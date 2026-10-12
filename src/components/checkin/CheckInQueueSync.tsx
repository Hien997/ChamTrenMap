"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  isNetworkError,
  readCheckInQueue,
  removeCheckIn,
  type StorageLike,
} from "@/lib/checkin-queue";

const getStorage = (): StorageLike | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null; // storage disabled (private mode, policy) — nothing to flush
  }
};

const flush = async (storage: StorageLike): Promise<number> => {
  const queue = readCheckInQueue(storage);
  if (queue.length === 0) {
    return 0;
  }

  let sent = 0;
  for (const entry of queue) {
    try {
      const response = await fetch(`/api/checkins?locale=${entry.locale}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkpointId: entry.checkpointId,
          latitude: entry.latitude,
          longitude: entry.longitude,
          accuracy: entry.accuracy,
        }),
      });
      const json: unknown = await response.json();
      // The server has now had its say — drop the entry either way so a
      // permanently rejected check-in (TOO_FAR, LOCKED) cannot loop forever.
      removeCheckIn(storage, entry.id);
      const ok =
        (json as { ok?: boolean } | null)?.ok === true ||
        (json as { error?: { code?: string } } | null)?.error?.code ===
          "ALREADY_CHECKED_IN";
      if (ok) {
        sent += 1;
      }
    } catch (error) {
      if (isNetworkError(error)) {
        break; // still offline: keep the rest and wait for the next trigger
      }
      removeCheckIn(storage, entry.id); // unusable answer, do not retry forever
    }
  }
  return sent;
};

/**
 * Replays queued check-ins on mount and whenever the browser reports it is
 * back online. Sits in the locale layout so it survives navigation, and keeps
 * a ref so two triggers cannot post the same payload twice.
 */
export const CheckInQueueSync = () => {
  const t = useTranslations("CheckIn");
  const runningRef = useRef(false);

  useEffect(() => {
    const run = async () => {
      const storage = getStorage();
      if (!storage || runningRef.current) {
        return;
      }
      runningRef.current = true;
      try {
        const sent = await flush(storage);
        if (sent > 0) {
          toast.success(t("syncedTitle"), { description: t("syncedBody") });
        }
      } finally {
        runningRef.current = false;
      }
    };

    void run();
    window.addEventListener("online", run);
    return () => window.removeEventListener("online", run);
  }, [t]);

  return null;
};
