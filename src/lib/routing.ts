import type { RouteProfile, RouteResult } from "@/components/map/map.types";

/**
 * Routing abstraction (task §13). The Google Directions dependency is gone;
 * any OSRM-compatible provider can serve routes, selected via
 * `NEXT_PUBLIC_ROUTING_API_URL` without touching application code.
 */
export interface RouteService {
  getRoute(
    /** [longitude, latitude] */
    start: [number, number],
    /** [longitude, latitude] */
    destination: [number, number],
    profile?: RouteProfile,
  ): Promise<RouteResult>;
}

interface OsrmResponse {
  code: string;
  routes?: {
    distance: number;
    duration: number;
    geometry: { coordinates: [number, number][] };
  }[];
}

/** OSRM HTTP implementation (`/route/v1/{profile}/…`, GeoJSON geometry). */
export function createOsrmRouteService(baseUrl: string): RouteService {
  const base = baseUrl.replace(/\/+$/, "");
  return {
    async getRoute(start, destination, profile = "foot") {
      const url =
        `${base}/route/v1/${profile}/` +
        `${start[0]},${start[1]};${destination[0]},${destination[1]}` +
        `?overview=full&geometries=geojson&steps=false`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`OSRM_HTTP_${response.status}`);
      const payload = (await response.json()) as OsrmResponse;
      const route = payload.routes?.[0];
      if (payload.code !== "Ok" || !route) {
        throw new Error(`OSRM_${payload.code || "NO_ROUTE"}`);
      }
      return {
        coordinates: route.geometry.coordinates,
        distanceMeters: route.distance,
        durationSeconds: route.duration,
      };
    },
  };
}

/**
 * Public OSRM demo server — light/demo usage only (provider policy:
 * https://github.com/Project-OSRM/osrm-backend/wiki/OSRM-demo-server-policy).
 * Set `NEXT_PUBLIC_ROUTING_API_URL` to your own instance for production.
 */
const DEFAULT_ROUTING_URL = "https://router.project-osrm.de";

export function getRouteService(): RouteService {
  const configured = process.env.NEXT_PUBLIC_ROUTING_API_URL?.trim();
  return createOsrmRouteService(configured || DEFAULT_ROUTING_URL);
}
