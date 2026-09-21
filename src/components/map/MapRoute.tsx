"use client";

import type { GeoJSONSource, Map as MaplibreMap } from "maplibre-gl";
import { CarFrontIcon, FootprintsIcon } from "lucide-react";
import { useEffect } from "react";

import type { RouteFeatureCollection } from "./map.types";
import { lineStringFeatureCollection } from "./map.utils";
import { cn } from "@/lib/utils";

export const ROUTE_SOURCE_ID = "route";
export const PATH_SOURCE_ID = "tour-path";

export const EMPTY_ROUTE_GEOJSON: RouteFeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

function ensureLineSource(map: MaplibreMap, sourceId: string): boolean {
  if (!map.isStyleLoaded()) return false;
  if (!map.getSource(sourceId)) {
    try {
      map.addSource(sourceId, { type: "geojson", data: EMPTY_ROUTE_GEOJSON });
    } catch {
      return false;
    }
  }
  return true;
}

export function ensurePathLayer(map: MaplibreMap): boolean {
  if (!ensureLineSource(map, PATH_SOURCE_ID)) return false;
  if (!map.getLayer("tour-path-line")) {
    try {
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
    } catch {
      return false;
    }
  }
  return true;
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

export function ensureRouteLayers(map: MaplibreMap): boolean {
  if (!ensureLineSource(map, ROUTE_SOURCE_ID)) return false;
  try {
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
  } catch {
    return false;
  }
  return true;
}

export function setRouteData(
  map: MaplibreMap,
  route: RouteFeatureCollection | null,
): void {
  const source = map.getSource(ROUTE_SOURCE_ID);
  if (!source || !("setData" in source)) return;
  (source as GeoJSONSource).setData(route ?? EMPTY_ROUTE_GEOJSON);
}

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
    if (!map || !map.isStyleLoaded()) return;
    if (ensurePathLayer(map)) setPathData(map, path ?? null);
  }, [map, path]);

  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return;
    if (ensureRouteLayers(map)) setRouteData(map, route ?? null);
  }, [map, route]);

  return null;
}

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
