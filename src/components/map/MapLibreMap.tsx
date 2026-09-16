"use client";

import {
  Marker,
  Map as MaplibreMap,
  NavigationControl,
  type ErrorEvent as MapErrorEvent,
  type MapMouseEvent,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";
import { MapPopup } from "./MapPopup";
import {
  ensurePathLayer,
  ensureRouteLayers,
  setPathData,
  setRouteData,
} from "./MapRoute";
import type {
  CustomMarkerRender,
  MapLocation,
  RouteFeatureCollection,
} from "./map.types";
import {
  DEFAULT_MAP_ZOOM,
  HATIEN_CENTER,
  defaultMapStyle,
  fitLocationsBounds,
  flyToLocation,
  isTileLevelMapError,
  resolveMapLoadTimeoutMs,
  resolveMapStyle,
  resolveMapTimeoutAction,
} from "./map.utils";
import {
  createDefaultPin,
  createUserLocationElement,
} from "./marker-elements";

type MapStatus = "loading" | "ready" | "error";

export interface MapLibreMapProps<T extends MapLocation = MapLocation> {
  locations: T[];
  center?: [number, number];
  zoom?: number;
  /** MapLibre style URL; defaults to NEXT_PUBLIC_MAP_STYLE_URL, then built-in OSM style. */
  styleUrl?: string;
  selectedLocationId?: string | null;
  onLocationClick?: (location: T) => void;
  onMapClick?: (coordinates: { latitude: number; longitude: number }) => void;
  /** Static line connecting points in order (tour path), [longitude, latitude][]. */
  path?: [number, number][];
  /** Directions route GeoJSON (user → target); null hides the route. */
  route?: RouteFeatureCollection | null;
  userPosition?: { latitude: number; longitude: number } | null;
  /** Custom marker element factory (checkpoint pins); default = plain dot. */
  renderMarkerElement?: (location: T) => CustomMarkerRender | null;
  /** Recreate a marker's element when this signature changes (e.g. status). */
  markerSignature?: (location: T) => string;
  /** Optional kit-level popup content for the selected location. */
  renderPopup?: (location: T) => ReactNode;
  /** Fit the viewport to all locations once data is ready (default true). */
  fitToLocationsOnLoad?: boolean;
  className?: string;
  loadingLabel?: string;
  errorLabel?: string;
  retryLabel?: string;
  /** Overlay message shown when loading exceeds the time budget. */
  timeoutLabel?: string;
  emptyLabel?: string;
  /** Time budget (ms) for one load attempt; default 20s, env-tunable. */
  loadTimeoutMs?: number;
  /** Imperative handle for flyTo/fit from parent components. */
  ref?: React.Ref<MapLibreMapRef<T>>;
}

export interface MapLibreMapRef<T extends MapLocation = MapLocation> {
  /** Fly to a specific checkpoint by id (no-op when not loaded). */
  flyToCheckpoint: (id: string) => void;
  /** Fit bounds to all currently rendered locations (no-op when empty). */
  fitToCheckpoints: () => void;
  /** Current selected location id (for external sync). */
  selectedLocationId: string | null;
}

/**
 * Reusable client-only MapLibre map (OpenStreetMap-compatible style).
 * Initialized once per mount inside `useEffect` and destroyed via
 * `map.remove()`. Markers/lines update in place — never recreated on
 * re-render (tasks §5, §15, §19).
 */
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
  const [status, setStatus] = useState<MapStatus>("loading");
  const [attempt, setAttempt] = useState(0);
  // Load-budget escalation: when a configured style URL stalls past the time
  // budget, one silent rebuild happens on the built-in raster style before
  // the error UI takes over.
  const [useFallbackStyle, setUseFallbackStyle] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  // Snapshot of locations as plain data so marker sync never closes over or
  // passes render-scope objects into the imperative MapLibre layer.
  const renderedLocations = useMemo<T[]>(
    () =>
      locations.map((location) => ({
        ...location,
      })),
    [locations],
  );

  // Latest-value refs: stable listeners + init-once config without effect churn.
  // Declared before useImperativeHandle so the handle never reads an
  // uninitialized ref (TDZ-safe).
  const renderedLocationsRef = useRef<T[]>([]);
  // Snapshot props into mutable local copies. Marker sync below reads only
  // this ref so the effect never closes over the `locations` prop identity,
  // satisfying react-hooks/immutability without inline disables.
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
        if (!map || status !== "ready") return;
        const location = renderedLocationsRef.current.find(
          (item) => item.id === id,
        );
        if (!location) return;
        flyToLocation(map, [location.longitude, location.latitude]);
      },
      fitToCheckpoints: () => {
        const map = mapRef.current;
        if (!map || status !== "ready") return;
        fitLocationsBounds(
          map,
          renderedLocationsRef.current.map(
            (l) => [l.longitude, l.latitude] as [number, number],
          ),
          { padding: 60, maxZoom: 15 },
        );
      },
    }),
    [selectedLocationId, status],
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
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const renderMarkerRef = useRef(renderMarkerElement);
  renderMarkerRef.current = renderMarkerElement;
  const markerSignatureRef = useRef(markerSignature);
  markerSignatureRef.current = markerSignature;

  // Init MapLibre once per attempt (retry after a load failure recreates it).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    setStatus("loading");
    setTimedOut(false);

    // The fallback attempt pins the built-in raster style, whatever the
    // configured URL is.
    const resolvedStyle = useFallbackStyle
      ? defaultMapStyle()
      : resolveMapStyle(styleUrlRef.current);
    const usedCustomStyle = typeof resolvedStyle === "string";

    let map: MaplibreMap;
    try {
      map = new MaplibreMap({
        container,
        style: resolvedStyle,
        center: centerRef.current ?? HATIEN_CENTER,
        zoom: zoomRef.current ?? DEFAULT_MAP_ZOOM,
      });
    } catch {
      setStatus("error");
      return;
    }
    mapRef.current = map;
    // Zoom in/out only — matches the previous map's chrome (zoomControl).
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");

    let loaded = false;
    // Time budget: a stalled style host fires no error event and never fires
    // `load`, which used to spin the loading overlay forever. Once the budget
    // lapses, a configured style gets one silent retry on the built-in raster
    // style; otherwise surface the error UI.
    const timeoutId = window.setTimeout(() => {
      if (loaded) return;
      const action = resolveMapTimeoutAction({
        usedCustomStyle,
        fallbackAlreadyTried: useFallbackStyle,
      });
      if (action === "fallback-to-default-style") {
        setUseFallbackStyle(true);
        return;
      }
      setTimedOut(true);
      setStatus("error");
    }, resolveMapLoadTimeoutMs(loadTimeoutMsRef.current));

    const handleLoad = () => {
      loaded = true;
      ensurePathLayer(map);
      ensureRouteLayers(map);
      setStatus("ready");
    };
    const handleError = (event: MapErrorEvent) => {
      // Per-tile failures (e.g. an optional shaded-relief source 404ing in the
      // chosen style) must not block the map — only a style-level failure
      // before load is fatal.
      if (isTileLevelMapError(event)) return;
      if (!loaded) {
        // The error UI is up — stop the budget so a later timer fire can't
        // trigger a surprise silent rebuild underneath it.
        window.clearTimeout(timeoutId);
        setStatus("error");
      }
    };
    const handleClick = (event: MapMouseEvent) => {
      onMapClickRef.current?.({
        latitude: event.lngLat.lat,
        longitude: event.lngLat.lng,
      });
    };
    map.on("load", handleLoad);
    map.on("error", handleError);
    map.on("click", handleClick);

    return () => {
      window.clearTimeout(timeoutId);
      map.off("load", handleLoad);
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
  }, [attempt, useFallbackStyle]);

  // Checkpoint markers: create once per id, update in place (tasks §15/§19).
  // locations/status drive re-sync via config-relaxed hooks rules; no inline disables.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;
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
        // Content-affecting change (e.g. check-in status) — rebuild this pin.
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
  }, [status]);

  // Highlight + restack the selected checkpoint without recreating markers.
  useEffect(() => {
    for (const id of markersRef.current.keys()) {
      rendersRef.current.get(id)?.setSelected?.(id === selectedLocationId);
    }
  }, [selectedLocationId, status]);

  // Fit all checkpoints once data is ready (task §17); waits for non-empty data.
  const didFitRef = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready" || didFitRef.current) return;
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
  }, [status, fitToLocationsOnLoad]);

  // Click → select → animate to the checkpoint (task §8). The very first
  // selection is skipped: the initial view comes from fitLocationsBounds.
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
  }, [selectedLocationId, status]);

  // User location dot: one marker, moved via setLngLat (no recreation).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;
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
  }, [userPosition, status]);

  // Lines: sources/layers exist after load; data flows through setData only.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;
    ensurePathLayer(map);
    setPathData(map, path ?? null);
  }, [path, status]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;
    ensureRouteLayers(map);
    setRouteData(map, route ?? null);
  }, [route, status]);

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

      {status === "loading" && (
        <div
          role="status"
          aria-live="polite"
          className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 text-sm text-muted-foreground"
        >
          {loadingLabel ?? "Loading…"}
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/90 p-4 text-center">
          <p role="alert" className="text-sm text-muted-foreground">
            {timedOut
              ? (timeoutLabel ?? errorLabel ?? "The map took too long to load")
              : (errorLabel ?? "Failed to load the map")}
          </p>
          <button
            type="button"
            onClick={() => {
              // A manual retry gives the configured style another chance —
              // the network may have recovered.
              setUseFallbackStyle(false);
              setAttempt((value) => value + 1);
            }}
            className="rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent"
          >
            {retryLabel ?? "Retry"}
          </button>
        </div>
      )}

      {status === "ready" && locations.length === 0 && emptyLabel && (
        <div className="pointer-events-none absolute inset-x-0 top-24 z-10 flex justify-center">
          <p className="rounded-full bg-background/90 px-3 py-1.5 text-sm text-muted-foreground shadow">
            {emptyLabel}
          </p>
        </div>
      )}

      {selectedLocation &&
        renderPopup &&
        status === "ready" &&
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
