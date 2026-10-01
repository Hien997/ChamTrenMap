import type { MapLocation } from "@/components/map/map.types";
import type { PrivateTourStopView } from "@/types";

/**
 * The map needs one field the generic `MapLocation` does not carry: the stop's
 * position in the itinerary, so the pin can be numbered the way the list is.
 */
export interface PrivateTourMapLocation extends MapLocation {
  order: number;
}

/**
 * Adapters from the private-tour itinerary view to the MapLibre kit.
 *
 * Kept as pure functions (and therefore unit-tested) because the two sides of
 * this mapping drift independently: `PrivateTourStopView` is the *server's*
 * itinerary contract, `PrivateTourMapLocation` is the *map kit's* input
 * contract. The interesting behaviours — itinerary order survives, the visited
 * flag reaches the pin, a stop with no copy does not render an empty popup
 * line — are all properties of this translation, not of MapLibre.
 */

/**
 * Stops → map markers, in itinerary order.
 *
 * `description` falls back to the address rather than `??`-ing to an empty
 * string: an empty description renders as a blank line in the popup, which
 * reads as a bug to the customer.
 */
export const privateStopsToMapLocations = (
  stops: PrivateTourStopView[],
): PrivateTourMapLocation[] =>
  stops.map((stop) => ({
    id: stop.checkpointId,
    order: stop.order,
    latitude: stop.latitude,
    longitude: stop.longitude,
    name: stop.name,
    description: stop.summary || stop.address || undefined,
    checkedIn: stop.visited,
  }));

/**
 * Stops → the polyline drawn between pins, in itinerary order.
 *
 * Coordinates are `[lng, lat]` (GeoJSON order), *not* the `[lat, lng]` the rest
 * of the app passes around — `setPathData` already draws nothing for fewer than
 * two points, so a one-stop tour simply has no line.
 */
export const privateStopsToPath = (
  stops: PrivateTourStopView[],
): [number, number][] =>
  stops.map((stop) => [stop.longitude, stop.latitude] as [number, number]);
