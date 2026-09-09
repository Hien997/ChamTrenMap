"use client";

/**
 * One-shot geolocation request for check-ins (Plan.md §8).
 * Client-only; rejects with Error("GEOLOCATION_UNSUPPORTED") when unavailable
 * or with GeolocationPositionError on denial/timeout.
 */
export function getCurrentPositionOnce(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("GEOLOCATION_UNSUPPORTED"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 10_000 },
    );
  });
}
