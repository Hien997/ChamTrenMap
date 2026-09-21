"use client";

import Map from "react-map-gl/maplibre";

import "maplibre-gl/dist/maplibre-gl.css";

import {
  DEFAULT_MAP_ZOOM,
  HATIEN_CENTER,
  resolveMapStyle,
} from "@/components/map/map.utils";

export default function DevMapPage() {
  return (
    <main className="h-[100dvh] w-full">
      <Map
        mapStyle={resolveMapStyle()}
        initialViewState={{
          longitude: HATIEN_CENTER[0],
          latitude: HATIEN_CENTER[1],
          zoom: DEFAULT_MAP_ZOOM,
        }}
        style={{ width: "100%", height: "100%" }}
      />
    </main>
  );
}
