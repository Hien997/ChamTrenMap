"use client";

import {
  Marker,
  Map as MaplibreMap,
  NavigationControl,
  type ErrorEvent as MapErrorEvent,
  type MapMouseEvent,
  type MapSourceDataEvent,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./maplibre-worker-config";
import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";

import { MapPopup } from "./MapPopup";
import {
  ensurePathLayer,
  ensureRouteLayers,
  setPathData,
  setRouteData,
} from "./MapRoute";
import { initialMapLoadState, reduceMapLoad } from "./map-load";
import type {
  CustomMarkerRender,
  MapLocation,
  RouteFeatureCollection,
} from "./map.types";
import {
  DEFAULT_MAP_ZOOM,
  HATIEN_CENTER,
  fallbackMapStyle,
  fitLocationsBounds,
  flyToLocation,
  isTileLevelMapError,
  isTileDataEvent,
  resolveMapLoadTimeoutMs,
  resolveMapStyle,
  styleUsesTileSources,
} from "./map.utils";
import {
  createDefaultPin,
  createUserLocationElement,
} from "./marker-elements";
import { cn } from "@/lib/utils";

export interface MapLibreMapProps<T extends MapLocation = MapLocation> {
  locations: T[];
  center?: [number, number];
  zoom?: number;
  styleUrl?: string;
  selectedLocationId?: string | null;
  onLocationClick?: (location: T) => void;
  onMapClick?: (coordinates: { latitude: number; longitude: number }) => void;
  path?: [number, number][];
  route?: RouteFeatureCollection | null;
  userPosition?: { latitude: number; longitude: number } | null;
  renderMarkerElement?: (location: T) => CustomMarkerRender | null;
  markerSignature?: (location: T) => string;
  renderPopup?: (location: T) => ReactNode;
  fitToLocationsOnLoad?: boolean;
  className?: string;
  loadingLabel?: string;
  errorLabel?: string;
  retryLabel?: string;
  timeoutLabel?: string;
  emptyLabel?: string;
  loadTimeoutMs?: number;
  ref?: React.Ref<MapLibreMapRef<T>>;
}

export interface MapLibreMapRef<T extends MapLocation = MapLocation> {
  flyToCheckpoint: (id: string) => void;
  fitToCheckpoints: () => void;
  selectedLocationId: string | null;
}

/**
 * Reads whether the current style fetches tiles. Called only when the load
 * budget fires; if the style has not settled yet, getStyle() may throw and
 * the answer is irrelevant — the reducer escalates on !loaded anyway.
 */
function readStyleHasTiles(map: MaplibreMap): boolean {
  try {
    return styleUsesTileSources(map.getStyle());
  } catch {
    return false;
  }
}

export function MapLibreMap<T extends MapLocation = MapLocation>({
  locations,
  center,
  zoom,
  styleUrl,
  selectedLocationId = null,
  onLocationClick,
  onMapClick,
  path,
  route = null,
  userPosition,
  renderMarkerElement,
  markerSignature,
  renderPopup,
  fitToLocationsOnLoad = true,
  className,
  loadingLabel,
  errorLabel,
  retryLabel,
  timeoutLabel,
  emptyLabel,
  loadTimeoutMs,
  ref,
}: MapLibreMapProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const markersRef = useRef(new Map<string, Marker>());
  const rendersRef = useRef(new Map<string, CustomMarkerRender>());
  const userMarkerRef = useRef<Marker | null>(null);
  const [load, dispatch] = useReducer(reduceMapLoad, initialMapLoadState);
  const renderedLocationsRef = useRef<T[]>([]);
  const constructionKey = `${load.attempt}:${load.styleMode}`;
  const latestConstructionKeyRef = useRef(constructionKey);
  latestConstructionKeyRef.current = constructionKey;

  useEffect(() => {
    renderedLocationsRef.current = locations.map((item) => ({ ...item }));
  }, [locations]);

  useImperativeHandle(
    ref,
    () => ({
      get selectedLocationId() {
        return selectedLocationId;
      },
      flyToCheckpoint: (id: string) => {
        const map = mapRef.current;
        if (!map || load.status !== "ready") return;
        const location = renderedLocationsRef.current.find(
          (item) => item.id === id,
        );
        if (!location) return;
        flyToLocation(map, [location.longitude, location.latitude]);
      },
      fitToCheckpoints: () => {
        const map = mapRef.current;
        if (!map || load.status !== "ready") return;
        fitLocationsBounds(
          map,
          renderedLocationsRef.current.map(
            (l) => [l.longitude, l.latitude] as [number, number],
          ),
          { padding: 60, maxZoom: 15 },
        );
      },
    }),
    [selectedLocationId, load.status],
  );

  const centerRef = useRef(center);
  centerRef.current = center;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const styleUrlRef = useRef(styleUrl);
  styleUrlRef.current = styleUrl;
  const loadTimeoutMsRef = useRef(loadTimeoutMs);
  loadTimeoutMsRef.current = loadTimeoutMs;
  const onLocationClickRef = useRef(onLocationClick);
  onLocationClickRef.current = onLocationClick;
  const pathRef = useRef(path ?? null);
  pathRef.current = path ?? null;
  const routeRef = useRef(route ?? null);
  routeRef.current = route ?? null;
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const renderMarkerRef = useRef(renderMarkerElement);
  renderMarkerRef.current = renderMarkerElement;
  const markerSignatureRef = useRef(markerSignature);
  markerSignatureRef.current = markerSignature;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resolvedStyle =
      load.styleMode === "fallback"
        ? fallbackMapStyle()
        : resolveMapStyle(styleUrlRef.current);

    let map: MaplibreMap;
    try {
      map = new MaplibreMap({
        container,
        style: resolvedStyle,
        center: centerRef.current ?? HATIEN_CENTER,
        zoom: zoomRef.current ?? DEFAULT_MAP_ZOOM,
      });
    } catch {
      dispatch({ type: "constructorFailed" });
      return;
    }
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    let active = true;
    const isCurrentConstruction = () =>
      active && latestConstructionKeyRef.current === constructionKey;

    const timeoutId = window.setTimeout(() => {
      if (!isCurrentConstruction()) return;
      dispatch({
        type: "timeout",
        styleHasTiles: readStyleHasTiles(map),
      });
    }, resolveMapLoadTimeoutMs(loadTimeoutMsRef.current));

    const handleLoad = () => {
      if (!isCurrentConstruction()) return;
      if (map.isStyleLoaded()) ensurePathLayer(map);
      if (map.isStyleLoaded()) ensureRouteLayers(map);
      dispatch({ type: "load" });
    };
    const handleSourceData = (event: MapSourceDataEvent) => {
      if (!isCurrentConstruction()) return;
      if (isTileDataEvent(event)) {
        dispatch({ type: "tileRendered" });
      }
    };
    const handleError = (event: MapErrorEvent) => {
      if (!isCurrentConstruction()) return;
      if (isTileLevelMapError(event)) {
        dispatch({ type: "tileError" });
      } else {
        dispatch({ type: "styleError" });
      }
    };
    const handleClick = (event: MapMouseEvent) => {
      if (!isCurrentConstruction()) return;
      onMapClickRef.current?.({
        latitude: event.lngLat.lat,
        longitude: event.lngLat.lng,
      });
    };
    map.on("load", handleLoad);
    const handleStyleData = () => {
      if (!isCurrentConstruction()) return;
      if (map.isStyleLoaded()) {
        if (ensurePathLayer(map)) setPathData(map, pathRef.current ?? null);
        if (ensureRouteLayers(map)) setRouteData(map, routeRef.current ?? null);
      }
    };
    map.on("styledata", handleStyleData);
    map.on("sourcedata", handleSourceData);
    map.on("error", handleError);
    map.on("click", handleClick);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      map.off("load", handleLoad);
      map.off("styledata", handleStyleData);
      map.off("sourcedata", handleSourceData);
      map.off("error", handleError);
      map.off("click", handleClick);
      const markers = markersRef.current;
      for (const marker of markers.values()) marker.remove();
      markers.clear();
      rendersRef.current.clear();
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [constructionKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || load.status !== "ready") return;
    const markers = markersRef.current;
    const renders = rendersRef.current;
    const seen = new Set<string>();

    const createMarker = (location: T) => {
      const custom = renderMarkerRef.current?.(location);
      const handle = custom ?? createDefaultPin(location);
      const element = handle.element;
      element.addEventListener("click", (event) => {
        event.stopPropagation();
        onLocationClickRef.current?.(location);
      });
      if (handle.zIndex !== undefined) {
        element.style.zIndex = String(handle.zIndex);
      }
      element.dataset.signature = markerSignatureRef.current?.(location) ?? "";
      const marker = new Marker({
        element,
        anchor: custom ? "bottom" : "center",
      });
      marker.setLngLat([location.longitude, location.latitude]);
      marker.addTo(map);
      markers.set(location.id, marker);
      renders.set(location.id, handle);
    };

    for (const location of locations) {
      seen.add(location.id);
      const existing = markers.get(location.id);
      if (!existing) {
        createMarker(location);
        continue;
      }
      existing.setLngLat([location.longitude, location.latitude]);
      const nextSignature = markerSignatureRef.current?.(location) ?? "";
      if (existing.getElement().dataset.signature !== nextSignature) {
        existing.remove();
        markers.delete(location.id);
        renders.delete(location.id);
        createMarker(location);
      }
    }
    for (const [id, marker] of markers) {
      if (seen.has(id)) continue;
      marker.remove();
      markers.delete(id);
      renders.delete(id);
    }
  }, [load.status, locations]);

  useEffect(() => {
    for (const id of markersRef.current.keys()) {
      rendersRef.current.get(id)?.setSelected?.(id === selectedLocationId);
    }
  }, [selectedLocationId, load.status]);

  const didFitRef = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || load.status !== "ready" || didFitRef.current) return;
    if (!fitToLocationsOnLoad || renderedLocationsRef.current.length === 0)
      return;
    didFitRef.current = true;
    fitLocationsBounds(
      map,
      renderedLocationsRef.current.map(
        (l) => [l.longitude, l.latitude] as [number, number],
      ),
      { padding: 60, maxZoom: 15 },
    );
  }, [load.status, fitToLocationsOnLoad]);

  const prevSelectedRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const isFirst = prevSelectedRef.current === undefined;
    const changed = !isFirst && prevSelectedRef.current !== selectedLocationId;
    prevSelectedRef.current = selectedLocationId;
    if (isFirst || !changed) return;
    const map = mapRef.current;
    const location = renderedLocationsRef.current.find(
      (item) => item.id === selectedLocationId,
    );
    if (map && location)
      flyToLocation(map, [location.longitude, location.latitude] as [
        number,
        number,
      ]);
  }, [selectedLocationId, load.status]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || load.status !== "ready") return;
    if (!userPosition) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      return;
    }
    if (!userMarkerRef.current) {
      const marker = new Marker({
        element: createUserLocationElement(),
        anchor: "center",
      });
      userMarkerRef.current = marker;
      marker.addTo(map);
    }
    userMarkerRef.current.setLngLat([
      userPosition.longitude,
      userPosition.latitude,
    ] as [number, number]);
  }, [userPosition, load.status]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || load.status !== "ready") return;
    if (ensurePathLayer(map)) setPathData(map, path ?? null);
  }, [path, load.status]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || load.status !== "ready") return;
    if (ensureRouteLayers(map)) setRouteData(map, route ?? null);
  }, [route, load.status]);

  const selectedLocation = useMemo(
    () =>
      renderedLocationsRef.current.find(
        (item) => item.id === selectedLocationId,
      ) ?? null,
    [selectedLocationId],
  );

  return (
    <div className={cn("relative h-full w-full", className)}>
      <div ref={containerRef} className="h-full w-full" />

      {load.status === "loading" && (
        <div
          role="status"
          aria-live="polite"
          className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 text-sm text-muted-foreground"
        >
          {loadingLabel ?? "Loading…"}
        </div>
      )}

      {load.status === "error" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/90 p-4 text-center">
          <p role="alert" className="text-sm text-muted-foreground">
            {load.timedOut
              ? (timeoutLabel ?? errorLabel ?? "The map took too long to load")
              : (errorLabel ?? "Failed to load the map")}
          </p>
          <button
            type="button"
            onClick={() => dispatch({ type: "retry" })}
            className="rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent"
          >
            {retryLabel ?? "Retry"}
          </button>
        </div>
      )}

      {load.status === "ready" && locations.length === 0 && emptyLabel && (
        <div className="pointer-events-none absolute inset-x-0 top-24 z-10 flex justify-center">
          <p className="rounded-full bg-background/90 px-3 py-1.5 text-sm text-muted-foreground shadow">
            {emptyLabel}
          </p>
        </div>
      )}

      {selectedLocation &&
        renderPopup &&
        load.status === "ready" &&
        mapRef.current && (
          <MapPopup
            map={mapRef.current}
            longitude={selectedLocation.longitude}
            latitude={selectedLocation.latitude}
          >
            {renderPopup(selectedLocation) ?? null}
          </MapPopup>
        )}
    </div>
  );
}
