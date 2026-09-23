/**
 * Shared helpers for the admin forms.
 *
 * Every `/api/admin/*` write endpoint answers with the same envelope:
 *   { ok: true }
 *   { ok: false, error: string, details?: [{ path, message }] }
 *
 * `path` is the dotted Zod issue path (e.g. `vi.name`), so it maps straight
 * onto the `name` attribute of the matching input.
 */

import { useRef, useState } from "react";
import type { ZodError, ZodType } from "zod";

export interface AdminFieldError {
  path: string;
  message: string;
}

export interface AdminWriteResponse {
  ok: boolean;
  error?: string;
  details?: AdminFieldError[];
}

/**
 * Keep only the first message per field.
 *
 * Zod reports *every* failed check rather than stopping at the first, so a
 * blank email comes back as both "Email is required." and "Enter a valid email
 * address.". The first issue is the most fundamental one — a missing value
 * before a malformed one — so that is the one worth showing.
 */
function firstMessagePerField(details: AdminFieldError[]): AdminFieldError[] {
  const seen = new Set<string>();
  const deduped: AdminFieldError[] = [];
  for (const detail of details) {
    const path = detail.path || "general";
    if (seen.has(path)) continue;
    seen.add(path);
    deduped.push({ path, message: detail.message });
  }
  return deduped;
}

/** Turn the API `details` list into a `field name -> message` map for inline errors. */
export function toFieldErrors(details?: AdminFieldError[]): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const detail of firstMessagePerField(details ?? [])) {
    fieldErrors[detail.path] = detail.message;
  }
  return fieldErrors;
}

/** Flatten the envelope into one human-readable line for a toast. */
export function formatApiError(error?: string, details?: AdminFieldError[]): string {
  const detailMessage = firstMessagePerField(details ?? [])
    .map((detail) => `${detail.path}: ${detail.message}`)
    .join("; ");
  return [error, detailMessage].filter(Boolean).join(" — ") || "Request failed";
}

/** Collect a Zod result's issues into the `field -> message` map. */
export function issuesToFieldErrors(error: ZodError): Record<string, string> {
  return toFieldErrors(
    error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  );
}

/**
 * Shared wiring for the admin forms: inline errors that clear as the user
 * types.
 *
 * Errors are held back until the first submit attempt — before that a half
 * filled form would light up on every keystroke. Once the user has tried to
 * submit, `revalidate` runs the schema on every field change, so fixing a
 * value removes its error immediately and breaking another field surfaces
 * that error right away.
 */
export function useAdminForm<TSchema extends ZodType>(options: {
  schema: TSchema;
  buildPayload: (formData: FormData) => unknown;
}) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attempted, setAttempted] = useState(false);

  function markAttempted() {
    setAttempted(true);
  }

  function revalidate() {
    if (!attempted || !formRef.current) return;
    const result = options.schema.safeParse(
      options.buildPayload(new FormData(formRef.current)),
    );
    if (result.success) {
      setErrors({});
      return;
    }
    setErrors(issuesToFieldErrors(result.error));
  }

  return { formRef, errors, setErrors, revalidate, markAttempted };
}
