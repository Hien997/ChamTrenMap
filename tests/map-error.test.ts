import { describe, expect, it } from "vitest";

import {
  initialMapLoadState,
  reduceMapLoad,
  TILE_FAILURE_ESCALATION_THRESHOLD,
  type MapLoadState,
} from "@/components/map/map-load";
import {
  MAP_LOAD_TIMEOUT_MS,
  OSM_ATTRIBUTION,
  OSM_RASTER_MAX_ZOOM,
  OSM_RASTER_TILE_URL,
  defaultMapStyle,
  fallbackMapStyle,
  isTileLevelMapError,
  isTileDataEvent,
  resolveMapLoadTimeoutMs,
  resolveMapStyle,
  styleUsesTileSources,
} from "@/components/map/map.utils";

interface RasterSource {
  type: string;
  tiles: string[];
  tileSize: number;
  maxzoom: number;
  attribution: string;
}

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

describe("reduceMapLoad — timeout budget", () => {
  const readyState: MapLoadState = {
    ...initialMapLoadState,
    status: "ready",
    loaded: true,
  };

  it("ignores the budget for a loaded style that needs no tiles", () => {
    expect(
      reduceMapLoad(readyState, { type: "timeout", styleHasTiles: false }),
    ).toBe(readyState);
  });

  it("ignores the budget once any tile has rendered", () => {
    const state: MapLoadState = { ...readyState, anyTileRendered: true };
    expect(
      reduceMapLoad(state, { type: "timeout", styleHasTiles: true }),
    ).toBe(state);
  });

  it("falls back when a loaded style still awaits its first tile", () => {
    const next = reduceMapLoad(readyState, {
      type: "timeout",
      styleHasTiles: true,
    });
    expect(next.styleMode).toBe("fallback");
    expect(next.status).toBe("loading");
    expect(next.loaded).toBe(false);
  });

  it("falls back on the first timeout while the map never loaded", () => {
    const next = reduceMapLoad(initialMapLoadState, {
      type: "timeout",
      styleHasTiles: false,
    });
    expect(next.styleMode).toBe("fallback");
    expect(next.status).toBe("loading");
  });

  it("escalates to a timed-out error when the fallback also stalls", () => {
    const stalled: MapLoadState = {
      ...initialMapLoadState,
      styleMode: "fallback",
    };
    const next = reduceMapLoad(stalled, {
      type: "timeout",
      styleHasTiles: true,
    });
    expect(next.status).toBe("error");
    expect(next.timedOut).toBe(true);
  });

  it("absorbs the late timer after give-up (terminal absorption)", () => {
    const errored: MapLoadState = {
      ...initialMapLoadState,
      status: "error",
      timedOut: true,
    };
    expect(
      reduceMapLoad(errored, { type: "timeout", styleHasTiles: true }),
    ).toBe(errored);
  });
});

describe("isTileDataEvent", () => {
  it("detects a source-data event carrying a tile (a tile rendered)", () => {
    expect(isTileDataEvent({ tile: { tileID: { key: "1/1/1" } } })).toBe(true);
  });

  it("ignores events that only report source metadata", () => {
    expect(
      isTileDataEvent({
        isSourceLoaded: true,
        sourceDataType: "content",
        sourceId: "osm",
      }),
    ).toBe(false);
  });

  it("ignores malformed events", () => {
    expect(isTileDataEvent(null)).toBe(false);
    expect(isTileDataEvent(undefined)).toBe(false);
    expect(isTileDataEvent("data")).toBe(false);
    expect(isTileDataEvent({})).toBe(false);
    expect(isTileDataEvent({ tile: null })).toBe(false);
  });
});

describe("reduceMapLoad — tile failures", () => {
  it("tolerates tile errors below the escalation threshold", () => {
    let state = initialMapLoadState;
    for (let count = 1; count < TILE_FAILURE_ESCALATION_THRESHOLD; count += 1) {
      state = reduceMapLoad(state, { type: "tileError" });
      expect(state.status).toBe("loading");
      expect(state.tileErrorCount).toBe(count);
    }
  });

  it("falls back at the threshold when no tile has rendered", () => {
    let state = initialMapLoadState;
    for (
      let count = 1;
      count <= TILE_FAILURE_ESCALATION_THRESHOLD;
      count += 1
    ) {
      state = reduceMapLoad(state, { type: "tileError" });
    }
    expect(state.styleMode).toBe("fallback");
    expect(state.status).toBe("loading");
    expect(state.tileErrorCount).toBe(0); // fresh construction counters
  });

  it("gives up with a generic error when the fallback also fails tiles", () => {
    let state: MapLoadState = {
      ...initialMapLoadState,
      styleMode: "fallback",
    };
    for (
      let count = 1;
      count <= TILE_FAILURE_ESCALATION_THRESHOLD;
      count += 1
    ) {
      state = reduceMapLoad(state, { type: "tileError" });
    }
    expect(state.status).toBe("error");
    expect(state.timedOut).toBe(false); // generic label, not the timeout one
  });

  it("keeps counting but never escalates once a tile rendered", () => {
    let state: MapLoadState = { ...initialMapLoadState, anyTileRendered: true };
    for (let count = 1; count <= 20; count += 1) {
      state = reduceMapLoad(state, { type: "tileError" });
    }
    expect(state.status).toBe("loading");
    expect(state.tileErrorCount).toBe(20);
  });

  it("absorbs tile noise after the error screen", () => {
    const errored: MapLoadState = {
      ...initialMapLoadState,
      status: "error",
    };
    expect(reduceMapLoad(errored, { type: "tileError" })).toBe(errored);
  });
});

describe("reduceMapLoad — style errors, load, restarts", () => {
  it("fails a pre-load style error without the timeout label", () => {
    const next = reduceMapLoad(initialMapLoadState, { type: "styleError" });
    expect(next.status).toBe("error");
    expect(next.timedOut).toBe(false);
  });

  it("absorbs style noise after the map loaded", () => {
    const ready: MapLoadState = {
      ...initialMapLoadState,
      status: "ready",
      loaded: true,
    };
    expect(reduceMapLoad(ready, { type: "styleError" })).toBe(ready);
  });

  it("pins the parity quirk: a late load flips an errored map to ready", () => {
    const errored: MapLoadState = {
      ...initialMapLoadState,
      status: "error",
    };
    const next = reduceMapLoad(errored, { type: "load" });
    expect(next.status).toBe("ready");
    expect(next.loaded).toBe(true);
  });

  it("retry restarts with a bumped attempt and the primary style", () => {
    const errored: MapLoadState = {
      ...initialMapLoadState,
      status: "error",
      timedOut: true,
      loaded: true,
      anyTileRendered: true,
      tileErrorCount: 7,
    };
    expect(reduceMapLoad(errored, { type: "retry" })).toEqual({
      status: "loading",
      timedOut: false,
      attempt: 1,
      styleMode: "primary",
      loaded: false,
      anyTileRendered: false,
      tileErrorCount: 0,
    });
  });

  it("absorbs constructor failure after the error screen", () => {
    const errored: MapLoadState = {
      ...initialMapLoadState,
      status: "error",
    };
    expect(reduceMapLoad(errored, { type: "constructorFailed" })).toBe(
      errored,
    );
  });

  it("records tile rendering once (idempotent)", () => {
    const once = reduceMapLoad(initialMapLoadState, { type: "tileRendered" });
    expect(once.anyTileRendered).toBe(true);
    expect(reduceMapLoad(once, { type: "tileRendered" })).toBe(once);
  });
});

describe("styleUsesTileSources", () => {
  it("is true for the built-in raster styles", () => {
    expect(styleUsesTileSources(defaultMapStyle())).toBe(true);
    expect(styleUsesTileSources(fallbackMapStyle())).toBe(true);
  });

  it("is true for vector styles, which also fetch tiles", () => {
    expect(
      styleUsesTileSources({ sources: { openmaptiles: { type: "vector" } } }),
    ).toBe(true);
    expect(
      styleUsesTileSources({ sources: { dem: { type: "raster-dem" } } }),
    ).toBe(true);
  });

  it("is false when no source fetches tiles", () => {
    expect(
      styleUsesTileSources({ sources: { stops: { type: "geojson" } } }),
    ).toBe(false);
    expect(styleUsesTileSources({ sources: { logo: { type: "image" } } })).toBe(
      false,
    );
    expect(styleUsesTileSources({ sources: {} })).toBe(false);
    expect(styleUsesTileSources({})).toBe(false);
  });
});

describe("built-in (key-free) map styles", () => {
  const STYLE_URL_KEY = "NEXT_PUBLIC_MAP_STYLE_URL";

  it("defaults to the standard OpenStreetMap raster layer", () => {
    expect(OSM_RASTER_TILE_URL).toBe(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    );
    const style = defaultMapStyle();
    const source = style.sources.osm as unknown as RasterSource;
    expect(source.type).toBe("raster");
    expect(source.tiles).toEqual([OSM_RASTER_TILE_URL]);
    expect(source.tileSize).toBe(256);
    expect(source.maxzoom).toBe(OSM_RASTER_MAX_ZOOM);
    expect(OSM_RASTER_MAX_ZOOM).toBe(19);
    expect(source.attribution).toBe(OSM_ATTRIBUTION);
    expect(source.attribution).toContain("openstreetmap.org/copyright");
    expect(style.layers).toEqual([
      { id: "osm", type: "raster", source: "osm" },
    ]);
    expect(style.version).toBe(8);
  });

  it("lets a configured style URL override the built-in default", () => {
    const original = process.env[STYLE_URL_KEY];
    try {
      delete process.env[STYLE_URL_KEY];
      expect(resolveMapStyle()).toEqual(defaultMapStyle());
      expect(resolveMapStyle("   ")).toEqual(defaultMapStyle());

      process.env[STYLE_URL_KEY] = "https://example.test/style.json";
      expect(resolveMapStyle()).toBe("https://example.test/style.json");
      expect(resolveMapStyle("https://prop.test/style.json")).toBe(
        "https://prop.test/style.json",
      );
    } finally {
      if (original === undefined) delete process.env[STYLE_URL_KEY];
      else process.env[STYLE_URL_KEY] = original;
    }
  });

  it("falls back to the vendored keyless OpenFreeMap style on a different host", () => {
    const style = fallbackMapStyle();
    const styleJson = JSON.stringify(style);
    expect(styleJson).not.toContain("cartocdn.com");
    expect(styleJson).not.toContain("mapbox.com");
    expect(styleJson).not.toContain("maptiler");
    expect(styleJson).not.toMatch(/[?&](key|token|api_key)=/i);
    expect(styleJson).not.toContain("tile.openstreetmap.org");
    expect(style.sources.openmaptiles).toMatchObject({
      type: "vector",
      url: "https://tiles.openfreemap.org/planet",
    });
    expect(style.glyphs).toContain("tiles.openfreemap.org");
    expect(style.sprite).toContain("tiles.openfreemap.org");
    expect(style.version).toBe(8);
    expect(style.layers.length).toBeGreaterThan(50);
    expect(fallbackMapStyle()).toEqual(style);
    expect(fallbackMapStyle()).not.toBe(style);
  });
});
