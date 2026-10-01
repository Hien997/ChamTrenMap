"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MapIcon } from "lucide-react";

import type { PrivateTourDetailView } from "@/types";

import PrivateTourItinerary from "./PrivateTourItinerary";
import PrivateTourMap from "./PrivateTourMap";

/**
 * The holder's view of an unlocked tour: the route on a map and the itinerary
 * under it, sharing one `visited` set.
 *
 * The set starts from what the server already knows (so a returning holder does
 * not see their own progress reset) and only ever grows after the server
 * accepts a check-in — the map can never claim a stop the itinerary has not.
 */
const PrivateTourExperience = ({ tour }: { tour: PrivateTourDetailView }) => {
  const t = useTranslations("PrivateTour");
  const [visited, setVisited] = useState<Set<string>>(
    () =>
      new Set(
        tour.stops
          .filter((stop) => stop.visited)
          .map((stop) => stop.checkpointId),
      ),
  );

  return (
    <div className="space-y-8">
      <section aria-labelledby="private-tour-map-title" className="space-y-3">
        <div>
          <h2
            id="private-tour-map-title"
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <MapIcon aria-hidden className="size-4 shrink-0 text-primary" />
            {t("mapTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("mapSubtitle")}</p>
        </div>

        <PrivateTourMap stops={tour.stops} visited={visited} />
      </section>

      <section
        aria-labelledby="private-tour-itinerary-title"
        className="space-y-4"
      >
        <h2 id="private-tour-itinerary-title" className="text-lg font-semibold">
          {t("itinerary")}
        </h2>
        <PrivateTourItinerary
          tour={tour}
          visited={visited}
          onVisitedChange={setVisited}
        />
      </section>
    </div>
  );
};

export default PrivateTourExperience;
