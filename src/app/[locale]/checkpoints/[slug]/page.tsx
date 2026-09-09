import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckInFlow } from "@/components/checkin/CheckInFlow";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Locale } from "@/config/constants";
import { Link } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/session";
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

  // Personalized check-in state (anonymous session; empty on first visit).
  const user = await getSessionUser();
  const completedIds =
    user && tour ? await getCompletedCheckpointIds(user.id, tour.slug) : [];
  const checkedIn = completedIds.includes(checkpoint.id);

  const jsonLd = {
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
    image: checkpoint.images.map((img) => img.url),
    url: `${appUrl()}/${locale}/checkpoints/${slug}`,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16">
        {/* Hero */}
        <div className="relative mt-4 aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
          {checkpoint.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin-managed URLs
            <img
              src={checkpoint.thumbnailUrl}
              alt={checkpoint.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
        </div>

        <div className="mt-5 flex flex-col gap-2">
          {tour && (
            <p className="text-sm text-muted-foreground">
              {t("onTour", { tour: tour.name })} ·{" "}
              {t("order", { order: tour.order })}
            </p>
          )}
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {checkpoint.name}
          </h1>
          <p className="text-muted-foreground">📍 {checkpoint.address}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <Badge variant="secondary">
              ⏱ {t("visitMinutes", { minutes: checkpoint.estimatedVisitMinutes })}
            </Badge>
            {checkpoint.openingHours && (
              <Badge variant="secondary">🕒 {checkpoint.openingHours}</Badge>
            )}
            {checkpoint.bestTimeToVisit && (
              <Badge variant="secondary">🌅 {checkpoint.bestTimeToVisit}</Badge>
            )}
          </div>
        </div>

        {/* Online guide sections (spec §8) */}
        <article className="mt-8 flex flex-col gap-6">
          {checkpoint.guides.map((section) => (
            <section key={section.sectionKey}>
              <h2 className="text-xl font-semibold tracking-tight">
                {section.title}
              </h2>
              <Separator className="my-3" />
              <div className="flex flex-col gap-3 leading-relaxed text-foreground/90">
                {section.content
                  .split(/\n{2,}/)
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
              </div>
            </section>
          ))}
        </article>

        {/* Gallery (spec §8) */}
        {checkpoint.images.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight">
              {t("gallery")}
            </h2>
            <Separator className="my-3" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {checkpoint.images.map((image) => (
                // eslint-disable-next-line @next/next/no-img-element -- admin-managed URLs
                <img
                  key={image.url}
                  src={image.url}
                  alt={image.alt ?? checkpoint.name}
                  className="aspect-square w-full rounded-xl object-cover"
                />
              ))}
            </div>
          </section>
        )}

        {/* Visit info + check-in (spec §8) */}
        <Card className="mt-8">
          <CardContent className="flex flex-col gap-4 p-5">
            <p className="text-lg font-semibold">📍 {t("youAreHere")}</p>
            <div className="flex flex-wrap items-center gap-2">
              <CheckInFlow
                checkpointId={checkpoint.id}
                locale={locale}
                checkedIn={checkedIn}
              />
              {tour && (
                <Link
                  href={`/map/${tour.slug}`}
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                  })}
                >
                  🗺️ {t("viewOnMap")}
                </Link>
              )}
            </div>
            {tour && (
              <Link
                href={`/tours/${tour.slug}`}
                className="text-sm text-muted-foreground underline-offset-2 hover:underline"
              >
                ← {t("backToTour")}
              </Link>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Structured data (spec §31) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
