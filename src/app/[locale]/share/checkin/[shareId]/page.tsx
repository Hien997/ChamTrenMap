import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ShareButtons } from "@/components/sharing/ShareButtons";
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
  if (!view) return { title: "Chàm Trên Map" };

  const t = await getTranslations({ locale, namespace: "Share" });
  const title = `✅ ${t("checkedInAt")} ${view.checkpoint.name} — Hà Tiên`;
  const description = `${view.checkpoint.name}, ${view.checkpoint.address}. ${t("exploreCta")} — Chàm Trên Map`;
  const url = `${appUrl()}/${locale}/share/checkin/${shareId}`;
  const images = view.checkpoint.thumbnailUrl ? [view.checkpoint.thumbnailUrl] : [];

  return {
    title,
    description,
    openGraph: { title, description, url, type: "website", images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

/** Public, OG-rich achievement page (spec §16). */
export default async function SharePage({ params }: Props) {
  const { locale, shareId } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Share");
  const view = await getSharePageView(shareId, locale as Locale);
  if (!view) notFound();

  const shareUrl = `${appUrl()}/${locale}/share/checkin/${view.shareId}`;
  const shareTitle = `✅ ${t("checkedInAt")} ${view.checkpoint.name} — Hà Tiên`;

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-primary/15 to-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 text-center shadow-xl">
        <p className="text-xs font-semibold tracking-[0.3em] text-muted-foreground">
          🧭 HÀ TIÊN EXPLORER
        </p>

        <div className="mt-4 text-6xl">✅</div>
        <p className="mt-2 text-sm font-medium text-emerald-700">
          {t("checkedInAt")}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
          {view.checkpoint.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          📍 {view.checkpoint.address}
        </p>
        {view.tour && (
          <p className="mt-1 text-xs text-muted-foreground">
            {t("inTour", { tour: view.tour.name })}
          </p>
        )}

        {view.checkpoint.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- admin-managed URLs
          <img
            src={view.checkpoint.thumbnailUrl}
            alt={view.checkpoint.name}
            className="mt-4 aspect-[16/9] w-full rounded-xl object-cover"
          />
        )}

        <p className="mt-4 text-lg font-bold">🏆 {t("exploreCta")}</p>

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
