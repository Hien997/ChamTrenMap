import { describe, expect, it } from "vitest";

import {
  MAP_LOAD_TIMEOUT_MS,
  OSM_ATTRIBUTION,
  OSM_RASTER_MAX_ZOOM,
  OSM_RASTER_TILE_URL,
  TILE_FAILURE_ESCALATION_THRESHOLD,
  defaultMapStyle,
  fallbackMapStyle,
  isTileLevelMapError,
  isTileDataEvent,
  resolveMapLoadTimeoutMs,
  resolveMapStyle,
  resolveMapTimeoutAction,
  resolveTileFailureAction,
} from "@/components/map/map.utils";

/** Just enough of a MapLibre raster source to assert on. */
interface RasterSource {
  type: string;
  tiles: string[];
  tileSize: number;
  maxzoom: number;
  attribution: string;
}

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
  it("retries once on the other built-in host when the first attempt stalls", () => {
    expect(resolveMapTimeoutAction({ fallbackAlreadyTried: false })).toBe(
      "use-fallback-style",
    );
  });

  it("gives up once the fallback style is already loading", () => {
    expect(resolveMapTimeoutAction({ fallbackAlreadyTried: true })).toBe(
      "give-up",
    );
  });
});

describe("isTileDataEvent", () => {
  it("detects a source-data event carrying a tile (a tile rendered)", () => {
    expect(isTileDataEvent({ tile: { tileID: { key: "1/1/1" } } })).toBe(true);
  });

  it("ignores events that only report source metadata", () => {
    // The `content` source event fires from TileJSON metadata, before any tile
    // is requested — it must not be mistaken for a rendered tile.
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

describe("resolveTileFailureAction", () => {
  it("stays non-fatal until the escalation threshold is reached", () => {
    for (
      let count = 1;
      count < TILE_FAILURE_ESCALATION_THRESHOLD;
      count += 1
    ) {
      expect(
        resolveTileFailureAction({
          tileErrorCount: count,
          anyTileRendered: false,
          fallbackAlreadyTried: false,
        }),
      ).toBe("ignore");
    }
  });

  it("escalates once no tile has arrived by the threshold", () => {
    expect(
      resolveTileFailureAction({
        tileErrorCount: TILE_FAILURE_ESCALATION_THRESHOLD,
        anyTileRendered: false,
        fallbackAlreadyTried: false,
      }),
    ).toBe("use-fallback-style");
  });

  it("gives up when the fallback host also serves no tiles", () => {
    expect(
      resolveTileFailureAction({
        tileErrorCount: TILE_FAILURE_ESCALATION_THRESHOLD + 5,
        anyTileRendered: false,
        fallbackAlreadyTried: true,
      }),
    ).toBe("give-up");
  });

  it("keeps gaps while panning non-fatal once a tile has rendered", () => {
    expect(
      resolveTileFailureAction({
        tileErrorCount: 99,
        anyTileRendered: true,
        fallbackAlreadyTried: false,
      }),
    ).toBe("ignore");
    expect(
      resolveTileFailureAction({
        tileErrorCount: 99,
        anyTileRendered: true,
        fallbackAlreadyTried: true,
      }),
    ).toBe("ignore");
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
    // OSM's tile policy requires attribution wherever its tiles render.
    expect(source.attribution).toBe(OSM_ATTRIBUTION);
    expect(source.attribution).toContain("openstreetmap.org/copyright");
    // The layer carries no maxzoom, so MapLibre overzooms past 19 instead of
    // blanking the map.
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
      // An explicit prop still wins over the env var.
      expect(resolveMapStyle("https://prop.test/style.json")).toBe(
        "https://prop.test/style.json",
      );
    } finally {
      if (original === undefined) delete process.env[STYLE_URL_KEY];
      else process.env[STYLE_URL_KEY] = original;
    }
  });

  it("falls back to a different host that still credits OpenStreetMap", () => {
    const style = fallbackMapStyle();
    const source = style.sources["carto-tiles"] as unknown as RasterSource;
    expect(source.type).toBe("raster");
    // A different host is the whole point: the primary may be unreachable.
    expect(source.tiles.every((t) => !t.includes("tile.openstreetmap.org"))).toBe(
      true,
    );
    expect(source.attribution).toContain(OSM_ATTRIBUTION);
    expect(style.layers).toEqual([
      { id: "carto-tiles", type: "raster", source: "carto-tiles" },
    ]);
  });
});
