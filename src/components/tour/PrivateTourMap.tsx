"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { MapLibreMap } from "@/components/map/MapLibreMap";
import { createPrivateStopPin } from "@/components/map/marker-elements";
import type { PrivateTourStopView } from "@/types";

import {
  privateStopsToMapLocations,
  privateStopsToPath,
} from "./private-tour-map";

/**
 * The itinerary drawn on a map, for a holder who already unlocked the tour.
 *
 * Everything here comes from the server's itinerary — the map is read-only: it
 * adds no way to claim a stop (that stays behind `/api/private-tours/visit` and
 * the GPS check), so widening what this page shows widens nothing private.
 */
const PrivateTourMap = ({
  stops,
  visited,
}: {
  stops: PrivateTourStopView[];
  visited: Set<string>;
}) => {
  const t = useTranslations("PrivateTour");
  const tCommon = useTranslations("Common");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // The `visited` set is *not* part of the stop records: it lives one level up
  // so a check-in updates the pin and the list at the same time.
  const locations = privateStopsToMapLocations(stops).map((location) => ({
    ...location,
    checkedIn: visited.has(location.id),
  }));
  const path = privateStopsToPath(stops);

  return (
    <div className="relative h-64 overflow-hidden rounded-xl border border-border/70 shadow-lg shadow-black/20 sm:h-80">
      <MapLibreMap
        locations={locations}
        selectedLocationId={selectedId}
        onLocationClick={(location) =>
          setSelectedId((current) =>
            current === location.id ? null : location.id,
          )
        }
        onMapClick={() => setSelectedId(null)}
        path={path}
        fitToLocationsOnLoad
        markerSignature={(location) => String(location.checkedIn)}
        renderMarkerElement={(location) =>
          createPrivateStopPin(location, {
            visited: t("pinVisited"),
            pending: t("pinPending"),
          })
        }
        renderPopup={(location) => (
          <div className="max-w-52 rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
            <p className="truncate text-sm font-medium text-popover-foreground">
              {location.name}
            </p>
            {location.description && (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {location.description}
              </p>
            )}
          </div>
        )}
        className="h-full w-full"
        loadingLabel={tCommon("loading")}
        errorLabel={tCommon("error")}
        retryLabel={tCommon("retry")}
        timeoutLabel={t("mapTimeout")}
        emptyLabel={t("mapEmpty")}
      />
    </div>
  );
};

export default PrivateTourMap;
