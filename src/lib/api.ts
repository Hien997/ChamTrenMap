import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

import type { Locale } from "@/config/constants";
import { localeQuerySchema } from "@/lib/validations";
import {
  adminListQuerySchema,
  type AdminListQuery,
} from "@/lib/validations/admin";
import { CheckpointWriteError } from "@/services/checkpoint-content";

/**
 * The one API envelope module (architecture candidate A).
 *
 * Two wire shapes exist on purpose:
 *
 * 1. **Public envelope** (typed): `{ ok: true, data }` /
 *    `{ ok: false, error: { code, message, details } }` — consumed by
 *    `api-client.ts`, which needs machine-readable error codes.
 * 2. **Admin adapter** (flat): `{ ok: true, ...entities }` /
 *    `{ ok: false, error: string, details? }` — consumed by the admin forms
 *    (`AdminWriteResponse`), which need a human string plus dotted field paths.
 *
 * Every route builds its response through this module instead of re-creating
 * the shapes inline; `tests/api-envelope.test.ts` pins both contracts.
 */

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "NO_TOUR_LINK"
  | "LOCKED"
  | "TOO_FAR"
  | "POOR_ACCURACY"
  | "ALREADY_CHECKED_IN"
  | "RATE_LIMITED"
  | "INTERNAL";

// ---------------------------------------------------------------------------
// Shared result type for schema parsing helpers.
// ---------------------------------------------------------------------------

export type Parsed<T> =
  { ok: true; data: T } | { ok: false; response: NextResponse };

/** Dotted-path validation detail, as consumed by `toFieldErrors`. */
export interface ValidationDetail {
  path: string;
  message: string;
}

export function validationDetails(error: ZodError): ValidationDetail[] {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

// ---------------------------------------------------------------------------
// Public envelope (typed errors).
// ---------------------------------------------------------------------------

export function apiOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true as const, data }, init);
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: unknown,
): NextResponse {
  return NextResponse.json(
    { ok: false as const, error: { code, message, details } },
    { status },
  );
}

export function handleApiError(context: string, error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return apiError("BAD_REQUEST", "Invalid request", 400, {
      issues: error.issues,
    });
  }
  console.error(`[api] ${context}:`, error);
  return apiError("INTERNAL", "Internal server error", 500);
}

/** Parse a request body against a schema; failure yields the public 400 shape. */
export function parseBody<T>(schema: ZodType<T>, raw: unknown): Parsed<T> {
  const result = schema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };
  return {
    ok: false,
    response: apiError("BAD_REQUEST", "Invalid request body", 400, {
      issues: result.error.issues,
    }),
  };
}

/** Read and validate the `?locale=` query parameter (defaults to `vi`). */
export function parseLocale(searchParams: URLSearchParams): Locale {
  return localeQuerySchema.parse(searchParams.get("locale") ?? undefined);
}

// ---------------------------------------------------------------------------
// Admin adapter (flat envelope with string errors).
// ---------------------------------------------------------------------------

/** `{ ok: true, ...entities }` — e.g. `adminOk({ checkpoints })` or `adminOk()`. */
export function adminOk(
  entities: Record<string, unknown> = {},
  init?: ResponseInit,
): NextResponse {
  return NextResponse.json({ ok: true, ...entities }, init);
}

export interface AdminErrorOptions {
  details?: ValidationDetail[];
  init?: ResponseInit;
}

/** `{ ok: false, error: message, details? }` with the given status. */
export function adminError(
  message: string,
  status: number,
  options: AdminErrorOptions = {},
): NextResponse {
  const { details, init } = options;
  return NextResponse.json(
    { ok: false, error: message, ...(details ? { details } : {}) },
    { status, ...init },
  );
}

/** Like `parseBody`, but failure yields the admin flat 400 shape. */
export function parseAdminBody<T>(schema: ZodType<T>, raw: unknown): Parsed<T> {
  const result = schema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };
  return {
    ok: false,
    response: adminError("Invalid input", 400, {
      details: validationDetails(result.error),
    }),
  };
}

/** Read and validate `?q=&take=&offset=` for the admin list routes. */
export function parseAdminListQuery(
  searchParams: URLSearchParams,
): Parsed<AdminListQuery> {
  const result = adminListQuerySchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    take: searchParams.get("take") ?? undefined,
    offset: searchParams.get("offset") ?? undefined,
  });
  if (result.success) return { ok: true, data: result.data };
  return {
    ok: false,
    response: adminError("Invalid list query", 400, {
      details: validationDetails(result.error),
    }),
  };
}

/**
 * Map a caught write error onto the admin envelope (absorbs `http.ts`).
 *
 * `CheckpointWriteError` carries its own status/message; anything else is a
 * bug — log it server-side and answer with a generic JSON 500 so the admin UI
 * always receives the documented envelope instead of Next's HTML error page.
 */
export function writeErrorResponse(error: unknown): NextResponse {
  if (error instanceof CheckpointWriteError) {
    return adminError(error.message, error.status);
  }
  console.error("[api] admin write:", error);
  return adminError("Internal server error", 500);
}
