interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

interface RateLimiterOptions {
  maxTokens: number;
  refillRate: number; // tokens per second
  windowMs?: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now - entry.lastRefill > windowMs * 2) {
      store.delete(key);
    }
  }
}

export function createRateLimiter(opts: RateLimiterOptions) {
  const { maxTokens, refillRate, windowMs = 60_000 } = opts;

  return {
    check(key: string): { allowed: boolean; remaining: number; resetMs: number } {
      cleanup(windowMs);
      const now = Date.now();
      let entry = store.get(key);

      if (!entry) {
        entry = { tokens: maxTokens, lastRefill: now };
        store.set(key, entry);
      }

      const elapsed = (now - entry.lastRefill) / 1000;
      entry.tokens = Math.min(maxTokens, entry.tokens + elapsed * refillRate);
      entry.lastRefill = now;

      if (entry.tokens < 1) {
        const resetMs = Math.ceil(((1 - entry.tokens) / refillRate) * 1000);
        return { allowed: false, remaining: 0, resetMs };
      }

      entry.tokens -= 1;
      return { allowed: true, remaining: Math.floor(entry.tokens), resetMs: 0 };
    },

    reset(key: string) {
      store.delete(key);
    },
  };
}

export const searchLimiter = createRateLimiter({
  maxTokens: 30,
  refillRate: 0.5,
});

export const listMutationLimiter = createRateLimiter({
  maxTokens: 20,
  refillRate: 0.33,
});

/**
 * Returns a Redis-backed limiter when Upstash env vars are set,
 * otherwise falls back to the in-memory implementation.
 */
export function createSmartRateLimiter(opts: RateLimiterOptions) {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createRedisRateLimiter } = require("@/lib/rate-limit-redis") as typeof import("@/lib/rate-limit-redis");
    return createRedisRateLimiter(opts);
  }
  return createRateLimiter(opts);
}
