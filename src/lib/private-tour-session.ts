import { cookies } from "next/headers";

import { PRIVATE_TOUR_COOKIE_NAME } from "@/config/constants";

/**
 * Read the private-tour holder key from `ctm_private` (ADR-0006).
 *
 * Deliberately separate from `ctm_visitor`: a private-tour customer never
 * check-ins publicly and never holds a share link, so merging the two would
 * drag a private customer into the ADR-0001 visitor seam for no reason. The
 * cookie is only ever *read* here — the route that unlocks a tour is the sole
 * writer, matching the write-lazy shape of the visitor session.
 */
export const readPrivateTourKey = async (): Promise<string | null> => {
  const store = await cookies();
  return store.get(PRIVATE_TOUR_COOKIE_NAME)?.value ?? null;
};
