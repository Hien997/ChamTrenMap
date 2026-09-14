import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { HomeMap } from "@/components/map/HomeMap";
import { buttonVariants } from "@/components/ui/button";
import { TourCard } from "@/components/tour/TourCard";
import type { Locale } from "@/config/constants";
import { Link } from "@/i18n/navigation";
import { listCheckpoints } from "@/services/checkpoints.service";
import { listTours } from "@/services/tours.service";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Home");
  const tours = await listTours(locale as Locale);
  const checkpoints = await listCheckpoints(locale as Locale);
  const mapLocations = checkpoints.map((checkpoint) => ({
    id: checkpoint.id,
    slug: checkpoint.slug,
    latitude: checkpoint.latitude,
    longitude: checkpoint.longitude,
    name: checkpoint.name,
    description: checkpoint.summary || undefined,
  }));

  const steps = [
    { title: t("step1Title"), desc: t("step1Desc") },
    { title: t("step2Title"), desc: t("step2Desc") },
    { title: t("step3Title"), desc: t("step3Desc") },
    { title: t("step4Title"), desc: t("step4Desc") },
    { title: t("step5Title"), desc: t("step5Desc") },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero — the headline, then the map itself as the hero object. */}
        <section className="border-b bg-background">
          <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-12 md:pt-16">
            <div className="max-w-3xl">
              <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
                {t("heroTitle")}
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
                {t("heroSubtitle")}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/tours"
                  className={buttonVariants({
                    size: "lg",
                    className: "text-base",
                  })}
                >
                  {t("ctaStartTour")}
                </Link>
                <Link
                  href="/tours"
                  className={buttonVariants({
                    variant: "outline",
                    size: "lg",
                    className: "text-base sm:hidden",
                  })}
                >
                  {t("viewAllTours")}
                </Link>
              </div>
            </div>
          </div>

          {mapLocations.length > 0 && (
            <div className="mx-auto w-full max-w-6xl px-4 pb-12">
              <div className="relative overflow-hidden rounded-3xl border">
                <HomeMap
                  locations={mapLocations}
                  className="h-[420px] md:h-[560px]"
                />
                {/* The passport stamp — the one deliberate flourish. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute right-4 top-4 rotate-6 rounded-full border-2 border-dashed border-primary/60 bg-background/70 px-5 py-3 text-center text-xs font-semibold leading-tight text-primary/90 backdrop-blur-sm md:right-8 md:top-8 md:px-6 md:py-4 md:text-sm"
                >
                  {t("heroBadge")}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* How it works — stops along a dashed route, not cards. */}
        <section className="mx-auto w-full max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("howItWorks")}
          </h2>
          <ol className="relative mt-8 flex flex-col gap-7 lg:flex-row lg:gap-5">
            <div
              aria-hidden
              className="absolute bottom-3 left-[15px] top-3 border-l-2 border-dashed border-primary/30 lg:bottom-auto lg:left-7 lg:right-7 lg:top-[15px] lg:border-l-0 lg:border-t-2"
            />
            {steps.map((step, index) => (
              <li key={step.title} className="relative flex gap-4 lg:flex-col">
                <span className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-primary/50 bg-background text-sm font-bold tabular-nums text-primary">
                  {index + 1}
                </span>
                <div className="lg:mt-3">
                  <div className="font-semibold">{step.title}</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {step.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Featured tours */}
        {tours.length > 0 && (
          <section className="mx-auto w-full max-w-6xl px-4 pb-16">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  {t("exploreTitle")}
                </h2>
                <p className="mt-1 text-muted-foreground">{t("exploreDesc")}</p>
              </div>
              <Link
                href="/tours"
                className={buttonVariants({
                  variant: "ghost",
                  className: "hidden sm:inline-flex",
                })}
              >
                {t("viewAllTours")}
              </Link>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        Chắm Trên Map — Hà Tiên, An Giang
      </footer>
    </div>
  );
}
  