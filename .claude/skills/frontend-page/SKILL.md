---
name: frontend-page
description: Use when building a Showbiz page or UI component. Provides the component patterns, layout templates, and UX rules for movie/TV detail pages, search, and the home feed.
---

# Frontend Page Skill

## Core layout components

### Facts grid (metadata row)
Used on all detail pages for year, runtime, rating, language etc.

```tsx
// components/ui/facts-grid.tsx
interface Fact { label: string; value: string | null }

export function FactsGrid({ facts }: { facts: Fact[] }) {
  return (
    <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
      {facts.filter(f => f.value).map(({ label, value }) => (
        <div key={label} className="flex flex-col">
          <dt className="text-muted-foreground text-xs uppercase tracking-wide">{label}</dt>
          <dd className="font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
```

### Genre chips
```tsx
// components/ui/genre-chips.tsx
export function GenreChips({ genres }: { genres: { id: number; name: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {genres.map(g => (
        <span key={g.id} className="rounded-full border border-border px-3 py-0.5 text-xs font-medium">
          {g.name}
        </span>
      ))}
    </div>
  )
}
```

### Poster image with fallback
```tsx
// components/ui/poster.tsx
import Image from 'next/image'
import { posterUrl } from '@/lib/catalog/images'

interface PosterProps { path: string | null; title: string; size?: 'sm' | 'md' | 'lg' }

const sizes = { sm: 'w-20 h-30', md: 'w-32 h-48', lg: 'w-48 h-72' }

export function Poster({ path, title, size = 'md' }: PosterProps) {
  const src = posterUrl(path, 'w342')
  return (
    <div className={`relative overflow-hidden rounded-md bg-muted ${sizes[size]}`}>
      {src ? (
        <Image src={src} alt={`${title} poster`} fill className="object-cover" sizes="(max-width: 768px) 128px, 192px" />
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground text-xs p-2 text-center">{title}</div>
      )}
    </div>
  )
}
```

### Cast carousel skeleton
```tsx
// components/ui/cast-carousel.tsx
export function CastCarouselSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-24 space-y-2 animate-pulse">
          <div className="w-24 h-24 rounded-full bg-muted" />
          <div className="h-3 bg-muted rounded w-3/4 mx-auto" />
          <div className="h-3 bg-muted rounded w-1/2 mx-auto" />
        </div>
      ))}
    </div>
  )
}
```

## Movie detail page template

```tsx
// app/movie/[id]/page.tsx
import { getMovie, getMovieCredits } from '@/lib/catalog/movie'
import { getUserListStatus } from '@/lib/db/list'
import { auth } from '@/auth'
import { FactsGrid } from '@/components/ui/facts-grid'
import { GenreChips } from '@/components/ui/genre-chips'
import { Poster } from '@/components/ui/poster'
import { ListToggleButtons } from '@/components/list-toggle-buttons'
import { CastCarousel } from '@/components/cast-carousel'
import { SimilarTitlesGrid } from '@/components/similar-titles-grid'
import type { Metadata } from 'next'

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const movie = await getMovie(params.id)
  return {
    title: movie ? `${movie.title} (${movie.year}) — Showbiz` : 'Movie — Showbiz',
    description: movie?.overview,
  }
}

export default async function MovieDetailPage({ params }: Props) {
  const [movie, credits, session] = await Promise.all([
    getMovie(params.id),
    getMovieCredits(params.id),
    auth(),
  ])

  if (!movie) notFound()

  const listStatus = session?.user?.id
    ? await getUserListStatus(session.user.id, params.id, 'movie')
    : null

  const facts = [
    { label: 'Year', value: movie.year?.toString() ?? null },
    { label: 'Runtime', value: movie.runtimeMinutes ? `${movie.runtimeMinutes} min` : null },
    { label: 'Rating', value: movie.ratingAverage ? `${movie.ratingAverage.toFixed(1)} / 10` : null },
  ]

  return (
    <main>
      {/* Backdrop */}
      {movie.backdropPath && (
        <div className="relative h-64 md:h-96 overflow-hidden">
          <Image src={backdropUrl(movie.backdropPath, 'w1280')!} alt="" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-background" />
        </div>
      )}

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex gap-6">
          <Poster path={movie.posterPath} title={movie.title} size="lg" />
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">{movie.title}</h1>
            <FactsGrid facts={facts} />
            <GenreChips genres={movie.genres} />
            {listStatus && <ListToggleButtons externalId={params.id} mediaType="movie" status={listStatus} />}
            <p className="text-muted-foreground max-w-prose">{movie.overview}</p>
          </div>
        </div>

        {/* Cast */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Cast</h2>
          <CastCarousel credits={credits?.cast ?? []} />
        </section>

        {/* Similar */}
        <section>
          <h2 className="text-xl font-semibold mb-4">More like this</h2>
          <SimilarTitlesGrid titleId={params.id} mediaType="movie" />
        </section>
      </div>
    </main>
  )
}
```

## List toggle button (optimistic UI)

```tsx
// components/list-toggle-buttons.tsx
'use client'
import { useOptimistic, useTransition } from 'react'
import { toggleListItem } from '@/app/actions/list'

type ListStatus = { watchlist: boolean; favorite: boolean; seen: boolean }

export function ListToggleButtons({ externalId, mediaType, status }: {
  externalId: string
  mediaType: 'movie' | 'tv'
  status: ListStatus
}) {
  const [optimistic, setOptimistic] = useOptimistic(status)
  const [, startTransition] = useTransition()

  function toggle(listType: keyof ListStatus) {
    const next = { ...optimistic, [listType]: !optimistic[listType] }
    startTransition(async () => {
      setOptimistic(next)
      await toggleListItem({ externalId, mediaType, listType, add: next[listType] })
    })
  }

  return (
    <div className="flex gap-2">
      <button onClick={() => toggle('watchlist')} aria-pressed={optimistic.watchlist}
        className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors
          ${optimistic.watchlist ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-muted'}`}>
        {optimistic.watchlist ? '✓ Watchlist' : '+ Watchlist'}
      </button>
      <button onClick={() => toggle('favorite')} aria-pressed={optimistic.favorite}
        className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors
          ${optimistic.favorite ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-muted'}`}>
        {optimistic.favorite ? '♥ Favorited' : '♡ Favorite'}
      </button>
      <button onClick={() => toggle('seen')} aria-pressed={optimistic.seen}
        className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors
          ${optimistic.seen ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-muted'}`}>
        {optimistic.seen ? '✓ Seen' : 'Mark seen'}
      </button>
    </div>
  )
}
```
