export interface LatLng {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

export type CheckInDecision =
  | { status: "ok" }
  | { status: "already_checked_in" }
  | { status: "locked" }
  | { status: "poor_accuracy"; accuracy: number; maxAccuracy: number }
  | { status: "too_far"; distanceMeters: number; radiusMeters: number };

export interface EvaluateCheckInInput {
  distanceMeters: number;
  accuracyMeters: number | null;
  radiusMeters: number;
  maxAccuracyMeters: number;
  alreadyCheckedIn: boolean;
  isLocked: boolean;
}

export function evaluateCheckIn(input: EvaluateCheckInInput): CheckInDecision {
  if (input.alreadyCheckedIn) return { status: "already_checked_in" };
  if (input.isLocked) return { status: "locked" };
  if (
    input.accuracyMeters !== null &&
    input.accuracyMeters !== undefined &&
    input.accuracyMeters > input.maxAccuracyMeters
  ) {
    return {
      status: "poor_accuracy",
      accuracy: input.accuracyMeters,
      maxAccuracy: input.maxAccuracyMeters,
    };
  }
  if (input.distanceMeters > input.radiusMeters) {
    return {
      status: "too_far",
      distanceMeters: input.distanceMeters,
      radiusMeters: input.radiusMeters,
    };
  }
  return { status: "ok" };
}
