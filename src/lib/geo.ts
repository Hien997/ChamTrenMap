/**
 * Geospatial helpers (Plan.md §3/§14).
 * Pure functions only — no side effects, fully unit-tested.
 */

export interface LatLng {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Great-circle distance between two coordinates using the haversine formula.
 * Accuracy is within ~0.3% for the short distances used by checkpoint geofences.
 */
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
  /** Server-computed distance between the user and the checkpoint (meters). */
  distanceMeters: number;
  /** Client-reported GPS accuracy in meters; null/undefined means the browser did not provide one. */
  accuracyMeters: number | null;
  /** Checkpoint geofence radius (meters). */
  radiusMeters: number;
  /** Maximum acceptable GPS accuracy (meters). */
  maxAccuracyMeters: number;
  /** The user already has a check-in for this checkpoint. */
  alreadyCheckedIn: boolean;
  /** Checkpoint is not the current one in the sequential tour order. */
  isLocked: boolean;
}

/**
 * Pure check-in policy. The server computes every input; nothing here trusts the client
 * beyond the raw coordinates/accuracy that get re-validated (Plan.md §7).
 *
 * Evaluation order: already_checked_in → locked → poor_accuracy → too_far → ok.
 * A null accuracy is tolerated (skip the accuracy gate) because some browsers omit it;
 * the distance gate still applies.
 */
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
