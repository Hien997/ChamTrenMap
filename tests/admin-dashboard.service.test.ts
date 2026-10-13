import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/prisma";
import {
  ADMIN_RECENT_ACTIVITY_LIMIT,
  bucketCheckInsByDay,
  getAdminDashboard,
} from "@/services/admin-dashboard.service";

/**
 * The dashboard aggregates several separate reads, so each test states exactly
 * which prisma delegate it answers. Anything a test leaves unstubbed is a
 * regression signal: the service issues a fixed, bounded set of queries rather
 * than walking relations client-side.
 */
const stub = (
  values: {
    tourCounts?: Array<{ status: string; _count: { _all: number } }>;
    checkpointTotal?: number;
    checkpointsWithGuides?: number;
    guideSections?: number;
    checkInTotal?: number;
    checkInsLast7Days?: number;
    distinctVisitors?: number;
    recent?: unknown[];
    tours?: unknown[];
    completions?: Array<{
      tourId: string;
      userId: string;
      completedAt?: Date | null;
    }>;
  } = {},
) => {
  // Mirrors Prisma `groupBy({ by: ["status"], _count: { _all: true } })`, whose
  // `_count` is an object keyed by the counted field, not a bare number.
  vi.spyOn(prisma.tour, "groupBy").mockResolvedValue(
    (values.tourCounts ?? [
      { status: "PUBLISHED", _count: { _all: 2 } },
      { status: "DRAFT", _count: { _all: 1 } },
    ]) as never,
  );

  // Two checkpoint counts on one delegate: keyed off the filter so the stub
  // does not depend on the order the service happens to call them in.
  vi.spyOn(prisma.checkpoint, "count").mockImplementation((async (args?: {
    where?: { guides?: unknown };
  }) =>
    args?.where?.guides
      ? (values.checkpointsWithGuides ?? 0)
      : (values.checkpointTotal ?? 5)) as never);

  vi.spyOn(prisma.guideSection, "count").mockResolvedValue(
    values.guideSections ?? 8,
  );

  vi.spyOn(prisma.checkIn, "count").mockImplementation((async (args?: {
    where?: { checkedInAt?: unknown };
  }) =>
    args?.where?.checkedInAt
      ? (values.checkInsLast7Days ?? 0)
      : (values.checkInTotal ?? 0)) as never);

  vi.spyOn(prisma.user, "count").mockResolvedValue(
    values.distinctVisitors ?? 0,
  );
  vi.spyOn(prisma.checkIn, "findMany").mockResolvedValue(
    (values.recent ?? []) as never,
  );
  vi.spyOn(prisma.tour, "findMany").mockResolvedValue(
    (values.tours ?? []) as never,
  );
  vi.spyOn(prisma.tourProgress, "findMany").mockResolvedValue(
    (values.completions ?? []) as never,
  );
};

const makeTourRow = (
  overrides: {
    id?: string;
    slug?: string;
    vi?: string | null;
    en?: string | null;
    checkpointCount?: number;
  } = {},
) => ({
  id: overrides.id ?? "tour-1",
  slug: overrides.slug ?? "ha-tien-discovery",
  status: "PUBLISHED",
  updatedAt: new Date("2026-01-02T00:00:00Z"),
  translations: [
    overrides.vi === null
      ? null
      : { locale: "vi", name: overrides.vi ?? "Hà Tiên Discovery" },
    overrides.en == null ? null : { locale: "en", name: overrides.en },
  ].filter((row): row is { locale: string; name: string } => row !== null),
  _count: { checkpoints: overrides.checkpointCount ?? 4 },
});

describe("getAdminDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("splits the tour groupBy into published and draft totals", async () => {
    stub();

    const dashboard = await getAdminDashboard();

    expect(dashboard.counts.toursTotal).toBe(3);
    expect(dashboard.counts.toursPublished).toBe(2);
    expect(dashboard.counts.toursDrafts).toBe(1);
  });

  it("keeps every count at zero when the database has no tours at all", async () => {
    stub({ tourCounts: [], checkpointTotal: 0, guideSections: 0 });

    const dashboard = await getAdminDashboard();

    expect(dashboard.counts).toMatchObject({
      toursTotal: 0,
      toursPublished: 0,
      toursDrafts: 0,
      checkpointsTotal: 0,
      guideSections: 0,
      checkInsTotal: 0,
      distinctVisitors: 0,
      checkInsLast7Days: 0,
    });
  });

  it("derives per-tour progress from distinct visitors and completions", async () => {
    stub({
      tours: [makeTourRow()],
      completions: [
        {
          tourId: "tour-1",
          userId: "u1",
          completedAt: new Date("2026-01-05T00:00:00Z"),
        },
        { tourId: "tour-1", userId: "u2", completedAt: null },
      ],
    });

    const dashboard = await getAdminDashboard();

    expect(dashboard.tourProgress).toHaveLength(1);
    expect(dashboard.tourProgress[0]).toMatchObject({
      slug: "ha-tien-discovery",
      name: "Hà Tiên Discovery",
      checkpointCount: 4,
      visitorCount: 2,
      completedCount: 1,
      percent: 50,
    });
  });

  it("reports zero percent for a published tour with no checkpoints instead of dividing by zero", async () => {
    stub({
      tours: [
        makeTourRow({ id: "empty", slug: "no-stops", checkpointCount: 0 }),
      ],
    });

    const dashboard = await getAdminDashboard();

    expect(dashboard.tourProgress[0]).toMatchObject({
      checkpointCount: 0,
      visitorCount: 0,
      percent: 0,
    });
  });

  it("prefers the Vietnamese name, then English, then the slug", async () => {
    stub({
      tours: [
        makeTourRow({
          id: "tour-2",
          slug: "fallback-slug",
          vi: null,
          en: "English name",
        }),
      ],
    });

    const dashboard = await getAdminDashboard();

    expect(dashboard.tourProgress[0]?.name).toBe("English name");
  });

  it("falls back to the slug when a tour has neither translation name", async () => {
    stub({
      tours: [
        makeTourRow({ id: "tour-3", slug: "bare-slug", vi: null, en: null }),
      ],
    });

    const dashboard = await getAdminDashboard();

    expect(dashboard.tourProgress[0]?.name).toBe("bare-slug");
  });

  it("orders per-tour progress by visitor count so the busiest tour leads", async () => {
    stub({
      tours: [
        makeTourRow({
          id: "quiet",
          slug: "quiet",
          vi: "Quiet",
          checkpointCount: 2,
        }),
        makeTourRow({
          id: "busy",
          slug: "busy",
          vi: "Busy",
          checkpointCount: 2,
        }),
      ],
      completions: [
        { tourId: "busy", userId: "a" },
        { tourId: "busy", userId: "b" },
        { tourId: "busy", userId: "c" },
      ],
    });

    const dashboard = await getAdminDashboard();

    expect(dashboard.tourProgress.map((row) => row.slug)).toEqual([
      "busy",
      "quiet",
    ]);
  });

  it("caps recent activity at the activity limit", async () => {
    const recent = Array.from(
      { length: ADMIN_RECENT_ACTIVITY_LIMIT + 4 },
      (_, i) => ({
        id: `check-${i}`,
        checkedInAt: new Date(2026, 0, 1, 0, i),
        accuracy: 12,
        distanceFromCheckpoint: 4,
        user: { email: `visitor${i}@example.com` },
        checkpoint: {
          slug: `cp-${i}`,
          translations: [{ locale: "vi", name: `Checkpoint ${i}` }],
          tourLinks: [{ tour: { slug: `tour-${i}`, status: "PUBLISHED" } }],
        },
      }),
    );
    stub({ recent });

    const dashboard = await getAdminDashboard();

    expect(dashboard.recentActivity).toHaveLength(ADMIN_RECENT_ACTIVITY_LIMIT);
    expect(dashboard.recentActivity[0]).toMatchObject({
      checkpointSlug: "cp-0",
      checkpointName: "Checkpoint 0",
      tourSlug: "tour-0",
      visitor: "visitor0@example.com",
      accuracy: 12,
      distanceFromCheckpoint: 4,
    });
    expect(dashboard.recentActivity[0]?.checkedInAt instanceof Date).toBe(true);
  });

  it("labels an anonymous check-in and falls back to the English name", async () => {
    stub({
      recent: [
        {
          id: "check-1",
          checkedInAt: new Date("2026-01-01T00:00:00Z"),
          accuracy: 20,
          distanceFromCheckpoint: 8,
          user: { email: null },
          checkpoint: {
            slug: "cp-1",
            translations: [{ locale: "en", name: "English checkpoint" }],
            tourLinks: [{ tour: { slug: "tour-1", status: "PUBLISHED" } }],
          },
        },
      ],
    });

    const dashboard = await getAdminDashboard();

    expect(dashboard.recentActivity[0]).toMatchObject({
      checkpointName: "English checkpoint",
      visitor: "Anonymous visitor",
    });
  });

  it("hides a recent check-in whose tour is still a draft", async () => {
    stub({
      recent: [
        {
          id: "check-draft",
          checkedInAt: new Date("2026-01-01T00:00:00Z"),
          accuracy: 9,
          distanceFromCheckpoint: 2,
          user: { email: "a@example.com" },
          checkpoint: {
            slug: "cp-draft",
            translations: [{ locale: "vi", name: "Draft stop" }],
            tourLinks: [{ tour: { slug: "draft-tour", status: "DRAFT" } }],
          },
        },
      ],
    });

    const dashboard = await getAdminDashboard();

    expect(dashboard.recentActivity).toHaveLength(0);
  });

  it("exposes generatedAt as a parseable ISO string so the page renders without drift", async () => {
    stub();

    const dashboard = await getAdminDashboard();

    expect(typeof dashboard.generatedAt).toBe("string");
    expect(Number.isNaN(Date.parse(dashboard.generatedAt))).toBe(false);
  });

  it("sums groupBy rows across statuses", async () => {
    stub({
      tourCounts: [
        { status: "PUBLISHED", _count: { _all: 4 } },
        { status: "DRAFT", _count: { _all: 7 } },
      ],
    });

    const dashboard = await getAdminDashboard();

    expect(dashboard.counts.toursTotal).toBe(11);
    expect(dashboard.counts.toursPublished).toBe(4);
    expect(dashboard.counts.toursDrafts).toBe(7);
  });
});

describe("bucketCheckInsByDay", () => {
  // A fixed Wednesday so day-labels and gaps are deterministic. The helper keys
  // buckets by local calendar day, so these are built in local time on purpose.
  const now = new Date(2026, 0, 7, 12, 0, 0); // Wed 7 Jan 2026

  const daysAgo = (n: number, hour = 9): Date => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  it("returns one bucket per day, oldest first, ending on today", () => {
    const buckets = bucketCheckInsByDay([], now, 7);

    expect(buckets).toHaveLength(7);
    // Last bucket is today; earlier ones step back one day each.
    expect(buckets[6]?.count).toBe(0);
    expect(buckets[0]?.count).toBe(0);
  });

  it("counts check-ins into their local calendar day", () => {
    const buckets = bucketCheckInsByDay(
      [daysAgo(0, 8), daysAgo(0, 14), daysAgo(2, 10)],
      now,
      7,
    );

    expect(buckets[6]?.count).toBe(2); // today
    expect(buckets[4]?.count).toBe(1); // two days ago
  });

  it("emits a stable ISO day key and a short weekday label per bucket", () => {
    const buckets = bucketCheckInsByDay([], now, 7);

    expect(buckets[0]?.day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(buckets[6]?.day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(buckets[6]?.label.length).toBeGreaterThan(0);
  });

  it("ignores check-ins older than the window", () => {
    const buckets = bucketCheckInsByDay([daysAgo(30)], now, 7);

    expect(buckets.every((bucket) => bucket.count === 0)).toBe(true);
  });
});
