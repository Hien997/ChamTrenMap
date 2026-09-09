"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCurrentPositionOnce } from "@/lib/geolocation-client";
import type { CheckInView, TourProgressView } from "@/types";
import { SuccessModal } from "./SuccessModal";

type Phase = "idle" | "explainer" | "locating";

interface ApiEnvelope {
  ok: boolean;
  data?: { checkIn: CheckInView; progress: TourProgressView };
  error?: { code: string; message: string; details?: unknown };
}

/**
 * The full check-in interaction (Plan.md §8):
 * explainer dialog → GPS fix → POST /api/checkins → success modal / failure toast.
 * The server decides the outcome; the client only renders it.
 */
export function CheckInFlow({
  checkpointId,
  locale,
  checkedIn = false,
  disabled = false,
  onChecked,
}: {
  checkpointId: string;
  locale: string;
  checkedIn?: boolean;
  disabled?: boolean;
  onChecked?: (progress: TourProgressView | null) => void;
}) {
  const t = useTranslations("CheckIn");
  const [phase, setPhase] = useState<Phase>("idle");
  const [success, setSuccess] = useState<{
    checkIn: CheckInView;
    progress: TourProgressView;
  } | null>(null);
  const [alreadyProgress, setAlreadyProgress] =
    useState<TourProgressView | null>(null);

  function showError() {
    toast.error(t("errorTitle"), { description: t("errorBody") });
  }

  async function submit(position: GeolocationPosition) {
    try {
      const response = await fetch(`/api/checkins?locale=${locale}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkpointId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Number.isFinite(position.coords.accuracy)
            ? position.coords.accuracy
            : null,
        }),
      });
      const json = (await response.json()) as ApiEnvelope;

      if (json.ok && json.data) {
        setSuccess(json.data);
        onChecked?.(json.data.progress);
        return;
      }

      switch (json.error?.code) {
        case "ALREADY_CHECKED_IN": {
          const details = json.error.details as
            | { progress?: TourProgressView }
            | undefined;
          setAlreadyProgress(details?.progress ?? null);
          break;
        }
        case "TOO_FAR": {
          const details = json.error.details as {
            distanceMeters: number;
            radiusMeters: number;
          };
          toast.error(t("tooFarTitle", { distance: details.distanceMeters }), {
            description: t("tooFarBody", { radius: details.radiusMeters }),
          });
          break;
        }
        case "POOR_ACCURACY": {
          const details = json.error.details as {
            accuracy: number;
            maxAccuracy: number;
          };
          toast.error(t("poorAccuracyTitle"), {
            description: t("poorAccuracyBody", {
              accuracy: details.accuracy,
              maxAccuracy: details.maxAccuracy,
            }),
          });
          break;
        }
        case "LOCKED":
          toast.error(t("lockedTitle"), { description: t("lockedBody") });
          break;
        default:
          showError();
      }
    } catch {
      showError();
    }
  }

  async function beginCheckIn() {
    setPhase("locating");
    try {
      const position = await getCurrentPositionOnce();
      await submit(position);
    } catch (error) {
      const geoError = error as Partial<GeolocationPositionError>;
      if (typeof geoError?.code === "number") {
        const denied = geoError.code === 1;
        toast.error(denied ? t("permissionDenied") : t("errorTitle"), {
          description: denied ? undefined : t("errorBody"),
        });
      } else {
        showError();
      }
    } finally {
      setPhase("idle");
    }
  }

  if (checkedIn) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-800">
        ✅ {t("checkedIn")}
      </span>
    );
  }

  return (
    <>
      <Button
        size="sm"
        disabled={disabled || phase === "locating"}
        onClick={() => setPhase("explainer")}
      >
        {phase === "locating" ? t("locating") : `✅ ${t("action")}`}
      </Button>

      {/* Location permission explainer (spec §28) — before the browser prompt. */}
      <Dialog
        open={phase === "explainer"}
        onOpenChange={(open) => {
          if (!open && phase === "explainer") setPhase("idle");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("explainerTitle")}</DialogTitle>
            <DialogDescription>{t("explainerBody")}</DialogDescription>
          </DialogHeader>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>{t("explainerReason1")}</li>
            <li>{t("explainerReason2")}</li>
            <li>{t("explainerReason3")}</li>
          </ul>
          <DialogFooter>
            <Button onClick={beginCheckIn}>{t("explainerAllow")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success celebration */}
      {success && (
        <SuccessModal
          open={success !== null}
          onOpenChange={(open) => {
            if (!open) setSuccess(null);
          }}
          checkIn={success.checkIn}
          progress={success.progress}
        />
      )}

      {/* Already checked in — friendly notice */}
      <Dialog
        open={alreadyProgress !== null}
        onOpenChange={(open) => {
          if (!open) setAlreadyProgress(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>🎉 {t("alreadyTitle")}</DialogTitle>
            <DialogDescription>{t("alreadyBody")}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
