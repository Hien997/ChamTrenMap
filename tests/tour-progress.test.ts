import { describe, expect, it } from "vitest";

import {
  NEAR_HINT_METERS,
  applyProgress,
  distanceTo,
  isNear,
} from "@/lib/tour-progress";
import type { TourProgressView } from "@/types";

function makeProgress(
  ...statuses: { id: string; status: "completed" | "current" | "locked" }[]
): TourProgressView {
  return {
    tourSlug: "tour",
    completedCount: statuses.filter((s) => s.status === "completed").length,
    totalCount: statuses.length,
    percent: 0,
    isCompleted: false,
    currentCheckpointId:
      statuses.find((s) => s.status === "current")?.id ?? null,
    checkpoints: statuses.map((s, index) => ({
      checkpointId: s.id,
      order: index + 1,
      status: s.status,
    })),
  };
}

describe("distanceTo", () => {
  const user = { latitude: 10.3836, longitude: 104.4835 };

  it("returns null when either side is unknown", () => {
    expect(distanceTo(null, user)).toBeNull();
    expect(distanceTo(user, null)).toBeNull();
    expect(distanceTo(undefined, undefined)).toBeNull();
  });

  it("measures great-circle distance in meters", () => {
    // 0.001° of longitude at the equator is ~111.2 m.
    const distance = distanceTo(
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 0.001 },
    );
    expect(distance).toBeGreaterThan(110);
    expect(distance).toBeLessThan(113);
  });
});

describe("isNear", () => {
  it("is true inside the hint threshold, false beyond it, false when unknown", () => {
    // ~111 m apart — inside the default 200 m hint threshold.
    expect(
      isNear(
        { latitude: 0, longitude: 0 },
        { latitude: 0, longitude: 0.001 },
      ),
    ).toBe(true);
    // ~222 m apart — outside it.
    expect(
      isNear(
        { latitude: 0, longitude: 0 },
        { latitude: 0, longitude: 0.002 },
      ),
    ).toBe(false);
    expect(isNear(null, { latitude: 0, longitude: 0 })).toBe(false);
  });

  it("pins the current hint policy", () => {
    expect(NEAR_HINT_METERS).toBe(200);
  });
});

describe("applyProgress", () => {
  it("merges fresh statuses, preserving object identity for unchanged entries", () => {
    const a = { id: "a", status: "locked" as const };
    const b = { id: "b", status: "locked" as const };
    const result = applyProgress([a, b], makeProgress({ id: "a", status: "current" }));
    expect(result[0]).toEqual({ id: "a", status: "current" });
    expect(result[1]).toBe(b);
  });

  it("leaves everything untouched when progress has no checkpoints", () => {
    const a = { id: "a", status: "current" as const };
    const result = applyProgress([a], makeProgress());
    expect(result[0]).toBe(a);
  });
});
