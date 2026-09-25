"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";

import { MapLibreMap } from "./MapLibreMap";
import { createHomePin } from "./marker-elements";
import type { MapLocation } from "./map.types";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export interface HomeMapLocation extends MapLocation {
  slug: string;
}

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
      renderMarkerElement={createHomePin}
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
