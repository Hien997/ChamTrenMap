import { NextResponse } from "next/server";

/**
 * REST envelope (Plan.md §6):
 *   success → { ok: true, data }
 *   failure → { ok: false, error: { code, message, details? } }
 */

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "LOCKED"
  | "TOO_FAR"
  | "POOR_ACCURACY"
  | "ALREADY_CHECKED_IN"
  | "RATE_LIMITED"
  | "INTERNAL";

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

/** Logs and converts an unexpected throw into a 500 envelope. */
export function handleApiError(context: string, error: unknown): NextResponse {
  console.error(`[api] ${context}:`, error);
  return apiError("INTERNAL", "Internal server error", 500);
}
