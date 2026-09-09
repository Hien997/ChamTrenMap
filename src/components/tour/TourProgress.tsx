import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/** Compact "X / Y + bar" progress used on tour pages and the map sheet. */
export function TourProgress({
  completed,
  total,
  percent,
  label,
  className,
}: {
  completed: number;
  total: number;
  percent: number;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between text-sm">
        {label ? <span className="text-muted-foreground">{label}</span> : null}
        <span className="font-semibold tabular-nums">
          {completed} / {total} · {percent}%
        </span>
      </div>
      <Progress value={percent} />
    </div>
  );
}
