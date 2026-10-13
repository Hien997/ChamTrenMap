import type { AdminTrendBucket } from "@/services/admin-dashboard.service";
import { cn } from "@/lib/utils";

/**
 * A tiny bar chart for the admin check-ins trend, drawn as inline SVG.
 *
 * Deliberately dependency-free and a server component: no chart library, no
 * client bundle. That is the right trade for seven static bars an operator
 * glances at once — recharts and friends would add ~100 kB of JS for this.
 *
 * Accessibility (priority #1): the chart carries an aria-label and a text
 * summary, and every bar also exposes its value as a visible label on hover,
 * so it never relies on colour or height alone. The peak bar is tinted with
 * `--primary` while the rest use `--chart-1`, giving a two-tone read without a
 * second colour channel.
 */
export const CheckInsTrend = ({ buckets }: { buckets: AdminTrendBucket[] }) => {
  const max = Math.max(1, ...buckets.map((bucket) => bucket.count));
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const peak = Math.max(...buckets.map((bucket) => bucket.count));
  const summary = buckets
    .map((bucket) => `${bucket.label}: ${bucket.count}`)
    .join(", ");

  return (
    <figure className="m-0">
      <figcaption className="sr-only">
        {`Check-ins per day over the last ${buckets.length} days. Total ${total}. ${summary}.`}
      </figcaption>
      <div
        role="img"
        aria-label={`Bar chart of check-ins per day. Total ${total} over ${buckets.length} days.`}
        className="flex h-32 items-end gap-2"
      >
        {buckets.map((bucket) => {
          const heightPercent =
            bucket.count === 0 ? 0 : Math.max(6, (bucket.count / max) * 100);
          const isPeak = bucket.count === peak && peak > 0;
          return (
            <div
              key={bucket.day}
              className="group relative flex h-full flex-1 flex-col justify-end"
            >
              {/* Value tooltip — appears on hover/focus, so the number is always
               * reachable without reading a bar's height. */}
              <span className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 rounded-md bg-foreground px-1.5 py-0.5 text-xs font-medium text-background opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                {bucket.count}
              </span>
              <div
                className={cn(
                  "w-full rounded-t-md transition-all duration-200",
                  isPeak ? "bg-primary" : "bg-chart-1/70",
                  bucket.count === 0 && "min-h-1 bg-muted",
                )}
                style={{ height: `${heightPercent}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        {buckets.map((bucket) => (
          <span
            key={bucket.day}
            className="flex-1 text-center text-xs text-muted-foreground"
          >
            {bucket.label}
          </span>
        ))}
      </div>
    </figure>
  );
};
