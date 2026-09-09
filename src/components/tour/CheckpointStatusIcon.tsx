import type { CheckpointStatus } from "@/types";

const ICONS: Record<CheckpointStatus, string> = {
  completed: "✅",
  current: "⭐",
  locked: "🔒",
};

const LABELS: Record<CheckpointStatus, string> = {
  completed: "Completed",
  current: "Current",
  locked: "Locked",
};

/** Sequential tour status icon: ✅ completed · ⭐ current · 🔒 locked. */
export function CheckpointStatusIcon({
  status,
  className,
}: {
  status: CheckpointStatus | null;
  className?: string;
}) {
  if (!status) return null;
  return (
    <span
      role="img"
      aria-label={LABELS[status]}
      className={className}
      title={LABELS[status]}
    >
      {ICONS[status]}
    </span>
  );
}
