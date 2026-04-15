---
name: catalog-provider
description: Use when building or modifying the TMDb catalog adapter in lib/catalog/. Provides the normalization shapes, fetch patterns, and caching templates needed to work with the TMDb API correctly.
---

# Catalog Provider Skill

This skill provides the concrete patterns for building the TMDb catalog adapter.

## Internal data shapes (normalize TO these)

```typescript
// lib/catalog/types.ts

export type MediaType = 'movie' | 'tv'

export interface Title {
  externalId: string
  mediaType: MediaType
  title: string
  year: number | null
  overview: string
  genres: Genre[]
  runtimeMinutes: number | null    // movie only
  seasonCount: number | null       // tv only
  episodeCount: number | null      // tv only
  status: string | null            // tv only
  posterPath: string | null
  backdropPath: string | null
  ratingAverage: number
  ratingCount: number
  trailerKey: string | null        // YouTube key from TMDb videos
}

export interface Person {
  externalId: string
  name: string
  bio: string | null
  profilePath: string | null
  knownForDepartment: string | null
}

export interface Credit {
  person: Pick<Person, 'externalId' | 'name' | 'profilePath'>
  role: 'cast' | 'crew'
  character: string | null   // cast only
  job: string | null         // crew only
  department: string | null  // crew only
  ordering: number           // cast only
}

export interface Genre {
  id: number
  name: string
}
```

## TMDb → internal normalizer pattern

```typescript
// lib/catalog/normalize.ts
import type { Title, MediaType } from './types'

// TMDb movie response → Title
export function normalizeMovie(raw: TMDbMovie): Title {
  return {
    externalId: String(raw.id),
    mediaType: 'movie',
    title: raw.title,
    year: raw.release_date ? new Date(raw.release_date).getFullYear() : null,
    overview: raw.overview ?? '',
    genres: raw.genres ?? [],
    runtimeMinutes: raw.runtime ?? null,
    seasonCount: null,
    episodeCount: null,
    status: null,
    posterPath: raw.poster_path ?? null,
    backdropPath: raw.backdrop_path ?? null,
    ratingAverage: raw.vote_average ?? 0,
    ratingCount: raw.vote_count ?? 0,
    trailerKey: extractTrailerKey(raw.videos?.results),
  }
}

function extractTrailerKey(videos?: TMDbVideo[]): string | null {
  return videos?.find(v => v.type === 'Trailer' && v.site === 'YouTube')?.key ?? null
}
```

## Fetch client with auth

```typescript
// lib/catalog/client.ts
const TMDB_BASE = 'https://api.themoviedb.org/3'

export async function tmdbFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${TMDB_BASE}${path}`)
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
    next: { revalidate: getCacheTTL(path) },
  })

  if (!res.ok) throw new CatalogError(`TMDb ${res.status}`, { path, status: res.status })
  return res.json() as Promise<T>
}
```

## Image URL helper

```typescript
// lib/catalog/images.ts
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

export function posterUrl(path: string | null, size: 'w342' | 'w500' | 'original' = 'w342') {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null
}

export function backdropUrl(path: string | null, size: 'w780' | 'w1280' | 'original' = 'w1280') {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null
}
```
