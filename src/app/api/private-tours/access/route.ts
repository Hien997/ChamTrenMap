import { cookies } from "next/headers";
import {
  PRIVATE_TOUR_COOKIE_MAX_AGE_SECONDS,
  PRIVATE_TOUR_COOKIE_NAME,
  PRIVATE_TOUR_RATE_LIMIT,
} from "@/config/constants";
import { apiError, apiOk, handleApiError, parseBody } from "@/lib/api";
import { newPrivateTourKey } from "@/lib/private-tour-codes";
import { readPrivateTourKey } from "@/lib/private-tour-session";
import { rateLimit } from "@/lib/rate-limit";
import { privateTourAccessSchema } from "@/lib/validations/admin";
import { unlockPrivateTour } from "@/services/private-tours.service";

/**
 * One fixed message for every refusal (ADR-0006).
 *
 * Distinguishing "no such code" from "wrong phone" would let an attacker
 * confirm a code exists and then brute-force the second factor, so the
 * response carries no signal: same status, same body, whichever gate closed.
 */
const ACCESS_DENIED_MESSAGE =
  "We could not find a private tour for that code and phone number.";

/**
 * Unlock a private tour with a code **and** a phone number.
 *
 * The rate limit is keyed on the caller's IP; the code is only 8 characters, so
 * this is what stops enumeration. See `docs/logic-map.md` for the known gap:
 * the limiter is in-memory, so it does not hold across multiple instances.
 */
export const POST = async (request: Request) => {
  try {
    const limited = rateLimit(
      `private-tour-access:${clientIp(request)}`,
      PRIVATE_TOUR_RATE_LIMIT,
    );
    if (!limited.ok) {
      return apiError(
        "RATE_LIMITED",
        "Too many attempts. Please wait a minute and try again.",
        429,
      );
    }

    const parsed = parseBody(privateTourAccessSchema, await request.json());
    if (!parsed.ok) {
      return parsed.response;
    }

    const locale =
      new URL(request.url).searchParams.get("locale") === "en" ? "en" : "vi";

    const existingKey = await readPrivateTourKey();
    const sessionKey = existingKey ?? newPrivateTourKey();

    const result = await unlockPrivateTour({
      code: parsed.data.code,
      phone: parsed.data.phone,
      sessionKey,
      locale,
    });

    if (result.status === "denied") {
      return apiError("NOT_FOUND", ACCESS_DENIED_MESSAGE, 404);
    }

    if (!existingKey) {
      const store = await cookies();
      store.set(PRIVATE_TOUR_COOKIE_NAME, sessionKey, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: PRIVATE_TOUR_COOKIE_MAX_AGE_SECONDS,
      });
    }

    return apiOk({
      tour: result.tour,
      slotsUsed: result.slotsUsed,
    });
  } catch (error) {
    return handleApiError("POST /api/private-tours/access", error);
  }
};

/** The proxy-facing IP, falling back to a shared bucket when it is absent. */
const clientIp = (request: Request): string => {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim();
  return ip && ip.length > 0 ? ip : "unknown";
};
