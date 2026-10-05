import type { Prisma } from "@prisma/client";

import { normalizePhone } from "@/lib/private-tour-codes";

/**
 * WHERE builders for the admin list search (`?q=`).
 *
 * Pure so `tests/search.test.ts` can pin the exact shape without a database.
 * An empty query means "no filter"; otherwise the match is case-insensitive
 * (Postgres `QueryMode`) against the slug OR either locale's name.
 */
export const buildTourSearchWhere = (q: string): Prisma.TourWhereInput => {
  if (!q) {
    return {};
  }
  return {
    OR: [
      { slug: { contains: q, mode: "insensitive" } },
      {
        translations: { some: { name: { contains: q, mode: "insensitive" } } },
      },
    ],
  };
};

export const buildCheckpointSearchWhere = (
  q: string,
): Prisma.CheckpointWhereInput => {
  if (!q) {
    return {};
  }
  return {
    OR: [
      { slug: { contains: q, mode: "insensitive" } },
      {
        translations: { some: { name: { contains: q, mode: "insensitive" } } },
      },
    ],
  };
};

/**
 * Private tours are searched by **code or customer**, not by slug: they have
 * none, and the admin works from what the customer said on the phone — the code
 * they were given, their name, or their number.
 *
 * The phone column is stored normalized (digits only, `+84…` → `0…`, ADR-0006),
 * so the typed term is normalized the same way before matching. A term with no
 * digits at all (`"Nguyen"`) is skipped rather than normalized to `""`, because
 * `contains: ""` matches every row.
 */
export const buildPrivateTourSearchWhere = (
  q: string,
): Prisma.PrivateTourWhereInput => {
  if (!q) {
    return {};
  }
  const phone = normalizePhone(q);
  return {
    OR: [
      { code: { contains: q, mode: "insensitive" } },
      { customerName: { contains: q, mode: "insensitive" } },
      ...(phone ? [{ customerPhone: { contains: phone } }] : []),
      {
        translations: { some: { name: { contains: q, mode: "insensitive" } } },
      },
    ],
  };
};
