import { LngLatBounds, type Map as MaplibreglMap } from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";

import type {
  RouteFeatureCollection,
  RouteResult,
} from "./map.types";

/** Default Hà Tiên view ([longitude, latitude]) — same as the previous map. */
export const HATIEN_CENTER: [number, number] = [104.4835, 10.3836];
export const DEFAULT_MAP_ZOOM = 13;

/**
 * Built-in raster style served from CARTO's raster tiles (OpenStreetMap data).
 * `tile.openstreetmap.org` is unreachable from some networks (Vietnam ISPs
 * commonly fail DNS for it) and OSM's tile policy discourages production app
 * traffic, so CARTO is the sensible default — free for reasonable use with
 * attribution (https://www.carto.com/attributions).
 * Custom deployments can point `NEXT_PUBLIC_MAP_STYLE_URL` at a dedicated
 * style/tile provider instead.
 */
export function defaultMapStyle(): StyleSpecification {
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
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
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
export function isTileLevelMapError(event: unknown): boolean {
  if (typeof event !== "object" || event === null) return false;
  return "tile" in event && (event as { tile?: unknown }).tile != null;
}

/** Explicit prop wins, then the env var, then the built-in OSM style. */
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
export type MapTimeoutAction = "fallback-to-default-style" | "give-up";

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
 * - a configured style URL gets ONE silent rebuild on the built-in raster
 *   style (its host is likely stalled or unreachable);
 * - once the built-in style is what we're already loading, give up so the
 *   error/retry UI takes over instead of an eternal spinner.
 */
export function resolveMapTimeoutAction(options: {
  usedCustomStyle: boolean;
  fallbackAlreadyTried: boolean;
}): MapTimeoutAction {
  if (options.usedCustomStyle && !options.fallbackAlreadyTried) {
    return "fallback-to-default-style";
  }
  return "give-up";
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
