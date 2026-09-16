import { describe, expect, it } from "vitest";

import {
  MAP_LOAD_TIMEOUT_MS,
  isTileLevelMapError,
  resolveMapLoadTimeoutMs,
  resolveMapTimeoutAction,
} from "@/components/map/map.utils";

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

describe("resolveMapLoadTimeoutMs", () => {
  const ENV_KEY = "NEXT_PUBLIC_MAP_LOAD_TIMEOUT_MS";

  it("prefers a valid explicit override", () => {
    expect(resolveMapLoadTimeoutMs(5_000)).toBe(5_000);
  });

  it("ignores non-positive or non-finite overrides", () => {
    expect(resolveMapLoadTimeoutMs(0)).toBe(MAP_LOAD_TIMEOUT_MS);
    expect(resolveMapLoadTimeoutMs(-1)).toBe(MAP_LOAD_TIMEOUT_MS);
    expect(resolveMapLoadTimeoutMs(Number.NaN)).toBe(MAP_LOAD_TIMEOUT_MS);
  });

  it("falls back to the env var, then the built-in default", () => {
    const original = process.env[ENV_KEY];
    try {
      delete process.env[ENV_KEY];
      expect(resolveMapLoadTimeoutMs()).toBe(MAP_LOAD_TIMEOUT_MS);

      process.env[ENV_KEY] = "8000";
      expect(resolveMapLoadTimeoutMs()).toBe(8_000);

      process.env[ENV_KEY] = "not-a-number";
      expect(resolveMapLoadTimeoutMs()).toBe(MAP_LOAD_TIMEOUT_MS);

      process.env[ENV_KEY] = "0";
      expect(resolveMapLoadTimeoutMs()).toBe(MAP_LOAD_TIMEOUT_MS);
    } finally {
      if (original === undefined) delete process.env[ENV_KEY];
      else process.env[ENV_KEY] = original;
    }
  });
});

describe("resolveMapTimeoutAction", () => {
  it("falls back to the built-in style once when a configured style stalls", () => {
    expect(
      resolveMapTimeoutAction({
        usedCustomStyle: true,
        fallbackAlreadyTried: false,
      }),
    ).toBe("fallback-to-default-style");
  });

  it("gives up once the built-in style is already in play", () => {
    expect(
      resolveMapTimeoutAction({
        usedCustomStyle: true,
        fallbackAlreadyTried: true,
      }),
    ).toBe("give-up");
    expect(
      resolveMapTimeoutAction({
        usedCustomStyle: false,
        fallbackAlreadyTried: false,
      }),
    ).toBe("give-up");
  });
});
