import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CheckpointStatusIcon } from "@/components/tour/CheckpointStatusIcon";
import { buttonVariants } from "@/components/ui/button";
import { TourProgress } from "@/components/tour/TourProgress";
import { Card, CardContent } from "@/components/ui/card";
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
    title: `${tour.name} — Chàm Trên Map`,
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

  // Personalize statuses when the visitor already has an anonymous session.
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
        {/* Cover */}
        <div className="relative aspect-[16/7] overflow-hidden rounded-2xl bg-muted">
          {tour.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin-managed URLs
            <img
              src={tour.coverImageUrl}
              alt={tour.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{tour.name}</h1>
          <p className="text-lg text-muted-foreground">{tour.tagline}</p>
          <p className="text-muted-foreground">{tour.description}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <span>📍 {t("checkpoints", { count: tour.checkpointCount })}</span>
          <span>⏱ {t("duration", { minutes: tour.estimatedMinutes })}</span>
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
          🗺️ {t("start")}
        </Link>

        {/* Checkpoint list */}
        <h2 className="mt-10 text-xl font-semibold tracking-tight">
          {t("include")}
        </h2>
        <ol className="mt-4 flex flex-col gap-2">
          {tour.checkpoints.map((cp) => (
            <li key={cp.id}>
              <Card className="py-0">
                <CardContent className="flex items-center gap-3 p-3">
                  <CheckpointStatusIcon
                    status={cp.status}
                    className="w-6 text-center text-lg"
                  />
                  <span className="w-8 text-sm font-semibold tabular-nums text-muted-foreground">
                    {String(cp.order).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
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
                  <span className="shrink-0 text-sm text-muted-foreground">
                    ⏱ {cp.estimatedVisitMinutes}′
                  </span>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href={`/tours`} className="hover:underline">
            ← {tCommon("back")}
          </Link>
        </p>
      </main>
    </div>
  );
}
