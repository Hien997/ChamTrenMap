import type { RouteProfile, RouteResult } from "@/components/map/map.types";

export interface RouteService {
  getRoute(
    start: [number, number],
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

const DEFAULT_ROUTING_URL = "https://router.project-osrm.de";

export function getRouteService(): RouteService {
  const configured = process.env.NEXT_PUBLIC_ROUTING_API_URL?.trim();
  return createOsrmRouteService(configured || DEFAULT_ROUTING_URL);
}
