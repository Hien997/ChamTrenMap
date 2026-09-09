"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type LocationPermissionState =
  | "unknown"
  | "granted"
  | "denied"
  | "prompt";

/**
 * Watches the user's position for the map (Plan.md §10).
 * The browser permission prompt is only triggered when the user opts in
 * via `startWatching()` — never on page load (spec §28).
 */
export function useUserLocation() {
  const [position, setPosition] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] =
    useState<LocationPermissionState>("unknown");
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions) return;
    let active = true;
    navigator.permissions
      .query({ name: "geolocation" })
      .then((status) => {
        if (!active) return;
        setPermission(status.state as LocationPermissionState);
        status.onchange = () =>
          setPermission(status.state as LocationPermissionState);
      })
      .catch(() => {
        /* Permissions API unavailable — permission stays "unknown". */
      });
    return () => {
      active = false;
    };
  }, []);

  const startWatching = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("GEOLOCATION_UNSUPPORTED");
      return;
    }
    if (watchIdRef.current !== null) return;
    setLoading(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition(pos.coords);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.code === err.PERMISSION_DENIED ? "DENIED" : err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 },
    );
  }, []);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => stopWatching, [stopWatching]);

  return { position, error, loading, permission, startWatching, stopWatching };
}
