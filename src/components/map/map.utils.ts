import {
  LngLatBounds,
  type Map as MaplibreglMap,
  type StyleSpecification,
} from "maplibre-gl";

import openfreemapLiberty from "./openfreemap-liberty.json";

import type { RouteFeatureCollection, RouteResult } from "./map.types";

export const HATIEN_CENTER: [number, number] = [104.4835, 10.3836];
export const DEFAULT_MAP_ZOOM = 13;

export const OSM_RASTER_TILE_URL =
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export const OSM_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const OSM_RASTER_MAX_ZOOM = 19;

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
    layers: [{ id: "osm", type: "raster", source: "osm" }],
  };
}

export function fallbackMapStyle(): StyleSpecification {
  return structuredClone(openfreemapLiberty) as StyleSpecification;
}

function hasTilePayload(event: unknown): boolean {
  if (typeof event !== "object" || event === null) return false;
  return "tile" in event && (event as { tile?: unknown }).tile != null;
}

export function isTileLevelMapError(event: unknown): boolean {
  return hasTilePayload(event);
}

export function isTileDataEvent(event: unknown): boolean {
  return hasTilePayload(event);
}

const TILE_SOURCE_TYPES = new Set(["raster", "vector", "raster-dem"]);

export function styleUsesTileSources(style: {
  sources?: Record<string, { type?: string }>;
}): boolean {
  const sources = style?.sources ?? {};
  return Object.values(sources).some(
    (source) => source?.type != null && TILE_SOURCE_TYPES.has(source.type),
  );
}

export function resolveMapStyle(
  styleUrl?: string,
): string | StyleSpecification {
  const url = styleUrl ?? process.env.NEXT_PUBLIC_MAP_STYLE_URL;
  const trimmed = url?.trim();
  return trimmed ? trimmed : defaultMapStyle();
}

export const MAP_LOAD_TIMEOUT_MS = 20_000;

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

export function routeResultToGeoJson(
  route: RouteResult,
): RouteFeatureCollection {
  return lineStringFeatureCollection(route.coordinates);
}

export { googleMapsDirectionsUrl } from "./map-links";
