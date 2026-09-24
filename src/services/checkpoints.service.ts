import type { Locale } from "@/config/constants";
import { prisma } from "@/lib/prisma";
import { pickLocalized } from "@/services/localize";
import {
  toCheckpointDetail,
  toCheckpointSummary,
} from "@/services/checkpoint-content";
import type { CheckpointDetailView } from "@/types";

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

export async function listCheckpoints(locale: Locale) {
  const checkpoints = await prisma.checkpoint.findMany({
    include: {
      translations: true,
      images: { where: { isThumbnail: true }, take: 1 },
    },
  });
  return checkpoints.map((cp) => toCheckpointSummary(cp, locale));
}

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

/**
 * All checkpoints as picker options for the tour stop editor: id/slug plus
 * the vi display name (falling back to the slug), ordered by slug.
 *
 * Deliberately unbounded — the admin list endpoint caps `take` at 50, which
 * would silently truncate the picker on larger datasets.
 */
export async function listCheckpointOptions(): Promise<
  { id: string; slug: string; name: string }[]
> {
  const checkpoints = await prisma.checkpoint.findMany({
    include: { translations: true },
    orderBy: { slug: "asc" },
  });
  return checkpoints.map((checkpoint) => ({
    id: checkpoint.id,
    slug: checkpoint.slug,
    name:
      checkpoint.translations.find((t) => t.locale === "vi")?.name ||
      checkpoint.slug,
  }));
}
