"use client";

import { Popup, type Map as MaplibreMap } from "maplibre-gl";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function MapPopup({
  map,
  longitude,
  latitude,
  maxWidth = "320px",
  onClose,
  children,
}: {
  map: MaplibreMap;
  longitude: number;
  latitude: number;
  maxWidth?: string;
  onClose?: () => void;
  children: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  if (containerRef.current === null && typeof document !== "undefined") {
    containerRef.current = document.createElement("div");
  }
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const container = containerRef.current;

  useEffect(() => {
    if (!container) return;
    const popup = new Popup({ closeButton: true, maxWidth })
      .setLngLat([longitude, latitude])
      .setDOMContent(container)
      .addTo(map);
    const handleClose = () => onCloseRef.current?.();
    popup.on("close", handleClose);
    return () => {
      popup.off("close", handleClose);
      popup.remove();
    };
  }, [map, container, longitude, latitude, maxWidth]);

  return container ? createPortal(children, container) : null;
}
