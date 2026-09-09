/**
 * Global app constants. Single source of truth for check-in policy (Plan.md §7).
 */

/** Default geofence radius for a checkpoint (meters). Admin can override per checkpoint in DB. */
export const DEFAULT_RADIUS_METERS = 100;

/** GPS accuracy ceiling (meters). A fix less precise than this is rejected server-side. */
export const MAX_GPS_ACCURACY_METERS = 100;

/** Per-IP rate limit for POST /api/checkins (in-memory; see lib/rate-limit.ts note). */
export const CHECKIN_RATE_LIMIT = { windowMs: 60_000, max: 10 } as const;

/** Anonymous-first session cookie (Plan.md §7). */
export const SESSION_COOKIE_NAME = "ctm_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

/** i18n (Plan.md §9). */
export const SUPPORTED_LOCALES = ["vi", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "vi";

/** Share link id length. */
export const SHARE_ID_LENGTH = 10;
