"use client";

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
