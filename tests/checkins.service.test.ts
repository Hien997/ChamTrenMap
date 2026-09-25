import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCheckIn } from "@/services/checkins.service";
import { prisma } from "@/lib/prisma";
import type { Locale } from "@/config/constants";
import type { CreateCheckInInput } from "@/lib/validations";

interface CheckpointFixture {
  id: string;
  slug: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  estimatedVisitMinutes: number;
  sortOrderHint: number;
  priceVnd: number | null;
  priceKind: "TICKET" | "FOOD";
  translations: Array<{ locale: string; name: string }>;
  tourLinks: Array<{
    tour: {
      id: string;
      checkpoints: Array<{ checkpointId: string; order: number }>;
    };
  }>;
}

function makeCheckpoint(
  overrides: Partial<CheckpointFixture> = {},
): CheckpointFixture {
  return {
    id: overrides.id ?? "cp-1",
    slug: overrides.slug ?? "cp-1",
    latitude: 10.3826,
    longitude: 104.4835,
    radiusMeters: 100,
    estimatedVisitMinutes: 15,
    sortOrderHint: 0,
    priceVnd: null,
    priceKind: "TICKET",
    translations: [{ locale: "vi", name: "Test Checkpoint" }],
    tourLinks: overrides.tourLinks ?? [],
  };
}

function checkInInput(
  checkpointId = "cp-1",
  accuracy?: number,
): CreateCheckInInput {
  return {
    checkpointId,
    latitude: 10.3826,
    longitude: 104.4835,
    accuracy: accuracy != null ? accuracy : 12,
  };
}

describe("createCheckIn — no_tour_link branch", () => {
  const locale: Locale = "vi";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns no_tour_link when the checkpoint has no tour link", async () => {
    const checkpoint = makeCheckpoint({
      id: "cp-no-tour",
      slug: "cp-no-tour",
      tourLinks: [],
    });

    vi.spyOn(prisma.checkpoint, "findUnique").mockResolvedValue(checkpoint);
    vi.spyOn(prisma.checkIn, "findMany").mockResolvedValue([]);

    const result = await createCheckIn(
      "user-1",
      checkInInput("cp-no-tour"),
      locale,
    );

    expect(result).toEqual({ status: "no_tour_link" });
    expect(prisma.checkpoint.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "cp-no-tour" },
      }),
    );
    expect(prisma.checkIn.findMany).not.toHaveBeenCalled();
  });

  it("still checks for an existing checkpoint before deciding no_tour_link", async () => {
    vi.spyOn(prisma.checkpoint, "findUnique").mockResolvedValue(null);

    const result = await createCheckIn(
      "user-1",
      checkInInput("missing"),
      locale,
    );

    expect(result).toEqual({ status: "not_found" });
    expect(prisma.checkIn.findMany).not.toHaveBeenCalled();
  });
});
