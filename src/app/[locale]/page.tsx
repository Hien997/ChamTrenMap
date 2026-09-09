import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { buttonVariants } from "@/components/ui/button";
import { TourCard } from "@/components/tour/TourCard";
import type { Locale } from "@/config/constants";
import { Link } from "@/i18n/navigation";
import { listTours } from "@/services/tours.service";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Home");
  const tours = await listTours(locale as Locale);

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
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/15 via-primary/5 to-background">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center md:py-28">
            <span className="rounded-full border bg-background/60 px-4 py-1 text-sm text-muted-foreground">
              {t("heroBadge")}
            </span>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
              {t("heroTitle")}
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              {t("heroSubtitle")}
            </p>
            <Link
              href="/tours"
              className={buttonVariants({ size: "lg", className: "text-base" })}
            >
              {t("ctaStartTour")}
            </Link>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto w-full max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("howItWorks")}
          </h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((step, index) => (
              <li key={step.title} className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="text-sm font-medium text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="mt-2 font-semibold">{step.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
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
        🧭 Chàm Trên Map — Hà Tiên, Kiên Giang
      </footer>
    </div>
  );
}
