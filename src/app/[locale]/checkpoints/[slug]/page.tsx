import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ArrowLeftIcon,
  Clock3Icon,
  ClockIcon,
  MapIcon,
  MapPinIcon,
  NavigationIcon,
  SunriseIcon,
  TicketIcon,
} from "lucide-react";
import { CheckInFlow } from "@/components/checkin/CheckInFlow";
import { CheckpointGallery } from "@/components/checkpoint/CheckpointGallery";
import { GuideContentRenderer } from "@/components/guide/GuideContent";
import { QuickStatsCard } from "@/components/checkpoint/QuickStatsCard";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PanoramaViewer } from "@/components/three/PanoramaViewer";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Locale } from "@/config/constants";
import { Link } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/session";
import { formatVnd } from "@/lib/format";
import { googleMapsDirectionsUrl } from "@/components/map/map-links";
import {
  getCheckpointDetail,
  getTourForCheckpoint,
} from "@/services/checkpoints.service";
import { getCompletedCheckpointIds } from "@/services/progress.service";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; slug: string }> };

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const checkpoint = await getCheckpointDetail(slug, locale as Locale);
  if (!checkpoint) return {};

  const url = `${appUrl()}/${locale}/checkpoints/${slug}`;
  const title = `${checkpoint.name} — Hà Tiên`;
  return {
    title,
    description: checkpoint.summary,
    alternates: {
      canonical: url,
      languages: {
        vi: `${appUrl()}/vi/checkpoints/${slug}`,
        en: `${appUrl()}/en/checkpoints/${slug}`,
      },
    },
    openGraph: {
      title,
      description: checkpoint.summary,
      url,
      type: "article",
      images: checkpoint.thumbnailUrl ? [checkpoint.thumbnailUrl] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: checkpoint.summary,
      images: checkpoint.thumbnailUrl ? [checkpoint.thumbnailUrl] : [],
    },
  };
}

export default async function CheckpointPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Checkpoint");
  const checkpoint = await getCheckpointDetail(slug, locale as Locale);
  if (!checkpoint) notFound();

  const tour = await getTourForCheckpoint(slug, locale as Locale);

  const user = await getSessionUser();
  const completedIds =
    user && tour ? await getCompletedCheckpointIds(user.id, tour.slug) : [];
  const checkedIn = completedIds.includes(checkpoint.id);

  const isFood = checkpoint.priceKind === "food";

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: checkpoint.name,
    description: checkpoint.summary,
    address: checkpoint.address,
    geo: {
      "@type": "GeoCoordinates",
      latitude: checkpoint.latitude,
      longitude: checkpoint.longitude,
    },
    ...(checkpoint.images.length > 0
      ? { image: checkpoint.images.map((img) => img.url) }
      : {}),
    url: `${appUrl()}/${locale}/checkpoints/${slug}`,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16">
        <div className="mt-4 relative">
          {checkpoint.thumbnailUrl ? (
            <div className="relative w-full aspect-video overflow-hidden rounded-2xl bg-muted">
              <PanoramaViewer
                src={checkpoint.thumbnailUrl}
                alt={checkpoint.name}
                className="absolute inset-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>
          ) : (
            <div className="aspect-video overflow-hidden rounded-2xl bg-muted" />
          )}
        </div>

        {/* Tour context + title + address */}
        <div className="mt-5 flex flex-col gap-2">
          {tour && (
            <p className="text-sm text-muted-foreground">
              {t("onTour", { tour: tour.name })}
              <span
                aria-hidden
                className="mx-2 inline-block size-1 rounded-full bg-muted-foreground/50 align-middle"
              />
              {t("order", { order: tour.order })}
            </p>
          )}
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {checkpoint.name}
          </h1>
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <MapPinIcon aria-hidden className="size-4 shrink-0" />
            {checkpoint.address}
          </p>
        </div>

        {/* Check-in + primary actions — at the TOP so the user sees them first */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <CheckInFlow
            checkpointId={checkpoint.id}
            locale={locale}
            checkedIn={checkedIn}
            variant={isFood ? "food" : "default"}
          />
          {isFood && (
            <a
              href={googleMapsDirectionsUrl(
                checkpoint.latitude,
                checkpoint.longitude,
                "WALKING",
              )}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "default", size: "sm" })}
            >
              <NavigationIcon aria-hidden className="size-4" />
              {t("navigate")}
            </a>
          )}
          {tour && (
            <Link
              href={`/map/${tour.slug}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <MapIcon aria-hidden className="size-4" />
              {t("viewOnMap")}
            </Link>
          )}
        </div>

        {/* Food checkpoint: quick-stats card */}
        {isFood && (
          <div className="mt-4">
            <QuickStatsCard
              checkpoint={{
                latitude: checkpoint.latitude,
                longitude: checkpoint.longitude,
              }}
              openingHours={checkpoint.openingHours}
              priceVnd={checkpoint.priceVnd}
            />
          </div>
        )}

        {/* Ticket/historical checkpoint: badges */}
        {!isFood && (
          <div className="mt-4 flex flex-wrap gap-2">
            {checkpoint.openingHours && (
              <Badge variant="secondary" className="gap-1">
                <Clock3Icon aria-hidden className="size-3.5" />
                {checkpoint.openingHours}
              </Badge>
            )}
            {checkpoint.bestTimeToVisit && (
              <Badge variant="secondary" className="gap-1">
                <SunriseIcon aria-hidden className="size-3.5" />
                {checkpoint.bestTimeToVisit}
              </Badge>
            )}
            <Badge variant="secondary" className="gap-1">
              <ClockIcon aria-hidden className="size-3.5" />
              {t("visitMinutes", { minutes: checkpoint.estimatedVisitMinutes })}
            </Badge>
            {checkpoint.priceVnd !== null && (
              <Badge variant="secondary" className="gap-1">
                <TicketIcon aria-hidden className="size-3.5" />
                {t("ticketPrice", { price: formatVnd(checkpoint.priceVnd) })}
              </Badge>
            )}
          </div>
        )}

        {/* Summary */}
        <p className="mt-4 text-base leading-relaxed text-foreground/80">
          {checkpoint.summary}
        </p>

        {/* Guide article (single content document) */}
        {checkpoint.guides.length > 0 && (
          <article className="mt-8">
            {checkpoint.guides.map((guide) => (
              <GuideContentRenderer
                key={guide.locale}
                content={guide.content}
              />
            ))}
          </article>
        )}

        {/* Gallery */}
        {checkpoint.images.length > 0 && (
          <section className="mt-8">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-semibold tracking-tight">
                {t("gallery")}
              </h2>
              <span className="text-sm tabular-nums text-muted-foreground">
                {checkpoint.images.length}
              </span>
            </div>
            <Separator className="my-3" />
            <CheckpointGallery
              images={checkpoint.images}
              name={checkpoint.name}
            />
          </section>
        )}

        {/* Tour footer */}
        {tour && (
          <Card className="mt-8">
            <CardContent className="p-5">
              <Link
                href={`/tours/${tour.slug}`}
                className="flex items-center gap-1 text-sm text-muted-foreground underline-offset-2 hover:underline"
              >
                <ArrowLeftIcon aria-hidden className="size-3.5" />
                {t("backToTour")}
              </Link>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Structured data (spec §31) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
