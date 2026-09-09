"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { CheckInFlow } from "@/components/checkin/CheckInFlow";
import { CheckpointStatusIcon } from "@/components/tour/CheckpointStatusIcon";
import { TourProgress } from "@/components/tour/TourProgress";
import { Button, buttonVariants } from "@/components/ui/button";
import { useUserLocation } from "@/hooks/useUserLocation";
import { formatDistance } from "@/lib/format";
import { haversineMeters } from "@/lib/geo";
import type { TourDetailView, TourProgressView } from "@/types";
import { Link } from "@/i18n/navigation";
import {
  googleMapsDirectionsUrl,
  HaTienMap,
  TravelModeToggle,
  type TravelMode,
} from "./HaTienMap";
import type { MapCheckpoint } from "./types";

async function fetchApi<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const json = await response.json();
  if (!json.ok) throw new Error(json.error?.code ?? "REQUEST_FAILED");
  return json.data as T;
}

/** Full-screen tour map experience (Plan.md §4/§8/§10). */
export function MapExperience({
  tourSlug,
  locale,
}: {
  tourSlug: string;
  locale: string;
}) {
  const t = useTranslations("Map");
  const tCommon = useTranslations("Common");
  const tCheckIn = useTranslations("CheckIn");

  const tourQuery = useQuery({
    queryKey: ["tour", tourSlug, locale],
    queryFn: () =>
      fetchApi<TourDetailView>(`/api/tours/${tourSlug}?locale=${locale}`),
  });
  const progressQuery = useQuery({
    queryKey: ["progress", tourSlug],
    queryFn: () =>
      fetchApi<TourProgressView>(`/api/tours/${tourSlug}/progress`),
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>("WALKING");
  const [navigating, setNavigating] = useState(false);
  const {
    position,
    loading: locating,
    permission,
    startWatching,
  } = useUserLocation();

  const checkpoints: MapCheckpoint[] = useMemo(() => {
    const tour = tourQuery.data;
    if (!tour) return [];
    const statusById = new Map(
      progressQuery.data?.checkpoints.map((c) => [c.checkpointId, c.status]) ??
        [],
    );
    return tour.checkpoints.map((cp) => ({
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
      status: statusById.get(cp.id) ?? "locked",
    }));
  }, [tourQuery.data, progressQuery.data]);

  const selected = checkpoints.find((cp) => cp.id === selectedId) ?? null;
  const current = checkpoints.find((cp) => cp.status === "current") ?? null;

  // Preselect the current checkpoint so the sheet answers "where next?".
  useEffect(() => {
    if (!selectedId && current) setSelectedId(current.id);
  }, [current, selectedId]);

  const directionsTarget = navigating ? (selected ?? current) : null;
  const distanceToTarget =
    directionsTarget && position
      ? haversineMeters(
          { latitude: position.latitude, longitude: position.longitude },
          {
            latitude: directionsTarget.latitude,
            longitude: directionsTarget.longitude,
          },
        )
      : null;

  if (tourQuery.isPending) {
    return (
      <div className="flex h-[100dvh] items-center justify-center text-muted-foreground">
        {tCommon("loading")}
      </div>
    );
  }

  if (tourQuery.isError || !tourQuery.data) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">{tCommon("error")}</p>
        <Button variant="outline" onClick={() => tourQuery.refetch()}>
          {tCommon("retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      <HaTienMap
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
        checkpoints={checkpoints}
        selectedId={selectedId}
        onSelect={(checkpoint) => {
          setSelectedId(checkpoint.id);
          setNavigating(false);
        }}
        userPosition={position}
        directionsTarget={directionsTarget}
        travelMode={travelMode}
      />

      {/* Top overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-3">
        <div className="pointer-events-auto flex items-center justify-between gap-2 rounded-xl bg-background/90 px-3 py-2 shadow backdrop-blur">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {tourQuery.data.name}
            </p>
            {progressQuery.data && (
              <p className="text-xs text-muted-foreground">
                {t("progress")}: {progressQuery.data.completedCount} /{" "}
                {progressQuery.data.totalCount}
              </p>
            )}
          </div>
          <Link
            href={`/tours/${tourSlug}`}
            className={buttonVariants({ size: "sm", variant: "ghost" })}
          >
            ✕
          </Link>
        </div>
      </div>

      {/* Locate me */}
      <button
        type="button"
        onClick={startWatching}
        title={t("locateMe")}
        className="absolute right-3 top-20 z-10 flex h-11 w-11 items-center justify-center rounded-full border bg-background/90 text-lg shadow backdrop-blur"
      >
        📍
      </button>

      {/* Bottom sheet (spec §26) */}
      <div className="absolute inset-x-0 bottom-0 z-20 max-h-[52dvh] overflow-y-auto rounded-t-2xl border-t bg-background/95 p-4 shadow-2xl backdrop-blur">
        {progressQuery.data && (
          <TourProgress
            completed={progressQuery.data.completedCount}
            total={progressQuery.data.totalCount}
            percent={progressQuery.data.percent}
            label={t("progress")}
          />
        )}

        {progressQuery.data?.isCompleted && (
          <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
            {t("tourComplete")}
          </p>
        )}

        {selected && (
          <div className="mt-3 flex flex-col gap-3">
            <div className="flex gap-3">
              {selected.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- admin-managed URLs
                <img
                  src={selected.thumbnailUrl}
                  alt={selected.name}
                  className="h-20 w-28 shrink-0 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <CheckpointStatusIcon status={selected.status} className="mr-1" />
                <span className="font-semibold">
                  {String(selected.order).padStart(2, "0")} · {selected.name}
                </span>
                <p className="truncate text-sm text-muted-foreground">
                  {selected.address}
                </p>
                {distanceToTarget !== null && (
                  <p className="text-sm text-muted-foreground">
                    📏 {formatDistance(distanceToTarget, tCommon)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/checkpoints/${selected.slug}`}
                className={buttonVariants({ size: "sm" })}
              >
                📖 {t("viewGuide")}
              </Link>

              {navigating && directionsTarget?.id === selected.id ? (
                <>
                  <TravelModeToggle
                    value={travelMode}
                    onChange={setTravelMode}
                    labels={{ walking: t("walking"), driving: t("driving") }}
                  />
                  <a
                    href={googleMapsDirectionsUrl(
                      directionsTarget.latitude,
                      directionsTarget.longitude,
                      travelMode,
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({
                      size: "sm",
                      variant: "outline",
                    })}
                  >
                    🗺️ {t("openInGoogleMaps")}
                  </a>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setNavigating(false)}
                  >
                    ✕
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!position) startWatching();
                    setNavigating(true);
                  }}
                >
                  🧭 {t("navigate")}
                </Button>
              )}

              {selected.status === "current" && (
                <CheckInFlow
                  checkpointId={selected.id}
                  checkpointName={selected.name}
                  locale={locale}
                  onChecked={() => progressQuery.refetch()}
                />
              )}
              {selected.status === "completed" && (
                <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-800">
                  ✅ {tCheckIn("checkedIn")}
                </span>
              )}
              {selected.status === "locked" && (
                <span className="text-sm text-muted-foreground">
                  🔒 {t("locked")}
                </span>
              )}
            </div>

            {selected.summary && (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {selected.summary}
              </p>
            )}
          </div>
        )}

        {permission !== "granted" && (
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={startWatching}
            disabled={locating}
          >
            {locating ? t("locating") : `📍 ${t("enableLocation")}`}
          </Button>
        )}
      </div>
    </div>
  );
}
