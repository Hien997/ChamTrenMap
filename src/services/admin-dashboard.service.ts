import { prisma } from "@/lib/prisma";

/** How many check-ins the dashboard's "Recent activity" panel shows. */
export const ADMIN_RECENT_ACTIVITY_LIMIT = 8;

/** Tours in the per-tour progress panel. */
const TOUR_PROGRESS_LIMIT = 5;

/** Window for the "check-ins this week" tile. */
const ACTIVITY_WINDOW_DAYS = 7;

/** Preferred locale, then English, for showing a bilingual row in the UI. */
const pickName = (
  translations: Array<{ locale: string; name: string }>,
  fallback: string,
): string =>
  translations.find((t) => t.locale === "vi")?.name ||
  translations.find((t) => t.locale === "en")?.name ||
  fallback;

export interface AdminDashboardCounts {
  toursTotal: number;
  toursPublished: number;
  toursDrafts: number;
  checkpointsTotal: number;
  checkpointsWithGuides: number;
  guideSections: number;
  checkInsTotal: number;
  checkInsLast7Days: number;
  distinctVisitors: number;
}

export interface AdminTourProgressRow {
  id: string;
  slug: string;
  name: string;
  checkpointCount: number;
  visitorCount: number;
  completedCount: number;
  percent: number;
}

export interface AdminRecentActivityRow {
  id: string;
  checkedInAt: Date;
  checkpointSlug: string;
  checkpointName: string;
  tourSlug: string;
  visitor: string;
  accuracy: number;
  distanceFromCheckpoint: number;
}

/** One daily bar in the check-ins trend chart. */
export interface AdminTrendBucket {
  /** Local calendar day as `YYYY-MM-DD`, stable for keys and sorting. */
  day: string;
  /** Short weekday label (e.g. "Mon") for the chart axis. */
  label: string;
  count: number;
}

export interface AdminDashboardView {
  generatedAt: string;
  counts: AdminDashboardCounts;
  tourProgress: AdminTourProgressRow[];
  recentActivity: AdminRecentActivityRow[];
  checkInsTrend: AdminTrendBucket[];
}

/**
 * Bucket check-in timestamps into one count per local calendar day.
 *
 * Returns `days` buckets oldest-first ending today, so empty days stay visible
 * as zero-height bars instead of collapsing (a gap in visits is information).
 * Buckets are keyed by local day, matching how an operator reads a calendar;
 * anything older than the window is ignored rather than rolled into today.
 *
 * Pure and clock-injectable so the chart can be unit-tested without a DB.
 */
export const bucketCheckInsByDay = (
  timestamps: Date[],
  now: Date,
  days: number,
): AdminTrendBucket[] => {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const key = (date: Date): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate(),
    ).padStart(2, "0")}`;

  const counts = new Map<string, number>();
  for (const date of timestamps) {
    const bucketKey = key(date);
    counts.set(bucketKey, (counts.get(bucketKey) ?? 0) + 1);
  }

  const buckets: AdminTrendBucket[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(startOfToday);
    day.setDate(day.getDate() - offset);
    buckets.push({
      day: key(day),
      label: day.toLocaleDateString("en-GB", { weekday: "short" }),
      count: counts.get(key(day)) ?? 0,
    });
  }
  return buckets;
};

/**
 * Everything the admin overview page renders, in one read.
 *
 * The page is `force-dynamic` (an operator tool, not cacheable content), so
 * this trades extra queries for a shape the UI renders directly: no
 * client-side joins and no N+1 from the component.
 */
export const getAdminDashboard = async (): Promise<AdminDashboardView> => {
  const windowStart = new Date(
    Date.now() - ACTIVITY_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );

  const [
    tourStatusRows,
    checkpointTotal,
    checkpointsWithGuides,
    guideSections,
    checkInsTotal,
    checkInsLast7Days,
    distinctVisitors,
    recent,
    trendTimestamps,
    tours,
    completions,
  ] = await Promise.all([
    prisma.tour.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.checkpoint.count(),
    prisma.checkpoint.count({ where: { guides: { some: {} } } }),
    prisma.guideSection.count(),
    prisma.checkIn.count(),
    prisma.checkIn.count({ where: { checkedInAt: { gte: windowStart } } }),
    prisma.user.count({ where: { checkIns: { some: {} } } }),
    prisma.checkIn.findMany({
      orderBy: { checkedInAt: "desc" },
      // Over-fetch: rows whose tour is a DRAFT are dropped below, so asking for
      // exactly the limit would often return fewer rows than the panel shows.
      take: ADMIN_RECENT_ACTIVITY_LIMIT * 2,
      select: {
        id: true,
        checkedInAt: true,
        accuracy: true,
        distanceFromCheckpoint: true,
        user: { select: { email: true } },
        checkpoint: {
          select: {
            slug: true,
            translations: { select: { locale: true, name: true } },
            tourLinks: {
              take: 1,
              select: { tour: { select: { slug: true, status: true } } },
            },
          },
        },
      },
    }),
    prisma.checkIn.findMany({
      where: { checkedInAt: { gte: windowStart } },
      select: { checkedInAt: true },
    }),
    prisma.tour.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      take: TOUR_PROGRESS_LIMIT,
      select: {
        id: true,
        slug: true,
        _count: { select: { checkpoints: true } },
        translations: { select: { locale: true, name: true } },
      },
    }),
    prisma.tourProgress.findMany({
      select: { tourId: true, userId: true, completedAt: true },
    }),
  ]);

  const published =
    tourStatusRows.find((row) => row.status === "PUBLISHED")?._count._all ?? 0;
  const draft =
    tourStatusRows.find((row) => row.status === "DRAFT")?._count._all ?? 0;

  const visitorsByTour = new Map<string, Set<string>>();
  const completionsByTour = new Map<string, number>();
  for (const row of completions) {
    const visitors = visitorsByTour.get(row.tourId) ?? new Set<string>();
    visitors.add(row.userId);
    visitorsByTour.set(row.tourId, visitors);

    if (row.completedAt) {
      completionsByTour.set(
        row.tourId,
        (completionsByTour.get(row.tourId) ?? 0) + 1,
      );
    }
  }

  const tourProgress: AdminTourProgressRow[] = tours
    .map((tour) => {
      const visitorCount = visitorsByTour.get(tour.id)?.size ?? 0;
      const completedCount = completionsByTour.get(tour.id) ?? 0;
      const checkpointCount = tour._count.checkpoints;
      return {
        id: tour.id,
        slug: tour.slug,
        name: pickName(tour.translations, tour.slug),
        checkpointCount,
        visitorCount,
        completedCount,
        percent:
          visitorCount === 0
            ? 0
            : Math.min(100, Math.round((completedCount / visitorCount) * 100)),
      };
    })
    .sort((a, b) => b.visitorCount - a.visitorCount);

  const recentActivity: AdminRecentActivityRow[] = recent
    .map((row) => {
      const link = row.checkpoint.tourLinks[0];
      // A check-in on a checkpoint that belongs only to a DRAFT tour would leak
      // unpublished itinerary shape (docs/logic-map §9), so it is dropped.
      if (!link || link.tour.status !== "PUBLISHED") {
        return null;
      }
      return {
        id: row.id,
        checkedInAt: row.checkedInAt,
        checkpointSlug: row.checkpoint.slug,
        checkpointName: pickName(
          row.checkpoint.translations,
          row.checkpoint.slug,
        ),
        tourSlug: link.tour.slug,
        visitor: row.user.email || "Anonymous visitor",
        accuracy: row.accuracy,
        distanceFromCheckpoint: row.distanceFromCheckpoint,
      };
    })
    .filter((row): row is AdminRecentActivityRow => row !== null)
    .slice(0, ADMIN_RECENT_ACTIVITY_LIMIT);

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      toursTotal: published + draft,
      toursPublished: published,
      toursDrafts: draft,
      checkpointsTotal: checkpointTotal,
      checkpointsWithGuides,
      guideSections,
      checkInsTotal,
      checkInsLast7Days,
      distinctVisitors,
    },
    tourProgress,
    recentActivity,
    checkInsTrend: bucketCheckInsByDay(
      trendTimestamps.map((row) => row.checkedInAt),
      new Date(),
      ACTIVITY_WINDOW_DAYS,
    ),
  };
};
