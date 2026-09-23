import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

export function PageHeader({
  title,
  sub,
  actions,
}: {
  title: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
          {title}
        </h1>
        {sub ? (
          <p className="mt-1.5 text-sm text-muted-foreground">{sub}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      <ChevronLeftIcon aria-hidden className="size-3.5" />
      {children}
    </Link>
  );
}

export function Panel({
  title,
  children,
  className = "",
}: {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-lg border bg-card ${className}`}>
      {title ? (
        <div className="border-b px-5 py-3">
          <h2 className="text-sm font-medium">{title}</h2>
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatusChip({ status }: { status: string }) {
  const published = status === "PUBLISHED";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
        published
          ? "bg-status-completed/15 text-status-completed-ink"
          : "bg-status-locked/15 text-status-locked-ink"
      }`}
    >
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${
          published ? "bg-status-completed" : "bg-status-locked"
        }`}
      />
      {published ? "Published" : "Draft"}
    </span>
  );
}

/** Legend for the red asterisk that `Field` renders on required labels. */
export function RequiredNote() {
  return (
    <p className="text-xs text-muted-foreground">
      <span aria-hidden className="text-destructive">
        *
      </span>{" "}
      required
    </p>
  );
}

export function Field({
  label,
  htmlFor,
  children,
  hint,
  error,
  required,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  hint?: string;
  error?: string;
  required?: boolean;
}) {
  const hintId = htmlFor ? `${htmlFor}-hint` : undefined;
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required ? (
          // Red asterisk so users can tell required fields at a glance;
          // aria-hidden keeps screen readers on the input's own `required`.
          <span aria-hidden className="ml-0.5 text-destructive">
            *
          </span>
        ) : null}
      </Label>
      {children}
      {error ? (
        <p
          id={errorId}
          className="text-xs text-destructive"
          aria-live="polite"
        >
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
