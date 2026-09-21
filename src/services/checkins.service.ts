import { Prisma } from "@prisma/client";
import type { Locale } from "@/config/constants";
import { MAX_GPS_ACCURACY_METERS } from "@/config/constants";
import { evaluateCheckIn, haversineMeters } from "@/lib/geo";
import { prisma } from "@/lib/prisma";
import { pickLocalized } from "@/services/localize";
import { buildProgressView } from "@/services/progress.service";
import { deriveStatuses } from "@/services/progress-status";
import type { CreateCheckInInput } from "@/lib/validations";
import type { CheckInView, TourProgressView } from "@/types";

export type CheckInResult =
  | { status: "ok"; checkIn: CheckInView; progress: TourProgressView }
  | { status: "already_checked_in"; progress: TourProgressView | null }
  | { status: "no_tour_link" }
  | { status: "locked" }
  | { status: "too_far"; distanceMeters: number; radiusMeters: number }
  | { status: "poor_accuracy"; accuracy: number; maxAccuracy: number }
  | { status: "not_found" };

interface CheckInRecordLike {
  id: string;
  checkpointId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  distanceFromCheckpoint: number;
  checkedInAt: Date;
}

function toCheckInView(
  checkIn: CheckInRecordLike,
  checkpointName: string,
): CheckInView {
  return {
    id: checkIn.id,
    checkpointId: checkIn.checkpointId,
    checkpointName,
    latitude: checkIn.latitude,
    longitude: checkIn.longitude,
    accuracy: checkIn.accuracy,
    distanceFromCheckpoint: checkIn.distanceFromCheckpoint,
    checkedInAt: checkIn.checkedInAt.toISOString(),
  };
}

export async function createCheckIn(
  userId: string,
  input: CreateCheckInInput,
  locale: Locale,
): Promise<CheckInResult> {
  const checkpoint = await prisma.checkpoint.findUnique({
    where: { id: input.checkpointId },
    include: {
      translations: true,
      tourLinks: {
        include: { tour: { include: { checkpoints: { orderBy: { order: "asc" } } } } },
      },
    },
  });
  if (!checkpoint) return { status: "not_found" };

  const tourLink = checkpoint.tourLinks[0];
  if (!tourLink) return { status: "no_tour_link" };
  const tour = tourLink.tour;
  const orderedIds = tour.checkpoints.map((tc) => tc.checkpointId);

  const existingCheckIns = await prisma.checkIn.findMany({
    where: { userId, checkpointId: { in: orderedIds } },
    select: { checkpointId: true },
  });
  const completedIds = existingCheckIns.map((c) => c.checkpointId);
  const { statuses } = deriveStatuses(orderedIds, completedIds);

  const distanceMeters = haversineMeters(
    { latitude: input.latitude, longitude: input.longitude },
    { latitude: checkpoint.latitude, longitude: checkpoint.longitude },
  );

  const decision = evaluateCheckIn({
    distanceMeters,
    accuracyMeters: input.accuracy ?? null,
    radiusMeters: checkpoint.radiusMeters,
    maxAccuracyMeters: MAX_GPS_ACCURACY_METERS,
    alreadyCheckedIn: completedIds.includes(checkpoint.id),
    isLocked: statuses.get(checkpoint.id) === "locked",
  });

  if (decision.status === "already_checked_in") {
    return {
      status: "already_checked_in",
      progress: await buildProgressView(userId, tour.slug),
    };
  }
  if (decision.status === "locked") return { status: "locked" };
  if (decision.status === "poor_accuracy") return decision;
  if (decision.status === "too_far") return decision;

  try {
    const checkIn = await prisma.$transaction(async (tx) => {
      const created = await tx.checkIn.create({
        data: {
          userId,
          checkpointId: checkpoint.id,
          latitude: input.latitude,
          longitude: input.longitude,
          accuracy: input.accuracy ?? 0,
          distanceFromCheckpoint: distanceMeters,
        },
      });

      const progress = await tx.tourProgress.upsert({
        where: { userId_tourId: { userId, tourId: tour.id } },
        create: { userId, tourId: tour.id },
        update: {},
      });

      if (
        completedIds.length + 1 >= orderedIds.length &&
        progress.completedAt === null
      ) {
        await tx.tourProgress.update({
          where: { id: progress.id },
          data: { completedAt: new Date() },
        });
      }

      return created;
    });

    const checkpointName =
      pickLocalized(checkpoint.translations, locale)?.name ?? checkpoint.slug;

    const progress = await buildProgressView(userId, tour.slug);
    if (!progress) throw new Error("Progress view missing after check-in");

    return { status: "ok", checkIn: toCheckInView(checkIn, checkpointName), progress };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        status: "already_checked_in",
        progress: await buildProgressView(userId, tour.slug),
      };
    }
    throw error;
  }
}

export async function listMyCheckIns(
  userId: string,
  locale: Locale,
): Promise<CheckInView[]> {
  const checkIns = await prisma.checkIn.findMany({
    where: { userId },
    orderBy: { checkedInAt: "desc" },
    include: { checkpoint: { include: { translations: true } } },
    take: 50,
  });
  return checkIns.map((c) =>
    toCheckInView(
      c,
      pickLocalized(c.checkpoint.translations, locale)?.name ??
        c.checkpoint.slug,
    ),
  );
}
