# Caching & Performance Rules

These rules apply to all code that fetches catalog data or serves API responses.

## TTL reference (import from lib/cache/ttl.ts — never hardcode)

```typescript
export const TTL = {
  TRENDING:    60 * 60 * 2,          // 2 hours
  POPULAR:     60 * 60 * 4,          // 4 hours
  DETAIL:      60 * 60 * 24 * 7,     // 7 days
  CREDITS:     60 * 60 * 24 * 7,     // 7 days
  PERSON:      60 * 60 * 24 * 7,     // 7 days
  SEARCH:      60 * 15,              // 15 minutes
  AI_EXPLAIN:  60 * 60 * 24 * 3,     // 3 days
} as const
```

## Server-side caching (Next.js fetch cache)
Use `next: { revalidate: TTL.DETAIL }` in all `fetch()` calls inside `lib/catalog/`.
Wrap reusable functions in `unstable_cache` so they benefit from request-level deduplication.

## What must never be cached
- Auth session data — always fresh from Auth.js
- User list items — read directly from DB (fast indexed query, changes frequently)
- Interaction events — write-only at ingest time

## Redis cache (optional, upgrade from Next.js cache)
When `REDIS_URL` is set, use Redis for:
- Trending/popular lists (shared across all users, high traffic)
- Rate limit counters (token bucket per IP / per user)
- AI explanation results (shared across users for the same titleId+recsVersion)

Pattern:
```typescript
const cached = await redis.get(cacheKey)
if (cached) return JSON.parse(cached)
const fresh = await fetchFreshData()
await redis.setex(cacheKey, TTL_SECONDS, JSON.stringify(fresh))
return fresh
```

## Performance targets (from PRD NFR1, NFR2)
- LCP < 2.5s on broadband for detail pages
- 99% of catalog requests < 800ms (with cache)

To hit these:
- Detail pages: parallel fetch of movie/TV data + credits using `Promise.all`
- Home page: preload trending data at build time or via ISR
- Images: always use `next/image` with `sizes` prop; never raw `<img>` for catalog images
- Never block the render on non-critical data (trailers, similar titles can stream in)

## Rate limiting (protect TMDb quota)
Every route that triggers a TMDb fetch must be rate-limited:
- Search: 30 requests/minute per IP
- Detail page: 60 requests/minute per IP (mostly cache hits)
- List mutations: 20 requests/minute per user

Use `lib/rate-limit.ts` which reads from Redis if available, in-memory otherwise.
