import { getTranslations } from "next-intl/server";
import { ClockIcon, MapPinIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { TourSummaryView } from "@/types";

export async function TourCard({ tour }: { tour: TourSummaryView }) {
  const t = await getTranslations("Tours");

  return (
    <Card className="group gap-0 overflow-hidden pt-0 transition-shadow duration-200 hover:shadow-lg">
      <Link
        href={`/tours/${tour.slug}`}
        className="relative block aspect-[16/9] overflow-hidden bg-muted"
      >
        {tour.coverImageUrl ? (
          <img
            src={tour.coverImageUrl}
            alt={tour.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
            <MapPinIcon className="size-8" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
      </Link>
      <CardContent className="flex flex-col gap-3 p-5">
        <h3 className="text-lg font-semibold tracking-tight">
          <Link href={`/tours/${tour.slug}`} className="hover:underline">
            {tour.name}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {tour.description}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm tabular-nums text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPinIcon aria-hidden className="size-4" />
            {t("checkpoints", { count: tour.checkpointCount })}
          </span>
          <span className="flex items-center gap-1.5">
            <ClockIcon aria-hidden className="size-4" />
            {t("duration", { minutes: tour.estimatedMinutes })}
          </span>
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
