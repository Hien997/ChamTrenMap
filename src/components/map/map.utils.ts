import { LngLatBounds, type Map as MaplibreglMap } from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";

import { cn } from "@/lib/utils";
import type { CheckpointStatus } from "@/types";
import type { MapLocation, RouteFeatureCollection, RouteResult } from "./map.types";
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
 * Built-in raster style served from the official OpenStreetMap tiles.
 * Sensible development default (free, low-volume use with attribution —
 * https://www.openstreetmap.org/copyright). Production should point
 * `NEXT_PUBLIC_MAP_STYLE_URL` at a dedicated style/tile provider.
 */
export function defaultMapStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      "osm-tiles": {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        maxzoom: 19,
        attribution: "© OpenStreetMap contributors",
      },
    },
    layers: [{ id: "osm-tiles", type: "raster", source: "osm-tiles" }],
  };
}

/** Explicit prop wins, then the env var, then the built-in OSM style. */
export function resolveMapStyle(styleUrl?: string): string | StyleSpecification {
  const url = styleUrl ?? process.env.NEXT_PUBLIC_MAP_STYLE_URL;
  const trimmed = url?.trim();
  return trimmed ? trimmed : defaultMapStyle();
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
  const bounds = new LngLatBounds(
    coordinates[0],
    coordinates[0],
  );
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
export function createDefaultMarkerElement(location: MapLocation): HTMLDivElement {
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
export function routeResultToGeoJson(route: RouteResult): RouteFeatureCollection {
  return lineStringFeatureCollection(route.coordinates);
}

// Re-exported for backwards compatibility — client map components still
// import it from here. Server Components should import from @/components/map/map-links
// to avoid transitively pulling maplibre-gl into the React Server environment.
export { googleMapsDirectionsUrl } from "./map-links";

