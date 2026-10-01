"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2Icon, MapPinIcon, NavigationIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentPositionOnce } from "@/lib/geolocation-client";
import type { PrivateTourDetailView } from "@/types";

/**
 * The itinerary, with a per-stop "I have arrived" action.
 *
 * The verdict comes from the server — the client only sends its raw GPS fix and
 * renders the answer, so a visitor cannot declare themselves arrived by editing
 * anything here (ADR-0006).
 *
 * `visited` is *controlled*: the set is owned by `PrivateTourExperience` so a
 * check-in lights up this list and the map pin in the same commit. The
 * component still never derives it optimistically — a stop only joins the set
 * after the server says yes.
 */
const PrivateTourItinerary = ({
  tour,
  visited,
  onVisitedChange,
}: {
  tour: PrivateTourDetailView;
  visited: Set<string>;
  onVisitedChange: (visited: Set<string>) => void;
}) => {
  const t = useTranslations("PrivateTour");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  /**
   * Turn a refusal into localized copy.
   *
   * The server sends a machine `code` plus numeric `details`; the wording lives
   * here so a Vietnamese visitor never reads an English error — the same split
   * `CheckInFlow` uses for `/api/checkins`. `error.message` is only a fallback
   * for a code this build does not know yet.
   */
  const visitErrorMessage = (error?: {
    code?: string;
    message?: string;
    details?: unknown;
  }): string => {
    switch (error?.code) {
      case "TOO_FAR": {
        const details = error.details as {
          distanceMeters?: number;
          radiusMeters?: number;
        };
        return t("tooFar", {
          meters: Math.round(details?.distanceMeters ?? 0),
          radius: Math.round(details?.radiusMeters ?? 0),
        });
      }
      case "POOR_ACCURACY": {
        const details = error.details as { accuracy?: number };
        return t("poorAccuracy", {
          accuracy: Math.round(details?.accuracy ?? 0),
        });
      }
      case "NOT_IN_ITINERARY":
        return t("notInItinerary");
      default:
        return error?.message ?? t("visitFailed");
    }
  };

  const visit = (checkpointId: string) => {
    setMessage(null);
    startTransition(async () => {
      // The Geolocation API is gated on a secure context, so on plain http (a
      // phone testing on a LAN address) it fails for a reason that has nothing
      // to do with the user's settings. Saying so beats a generic "location
      // unavailable" and a support ticket.
      if (!window.isSecureContext) {
        setMessage(t("needsHttps"));
        return;
      }

      // The helper rejects (rather than resolving to null) when the browser has
      // no geolocation or the user declines, so the rejection is the failure
      // path — there is no third "unsupported" branch to render.
      let coords: GeolocationCoordinates;
      try {
        const position = await getCurrentPositionOnce();
        coords = position.coords;
      } catch {
        setMessage(t("positionUnavailable"));
        return;
      }

      try {
        const res = await fetch("/api/private-tours/visit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: tour.code,
            checkpointId,
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
          }),
        });
        const json: {
          ok: boolean;
          data?: { order?: number; alreadyVisited?: boolean };
          error?: { code?: string; message?: string; details?: unknown };
        } = await res.json();

        // A refusal arrives as an error envelope carrying a `code`; success is
        // the only thing that comes back under `data`. Branches on the error
        // code, not on a status field, because the server returns none.
        if (!json.ok || !json.data) {
          setMessage(visitErrorMessage(json.error));
          return;
        }

        onVisitedChange(new Set(visited).add(checkpointId));
        setMessage(t("arrived", { number: json.data.order ?? 0 }));
      } catch {
        setMessage(t("networkError"));
      }
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {t("visitCount", { visited: visited.size, total: tour.stops.length })}
      </p>

      <ol className="space-y-4">
        {tour.stops.map((stop) => {
          const done = visited.has(stop.checkpointId);
          return (
            <li
              key={stop.checkpointId}
              className={`space-y-3 rounded-xl border p-4 backdrop-blur-sm transition-colors ${
                done
                  ? "border-primary/40 bg-primary/5"
                  : "border-border/70 bg-card/70"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    done
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? (
                    <CheckCircle2Icon aria-hidden className="size-4" />
                  ) : (
                    stop.order
                  )}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="font-medium leading-tight">{stop.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t("stopNumber", { number: stop.order })}
                    {stop.estimatedVisitMinutes > 0 && (
                      <>
                        {" · "}
                        {t("stopMinutes", {
                          minutes: stop.estimatedVisitMinutes,
                        })}
                      </>
                    )}
                  </p>
                  {stop.address && (
                    <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <MapPinIcon
                        aria-hidden
                        className="mt-0.5 size-3.5 shrink-0"
                      />
                      <span>{stop.address}</span>
                    </p>
                  )}
                </div>
              </div>

              {!done && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={isPending}
                  onClick={() => visit(stop.checkpointId)}
                >
                  <NavigationIcon aria-hidden className="size-4" />
                  {t("arriveCta")}
                </Button>
              )}
            </li>
          );
        })}
      </ol>

      {message && (
        <p
          role="status"
          aria-live="polite"
          className="rounded-md bg-muted px-3 py-2 text-sm"
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default PrivateTourItinerary;
