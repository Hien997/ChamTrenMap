"use client";

import type { GeoJSONSource, Map as MaplibreMap } from "maplibre-gl";
import { CarFrontIcon, FootprintsIcon } from "lucide-react";
import { useEffect } from "react";

import { cn } from "@/lib/utils";
import type { RouteFeatureCollection } from "./map.types";
import { lineStringFeatureCollection } from "./map.utils";

/** GeoJSON source/layer ids managed by the kit (added once, updated via setData). */
export const ROUTE_SOURCE_ID = "route";
export const PATH_SOURCE_ID = "tour-path";

export const EMPTY_ROUTE_GEOJSON: RouteFeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

function ensureLineSource(map: MaplibreMap, sourceId: string): void {
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, { type: "geojson", data: EMPTY_ROUTE_GEOJSON });
  }
}

/**
 * Tour path polyline (previous Google `Polyline`): slate, subtle, drawn only
 * when there is more than one point. Source + layer are created once; data
 * updates go through `setData` (task §14).
 */
export function ensurePathLayer(map: MaplibreMap): void {
  ensureLineSource(map, PATH_SOURCE_ID);
  if (!map.getLayer("tour-path-line")) {
    map.addLayer({
      id: "tour-path-line",
      type: "line",
      source: PATH_SOURCE_ID,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#379a7f",
        "line-opacity": 0.6,
        "line-width": 3,
        "line-dasharray": [2, 2],
      },
    });
  }
}

export function setPathData(
  map: MaplibreMap,
  coordinates: [number, number][] | null,
): void {
  const source = map.getSource(PATH_SOURCE_ID);
  if (!source || !("setData" in source)) return;
  const data =
    coordinates && coordinates.length > 1
      ? lineStringFeatureCollection(coordinates)
      : EMPTY_ROUTE_GEOJSON;
  (source as GeoJSONSource).setData(data);
}

/**
 * Directions route (previous Google `DirectionsRenderer`): white casing under a
 * gulf-teal line (#01707e / 0.9 / 5). Created once, data-updated only.
 */
export function ensureRouteLayers(map: MaplibreMap): void {
  ensureLineSource(map, ROUTE_SOURCE_ID);
  if (!map.getLayer("route-line-casing")) {
    map.addLayer({
      id: "route-line-casing",
      type: "line",
      source: ROUTE_SOURCE_ID,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#ffffff",
        "line-opacity": 0.7,
        "line-width": 7,
      },
    });
  }
  if (!map.getLayer("route-line")) {
    map.addLayer({
      id: "route-line",
      type: "line",
      source: ROUTE_SOURCE_ID,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#01707e",
        "line-opacity": 0.9,
        "line-width": 5,
      },
    });
  }
}

export function setRouteData(
  map: MaplibreMap,
  route: RouteFeatureCollection | null,
): void {
  const source = map.getSource(ROUTE_SOURCE_ID);
  if (!source || !("setData" in source)) return;
  (source as GeoJSONSource).setData(route ?? EMPTY_ROUTE_GEOJSON);
}

/**
 * Standalone route/path renderer for reuse outside `MapLibreMap`.
 * Renders via GeoJSON sources + line layers; never rebuilds them.
 */
export function MapRoute({
  map,
  route,
  path,
}: {
  map: MaplibreMap | null;
  route: RouteFeatureCollection | null;
  path?: [number, number][] | null;
}) {
  useEffect(() => {
    if (!map) return;
    ensurePathLayer(map);
    setPathData(map, path ?? null);
  }, [map, path]);

  useEffect(() => {
    if (!map) return;
    ensureRouteLayers(map);
    setRouteData(map, route ?? null);
  }, [map, route]);

  return null;
}

/** Travel-mode toggle used next to the Navigate action (UX unchanged). */
export function TravelModeToggle({
  value,
  onChange,
  labels,
}: {
  value: "WALKING" | "DRIVING";
  onChange: (mode: "WALKING" | "DRIVING") => void;
  labels: { walking: string; driving: string };
}) {
  return (
    <div className="flex overflow-hidden rounded-md border text-xs">
      {(["WALKING", "DRIVING"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 transition-colors",
            value === mode
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground hover:bg-accent",
          )}
        >
          {mode === "WALKING" ? (
            <FootprintsIcon aria-hidden className="size-3.5" />
          ) : (
            <CarFrontIcon aria-hidden className="size-3.5" />
          )}
          {mode === "WALKING" ? labels.walking : labels.driving}
        </button>
      ))}
    </div>
  );
}
