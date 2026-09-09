/**
 * Minimal fixed-window in-memory rate limiter (Plan.md §7).
 *
 * Limitation (documented, accepted for Phase 1): on Vercel serverless each Lambda
 * instance keeps its own map, so limits are per-instance. Swap the Map for Upstash
 * Redis (or Vercel KV) when strict global limits are required.
 */

interface Bucket {
  count: number;
  resetAtMs: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets (0 when ok). */
  retryAfterSec: number;
  remaining: number;
}

export function rateLimit(
  key: string,
  options: { windowMs: number; max: number },
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAtMs <= now) {
    buckets.set(key, { count: 1, resetAtMs: now + options.windowMs });
    return { ok: true, retryAfterSec: 0, remaining: options.max - 1 };
  }

  bucket.count += 1;
  if (bucket.count > options.max) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAtMs - now) / 1000)),
      remaining: 0,
    };
  }
  return { ok: true, retryAfterSec: 0, remaining: options.max - bucket.count };
}

/** Test helper. */
export function resetRateLimiter(): void {
  buckets.clear();
}
