import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

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
        <span className="ml-auto flex items-baseline gap-2">
          <span className="font-semibold tabular-nums">
            {completed}/{total}
          </span>
          <span className="tabular-nums text-muted-foreground">{percent}%</span>
        </span>
      </div>
      <Progress value={percent} className="bg-primary/15" />
    </div>
  );
}
