import type { NextRequest } from "next/server";
import { apiError, apiOk, handleApiError, parseBody, parseLocale } from "@/lib/api";
import { CHECKIN_RATE_LIMIT } from "@/config/constants";
import { rateLimit } from "@/lib/rate-limit";
import { ensureVisitorWithCookie } from "@/lib/visitor-session";
import { createCheckInSchema } from "@/lib/validations";
import { createCheckIn } from "@/services/checkins.service";

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

    const parsed = parseBody(createCheckInSchema, await request.json());
    if (!parsed.ok) return parsed.response;

    // Write-lazy identity (ADR-0001): the visitor row appears here, on the
    // first check-in attempt — the rate limit above already bounds growth.
    const user = await ensureVisitorWithCookie();
    const locale = parseLocale(request.nextUrl.searchParams);
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
