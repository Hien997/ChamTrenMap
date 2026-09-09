import { prisma } from "@/lib/prisma";
import { pickLocalized } from "@/services/localize";
import { deriveStatuses } from "@/services/progress-status";
import type { CheckpointStatus, TourDetailView, TourSummaryView, TourCheckpointView } from "@/types";
import type { Locale } from "@/config/constants";

/** Published tours with localized metadata (Plan.md §6: GET /api/tours). */
export async function listTours(locale: Locale): Promise<TourSummaryView[]> {
  const tours = await prisma.tour.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "asc" },
    include: {
      translations: true,
      checkpoints: {
        orderBy: { order: "asc" },
        include: {
          checkpoint: { include: { translations: true } },
        },
      },
    },
  });

  return tours.map((tour) => {
    const translation = pickLocalized(tour.translations, locale);
    return {
      id: tour.id,
      slug: tour.slug,
      name: translation?.name ?? tour.slug,
      tagline: translation?.tagline ?? "",
      description: translation?.description ?? "",
      coverImageUrl: translation?.coverImageUrl ?? "",
      checkpointCount: tour.checkpoints.length,
      estimatedMinutes: tour.checkpoints.reduce(
        (sum, tc) => sum + tc.checkpoint.estimatedVisitMinutes,
        0,
      ),
    };
  });
}

/**
 * Full tour detail with ordered checkpoints. When `completedCheckpointIds` is
 * provided (session known), each checkpoint also carries its sequential status.
 */
export async function getTourDetail(
  slug: string,
  locale: Locale,
  completedCheckpointIds?: string[],
): Promise<TourDetailView | null> {
  const tour = await prisma.tour.findUnique({
    where: { slug },
    include: {
      translations: true,
      checkpoints: {
        orderBy: { order: "asc" },
        include: {
          checkpoint: {
            include: {
              translations: true,
              images: { orderBy: { sortOrder: "asc" } },
            },
          },
        },
      },
    },
  });
  if (!tour) return null;

  const translation = pickLocalized(tour.translations, locale);

  let statuses: Map<string, CheckpointStatus> | null = null;
  if (completedCheckpointIds) {
    statuses = deriveStatuses(
      tour.checkpoints.map((tc) => tc.checkpointId),
      completedCheckpointIds,
    ).statuses;
  }

  const checkpoints: TourCheckpointView[] = tour.checkpoints.map((tc) => {
    const cp = tc.checkpoint;
    const cpTranslation = pickLocalized(cp.translations, locale);
    return {
      id: cp.id,
      slug: cp.slug,
      order: tc.order,
      name: cpTranslation?.name ?? cp.slug,
      summary: cpTranslation?.summary ?? "",
      address: cpTranslation?.address ?? "",
      latitude: cp.latitude,
      longitude: cp.longitude,
      thumbnailUrl:
        cp.images.find((img) => img.isThumbnail)?.url ?? cp.images[0]?.url ?? null,
      estimatedVisitMinutes: cp.estimatedVisitMinutes,
      status: statuses ? (statuses.get(cp.id) ?? null) : null,
    };
  });

  return {
    id: tour.id,
    slug: tour.slug,
    name: translation?.name ?? tour.slug,
    tagline: translation?.tagline ?? "",
    description: translation?.description ?? "",
    coverImageUrl: translation?.coverImageUrl ?? "",
    checkpointCount: checkpoints.length,
    estimatedMinutes: checkpoints.reduce(
      (sum, cp) => sum + cp.estimatedVisitMinutes,
      0,
    ),
    checkpoints,
  };
}
