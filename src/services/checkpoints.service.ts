import type { Locale } from "@/config/constants";
import { prisma } from "@/lib/prisma";
import { pickLocalized } from "@/services/localize";
import type { CheckpointDetailView, GuideSectionView } from "@/types";

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

  const translation = pickLocalized(checkpoint.translations, locale);

  // One guide row per locale; pick the requested locale (vi fallback).
  const guide = pickLocalized(checkpoint.guides, locale);

  const guides: GuideSectionView[] = guide
    ? [
        {
          locale: guide.locale as "vi" | "en",
          content: guide.content,
          contentType: guide.contentType,
        },
      ]
    : [];

  return {
    id: checkpoint.id,
    slug: checkpoint.slug,
    latitude: checkpoint.latitude,
    longitude: checkpoint.longitude,
    radiusMeters: checkpoint.radiusMeters,
    estimatedVisitMinutes: checkpoint.estimatedVisitMinutes,
    priceVnd: checkpoint.priceVnd,
    priceKind: checkpoint.priceKind === "FOOD" ? "food" : "ticket",
    name: translation?.name ?? checkpoint.slug,
    summary: translation?.summary ?? "",
    address: translation?.address ?? "",
    openingHours: translation?.openingHours ?? null,
    bestTimeToVisit: translation?.bestTimeToVisit ?? null,
    thumbnailUrl:
      checkpoint.images.find((img) => img.isThumbnail)?.url ??
      checkpoint.images[0]?.url ??
      null,
    images: checkpoint.images.map((img) => ({ url: img.url, alt: img.alt })),
    guides,
  };
}

/** All published checkpoints (marker data), localized. */
export async function listCheckpoints(locale: Locale) {
  const checkpoints = await prisma.checkpoint.findMany({
    include: {
      translations: true,
      images: { where: { isThumbnail: true }, take: 1 },
    },
  });
  return checkpoints.map((cp) => {
    const translation = pickLocalized(cp.translations, locale);
    return {
      id: cp.id,
      slug: cp.slug,
      latitude: cp.latitude,
      longitude: cp.longitude,
      name: translation?.name ?? cp.slug,
      summary: translation?.summary ?? "",
      thumbnailUrl: cp.images[0]?.url ?? null,
    };
  });
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
