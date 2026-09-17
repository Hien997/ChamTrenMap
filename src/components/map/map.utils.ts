import { LngLatBounds, type Map as MaplibreglMap } from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";

import type {
  RouteFeatureCollection,
  RouteResult,
} from "./map.types";

/** Default Hà Tiên view ([longitude, latitude]) — same as the previous map. */
export const HATIEN_CENTER: [number, number] = [104.4835, 10.3836];
export const DEFAULT_MAP_ZOOM = 13;

/** Standard OpenStreetMap raster tiles — free, no key, no account. */
export const OSM_RASTER_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

/** Attribution OSM's tile usage policy requires wherever those tiles render. */
export const OSM_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Highest zoom `tile.openstreetmap.org` serves; MapLibre overzooms past it. */
export const OSM_RASTER_MAX_ZOOM = 19;

/**
 * Built-in raster style: the standard OpenStreetMap layer.
 * No API key, no account, no watermark — just the required attribution.
 *
 * Before pointing real traffic here, mind OSM's tile usage policy
 * (https://operations.osmfoundation.org/policies/tiles/): the community tile
 * servers are for low-volume use and forbid bulk downloads. A busy public
 * deployment should set `NEXT_PUBLIC_MAP_STYLE_URL` to a commercial provider
 * (or a self-hosted style) instead.
 */
export function defaultMapStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: [OSM_RASTER_TILE_URL],
        tileSize: 256,
        maxzoom: OSM_RASTER_MAX_ZOOM,
        attribution: OSM_ATTRIBUTION,
      },
    },
    // No maxzoom on the layer: MapLibre keeps drawing (overzoomed) tiles past
    // zoom 19 rather than blanking the map when the user zooms further.
    layers: [{ id: "osm", type: "raster", source: "osm" }],
  };
}

/**
 * Second built-in style, used only when a load attempt exhausts its time
 * budget: the same OpenStreetMap data rastered by CARTO from a different
 * host/CDN. `tile.openstreetmap.org` is unreachable from some networks
 * (Vietnam ISPs commonly fail DNS for it), so the fallback exists to keep the
 * map usable when the primary tiles can't be fetched.
 * Free for reasonable use with attribution (https://www.carto.com/attributions).
 */
export function fallbackMapStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      "carto-tiles": {
        type: "raster",
        tiles: [
          "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
          "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
          "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        ],
        tileSize: 256,
        maxzoom: 20,
        attribution: `${OSM_ATTRIBUTION} © <a href="https://carto.com/attributions">CARTO</a>`,
      },
    },
    layers: [{ id: "carto-tiles", type: "raster", source: "carto-tiles" }],
  };
}

/**
 * MapLibre fires a map-level `error` event for every failed resource fetch,
 * including individual tile 404s. Events that carry a `tile` payload are
 * per-tile failures: retryable and non-fatal. A style whose optional overlay
 * source 404s (e.g. OpenFreeMap Liberty's `ne2_shaded` shaded relief) must not
 * brick the whole map — only style-level failures (no `tile`) are fatal.
 */
/** True when a MapLibre event carries a `tile` payload. */
function hasTilePayload(event: unknown): boolean {
  if (typeof event !== "object" || event === null) return false;
  return "tile" in event && (event as { tile?: unknown }).tile != null;
}

/**
 * MapLibre fires a map-level `error` event for every failed resource fetch,
 * including individual tile 404s. Events that carry a `tile` payload are
 * per-tile failures: retryable and non-fatal. A style whose optional overlay
 * source 404s (e.g. OpenFreeMap Liberty's `ne2_shaded` shaded relief) must not
 * brick the whole map — only style-level failures (no `tile`) are fatal.
 */
export function isTileLevelMapError(event: unknown): boolean {
  return hasTilePayload(event);
}

/**
 * True for a `sourcedata` event that carries a tile. MapLibre fires one of
 * these after a tile *successfully* loads, so it's the positive "at least one
 * tile actually rendered" signal — unlike `sourceDataType === "content"`,
 * which fires as soon as the source's TileJSON metadata arrives (i.e. before
 * any tile is requested) and therefore can't distinguish a working host from
 * an unreachable one.
 */
export function isTileDataEvent(event: unknown): boolean {
  return hasTilePayload(event);
}

/** Explicit prop wins, then the env var, then the built-in OSM raster style. */
export function resolveMapStyle(
  styleUrl?: string,
): string | StyleSpecification {
  const url = styleUrl ?? process.env.NEXT_PUBLIC_MAP_STYLE_URL;
  const trimmed = url?.trim();
  return trimmed ? trimmed : defaultMapStyle();
}

/** Default time budget for one map-load attempt (style fetch + first render). */
export const MAP_LOAD_TIMEOUT_MS = 20_000;

/** What to do when a load attempt exceeds its time budget. */
export type MapTimeoutAction = "use-fallback-style" | "give-up";

/**
 * Time budget for one map-load attempt: explicit prop wins, then the
 * NEXT_PUBLIC_MAP_LOAD_TIMEOUT_MS env var, then the built-in default.
 * Non-positive or non-numeric values fall through so a bad deployment
 * config can't disable the budget.
 */
export function resolveMapLoadTimeoutMs(override?: number): number {
  if (
    typeof override === "number" &&
    Number.isFinite(override) &&
    override > 0
  ) {
    return override;
  }
  const raw = process.env.NEXT_PUBLIC_MAP_LOAD_TIMEOUT_MS;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return MAP_LOAD_TIMEOUT_MS;
}

/**
 * Escalation when the budget elapses before the map fires `load`:
 * - the first attempt gets ONE silent rebuild on the other built-in host
 *   (whether it was loading a configured style or the OSM default);
 * - once the fallback style is what's already loading, give up so the
 *   error/retry UI takes over instead of an eternal spinner.
 */
export function resolveMapTimeoutAction(options: {
  fallbackAlreadyTried: boolean;
}): MapTimeoutAction {
  return options.fallbackAlreadyTried ? "give-up" : "use-fallback-style";
}

/**
 * Failed tiles are normally non-fatal (see `isTileLevelMapError`), but when
 * *no* tile ever arrives the map sits blank forever with no error UI — the
 * host is unreachable (DNS-blocked, offline). After this many failed tiles,
 * with none succeeding, the host is treated as unreachable.
 */
export const TILE_FAILURE_ESCALATION_THRESHOLD = 3;

/** `ignore` keeps the map up (tiles are arriving); the rest escalate as above. */
export type TileFailureAction = MapTimeoutAction | "ignore";

/**
 * Decide what a failed tile means. Once a single tile has rendered, tile
 * failures are transient (gaps while panning) and stay non-fatal.
 */
export function resolveTileFailureAction(options: {
  tileErrorCount: number;
  anyTileRendered: boolean;
  fallbackAlreadyTried: boolean;
}): TileFailureAction {
  if (options.anyTileRendered) return "ignore";
  if (options.tileErrorCount < TILE_FAILURE_ESCALATION_THRESHOLD) {
    return "ignore";
  }
  return options.fallbackAlreadyTried ? "give-up" : "use-fallback-style";
}

/**
 * Fit the viewport to the given coordinates (task §17).
 * Zero → no-op; one → gentle flyTo; many → padded fitBounds.
 */
export function fitLocationsBounds(
  map: MaplibreglMap,
  coordinates: [number, number][],
  options?: { padding?: number; maxZoom?: number },
): void {
  if (coordinates.length === 0) return;
  const maxZoom = options?.maxZoom ?? 15;
  if (coordinates.length === 1) {
    map.flyTo({
      center: coordinates[0],
      zoom: maxZoom,
      duration: 800,
    });
    return;
  }
  const bounds = new LngLatBounds(coordinates[0], coordinates[0]);
  for (const coord of coordinates) {
    bounds.extend(coord);
  }
  map.fitBounds(bounds, {
    padding: options?.padding ?? 60,
    maxZoom,
    duration: 800,
  });
}

/** Fly to a coordinate (task §8: click → select → animate). */
export function flyToLocation(
  map: MaplibreglMap,
  coordinate: [number, number],
  zoom?: number,
): void {
  map.flyTo({
    center: coordinate,
    zoom: zoom ?? 16,
    duration: 800,
  });
}

/** Wrap coordinates in a GeoJSON LineString FeatureCollection. */
export function lineStringFeatureCollection(
  coordinates: [number, number][],
): RouteFeatureCollection {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates },
      },
    ],
  };
}

/** Convert a fetched `RouteResult` into drawable GeoJSON (task §14). */
export function routeResultToGeoJson(
  route: RouteResult,
): RouteFeatureCollection {
  return lineStringFeatureCollection(route.coordinates);
}

// Re-exported for backwards compatibility — client map components still
// import it from here. Server Components should import from @/components/map/map-links
// to avoid transitively pulling maplibre-gl into the React Server environment.
export { googleMapsDirectionsUrl } from "./map-links";
