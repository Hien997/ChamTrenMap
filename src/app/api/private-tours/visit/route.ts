import { PRIVATE_TOUR_VISIT_RATE_LIMIT } from "@/config/constants";
import { apiError, apiOk, handleApiError, parseBody } from "@/lib/api";
import { readPrivateTourKey } from "@/lib/private-tour-session";
import { rateLimit } from "@/lib/rate-limit";
import { privateTourVisitSchema } from "@/lib/validations/admin";
import { visitPrivateTourStop } from "@/services/private-tours.service";

/**
 * Record "I have arrived at stop N" (ADR-0006).
 *
 * The reported position is **never** trusted as a verdict — it only feeds the
 * shared `evaluateCheckIn` policy, the same one public check-ins obey. A caller
 * who fakes coordinates still has to satisfy the radius and accuracy bounds.
 *
 * Unlike `/access` this one may answer specifically: the caller has already
 * proven they hold the code and phone, so "you are 300 m away" leaks nothing
 * they could not compute from the itinerary they were just shown.
 */
export const POST = async (request: Request) => {
  try {
    // A visit only counts for someone who already holds the tour, so the cookie
    // is read first and is also the rate-limit identity: an anonymous caller
    // shares one bucket rather than minting a fresh limit on every request.
    const sessionKey = await readPrivateTourKey();
    const limited = rateLimit(
      `private-tour-visit:${sessionKey ?? "anonymous"}`,
      PRIVATE_TOUR_VISIT_RATE_LIMIT,
    );
    if (!limited.ok) {
      return apiError(
        "RATE_LIMITED",
        "Too many attempts. Please wait a moment.",
        429,
      );
    }

    const parsed = parseBody(privateTourVisitSchema, await request.json());
    if (!parsed.ok) return parsed.response;

    if (!sessionKey) {
      return apiError("UNAUTHORIZED", "Unlock this tour first.", 401);
    }

    const result = await visitPrivateTourStop({
      code: parsed.data.code,
      checkpointId: parsed.data.checkpointId,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      accuracy: parsed.data.accuracy ?? null,
      sessionKey,
    });

    switch (result.status) {
      case "ok":
        return apiOk({
          checkpointId: parsed.data.checkpointId,
          order: result.order,
          alreadyVisited: result.alreadyVisited,
        });
      // The numbers travel as `details` and the wording is chosen by the client
      // (translations live in `messages/*.json`), exactly as `/api/checkins`
      // does — otherwise a Vietnamese visitor reads an English error.
      case "too_far":
        return apiError("TOO_FAR", "Too far from the stop", 422, {
          distanceMeters: Math.round(result.distanceMeters),
          radiusMeters: result.radiusMeters,
        });
      case "poor_accuracy":
        return apiError("POOR_ACCURACY", "GPS accuracy too low", 422, {
          accuracy: Math.round(result.accuracy),
          maxAccuracy: result.maxAccuracy,
        });
      case "not_in_itinerary":
        // Its own code, distinct from the `denied` NOT_FOUND below: the client
        // must say "that stop is not on this tour", not "we lost your tour".
        return apiError(
          "NOT_IN_ITINERARY",
          "That stop is not on this tour",
          404,
        );
      default:
        // `denied` — same indistinguishability rule as the unlock gate.
        return apiError(
          "NOT_FOUND",
          "We could not find a private tour for that code.",
          404,
        );
    }
  } catch (error) {
    return handleApiError("POST /api/private-tours/visit", error);
  }
};
