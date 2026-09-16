"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";

import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { MapLibreMap } from "./MapLibreMap";
import type { MapLocation } from "./map.types";

/** A checkpoint shown on the homepage map, with its detail-page slug. */
export interface HomeMapLocation extends MapLocation {
  slug: string;
}

/**
 * Interactive homepage map: every published checkpoint rendered as a tappable
 * pin (MapLibreMap kit). Selecting a pin opens a small popup with the
 * checkpoint summary and a link to its detail page. Fits the viewport to the
 * checkpoints once the map is ready.
 */
export function HomeMap({
  locations,
  className,
}: {
  locations: HomeMapLocation[];
  className?: string;
}) {
  const t = useTranslations("Home");
  const tCommon = useTranslations("Common");
  const tMap = useTranslations("Map");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <MapLibreMap<HomeMapLocation>
      locations={locations}
      selectedLocationId={selectedId}
      onLocationClick={(location) => setSelectedId(location.id)}
      onMapClick={() => setSelectedId(null)}
      renderMarkerElement={(location) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.baseZindex = "20";
        button.setAttribute("aria-label", location.name);
        button.title = location.name;
        button.className =
          "flex cursor-pointer flex-col items-center border-0 bg-transparent p-0 focus-visible:outline-none";

        const circle = document.createElement("div");
        circle.className =
          "map-pin-circle flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary text-xs font-semibold text-primary-foreground shadow-md transition-transform";
        circle.textContent = location.name.slice(0, 1).toUpperCase();

        const label = document.createElement("div");
        label.className =
          "mt-1 max-w-[120px] truncate rounded-full bg-background/95 px-2 py-0.5 text-[11px] font-medium text-foreground shadow-sm";
        label.textContent = location.name;

        button.append(circle, label);
        return { element: button, zIndex: 20 };
      }}
      renderPopup={(location) => (
        <div className="w-72 rounded-xl border bg-card p-4 shadow-lg">
          <h3 className="text-base font-semibold tracking-tight">
            {location.name}
          </h3>
          {location.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {location.description}
            </p>
          ) : null}
          <Link
            href={`/checkpoints/${location.slug}`}
            className={buttonVariants({
              size: "sm",
              className: "mt-3 w-full",
            })}
          >
            {t("viewCheckpoint")}
          </Link>
        </div>
      )}
      fitToLocationsOnLoad
      className={cn("h-full w-full", className)}
      loadingLabel={tMap("loadingMap")}
      errorLabel={tCommon("error")}
      retryLabel={tCommon("retry")}
      timeoutLabel={tMap("mapTimeout")}
    />
  );
}