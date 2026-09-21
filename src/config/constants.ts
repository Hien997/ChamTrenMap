export const DEFAULT_RADIUS_METERS = 100;

export const MAX_GPS_ACCURACY_METERS = 100;

export const CHECKIN_RATE_LIMIT = { windowMs: 60_000, max: 10 } as const;

export const SESSION_COOKIE_NAME = "ctm_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const SUPPORTED_LOCALES = ["vi", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "vi";

export const SHARE_ID_LENGTH = 10;
