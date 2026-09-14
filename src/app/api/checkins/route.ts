import type { NextRequest } from "next/server";
import { apiError, apiOk, handleApiError } from "@/lib/api";
import { CHECKIN_RATE_LIMIT } from "@/config/constants";
import { rateLimit } from "@/lib/rate-limit";
import { getOrCreateSessionUser } from "@/lib/session";
import { createCheckInSchema, localeQuerySchema } from "@/lib/validations";
import { createCheckIn } from "@/services/checkins.service";

/**
 * POST /api/checkins — GPS check-in (Plan.md §6/§7).
 * The server computes distance, enforces the sequential lock, accuracy policy,
 * rate limiting and duplicate protection. Clients never dictate the outcome.
 */
export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const limit = rateLimit(`checkin:${ip}`, CHECKIN_RATE_LIMIT);
    if (!limit.ok) {
      return apiError("RATE_LIMITED", "Too many requests", 429, {
        retryAfterSec: limit.retryAfterSec,
      });
    }

    const parsed = createCheckInSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError("BAD_REQUEST", "Invalid request body", 400, {
        issues: parsed.error.issues,
      });
    }

    const user = await getOrCreateSessionUser();
    const locale = localeQuerySchema.parse(
      request.nextUrl.searchParams.get("locale") ?? undefined,
    );
    const result = await createCheckIn(user.id, parsed.data, locale);

    switch (result.status) {
      case "ok":
        return apiOk({ checkIn: result.checkIn, progress: result.progress });
      case "already_checked_in":
        return apiError("ALREADY_CHECKED_IN", "Already checked in", 409, {
          progress: result.progress,
        });
      case "no_tour_link":
        return apiError(
          "NO_TOUR_LINK",
          "Checkpoint is not part of a tour",
          422,
        );
      case "locked":
        return apiError("LOCKED", "Checkpoint is locked", 422);
      case "too_far":
        return apiError("TOO_FAR", "Too far from the checkpoint", 422, {
          distanceMeters: Math.round(result.distanceMeters),
          radiusMeters: result.radiusMeters,
        });
      case "poor_accuracy":
        return apiError("POOR_ACCURACY", "GPS accuracy too low", 422, {
          accuracy: result.accuracy,
          maxAccuracy: result.maxAccuracy,
        });
      case "not_found":
        return apiError("NOT_FOUND", "Checkpoint not found", 404);
    }
  } catch (error) {
    return handleApiError("POST /api/checkins", error);
  }
}
