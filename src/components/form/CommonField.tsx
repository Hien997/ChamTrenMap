import { useFormContext } from "react-hook-form";
import { peekErrors } from "./utils";
import { cn } from "cn";
import { Label } from "../ui/label";

export function CommonField({
  label,
  name,
  required,
  hint,
  serverError,
  className,
  hideLabel,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  hint?: string;
  serverError?: string;
  className?: string;
  /** Suppress the top-level label (for inline controls like checkboxes/toggles). */
  hideLabel?: boolean;
  children: React.ReactNode;
}) {
  const form = useFormContext();
  const error = serverError ?? peekErrors(form, name);
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;

  return (
    <div className={cn("space-y-1.5", className)}>
      {hideLabel ? null : (
        <Label htmlFor={name}>
          {label}
          {required ? (
            <span aria-hidden className="ml-0.5 text-destructive">
              *
            </span>
          ) : null}
        </Label>
      )}
      {children}
      {error ? (
        <p id={errorId} className="text-xs text-destructive" aria-live="polite">
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
