interface Bucket {
  count: number;
  resetAtMs: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  retryAfterSec: number;
  remaining: number;
}

// Lazy eviction (S5): drop buckets whose window has passed whenever a new key
// arrives, so keys that never come back cannot grow the map without bound.
function sweepExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAtMs <= now) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  options: { windowMs: number; max: number },
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket) {
    sweepExpired(now);
    buckets.set(key, { count: 1, resetAtMs: now + options.windowMs });
    return { ok: true, retryAfterSec: 0, remaining: options.max - 1 };
  }

  if (bucket.resetAtMs <= now) {
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

export function resetRateLimiter(): void {
  buckets.clear();
}
