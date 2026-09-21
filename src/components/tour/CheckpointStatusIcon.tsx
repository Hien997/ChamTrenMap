import { CircleCheckIcon, LockIcon, MapPinIcon } from "lucide-react";
import type { CheckpointStatus } from "@/types";

const ICONS: Record<CheckpointStatus, typeof CircleCheckIcon> = {
  completed: CircleCheckIcon,
  current: MapPinIcon,
  locked: LockIcon,
};

const TONES: Record<CheckpointStatus, string> = {
  completed: "text-status-completed-ink dark:text-status-completed",
  current: "text-status-current-ink dark:text-status-current",
  locked: "text-status-locked-ink dark:text-status-locked",
};

const LABELS: Record<CheckpointStatus, string> = {
  completed: "Completed",
  current: "Current",
  locked: "Locked",
};

export function CheckpointStatusIcon({
  status,
  className,
}: {
  status: CheckpointStatus | null;
  className?: string;
}) {
  if (!status) return null;
  const Icon = ICONS[status];
  return (
    <span
      role="img"
      aria-label={LABELS[status]}
      title={LABELS[status]}
      className={`inline-flex shrink-0 items-center justify-center ${TONES[status]} ${className ?? ""}`}
    >
      <Icon aria-hidden className="size-[1em]" />
    </span>
  );
}
