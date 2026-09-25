import { describe, expect, it } from "vitest";

import {
  PANORAMA_ASPECT_RATIO,
  PANORAMA_MIN_WIDTH,
  isLikelyPanorama,
} from "@/lib/panorama";

describe("isLikelyPanorama", () => {
  it("accepts a 2:1 frame", () => {
    expect(isLikelyPanorama(4096, 2048)).toBe(true);
    expect(isLikelyPanorama(2048, 1024)).toBe(true);
  });

  it("accepts a small drift from 2:1, since real exports are rarely exact", () => {
    expect(isLikelyPanorama(4200, 2048)).toBe(true);
    expect(isLikelyPanorama(4000, 2048)).toBe(true);
  });

  it("rejects a frame that is clearly not equirectangular", () => {
    expect(isLikelyPanorama(4000, 3000)).toBe(false);
    expect(isLikelyPanorama(2048, 2048)).toBe(false);
    expect(isLikelyPanorama(1080, 1920)).toBe(false);
  });

  it("rejects a well-shaped but too small image, which the sphere would only blur", () => {
    expect(
      isLikelyPanorama(PANORAMA_MIN_WIDTH - 1, (PANORAMA_MIN_WIDTH - 1) / 2),
    ).toBe(false);
    expect(isLikelyPanorama(PANORAMA_MIN_WIDTH, PANORAMA_MIN_WIDTH / 2)).toBe(
      true,
    );
  });

  it("rejects degenerate dimensions instead of dividing by zero", () => {
    expect(isLikelyPanorama(0, 0)).toBe(false);
    expect(isLikelyPanorama(2048, 0)).toBe(false);
    expect(isLikelyPanorama(Number.NaN, 1024)).toBe(false);
    expect(isLikelyPanorama(Number.POSITIVE_INFINITY, 1024)).toBe(false);
  });

  it("pins the aspect contract the viewer relies on", () => {
    expect(PANORAMA_ASPECT_RATIO).toBe(2);
  });
});
