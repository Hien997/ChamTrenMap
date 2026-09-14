import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { MapExperience } from "@/components/map/MapExperience";
import type { MapCheckpoint } from "@/components/map/types";
import type { Locale } from "@/config/constants";
import { getSessionUser } from "@/lib/session";
import { deriveStatuses } from "@/services/progress-status";
import { getCompletedCheckpointIds } from "@/services/progress.service";
import { getTourDetail } from "@/services/tours.service";
import type { TourProgressView } from "@/types";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; tourSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, tourSlug } = await params;
  const tour = await getTourDetail(tourSlug, locale as Locale);
  return { title: `${tour?.name ?? "Map"} — Chắm Trên Map` };
}

export default async function TourMapPage({ params }: Props) {
  const { locale, tourSlug } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  const completedIds = user
    ? await getCompletedCheckpointIds(user.id, tourSlug)
    : [];
  const tour = await getTourDetail(tourSlug, locale as Locale, completedIds);
  if (!tour) notFound();

  const derived = deriveStatuses(
    tour.checkpoints.map((cp) => cp.id),
    completedIds,
  );

  const progress: TourProgressView = {
    tourSlug,
    completedCount: completedIds.length,
    totalCount: tour.checkpoints.length,
    percent:
      tour.checkpoints.length === 0
        ? 0
        : Math.round((completedIds.length / tour.checkpoints.length) * 100),
    isCompleted: derived.isCompleted,
    currentCheckpointId: derived.currentCheckpointId,
    checkpoints: tour.checkpoints.map((cp) => ({
      checkpointId: cp.id,
      order: cp.order,
      status: cp.status ?? derived.statuses.get(cp.id) ?? "locked",
    })),
  };

  const checkpoints: MapCheckpoint[] = tour.checkpoints.map((cp) => ({
    id: cp.id,
    slug: cp.slug,
    order: cp.order,
    name: cp.name,
    summary: cp.summary,
    address: cp.address,
    latitude: cp.latitude,
    longitude: cp.longitude,
    thumbnailUrl: cp.thumbnailUrl,
    estimatedVisitMinutes: cp.estimatedVisitMinutes,
    status: cp.status ?? derived.statuses.get(cp.id) ?? "locked",
  }));

  return (
    <MapExperience
      tourSlug={tourSlug}
      locale={locale as Locale}
      tour={{ slug: tour.slug, name: tour.name }}
      checkpoints={checkpoints}
      progress={progress}
    />
  );
}
