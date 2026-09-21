import { haversineMeters, type LatLng } from "@/lib/geo";
import type { CheckpointStatus, TourProgressView } from "@/types";

export const NEAR_HINT_METERS = 200;

export function distanceTo(
  user: LatLng | null | undefined,
  checkpoint: LatLng | null | undefined,
): number | null {
  if (!user || !checkpoint) return null;
  return haversineMeters(user, checkpoint);
}

export function isNear(
  user: LatLng | null | undefined,
  checkpoint: LatLng | null | undefined,
): boolean {
  const distance = distanceTo(user, checkpoint);
  return distance !== null && distance <= NEAR_HINT_METERS;
}

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
