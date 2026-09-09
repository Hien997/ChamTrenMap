"use client";

import {
  APIProvider,
  AdvancedMarker,
  Map,
  Polyline,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { useEffect } from "react";
import { CheckpointMarkers } from "@/components/map/CheckpointMarkers";
import type { MapCheckpoint } from "@/components/map/types";
import { cn } from "@/lib/utils";

/** AdvancedMarkers require a cloud Map ID (console.cloud.google.com → Map Management → Map IDs). */
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined;
const HATIEN_CENTER = { lat: 10.3836, lng: 104.4835 };

export type TravelMode = "WALKING" | "DRIVING";

function DirectionsLayer({
  target,
  userPosition,
  travelMode,
}: {
  target: MapCheckpoint | null;
  userPosition: GeolocationCoordinates | null;
  travelMode: TravelMode;
}) {
  const map = useMap();
  const routesLibrary = useMapsLibrary("routes");

  // Imperative renderer per effect run — no React state, no cascading renders.
  useEffect(() => {
    if (!routesLibrary || !map) return;

    const renderer = new routesLibrary.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#2563eb",
        strokeOpacity: 0.85,
        strokeWeight: 5,
      },
    });

    if (!target || !userPosition) {
      return () => {
        renderer.setMap(null);
      };
    }

    const service = new routesLibrary.DirectionsService();
    let cancelled = false;
    service
      .route({
        origin: { lat: userPosition.latitude, lng: userPosition.longitude },
        destination: { lat: target.latitude, lng: target.longitude },
        travelMode: travelMode as google.maps.TravelMode,
      })
      .then((directions) => {
        if (!cancelled) renderer.setDirections(directions);
      })
      .catch(() => {
        /* no route available — leave the map clean */
      });

    return () => {
      cancelled = true;
      renderer.setMap(null);
    };
  }, [routesLibrary, map, target, userPosition, travelMode]);

  return null;
}

export interface HaTienMapProps {
  apiKey: string;
  checkpoints: MapCheckpoint[];
  selectedId: string | null;
  onSelect: (checkpoint: MapCheckpoint) => void;
  userPosition: GeolocationCoordinates | null;
  /** When set, draws a directions route from the user to this checkpoint. */
  directionsTarget: MapCheckpoint | null;
  travelMode: TravelMode;
}

/** Full-viewport Google Map with tour markers, path polyline and user dot. */
export function HaTienMap({
  apiKey,
  checkpoints,
  selectedId,
  onSelect,
  userPosition,
  directionsTarget,
  travelMode,
}: HaTienMapProps) {
  const ordered = [...checkpoints].sort((a, b) => a.order - b.order);
  const path = ordered.map((cp) => ({ lat: cp.latitude, lng: cp.longitude }));

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={HATIEN_CENTER}
        defaultZoom={13}
        mapId={MAP_ID}
        className="h-full w-full"
        clickableIcons={false}
        disableDefaultUI
        zoomControl
      >
        {path.length > 1 && (
          <Polyline
            path={path}
            strokeColor="#64748b"
            strokeOpacity={0.45}
            strokeWeight={3}
          />
        )}

        <CheckpointMarkers
          checkpoints={checkpoints}
          selectedId={selectedId}
          onSelect={onSelect}
        />

        {userPosition && (
          <AdvancedMarker
            position={{
              lat: userPosition.latitude,
              lng: userPosition.longitude,
            }}
            title="You"
            zIndex={40}
          >
            <div className="relative flex items-center justify-center">
              <span className="absolute h-6 w-6 animate-ping rounded-full bg-blue-400/50" />
              <span className="relative h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow" />
            </div>
          </AdvancedMarker>
        )}

        <DirectionsLayer
          target={directionsTarget}
          userPosition={userPosition}
          travelMode={travelMode}
        />
      </Map>
    </APIProvider>
  );
}

/** Small travel-mode toggle used next to the Navigate action. */
export function TravelModeToggle({
  value,
  onChange,
  labels,
}: {
  value: TravelMode;
  onChange: (mode: TravelMode) => void;
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
            "px-3 py-1.5 transition-colors",
            value === mode
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground hover:bg-accent",
          )}
        >
          {mode === "WALKING" ? `🚶 ${labels.walking}` : `🛵 ${labels.driving}`}
        </button>
      ))}
    </div>
  );
}

/** Deep link into the full Google Maps app/site for turn-by-turn navigation. */
export function googleMapsDirectionsUrl(
  latitude: number,
  longitude: number,
  travelMode: TravelMode,
): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=${travelMode.toLowerCase()}`;
}
