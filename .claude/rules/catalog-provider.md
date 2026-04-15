# Catalog Provider Rules

These rules apply to all files in `lib/catalog/`.

## The golden rule
**Never expose the TMDb API key to the client.** Every fetch to `api.themoviedb.org` must originate from a Server Component, Server Action, or API Route Handler. If you find a catalog fetch in a client component, it is a bug.

## Adapter structure
```
lib/catalog/
  client.ts        # Raw fetch wrapper with auth header injected
  normalize.ts     # TMDb response → internal Title / Person / Credit shapes
  endpoints.ts     # All TMDb endpoint URL builders
  cache.ts         # Cache key builders and TTL constants
  movie.ts         # getMovie(id), getSimilarMovies(id)
  tv.ts            # getTv(id), getSimilarShows(id)
  person.ts        # getPerson(id), getPersonCredits(id)
  search.ts        # searchMulti(query), searchByFilters(filters)
  trending.ts      # getTrending(type, window)
```

## Normalization
All TMDb responses must be normalized before leaving `lib/catalog/`. The rest of the app never imports TMDb-specific field names (`original_title`, `vote_average`, `poster_path`, etc.). Use the internal shapes from `docs/concept_system.md`:
- `Title` — externalId, mediaType, title, year, overview, genres[], ratingAverage, posterPath, etc.
- `Person` — externalId, name, bio, profilePath, knownForDepartment
- `Credit` — role, character, job, department, ordering

## Caching
Wrap every catalog fetch with `unstable_cache` from `next/cache`:
```typescript
import { unstable_cache } from 'next/cache'
export const getMovie = unstable_cache(
  async (id: string) => { /* fetch + normalize */ },
  ['movie', id],
  { revalidate: 60 * 60 * 24 * 7 }  // 7 days
)
```
TTL constants must come from `lib/cache/ttl.ts`, not be hardcoded inline.

## Error handling
```typescript
// On provider error, throw a typed error
throw new CatalogError('TMDb fetch failed', { status: response.status, id })
```
Callers catch `CatalogError` and either return stale cache or a friendly error response.

## Provider attribution
TMDb requires attribution. The `<TMDbAttribution />` component must appear on every page that displays catalog data.
