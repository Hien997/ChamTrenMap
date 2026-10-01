import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import PrivateTourShell from "@/components/tour/PrivateTourShell";
import PrivateTourUnlockGate from "@/components/tour/PrivateTourUnlockGate";

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
 * The itinerary is never rendered here at all: `PrivateTourUnlockGate` owns the
 * form *and* the unlocked view, and hands the tour over only after
 * `POST /api/private-tours/access` has matched a code against a phone number.
 * Nothing on this route reads the holder cookie, so a link on its own — or a
 * cookie left over from an earlier visit — buys nothing (ADR-0006).
 *
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

  return (
    <PrivateTourShell>
      <PrivateTourUnlockGate />
    </PrivateTourShell>
  );
};

export default PrivateTourAccessPage;
