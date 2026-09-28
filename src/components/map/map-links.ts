export type TravelMode = "WALKING" | "DRIVING";

export const googleMapsDirectionsUrl = (
  latitude: number,
  longitude: number,
  travelMode: TravelMode,
): string => {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=${travelMode.toLowerCase()}`;
};
