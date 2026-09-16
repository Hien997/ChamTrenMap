/**
 * Shared types for the MapLibre map kit (components/map).
 * The kit is app-agnostic: it speaks `MapLocation`, while the tour domain
 * maps its `MapCheckpoint` (types.ts) onto it.
 */

/** Generic point rendered by the reusable map (task §6 API). */
export interface MapLocation {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  checkedIn?: boolean;
}

/** Routing travel mode (kept compatible with the external maps deep link). */
export type TravelMode = "WALKING" | "DRIVING";

/** OSRM-style routing profile served under `/route/v1/{profile}`. */
export type RouteProfile = "foot" | "driving";

/** A fetched route: ordered [longitude, latitude] pairs plus metrics. */
export interface RouteResult {
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
}

/** Minimal GeoJSON shapes used by the kit (no extra dependencies). */
export interface LineStringGeometry {
  type: "LineString";
  coordinates: [number, number][];
}

export interface RouteFeatureCollection {
  type: "FeatureCollection";
  features: {
    type: "Feature";
    properties: Record<string, unknown>;
    geometry: LineStringGeometry;
  }[];
}

/** Result of a custom marker renderer supplied to `MapLibreMap`. */
export interface CustomMarkerRender {
  element: HTMLElement;
  /** Base stacking order; the kit raises selected markers above others. */
  zIndex?: number;
  /** Optional in-place selection toggle; the kit calls it instead of DOM queries. */
  setSelected?: (selected: boolean) => void;
}
