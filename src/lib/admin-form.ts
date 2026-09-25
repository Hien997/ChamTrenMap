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
export function toFieldErrors(
  details?: AdminFieldError[],
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const detail of firstMessagePerField(details ?? [])) {
    fieldErrors[detail.path] = detail.message;
  }
  return fieldErrors;
}

/** Flatten the envelope into one human-readable line for a toast. */
export function formatApiError(
  error?: string,
  details?: AdminFieldError[],
): string {
  const detailMessage = firstMessagePerField(details ?? [])
    .map((detail) => `${detail.path}: ${detail.message}`)
    .join("; ");
  return [error, detailMessage].filter(Boolean).join(" — ") || "Request failed";
}
