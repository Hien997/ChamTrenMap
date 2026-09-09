import { prisma } from "@/lib/prisma";
import { deriveStatuses } from "@/services/progress-status";
import type { TourProgressView } from "@/types";

/** Build the progress view for a user on a tour (Plan.md §6 TourProgressView). */
export async function buildProgressView(
  userId: string,
  tourSlug: string,
): Promise<TourProgressView | null> {
  const tour = await prisma.tour.findUnique({
    where: { slug: tourSlug },
    include: { checkpoints: { orderBy: { order: "asc" } } },
  });
  if (!tour) return null;

  const orderedIds = tour.checkpoints.map((tc) => tc.checkpointId);
  const checkIns = await prisma.checkIn.findMany({
    where: { userId, checkpointId: { in: orderedIds } },
    select: { checkpointId: true },
  });
  const completedIds = checkIns.map((c) => c.checkpointId);
  const { statuses, currentCheckpointId, isCompleted } = deriveStatuses(
    orderedIds,
    completedIds,
  );

  return {
    tourSlug: tour.slug,
    completedCount: completedIds.length,
    totalCount: orderedIds.length,
    percent:
      orderedIds.length === 0
        ? 0
        : Math.round((completedIds.length / orderedIds.length) * 100),
    isCompleted,
    currentCheckpointId,
    checkpoints: tour.checkpoints.map((tc) => ({
      checkpointId: tc.checkpointId,
      order: tc.order,
      status: statuses.get(tc.checkpointId) ?? "locked",
    })),
  };
}

/** Mark a tour as started for this user (idempotent). */
export async function ensureTourStarted(
  userId: string,
  tourId: string,
): Promise<void> {
  await prisma.tourProgress.upsert({
    where: { userId_tourId: { userId, tourId } },
    create: { userId, tourId },
    update: {},
  });
}

/** Checkpoint ids the user has checked in on a specific tour. */
export async function getCompletedCheckpointIds(
  userId: string,
  tourSlug: string,
): Promise<string[]> {
  const tour = await prisma.tour.findUnique({
    where: { slug: tourSlug },
    select: { checkpoints: { select: { checkpointId: true } } },
  });
  if (!tour) return [];
  const checkIns = await prisma.checkIn.findMany({
    where: {
      userId,
      checkpointId: { in: tour.checkpoints.map((tc) => tc.checkpointId) },
    },
    select: { checkpointId: true },
  });
  return checkIns.map((c) => c.checkpointId);
}
