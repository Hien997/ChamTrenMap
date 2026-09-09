import type { CheckpointStatus } from "@/types";

/**
 * Pure sequential-tour status derivation (Plan.md §2 "unlock next checkpoint",
 * §14 tests). Given the tour's checkpoint order and the set of checkpoint ids
 * the user has checked in, derive per-checkpoint statuses.
 *
 *   completed — a check-in exists
 *   current   — the first checkpoint (by tour order) without a check-in
 *   locked    — everything after the current checkpoint
 */

export interface DeriveStatusesResult {
  statuses: Map<string, CheckpointStatus>;
  currentCheckpointId: string | null;
  isCompleted: boolean;
}

export function deriveStatuses(
  orderedCheckpointIds: string[],
  completedCheckpointIds: string[],
): DeriveStatusesResult {
  const completed = new Set(completedCheckpointIds);
  const current =
    orderedCheckpointIds.find((id) => !completed.has(id)) ?? null;

  const statuses = new Map<string, CheckpointStatus>();
  for (const id of orderedCheckpointIds) {
    statuses.set(
      id,
      completed.has(id) ? "completed" : id === current ? "current" : "locked",
    );
  }

  return {
    statuses,
    currentCheckpointId: current,
    isCompleted: current === null && orderedCheckpointIds.length > 0,
  };
}
