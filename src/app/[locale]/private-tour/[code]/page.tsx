import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CalendarClockIcon } from "lucide-react";
import { PanoramaViewer } from "@/components/three/PanoramaViewer";
import PrivateTourExperience from "@/components/tour/PrivateTourExperience";
import PrivateTourShell from "@/components/tour/PrivateTourShell";
import type { Locale } from "@/config/constants";
import { readPrivateTourKey } from "@/lib/private-tour-session";
import { readUnlockedPrivateTour } from "@/services/private-tours.service";

export const dynamic = "force-dynamic";

/**
 * A code URL is private customer data: it must never be indexed, even for a
 * holder who could render it (ADR-0006, "unlisted").
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ locale: string; code: string }> };

/**
 * The itinerary for a holder who already unlocked this tour.
 *
 * The code alone is not access: `readUnlockedPrivateTour` also requires the
 * holder cookie *and* a spent slot on this specific tour. Anyone else is sent
 * back to the unlock form rather than shown a "not found" page, so the page's
 * existence leaks nothing about which codes are real (ADR-0006).
 */
const PrivateTourPage = async ({ params }: Props) => {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "PrivateTour" });

  const sessionKey = await readPrivateTourKey();
  if (!sessionKey) {
    redirect(`/${locale}/private-tour`);
  }

  const tour = await readUnlockedPrivateTour({
    code,
    sessionKey,
    locale: locale as Locale,
  });
  if (!tour) {
    redirect(`/${locale}/private-tour`);
  }

  return (
    <PrivateTourShell>
      {tour.coverImageUrl && (
        <div className="relative -mx-4 aspect-[16/7] overflow-hidden rounded-2xl bg-muted/20 sm:-mx-6">
          <PanoramaViewer
            src={tour.coverImageUrl}
            alt={tour.name}
            className="absolute inset-0 h-full w-full"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
          />
        </div>
      )}

      <header className="space-y-3 border-b border-border/70 pt-6 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{tour.name}</h1>
        {tour.tagline && (
          <p className="text-sm text-muted-foreground">{tour.tagline}</p>
        )}
        {tour.description && (
          <p className="text-sm leading-relaxed text-foreground/90">
            {tour.description}
          </p>
        )}
        {tour.startsAt && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClockIcon aria-hidden className="size-4" />
            {t("startsAt")}:{" "}
            {new Date(tour.startsAt).toLocaleString(locale, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        )}
        <p className="font-mono text-xs tracking-widest text-muted-foreground">
          {tour.code}
        </p>
      </header>

      <section className="pt-6">
        {tour.stops.length === 0 ? (
          <>
            <h2 className="mb-4 text-lg font-semibold">{t("itinerary")}</h2>
            <p className="text-sm text-muted-foreground">{t("noStops")}</p>
          </>
        ) : (
          <PrivateTourExperience tour={tour} />
        )}
      </section>
    </PrivateTourShell>
  );
};

export default PrivateTourPage;
