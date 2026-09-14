export type TravelMode = "WALKING" | "DRIVING";

/** Deep link into the external maps app/site for turn-by-turn navigation. */
export function googleMapsDirectionsUrl(
  latitude: number,
  longitude: number,
  travelMode: TravelMode,
): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=${travelMode.toLowerCase()}`;
}
