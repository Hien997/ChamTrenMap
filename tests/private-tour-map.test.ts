import { describe, expect, it } from "vitest";

import {
  privateStopsToMapLocations,
  privateStopsToPath,
} from "@/components/tour/private-tour-map";
import type { PrivateTourStopView } from "@/types";

const stop = (
  overrides: Partial<PrivateTourStopView> = {},
): PrivateTourStopView => ({
  checkpointId: "cp-1",
  order: 1,
  name: "Chợ đêm Hà Tiên",
  summary: "Chợ đêm ven sông",
  address: "1 Trần Hầu, Hà Tiên",
  latitude: 10.3826,
  longitude: 104.4835,
  radiusMeters: 120,
  estimatedVisitMinutes: 45,
  visited: false,
  ...overrides,
});

describe("privateStopsToMapLocations", () => {
  it("returns nothing to plot for a tour with no stops", () => {
    expect(privateStopsToMapLocations([])).toEqual([]);
  });

  it("maps a stop onto the shape MapLibreMap expects", () => {
    expect(privateStopsToMapLocations([stop()])).toEqual([
      {
        id: "cp-1",
        order: 1,
        latitude: 10.3826,
        longitude: 104.4835,
        name: "Chợ đêm Hà Tiên",
        description: "Chợ đêm ven sông",
        checkedIn: false,
      },
    ]);
  });

  it("keeps the itinerary order number, so pins number out along the route", () => {
    const [location] = privateStopsToMapLocations([stop({ order: 3 })]);

    expect(location.order).toBe(3);
  });

  it("keeps itinerary order, so the pins number out along the route", () => {
    const locations = privateStopsToMapLocations([
      stop({ checkpointId: "cp-2", order: 2 }),
      stop({ checkpointId: "cp-1", order: 1 }),
    ]);

    expect(locations.map((location) => location.id)).toEqual(["cp-2", "cp-1"]);
  });

  it("falls back to the address when a stop carries no summary", () => {
    const [location] = privateStopsToMapLocations([stop({ summary: "" })]);

    expect(location.description).toBe("1 Trần Hầu, Hà Tiên");
  });

  it("omits the description when both summary and address are empty", () => {
    const [location] = privateStopsToMapLocations([
      stop({ summary: "", address: "" }),
    ]);

    expect(location.description).toBeUndefined();
  });

  it("carries the visited flag over as checkedIn, so progress shows on the map", () => {
    const [location] = privateStopsToMapLocations([stop({ visited: true })]);

    expect(location.checkedIn).toBe(true);
  });
});

describe("privateStopsToPath", () => {
  it("emits [lng, lat] pairs in itinerary order for the route line", () => {
    expect(
      privateStopsToPath([
        stop({ latitude: 10.3826, longitude: 104.4835 }),
        stop({ latitude: 10.3911, longitude: 104.4702 }),
      ]),
    ).toEqual([
      [104.4835, 10.3826],
      [104.4702, 10.3911],
    ]);
  });

  it("returns one coordinate for a single stop, which draws no line", () => {
    expect(privateStopsToPath([stop()])).toEqual([[104.4835, 10.3826]]);
  });

  it("returns an empty path for a tour with no stops", () => {
    expect(privateStopsToPath([])).toEqual([]);
  });
});
