import { describe, expect, it } from "vitest";

import { isTileLevelMapError } from "@/components/map/map.utils";

/** Mimics a MapLibre ErrorEvent: extra payload props are assigned onto it. */
function makeErrorEvent(data?: Record<string, unknown>): object {
  return Object.assign(new Error("boom"), data);
}

describe("isTileLevelMapError", () => {
  it("treats errors carrying a tile payload as per-tile (non-fatal)", () => {
    expect(isTileLevelMapError(makeErrorEvent({ tile: { tileID: 1 } }))).toBe(
      true,
    );
  });

  it("treats style-level errors without a tile as fatal", () => {
    expect(isTileLevelMapError(makeErrorEvent())).toBe(false);
    expect(
      isTileLevelMapError(makeErrorEvent({ sourceId: "openmaptiles" })),
    ).toBe(false);
  });

  it("ignores malformed events", () => {
    expect(isTileLevelMapError(null)).toBe(false);
    expect(isTileLevelMapError(undefined)).toBe(false);
    expect(isTileLevelMapError("error")).toBe(false);
    expect(isTileLevelMapError({})).toBe(false);
    expect(isTileLevelMapError({ tile: null })).toBe(false);
  });
});
