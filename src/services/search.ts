import type { Prisma } from "@prisma/client";

/**
 * WHERE builders for the admin list search (`?q=`).
 *
 * Pure so `tests/search.test.ts` can pin the exact shape without a database.
 * An empty query means "no filter"; otherwise the match is case-insensitive
 * (Postgres `QueryMode`) against the slug OR either locale's name.
 */
export function buildTourSearchWhere(q: string): Prisma.TourWhereInput {
  if (!q) return {};
  return {
    OR: [
      { slug: { contains: q, mode: "insensitive" } },
      { translations: { some: { name: { contains: q, mode: "insensitive" } } } },
    ],
  };
}

export function buildCheckpointSearchWhere(
  q: string,
): Prisma.CheckpointWhereInput {
  if (!q) return {};
  return {
    OR: [
      { slug: { contains: q, mode: "insensitive" } },
      { translations: { some: { name: { contains: q, mode: "insensitive" } } } },
    ],
  };
}