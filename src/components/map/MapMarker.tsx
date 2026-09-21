"use client";

import { Marker, type Map as MaplibreMap, type PositionAnchor } from "maplibre-gl";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function MapMarker({
  map,
  position,
  zIndex,
  anchor = "center",
  onClick,
  children,
}: {
  map: MaplibreMap | null;
  position: [number, number];
  zIndex?: number;
  anchor?: PositionAnchor;
  onClick?: () => void;
  children: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  if (containerRef.current === null && typeof document !== "undefined") {
    containerRef.current = document.createElement("div");
  }
  const container = containerRef.current;
  const markerRef = useRef<Marker | null>(null);
  const onClickRef = useRef(onClick);
  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  useEffect(() => {
    if (!map || !container) return;
    const marker = new Marker({ element: container, anchor });
    marker.addTo(map);
    markerRef.current = marker;
    const element = container;
    const handleClick = (event: Event) => {
      event.stopPropagation();
      onClickRef.current?.();
    };
    element.addEventListener("click", handleClick);
    return () => {
      element.removeEventListener("click", handleClick);
      marker.remove();
      markerRef.current = null;
    };
  }, [map, anchor]);

  useEffect(() => {
    markerRef.current?.setLngLat(position);
  }, [position]);

  useEffect(() => {
    if (container && zIndex !== undefined) {
      container.style.zIndex = String(zIndex);
    }
  });

  return container ? createPortal(children, container) : null;
}
