"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { TourProgress } from "@/components/tour/TourProgress";
import { ShareButtons } from "@/components/sharing/ShareButtons";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Link } from "@/i18n/navigation";
import type { CheckInView, TourProgressView } from "@/types";

/** Deterministic confetti pieces (no hydration randomness). */
const CONFETTI = [
  { x: -120, y: -140, c: "#f59e0b" },
  { x: 110, y: -150, c: "#10b981" },
  { x: -150, y: -60, c: "#3b82f6" },
  { x: 150, y: -70, c: "#ec4899" },
  { x: -90, y: -180, c: "#8b5cf6" },
  { x: 90, y: -190, c: "#f43f5e" },
  { x: -170, y: -110, c: "#14b8a6" },
  { x: 170, y: -120, c: "#eab308" },
  { x: -40, y: -200, c: "#06b6d4" },
  { x: 40, y: -210, c: "#f97316" },
  { x: -130, y: -170, c: "#a3e635" },
  { x: 130, y: -165, c: "#fb7185" },
] as const;

/** Celebration modal (Plan.md §8/§11): spring check, confetti, progress, share. */
export function SuccessModal({
  open,
  onOpenChange,
  checkIn,
  progress,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkIn: CheckInView;
  progress: TourProgressView;
}) {
  const t = useTranslations("CheckIn");
  const tShare = useTranslations("Share");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function createShare() {
    setCreating(true);
    try {
      const response = await fetch("/api/share/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkInId: checkIn.id }),
      });
      const json = await response.json();
      if (json.ok) setShareUrl(json.data.url as string);
    } catch {
      /* keep the modal; user can retry */
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden sm:max-w-md">
        <div className="relative flex flex-col items-center gap-3 pb-1 pt-2 text-center">
          {open &&
            CONFETTI.map((piece, index) => (
              <motion.span
                key={index}
                aria-hidden
                className="absolute left-1/2 top-8 h-2 w-3 rounded-sm"
                style={{ backgroundColor: piece.c }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
                animate={{ x: piece.x, y: piece.y, opacity: 0, scale: 1, rotate: piece.x / 10 }}
                transition={{ duration: 1.4, ease: "easeOut" }}
              />
            ))}

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 14 }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl"
          >
            ✅
          </motion.div>

          <h2 className="text-lg font-bold tracking-tight">
            {t("successTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("successBody")}</p>
          <p className="text-2xl font-extrabold tracking-tight">
            {checkIn.checkpointName}
          </p>

          <motion.p
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.35, type: "spring", stiffness: 200 }}
            className="text-sm font-semibold text-primary"
          >
            {t("checkpointOf", {
              current: progress.completedCount,
              total: progress.totalCount,
            })}
          </motion.p>

          <TourProgress
            completed={progress.completedCount}
            total={progress.totalCount}
            percent={progress.percent}
            className="w-full"
          />

          {progress.isCompleted && (
            <p className="text-sm font-medium text-emerald-700">
              {t("tourComplete")}
            </p>
          )}

          <div className="mt-1 flex w-full flex-col gap-2">
            <Link
              href={`/map/${progress.tourSlug}`}
              onClick={() => onOpenChange(false)}
              className={buttonVariants()}
            >
              {t("continue")}
            </Link>
            {!shareUrl && (
              <Button variant="outline" onClick={createShare} disabled={creating}>
                {creating ? "…" : `📲 ${t("share")}`}
              </Button>
            )}
            {shareUrl && (
              <div className="flex flex-col gap-2 rounded-lg border p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  {tShare("title")}
                </p>
                <ShareButtons
                  url={shareUrl}
                  title={`${tShare("checkedInAt")} ${checkIn.checkpointName} — Hà Tiên`}
                />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
