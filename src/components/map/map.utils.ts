import { LngLatBounds, type Map as MaplibreglMap } from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";

import { cn } from "@/lib/utils";
import type { CheckpointStatus } from "@/types";
import type {
  MapLocation,
  RouteFeatureCollection,
  RouteResult,
} from "./map.types";
import type { MapCheckpoint } from "./types";

/** Default Hà Tiên view ([longitude, latitude]) — same as the previous map. */
export const HATIEN_CENTER: [number, number] = [104.4835, 10.3836];
export const DEFAULT_MAP_ZOOM = 13;

/** Classes toggled on the pin circle when a checkpoint is selected. */
export const SELECTED_MARKER_CLASSES = [
  "scale-125",
  "ring-2",
  "ring-primary/60",
] as const;

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

const STATUS_ICONS: Record<CheckpointStatus, string> = {
  completed:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
  current:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  locked:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
};

const STATUS_TONES: Record<CheckpointStatus, string> = {
  completed: "bg-status-completed",
  current: "bg-status-current",
  locked: "bg-status-locked",
};

const DEFAULT_STATUS_LABELS: Record<CheckpointStatus, string> = {
  completed: "Completed",
  current: "Up next",
  locked: "Locked",
};

const MARKER_Z = { selected: 30, normal: 20, locked: 5, user: 40 } as const;

/**
 * DOM element for a tour checkpoint pin — same look as the previous Google
 * status markers, with icon-library glyphs instead of emojis (task §7).
 * Selection styling is applied/toggled by `setMarkerSelected`.
 */
export function createCheckpointMarkerElement(
  checkpoint: MapCheckpoint,
  options?: {
    selected?: boolean;
    statusLabels?: Partial<Record<CheckpointStatus, string>>;
  },
): HTMLButtonElement {
  const status = checkpoint.status;
  const statusLabel =
    options?.statusLabels?.[status] ?? DEFAULT_STATUS_LABELS[status];
  const label = `${String(checkpoint.order).padStart(2, "0")}. ${checkpoint.name}`;

  const button = document.createElement("button");
  button.type = "button";
  button.dataset.baseZindex = String(
    status === "locked" ? MARKER_Z.locked : MARKER_Z.normal,
  );
  button.setAttribute("aria-label", `${label} — ${statusLabel}`);
  button.title = checkpoint.name;
  button.className =
    "flex cursor-pointer flex-col items-center border-0 bg-transparent p-0 focus-visible:outline-none";

  const circle = document.createElement("div");
  circle.className = cn(
    "map-pin-circle flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-white shadow-md transition-transform",
    STATUS_TONES[status],
  );
  circle.innerHTML = STATUS_ICONS[status];

  const labelDiv = document.createElement("div");
  labelDiv.className =
    "mt-1 max-w-[120px] truncate rounded-full bg-background/95 px-2 py-0.5 text-[11px] font-medium text-foreground shadow-sm";
  labelDiv.textContent = label;

  button.append(circle, labelDiv);
  setMarkerSelected(button, options?.selected ?? false);
  return button;
}

/** Toggle the selected look + stacking order on a custom marker element. */
export function setMarkerSelected(
  element: HTMLElement,
  selected: boolean,
): void {
  const pin = element.querySelector<HTMLElement>(".map-pin-circle");
  for (const className of SELECTED_MARKER_CLASSES) {
    pin?.classList.toggle(className, selected);
  }
  const baseZ = Number(element.dataset.baseZindex ?? MARKER_Z.normal);
  element.style.zIndex = String(selected ? MARKER_Z.selected : baseZ);
}

/** Pulsing blue dot for the user's position (same look as before). */
export function createUserLocationElement(): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.setAttribute("aria-label", "You");
  wrapper.className = "relative flex items-center justify-center";
  wrapper.style.zIndex = String(MARKER_Z.user);
  wrapper.innerHTML =
    '<span class="absolute h-6 w-6 animate-ping rounded-full bg-primary/50"></span>' +
    '<span class="relative h-4 w-4 rounded-full border-2 border-white bg-primary shadow"></span>';
  return wrapper;
}

/** Kit default pin when no custom renderer is provided (task §7 "custom"). */
export function createDefaultMarkerElement(
  location: MapLocation,
): HTMLDivElement {
  const element = document.createElement("div");
  element.title = location.name;
  element.style.zIndex = String(MARKER_Z.normal);
  element.className =
    "h-4 w-4 rounded-full border-2 border-white bg-primary shadow-md";
  return element;
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
