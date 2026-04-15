import { cacheGet, cacheSet } from "@/lib/cache/redis";
import { CatalogError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export async function tmdbFetch<T>(
  url: string,
  params?: Record<string, string>,
  revalidate?: number
): Promise<T> {
  const fullUrl = new URL(url);
  if (params) {
    Object.entries(params).forEach(([k, v]) =>
      fullUrl.searchParams.set(k, v)
    );
  }

  const ttl = revalidate ?? 3600;
  const cacheKey = `tmdb:${fullUrl.pathname}${fullUrl.search}`;

  const cached = await cacheGet<T>(cacheKey);
  if (cached !== null) {
    logger.debug("TMDb cache hit", { key: cacheKey });
    return cached;
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new CatalogError("TMDB_API_KEY is not configured", { status: 500 });
  }

  const start = Date.now();
  const res = await fetch(fullUrl.toString(), {
    headers: { Authorization: `Bearer ${apiKey}` },
    next: { revalidate: ttl },
  });

  const durationMs = Date.now() - start;

  if (!res.ok) {
    logger.warn("TMDb request failed", {
      url: fullUrl.pathname,
      status: res.status,
      durationMs,
    });
    throw new CatalogError(`TMDb ${res.status}: ${res.statusText}`, {
      status: res.status,
      url: fullUrl.pathname,
    });
  }

  logger.debug("TMDb request", {
    url: fullUrl.pathname,
    status: res.status,
    durationMs,
  });

  const data = (await res.json()) as T;

  await cacheSet(cacheKey, data, ttl);

  return data;
}
