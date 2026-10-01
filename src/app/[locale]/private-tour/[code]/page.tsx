import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import PrivateTourShell from "@/components/tour/PrivateTourShell";
import PrivateTourUnlockGate from "@/components/tour/PrivateTourUnlockGate";

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
 * The gate for a code URL — and deliberately nothing more.
 *
 * The code in the path is *not* access. This route performs no read at all: no
 * cookie lookup, no database query, no existence check. It renders
 * `PrivateTourUnlockGate` with the code prefilled, and that component serves
 * the itinerary only from the response to a POST carrying the code **and** the
 * phone number.
 *
 * Earlier this rendered the unlocked itinerary server-side, keyed off the
 * `ctm_private` holder cookie. That made the URL alone sufficient after the
 * first unlock on a device — a refresh, or a re-visit days later, never asked
 * for either gate again. Reading nothing here is also why an unknown code is
 * indistinguishable from a locked one: both show the same form, so the page
 * reveals nothing about which codes exist (ADR-0006).
 */
const PrivateTourPage = async ({ params }: Props) => {
  const { locale, code } = await params;
  setRequestLocale(locale);

  return (
    <PrivateTourShell>
      <PrivateTourUnlockGate code={code} />
    </PrivateTourShell>
  );
};

export default PrivateTourPage;
