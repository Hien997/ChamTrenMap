import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeftIcon, ClockIcon, MapIcon, MapPinIcon } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PanoramaViewer } from "@/components/three/PanoramaViewer";
import { buttonVariants } from "@/components/ui/button";
import { TourProgress } from "@/components/tour/TourProgress";
import { cn } from "@/lib/utils";
import type { Locale } from "@/config/constants";
import { Link } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/session";
import { getCompletedCheckpointIds } from "@/services/progress.service";
import { getTourDetail } from "@/services/tours.service";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const tour = await getTourDetail(slug, locale as Locale);
  if (!tour) return {};
  return {
    title: `${tour.name} — Chắm Trên Map`,
    description: tour.description,
    openGraph: {
      title: tour.name,
      description: tour.description,
      images: tour.coverImageUrl ? [tour.coverImageUrl] : [],
    },
  };
}

export default async function TourDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Tours");
  const tCommon = await getTranslations("Common");

  const user = await getSessionUser();
  const completedIds = user
    ? await getCompletedCheckpointIds(user.id, slug)
    : [];
  const tour = await getTourDetail(slug, locale as Locale, completedIds);
  if (!tour) notFound();

  const completedCount = tour.checkpoints.filter(
    (cp) => cp.status === "completed",
  ).length;
  const percent =
    tour.checkpoints.length === 0
      ? 0
      : Math.round((completedCount / tour.checkpoints.length) * 100);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        {/* Cover — 360° when the cover photo is equirectangular, flat otherwise. */}
        <div className="relative -mx-4 aspect-[16/7] overflow-hidden rounded-2xl bg-muted sm:-mx-6">
          {tour.coverImageUrl ? (
            <PanoramaViewer
              src={tour.coverImageUrl}
              alt={tour.name}
              className="absolute inset-0 h-full w-full"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{tour.name}</h1>
          <p className="text-lg text-muted-foreground">{tour.tagline}</p>
          <p className="text-muted-foreground">{tour.description}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPinIcon aria-hidden className="size-4" />
            {t("checkpoints", { count: tour.checkpointCount })}
          </span>
          <span className="flex items-center gap-1.5">
            <ClockIcon aria-hidden className="size-4" />
            {t("duration", { minutes: tour.estimatedMinutes })}
          </span>
        </div>

        <div className="mt-4">
          <TourProgress
            completed={completedCount}
            total={tour.checkpoints.length}
            percent={percent}
            label={t("yourProgress")}
          />
        </div>

        <Link
          href={`/map/${tour.slug}`}
          className={buttonVariants({ size: "lg", className: "mt-6" })}
        >
          <MapIcon aria-hidden />
          {t("start")}
        </Link>

        {/* Checkpoint list — the route itself: numbered nodes on a dashed line */}
        <h2 className="mt-10 text-xl font-semibold tracking-tight">
          {t("include")}
        </h2>
        <ol className="mt-4">
          {tour.checkpoints.map((cp, index) => {
            const last = index === tour.checkpoints.length - 1;
            return (
              <li key={cp.id} className="relative flex gap-4 pb-6 last:pb-0">
                {!last && (
                  <span
                    aria-hidden
                    className="absolute left-[17px] top-9 h-[calc(100%-2.25rem)] border-l-2 border-dashed border-status-locked/50"
                  />
                )}
                <span
                  className={cn(
                    "z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums text-white shadow-sm",
                    cp.status === "completed" && "bg-status-completed",
                    cp.status === "current" && "bg-status-current",
                    (!cp.status || cp.status === "locked") &&
                      "bg-status-locked",
                  )}
                >
                  {cp.order}
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <Link
                    href={`/checkpoints/${cp.slug}`}
                    className="block truncate font-medium hover:underline"
                  >
                    {cp.name}
                  </Link>
                  <p className="truncate text-sm text-muted-foreground">
                    {cp.address}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1 pt-1 text-sm text-muted-foreground">
                  <ClockIcon aria-hidden className="size-3.5" />
                  {t("duration", { minutes: cp.estimatedVisitMinutes })}
                </span>
              </li>
            );
          })}
        </ol>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href={`/tours`} className="hover:underline">
            <ArrowLeftIcon aria-hidden className="inline size-4 align-[-3px]" />{" "}
            {tCommon("back")}
          </Link>
        </p>
      </main>
    </div>
  );
}
