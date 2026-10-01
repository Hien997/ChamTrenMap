import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { KeyRoundIcon } from "lucide-react";
import PrivateTourShell from "@/components/tour/PrivateTourShell";
import PrivateTourUnlockForm from "@/components/tour/PrivateTourUnlockForm";

/**
 * Unlisted by design (ADR-0006): the entry page and every code URL must stay
 * out of search results, so neither route is indexed.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Entry point for a private tour.
 *
 * This is the *only* public way in: the itinerary is never served without a
 * prior unlock, so the page itself shows the form and nothing else (ADR-0006).
 * `PrivateTourShell` supplies the private backdrop and the language switcher —
 * neither leaks anything, because this route has no tour data to leak.
 */
const PrivateTourAccessPage = async ({
  params,
}: {
  params: Promise<{ locale: string }>;
}) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "PrivateTour" });

  return (
    <PrivateTourShell>
      <div className="my-auto w-full max-w-md space-y-6 py-8">
        <header className="space-y-2 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRoundIcon aria-hidden className="size-6" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </header>

        <PrivateTourUnlockForm />
      </div>
    </PrivateTourShell>
  );
};

export default PrivateTourAccessPage;
