import type { Locale } from "@/config/constants";
import { prisma } from "@/lib/prisma";
import { pickLocalized } from "@/services/localize";
import {
  toCheckpointDetail,
  toCheckpointSummary,
} from "@/services/checkpoint-content";
import type { CheckpointDetailView } from "@/types";

/** Full checkpoint with localized guide sections & gallery (Plan.md §6). */
export async function getCheckpointDetail(
  slug: string,
  locale: Locale,
): Promise<CheckpointDetailView | null> {
  const checkpoint = await prisma.checkpoint.findUnique({
    where: { slug },
    include: {
      translations: true,
      images: { orderBy: { sortOrder: "asc" } },
      guides: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!checkpoint) return null;

  return toCheckpointDetail(checkpoint, locale);
}

/** All published checkpoints (marker data), localized. */
export async function listCheckpoints(locale: Locale) {
  const checkpoints = await prisma.checkpoint.findMany({
    include: {
      translations: true,
      images: { where: { isThumbnail: true }, take: 1 },
    },
  });
  return checkpoints.map((cp) => toCheckpointSummary(cp, locale));
}

/** The published tour a checkpoint belongs to (for "on tour" badges & CTAs). */
export async function getTourForCheckpoint(
  checkpointSlug: string,
  locale: Locale,
): Promise<{ slug: string; name: string; order: number } | null> {
  const link = await prisma.tourCheckpoint.findFirst({
    where: {
      checkpoint: { slug: checkpointSlug },
      tour: { status: "PUBLISHED" },
    },
    orderBy: { order: "asc" },
    include: { tour: { include: { translations: true } } },
  });
  if (!link) return null;
  const translation = pickLocalized(link.tour.translations, locale);
  return {
    slug: link.tour.slug,
    name: translation?.name ?? link.tour.slug,
    order: link.order,
  };
}
