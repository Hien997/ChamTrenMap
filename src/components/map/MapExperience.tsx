"use client";

import { useState } from "react";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  CircleCheckIcon,
  ClockIcon,
  LocateFixedIcon,
  MapPinCheckIcon,
  NavigationIcon,
  RulerIcon,
  XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { MapPinIcon } from "lucide-react";
import { CheckInFlow } from "@/components/checkin/CheckInFlow";
import { Link } from "@/i18n/navigation";
import { MapLibreMap } from "@/components/map/MapLibreMap";
import {
  createCheckpointMarkerElement,
  googleMapsDirectionsUrl,
  routeResultToGeoJson,
} from "@/components/map/map.utils";
import type {
  RouteFeatureCollection,
  TravelMode,
} from "@/components/map/map.types";
import { TravelModeToggle } from "@/components/map/MapRoute";
import type { MapCheckpoint } from "@/components/map/types";
import { CheckpointStatusIcon } from "@/components/tour/CheckpointStatusIcon";
import { TourProgress } from "@/components/tour/TourProgress";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Locale } from "@/config/constants";
import { useUserLocation } from "@/hooks/useUserLocation";
import { formatDistance } from "@/lib/format";
import { applyProgress, distanceTo, isNear } from "@/lib/tour-progress";
import { getRouteService } from "@/lib/routing";
import type { TourProgressView } from "@/types";

/** Full-screen tour map experience (Plan.md §4/§8/§10) on the MapLibre kit. */
export function MapExperience({
  tourSlug,
  locale,
  tour,
  checkpoints: initialCheckpoints,
  progress: initialProgress,
}: {
  tourSlug: string;
  locale: Locale;
  tour: { slug: string; name: string } | null;
  checkpoints: MapCheckpoint[];
  progress: TourProgressView | null;
}) {
  const t = useTranslations("Map");
  const tCheckin = useTranslations("CheckIn");
  const tCommon = useTranslations("Common");

  const [checkpoints, setCheckpoints] =
    useState<MapCheckpoint[]>(initialCheckpoints);
  const [progress, setProgress] = useState<TourProgressView | null>(
    initialProgress,
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    initialProgress?.currentCheckpointId ?? null,
  );
  const [travelMode, setTravelMode] = useState<TravelMode>("WALKING");
  const [route, setRoute] = useState<RouteFeatureCollection | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);

  const {
    position,
    loading: locating,
    permission,
    startWatching,
  } = useUserLocation();

  const selectedCheckpoint =
    checkpoints.find((cp) => cp.id === selectedId) ?? null;
  const userPosition = position;

  const currentCheckpoint = progress?.currentCheckpointId
    ? checkpoints.find((cp) => cp.id === progress.currentCheckpointId) ?? null
    : null;

  const path = checkpoints.map(
    (cp) => [cp.longitude, cp.latitude] as [number, number],
  );

  const distanceToCurrent = distanceTo(userPosition, currentCheckpoint);

  const distanceToSelected = distanceTo(userPosition, selectedCheckpoint);

  async function fetchRoute() {
    const cp = selectedCheckpoint;
    if (!cp || !userPosition) return;
    setRouteLoading(true);
    try {
      const service = getRouteService();
      const result = await service.getRoute(
        [userPosition.longitude, userPosition.latitude],
        [cp.longitude, cp.latitude],
        travelMode === "DRIVING" ? "driving" : "foot",
      );
      setRoute(routeResultToGeoJson(result));
    } catch {
      toast.error(tCommon("error"));
      setRoute(null);
    } finally {
      setRouteLoading(false);
    }
  }

  function handleChecked(progressData: TourProgressView | null) {
    if (progressData) {
      setProgress(progressData);
      setCheckpoints((prev) => applyProgress(prev, progressData));
    }
    setShowCheckin(false);
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      <MapLibreMap<MapCheckpoint>
        locations={checkpoints}
        selectedLocationId={selectedId}
        onLocationClick={(cp) => {
          setSelectedId(cp.id);
          setShowSheet(true);
        }}
        onMapClick={() => {
          setSelectedId(null);
          setShowSheet(false);
        }}
        userPosition={userPosition}
        path={path}
        route={route}
        renderMarkerElement={(cp) => ({
          element: createCheckpointMarkerElement(cp),
        })}
        markerSignature={(cp) => cp.status}
        fitToLocationsOnLoad
        className="h-full w-full"
        loadingLabel={tCommon("loading")}
        errorLabel={tCommon("error")}
        retryLabel={tCommon("retry")}
        timeoutLabel={t("mapTimeout")}
        emptyLabel={t("noCheckpoints")}
      />
{/* Top overlay: tour name + progress + close */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center p-3">
        <div className="pointer-events-auto flex w-full max-w-sm items-center justify-between gap-2 rounded-xl border bg-background/95 px-3 py-2 shadow backdrop-blur">
          <div className="min-w-0">
            {tour && (
              <p className="truncate text-sm font-semibold">{tour.name}</p>
            )}
            {progress && (
              <p className="text-xs text-muted-foreground">
                {t("progress")}: {progress.completedCount} /{" "}
                {progress.totalCount}
              </p>
            )}
          </div>
          <Link
            href={`/tours/${tourSlug}`}
            className={buttonVariants({ size: "sm", variant: "ghost" })}
            aria-label={t("backToTour")}
          >
            <XIcon aria-hidden className="size-4" />
          </Link>
        </div>
      </div>

      {/* Locate me */}
      <button
        type="button"
        onClick={startWatching}
        title={t("locateMe")}
        aria-label={t("locateMe")}
        disabled={locating}
        className="absolute right-3 top-20 z-10 flex h-11 w-11 items-center justify-center rounded-full border bg-background/95 text-foreground shadow backdrop-blur disabled:opacity-60"
      >
        <LocateFixedIcon
          aria-hidden
          className={`size-5 ${locating ? "animate-pulse" : ""}`}
        />
      </button>

      {/* Next-stop card — the walking answer: where to go, how far, one tap.
          Coral edge marks the current stop; hides while the sheet is open. */}
      {!showSheet && !progress?.isCompleted && currentCheckpoint && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-4">
          <button
            type="button"
            onClick={() => {
              setSelectedId(currentCheckpoint.id);
              setShowSheet(true);
            }}
            className="pointer-events-auto w-full max-w-sm rounded-xl border border-l-4 border-l-status-current border-border bg-background/95 p-3 text-left shadow-lg backdrop-blur outline-none transition-transform focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.99]"
          >
            <span className="flex items-center gap-1.5 text-xs font-medium text-status-current-ink dark:text-status-current">
              <MapPinIcon aria-hidden className="size-3.5" />
              {t("nextCheckpoint")}
            </span>
            <span className="mt-0.5 flex items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold">
                {currentCheckpoint.name}
              </span>
              {distanceToCurrent !== null && (
                <span className="shrink-0 text-sm tabular-nums text-status-current-ink dark:text-status-current">
                  {t("awayDistance", {
                    distance: formatDistance(distanceToCurrent, tCommon),
                  })}
                </span>
              )}
            </span>
          </button>
        </div>
      )}

      {/* Journey complete — quiet sea-glass variant of the card. */}
      {!showSheet && progress?.isCompleted && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-4">
          <p className="pointer-events-auto flex w-full max-w-sm items-center gap-2 rounded-xl border border-l-4 border-l-status-completed border-border bg-background/95 p-3 text-sm font-medium text-status-completed-ink shadow-lg backdrop-blur dark:text-status-completed">
            <CircleCheckIcon aria-hidden className="size-5 shrink-0" />
            {t("tourComplete")}
          </p>
        </div>
      )}

      {/* Bottom sheet (spec §26) */}
      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetContent
          side="bottom"
          className="max-h-[52dvh] gap-4 overflow-y-auto p-4 pb-8"
        >
          {progress && (
            <TourProgress
              completed={progress.completedCount}
              total={progress.totalCount}
              percent={progress.percent}
              label={t("progress")}
            />
          )}

          {progress?.isCompleted && (
            <p className="rounded-lg border border-status-completed/40 bg-status-completed/10 p-3 text-sm font-medium text-status-completed-ink dark:text-status-completed">
              {t("tourComplete")}
            </p>
          )}

          {selectedCheckpoint && (
            <div className="flex flex-col gap-3">
              <SheetHeader className="border-b p-0 pb-3">
                <SheetTitle className="flex items-center gap-1.5 text-lg font-semibold">
                  <CheckpointStatusIcon
                    status={selectedCheckpoint.status}
                    className="shrink-0 text-lg"
                  />
                  <span className="truncate">{selectedCheckpoint.name}</span>
                </SheetTitle>
              </SheetHeader>

              <div className="flex gap-3">
                {selectedCheckpoint.thumbnailUrl && (
                  <div
                    aria-hidden
                    className="h-20 w-28 shrink-0 rounded-lg bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${selectedCheckpoint.thumbnailUrl})`,
                    }}
                  />
                )}
                <div className="min-w-0 flex-1 text-sm text-muted-foreground">
                  <p className="truncate">{selectedCheckpoint.address}</p>
                  {distanceToSelected !== null && (
                    <p className="mt-1 flex items-center gap-1.5">
                      <RulerIcon aria-hidden className="size-3.5 shrink-0" />
                      {formatDistance(distanceToSelected, tCommon)}
                    </p>
                  )}
                  <p className="mt-1 flex items-center gap-1.5">
                    <ClockIcon aria-hidden className="size-3.5 shrink-0" />
                    {selectedCheckpoint.estimatedVisitMinutes}′
                  </p>
                </div>
              </div>

              {selectedCheckpoint.summary && (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {selectedCheckpoint.summary}
                </p>
              )}

              <TravelModeToggle
                value={travelMode}
                onChange={setTravelMode}
                labels={{
                  walking: t("walking"),
                  driving: t("driving"),
                }}
              />

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/checkpoints/${selectedCheckpoint.slug}`}
                  className={buttonVariants({ size: "sm" })}
                >
                  <BookOpenIcon aria-hidden className="size-4" />
                  {t("viewGuide")}
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={routeLoading || !userPosition}
                  onClick={fetchRoute}
                >
                  {routeLoading ? t("locating") : t("navigate")}
                  <NavigationIcon aria-hidden className="size-4" />
                </Button>
                <a
                  href={googleMapsDirectionsUrl(
                    selectedCheckpoint.latitude,
                    selectedCheckpoint.longitude,
                    travelMode,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  {t("openInGoogleMaps")}
                </a>
              </div>

              {selectedCheckpoint.status === "current" && (
                <>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setShowSheet(false);
                      setShowCheckin(true);
                    }}
                  >
                    <MapPinCheckIcon aria-hidden className="size-4" />
                    {tCheckin("action")}
                  </Button>
                  {isNear(userPosition, selectedCheckpoint) && (
                    <p className="text-xs font-medium text-status-current-ink dark:text-status-current">
                      {t("nearHint")}
                    </p>
                  )}
                </>
              )}
              {selectedCheckpoint.status === "completed" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-status-completed/15 px-3 py-1.5 text-sm font-medium text-status-completed-ink dark:text-status-completed">
                  <CircleCheckIcon aria-hidden className="size-4" />
                  {tCheckin("checkedIn")}
                </span>
              )}
              {selectedCheckpoint.status === "locked" && (
                <p className="inline-flex items-start gap-1.5 text-sm text-muted-foreground">
                  <CheckpointStatusIcon status="locked" className="mt-0.5 text-sm" />
                  {tCheckin("lockedBody")}
                </p>
              )}
            </div>
          )}

          {tour && (
            <Link
              href={`/tours/${tourSlug}`}
              className={buttonVariants({
                variant: "outline",
                className: "w-full",
              })}
            >
              <ArrowLeftIcon aria-hidden className="size-4" />
              {t("backToTour")}
            </Link>
          )}

          {permission !== "granted" && (
            <Button
              variant="outline"
              className="w-full"
              disabled={locating}
              onClick={startWatching}
            >
              <span className="flex items-center gap-1.5">
                <MapPinIcon aria-hidden className="size-4" />
                {locating ? t("locating") : t("enableLocation")}
              </span>
            </Button>
          )}
        </SheetContent>
      </Sheet>

      {showCheckin && selectedCheckpoint && (
        <CheckInFlow
          checkpointId={selectedCheckpoint.id}
          locale={locale}
          checkedIn={selectedCheckpoint.status === "completed"}
          onChecked={handleChecked}
        />
      )}

      {permission === "denied" && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-10 flex justify-center px-4">
          <p className="rounded-full border bg-background/95 px-4 py-2 text-center text-xs text-muted-foreground shadow backdrop-blur">
            {t("locationOff")}
          </p>
        </div>
      )}
    </div>
  );
}