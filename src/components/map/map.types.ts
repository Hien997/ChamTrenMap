export interface MapLocation {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  checkedIn?: boolean;
}

export type TravelMode = "WALKING" | "DRIVING";

export type RouteProfile = "foot" | "driving";

export interface RouteResult {
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
}

export interface LineStringGeometry {
  type: "LineString";
  coordinates: [number, number][];
}

export interface RouteFeatureCollection {
  type: "FeatureCollection";
  features: {
    type: "Feature";
    properties: Record<string, unknown>;
    geometry: LineStringGeometry;
  }[];
}

export interface CustomMarkerRender {
  element: HTMLElement;
  zIndex?: number;
  setSelected?: (selected: boolean) => void;
}
