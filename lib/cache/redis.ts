import { Redis } from "@upstash/redis";
import { logger } from "@/lib/logger";

let client: Redis | null = null;

function getClient(): Redis | null {
  if (client) return client;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  client = new Redis({ url, token });
  return client;
}

export function isRedisConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getClient();
  if (!redis) return null;

  try {
    const data = await redis.get<T>(key);
    return data ?? null;
  } catch (err) {
    logger.warn("Redis cacheGet error", {
      key,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  const redis = getClient();
  if (!redis) return;

  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (err) {
    logger.warn("Redis cacheSet error", {
      key,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function cacheDel(key: string): Promise<void> {
  const redis = getClient();
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (err) {
    logger.warn("Redis cacheDel error", {
      key,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function cachePing(): Promise<boolean> {
  const redis = getClient();
  if (!redis) return false;

  const probeKey = `health:redis:${Date.now()}`;
  try {
    await redis.set(probeKey, "1", { ex: 10 });
    const value = await redis.get<string>(probeKey);
    await redis.del(probeKey);
    return value === "1";
  } catch (err) {
    logger.warn("Redis cachePing error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}
