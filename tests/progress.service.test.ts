import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/prisma";
import { buildProgressView } from "@/services/progress.service";

interface TourFixture {
  id: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  checkpoints: Array<{ checkpointId: string; order: number }>;
}

const makeTour = (overrides: Partial<TourFixture> = {}): TourFixture => {
  return {
    id: overrides.id ?? "tour-1",
    slug: overrides.slug ?? "ha-tien-discovery",
    status: overrides.status ?? "PUBLISHED",
    checkpoints: overrides.checkpoints ?? [
      { checkpointId: "cp-1", order: 1 },
      { checkpointId: "cp-2", order: 2 },
    ],
  };
};

describe("buildProgressView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("constrains the tour lookup to PUBLISHED when asked (public progress read)", async () => {
    const findUnique = vi
      .spyOn(prisma.tour, "findUnique")
      .mockResolvedValue(null);
    vi.spyOn(prisma.checkIn, "findMany").mockResolvedValue([]);

    const view = await buildProgressView("user-1", "ha-tien-discovery", {
      publishedOnly: true,
    });

    expect(view).toBeNull();
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: "ha-tien-discovery", status: "PUBLISHED" },
      }),
    );
    // A DRAFT slug resolves to `null`, so no progress rows are ever read.
    expect(prisma.checkIn.findMany).not.toHaveBeenCalled();
  });

  it("leaves the tour lookup unconstrained by status by default (check-in path)", async () => {
    const findUnique = vi
      .spyOn(prisma.tour, "findUnique")
      .mockResolvedValue(makeTour() as never);
    // The Prisma spy types the default payload; the real call selects only
    // `checkpointId`, which is all `buildProgressView` reads.
    vi.spyOn(prisma.checkIn, "findMany").mockResolvedValue([
      { checkpointId: "cp-1" },
    ] as never);

    const view = await buildProgressView("user-1", "ha-tien-discovery");

    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: "ha-tien-discovery" } }),
    );
    expect(view).toMatchObject({
      tourSlug: "ha-tien-discovery",
      completedCount: 1,
      totalCount: 2,
      percent: 50,
      isCompleted: false,
      currentCheckpointId: "cp-2",
    });
  });

  it("reports an empty tour as zeroed progress rather than null", async () => {
    vi.spyOn(prisma.tour, "findUnique").mockResolvedValue(
      makeTour({ checkpoints: [] }) as never,
    );
    vi.spyOn(prisma.checkIn, "findMany").mockResolvedValue([]);

    const view = await buildProgressView("user-1", "ha-tien-discovery");

    expect(view).toMatchObject({
      completedCount: 0,
      totalCount: 0,
      percent: 0,
      isCompleted: false,
      currentCheckpointId: null,
      checkpoints: [],
    });
  });
});
