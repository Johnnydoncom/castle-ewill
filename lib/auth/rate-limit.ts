import "server-only";

/**
 * Fixed-window rate limiter backed by an in-process map.
 *
 * This is sufficient for a single-instance deployment and for protecting
 * against casual credential stuffing. For multi-instance production, swap the
 * `store` for Redis — the public API is designed so nothing else has to change.
 */

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  entry.count += 1;

  if (entry.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  return {
    ok: true,
    remaining: limit - entry.count,
    retryAfterSeconds: 0,
  };
}

export function resetRateLimit(key: string): void {
  store.delete(key);
}

/** Evicts expired entries so the map cannot grow without bound. */
export function sweepRateLimits(now = Date.now()): number {
  let removed = 0;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
      removed++;
    }
  }
  return removed;
}

if (typeof setInterval === "function") {
  const timer = setInterval(() => sweepRateLimits(), 60_000);
  // Do not hold the event loop open during graceful shutdown.
  if (typeof timer.unref === "function") timer.unref();
}
