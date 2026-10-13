import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * One summary tile on the admin overview. Presentational only — the numbers are
 * computed server-side by `getAdminDashboard`, so this renders identically on
 * every request and never needs a client boundary.
 */
export const StatCard = ({
  label,
  value,
  hint,
  icon: Icon,
  href,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: LucideIcon;
  href?: string;
}) => {
  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      </div>
      <p className="mt-2 text-3xl font-medium tabular-nums">{value}</p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </>
  );

  const shell =
    "block rounded-lg border bg-card px-5 py-4 transition-colors duration-200";

  return href ? (
    <Link href={href} className={`${shell} hover:bg-accent/40`}>
      {body}
    </Link>
  ) : (
    <div className={shell}>{body}</div>
  );
};
