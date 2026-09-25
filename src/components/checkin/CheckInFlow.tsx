"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { CircleCheckIcon, StampIcon } from "lucide-react";
import { SuccessModal } from "./SuccessModal";
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
import type { ApiEnvelope } from "@/lib/api-client";
import { formatDistance } from "@/lib/format";
import type { CheckInView, TourProgressView } from "@/types";

type Phase = "idle" | "explainer" | "locating";

type CheckInEnvelope = ApiEnvelope<{
  checkIn: CheckInView;
  progress: TourProgressView;
}>;

export function CheckInFlow({
  checkpointId,
  locale,
  checkedIn = false,
  disabled = false,
  onChecked,
  variant = "default",
}: {
  checkpointId: string;
  locale: string;
  checkedIn?: boolean;
  disabled?: boolean;
  onChecked?: (progress: TourProgressView | null) => void;
  variant?: "default" | "food";
}) {
  const t = useTranslations("CheckIn");
  const tCommon = useTranslations("Common");
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
      const json = (await response.json()) as CheckInEnvelope;

      if (json.ok && json.data) {
        setSuccess(json.data);
        onChecked?.(json.data.progress);
        return;
      }

      const error = json.error;
      if (!error) {
        showError();
        return;
      }

      switch (error.code) {
        case "ALREADY_CHECKED_IN": {
          const details = error.details as
            { progress?: TourProgressView } | undefined;
          setAlreadyProgress(details?.progress ?? null);
          break;
        }
        case "TOO_FAR": {
          const details = error.details as {
            distanceMeters: number;
            radiusMeters: number;
          };
          toast.error(
            t("tooFarTitle", {
              distance: formatDistance(details.distanceMeters, tCommon),
            }),
            {
              description: t("tooFarBody", {
                radius: formatDistance(details.radiusMeters, tCommon),
              }),
            },
          );
          break;
        }
        case "POOR_ACCURACY": {
          const details = error.details as {
            accuracy: number;
            maxAccuracy: number;
          };
          toast.error(t("poorAccuracyTitle"), {
            description: t("poorAccuracyBody", {
              accuracy: Math.round(details.accuracy),
              maxAccuracy: Math.round(details.maxAccuracy),
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
      <span className="inline-flex items-center gap-1.5 rounded-full bg-status-completed/15 px-3 py-1.5 text-sm font-medium text-status-completed-ink dark:text-status-completed">
        <CircleCheckIcon aria-hidden className="size-4" />
        {variant === "food" ? t("ate") : t("checkedIn")}
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
        <StampIcon aria-hidden className="size-4" />
        {phase === "locating"
          ? t("locating")
          : variant === "food"
            ? t("ateAction")
            : t("action")}
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
          variant={variant}
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
            <DialogTitle>{t("alreadyTitle")}</DialogTitle>
            <DialogDescription>{t("alreadyBody")}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
