import { haversineMeters, type LatLng } from "@/lib/geo";
import type { CheckpointStatus, TourProgressView } from "@/types";

/**
 * Hint threshold for "you're close — check in now" on the tour map.
 * Deliberately its own policy: check-in acceptance is validated server-side
 * against each checkpoint's `radiusMeters`, which may be tighter or looser
 * than this hint. Resolve that split here — never at call sites.
 */
export const NEAR_HINT_METERS = 200;

/** Distance in meters from the user to a checkpoint; null when either side is unknown. */
export function distanceTo(
  user: LatLng | null | undefined,
  checkpoint: LatLng | null | undefined,
): number | null {
  if (!user || !checkpoint) return null;
  return haversineMeters(user, checkpoint);
}

/** True when the user is within the near-hint threshold of a checkpoint. */
export function isNear(
  user: LatLng | null | undefined,
  checkpoint: LatLng | null | undefined,
): boolean {
  const distance = distanceTo(user, checkpoint);
  return distance !== null && distance <= NEAR_HINT_METERS;
}

/**
 * Merge fresh progress into rendered checkpoints: status per checkpoint id.
 * Unmatched checkpoints pass through untouched (same object references).
 */
export function applyProgress<
  T extends { id: string; status: CheckpointStatus },
>(checkpoints: T[], progress: TourProgressView): T[] {
  const statusById = new Map(
    progress.checkpoints.map((item) => [item.checkpointId, item.status]),
  );
  return checkpoints.map((checkpoint) => {
    const status = statusById.get(checkpoint.id);
    return status && status !== checkpoint.status
      ? { ...checkpoint, status }
      : checkpoint;
  });
}
