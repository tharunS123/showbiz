# START HERE (Showbiz Catalog)

This repository is the **Showbiz** movie/TV catalog app: rich metadata pages + user lists + personalized recommendations.

- **Catalog data**: fetched on-demand from an external metadata provider (e.g., TMDb).
- **User data**: stored in our DB (watchlist, favorites, seen, ratings, activity).
- **Recommendations**: start with deterministic ranking; upgrade to embeddings-based personalization.

## What to build first (recommended order)

1. **Catalog browsing**
   - Home: Trending / Popular / Top Rated
   - Search: query + filters
2. **Detail pages**
   - Movie: metadata, trailer, cast & crew, similar titles
   - TV: metadata, seasons, cast & crew, similar shows
   - Person: bio + filmography
3. **Accounts + lists**
   - Login
   - Watchlist/Favorites/Seen
4. **Recommendations**
   - v1: re-rank "similar/trending" with user taste profile
   - v2: embeddings + vector search

## Baseline tech stack (opinionated default)

- **Frontend**: Next.js (App Router) + TypeScript
- **UI**: TailwindCSS + shadcn/ui (optional)
- **Backend**: Next.js Route Handlers (`/app/api/...`)
- **DB**: Supabase
- **Auth**: Manual Auth
- **Caching**: Next fetch caching → Redis later
- **Observability**: structured logs + error tracking + basic metrics

If you prefer a split architecture (separate backend), see `showbiz_infra_rider_prd.md`.

## Environment variables

Common env vars (names are suggestions — adopt consistently):

- `CATALOG_PROVIDER=tmdb`
- `TMDB_API_KEY=...` *(server-only)*
- `SUPABASE_URL=...`
- `REDIS_URL=...` *(optional)*
- `RECS_MODE=rules|embeddings` *(feature flag)*

## Local development

1. Install deps
   - `pnpm install` (or npm/yarn)
2. Start DB (if using Docker)
   - `docker compose up -d`
3. Start dev server
   - `pnpm dev`

## Repo layout (suggested)

- `app/` — routes & pages (Next.js)
- `app/api/` — backend endpoints
- `lib/catalog/` — provider adapter (TMDb wrapper, caching, mapping)
- `lib/db/` — Prisma client + DB helpers
- `lib/recs/` — recommendation engine (rules + embeddings)
- `components/` — UI components
- `tests/` — unit/integration tests
- `docs/` — additional docs (this folder can contain these .md files)

## Definition of done (MVP)

- Home browsing works
- Search works
- Movie/TV/Person pages render with correct metadata
- User can login and maintain watchlist/favorites
- Recommendations page shows personalized results and can explain why (basic)

## Where to go next

Read:
- `showbiz_prd.md` — product requirements
- `showbiz_infra_rider_prd.md` — infrastructure requirements
- `concept_system.md` — domain model + event taxonomy
- `ai_prompting_context.md` — AI usage patterns + safety constraints
- `AGENTS.md` — roles and evaluation expectations

_Last updated: 2025-12-16_
