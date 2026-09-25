import type { CheckpointStatus } from "@/types";

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
  const current = orderedCheckpointIds.find((id) => !completed.has(id)) ?? null;

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
