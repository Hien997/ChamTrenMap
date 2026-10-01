export const DEFAULT_RADIUS_METERS = 100;

export const MAX_GPS_ACCURACY_METERS = 100;

export const CHECKIN_RATE_LIMIT = { windowMs: 60_000, max: 10 } as const;
export const LOGIN_RATE_LIMIT = { windowMs: 60_000, max: 5 } as const;
// Private-tour unlock. Looser than login (5/min) because legitimate customers
// mistype codes; still bounded because the code is only 8 chars (ADR-0006).
/**
 * Unlock attempts, keyed on the caller IP.
 *
 * Generous on purpose: a booked group shares one hotel or café WiFi, so all ten
 * holders present the same IP. A tight per-IP limit would lock out the very
 * group the feature exists for, while still capping a real enumeration run.
 */
export const PRIVATE_TOUR_RATE_LIMIT = { windowMs: 60_000, max: 40 } as const;

/**
 * Arrival pings, keyed on the tour-holder cookie instead of the IP.
 *
 * Per-holder, so one person tapping "I'm here" repeatedly cannot exhaust anyone
 * else's budget — but tight enough to blunt GPS spam.
 */
export const PRIVATE_TOUR_VISIT_RATE_LIMIT = {
  windowMs: 60_000,
  max: 20,
} as const;

// Split session cookies (ADR-0001): visitor identity vs admin auth.
export const VISITOR_COOKIE_NAME = "ctm_visitor";
export const VISITOR_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
export const ADMIN_COOKIE_NAME = "ctm_admin";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export const SUPPORTED_LOCALES = ["vi", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "vi";

export const SHARE_ID_LENGTH = 10;

// Private tours (ADR-0006). The alphabet omits 0/O, 1/l/I and other
// look-alikes because these codes get read aloud over the phone.
export const PRIVATE_TOUR_CODE_LENGTH = 8;
export const PRIVATE_TOUR_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const PRIVATE_TOUR_DEFAULT_MAX_SLOTS = 10;
export const PRIVATE_TOUR_COOKIE_NAME = "ctm_private";
export const PRIVATE_TOUR_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
