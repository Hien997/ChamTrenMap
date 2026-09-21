import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CircleCheckIcon, MapPinIcon, TrophyIcon } from "lucide-react";
import { ShareButtons } from "@/components/sharing/ShareButtons";
import { PanoramaViewer } from "@/components/three/PanoramaViewer";
import { buttonVariants } from "@/components/ui/button";
import type { Locale } from "@/config/constants";
import { Link } from "@/i18n/navigation";
import { getSharePageView } from "@/services/share.service";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; shareId: string }> };

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, shareId } = await params;
  const view = await getSharePageView(shareId, locale as Locale);
  if (!view) return { title: "Chắm Trên Map" };

  const t = await getTranslations({ locale, namespace: "Share" });
  const title = `${t("checkedInAt")} ${view.checkpoint.name} — Hà Tiên`;
  const description = `${view.checkpoint.name}, ${view.checkpoint.address}. ${t("exploreCta")} — Chắm Trên Map`;
  const url = `${appUrl()}/${locale}/share/checkin/${shareId}`;
  const images = view.checkpoint.thumbnailUrl
    ? [view.checkpoint.thumbnailUrl]
    : [];

  return {
    title,
    description,
    openGraph: { title, description, url, type: "website", images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

export default async function SharePage({ params }: Props) {
  const { locale, shareId } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Share");
  const view = await getSharePageView(shareId, locale as Locale);
  if (!view) notFound();

  const shareUrl = `${appUrl()}/${locale}/share/checkin/${view.shareId}`;
  const shareTitle = `${t("checkedInAt")} ${view.checkpoint.name} — Hà Tiên`;

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-primary/10 to-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 text-center shadow-xl">
        {/* Passport stamp — the check-in moment, inked. */}
        <div className="relative mx-auto flex h-24 w-24 -rotate-6 items-center justify-center rounded-full border-2 border-dashed border-status-completed/70 bg-status-completed/10">
          <CircleCheckIcon
            aria-hidden
            className="size-10 text-status-completed-ink dark:text-status-completed"
          />
          <span
            aria-hidden
            className="absolute inset-1.5 rounded-full border border-status-completed/40"
          />
        </div>

        <p className="mt-3 text-sm font-medium text-status-completed-ink dark:text-status-completed">
          {t("checkedInAt")}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
          {view.checkpoint.name}
        </h1>
        <p className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
          <MapPinIcon aria-hidden className="size-4 shrink-0" />
          {view.checkpoint.address}
        </p>
        {view.tour && (
          <p className="mt-1 text-xs text-muted-foreground">
            {t("inTour", { tour: view.tour.name })}
          </p>
        )}

        {view.checkpoint.thumbnailUrl && (
          <PanoramaViewer
            src={view.checkpoint.thumbnailUrl}
            alt={view.checkpoint.name}
            className="mt-4 aspect-[16/9] w-full overflow-hidden rounded-xl [&_img]:rounded-xl [&_canvas]:rounded-xl"
          />
        )}

        <p className="mt-4 flex items-center justify-center gap-2 text-lg font-bold">
          <TrophyIcon
            aria-hidden
            className="size-5 text-status-current-ink dark:text-status-current"
          />
          {t("exploreCta")}
        </p>

        <div className="mt-4">
          <ShareButtons url={shareUrl} title={shareTitle} />
        </div>

        <Link
          href="/tours"
          className={buttonVariants({ className: "mt-3 w-full" })}
        >
          {t("exploreCta")}
        </Link>

        <p className="mt-4 text-xs text-muted-foreground">{t("poweredBy")}</p>
        <Link
          href={`/checkpoints/${view.checkpoint.slug}`}
          className="mt-1 inline-block text-xs text-muted-foreground underline underline-offset-2"
        >
          {t("viewGuide")}
        </Link>
      </div>
    </div>
  );
}
