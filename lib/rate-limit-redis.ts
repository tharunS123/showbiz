import { cacheGet, cacheSet } from "@/lib/cache/redis";

interface RateLimiterOptions {
  maxTokens: number;
  refillRate: number; // tokens per second
  windowMs?: number;
}

interface Bucket {
  tokens: number;
  lastRefill: number;
}

export function createRedisRateLimiter(opts: RateLimiterOptions) {
  const { maxTokens, refillRate, windowMs = 60_000 } = opts;
  const ttlSeconds = Math.ceil((windowMs * 2) / 1000);

  return {
    async check(
      key: string,
    ): Promise<{ allowed: boolean; remaining: number; resetMs: number }> {
      const redisKey = `rl:${key}`;
      const now = Date.now();

      let bucket = await cacheGet<Bucket>(redisKey);

      if (!bucket) {
        bucket = { tokens: maxTokens, lastRefill: now };
      }

      const elapsed = (now - bucket.lastRefill) / 1000;
      bucket.tokens = Math.min(maxTokens, bucket.tokens + elapsed * refillRate);
      bucket.lastRefill = now;

      if (bucket.tokens < 1) {
        const resetMs = Math.ceil(((1 - bucket.tokens) / refillRate) * 1000);
        await cacheSet(redisKey, bucket, ttlSeconds);
        return { allowed: false, remaining: 0, resetMs };
      }

      bucket.tokens -= 1;
      const remaining = Math.floor(bucket.tokens);
      await cacheSet(redisKey, bucket, ttlSeconds);
      return { allowed: true, remaining, resetMs: 0 };
    },
  };
}
