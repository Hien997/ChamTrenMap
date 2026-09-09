import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { TourSummaryView } from "@/types";

/** Landing/tour-list card with cover photo, stats and CTAs. */
export async function TourCard({ tour }: { tour: TourSummaryView }) {
  const t = await getTranslations("Tours");

  return (
    <Card className="gap-0 overflow-hidden pt-0">
      <Link href={`/tours/${tour.slug}`} className="relative block aspect-[16/9] bg-muted">
        {tour.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- content URLs are admin-managed, no fixed remotePatterns
          <img
            src={tour.coverImageUrl}
            alt={tour.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
      </Link>
      <CardContent className="flex flex-col gap-3 p-5">
        <h3 className="text-lg font-semibold tracking-tight">
          <Link href={`/tours/${tour.slug}`} className="hover:underline">
            {tour.name}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {tour.description}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>📍 {t("checkpoints", { count: tour.checkpointCount })}</span>
          <span>⏱ {t("duration", { minutes: tour.estimatedMinutes })}</span>
        </div>
        <div className="mt-1 flex gap-2">
          <Link
            href={`/map/${tour.slug}`}
            className={buttonVariants({ size: "sm" })}
          >
            {t("openMap")}
          </Link>
          <Link
            href={`/tours/${tour.slug}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            {t("detail")}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
