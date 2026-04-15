# Showbiz — Movies & TV

A movie and TV show catalog app with personalized recommendations. Built with Next.js 16, TypeScript, TailwindCSS, Clerk Auth, Supabase, and the TMDb API.

## Features

- **Catalog Browsing** — Trending, popular, and top-rated movies & TV shows
- **Search** — Debounced multi-search across movies and TV
- **Detail Pages** — Movie, TV, and person pages with trailers, cast, crew, and similar titles
- **User Lists** — Watchlist, favorites, and seen lists with optimistic UI
- **Personalized Recommendations** — Rules-based scoring engine with deterministic "why this?" explanations
- **Dark Theme** — Beautiful dark UI with purple accent built on shadcn/ui

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + TypeScript |
| UI | TailwindCSS + shadcn/ui |
| Auth | Clerk |
| Database | Supabase (Postgres + JS client) |
| Catalog Data | TMDb API (server-only) |
| Recommendations | Rules-based scoring (no AI for MVP) |
| Testing | Vitest |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- A TMDb API read access token
- A Clerk account with publishable/secret keys
- A Supabase project

### Setup

```bash
# Clone and install
pnpm install

# Copy environment variables
cp .env.example .env.local
# Fill in your Supabase URL, service role key, TMDB_API_KEY, and Clerk keys

# Create the database tables
# Open the Supabase SQL Editor and run supabase/migration.sql

# Start development server
pnpm dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `TMDB_API_KEY` | TMDb Read Access Token (v4 auth) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook signing secret |

### Database Setup

Run `supabase/migration.sql` in the Supabase SQL Editor. This creates the `users`, `list_items`, and `interaction_events` tables with appropriate indexes and RLS policies.

### Clerk Webhook Setup

Create a webhook in Clerk Dashboard pointing to `/api/webhooks/clerk` with events: `user.created`, `user.updated`, `user.deleted`.

## Project Structure

```
app/                    # Next.js App Router pages
  api/                  # API route handlers
  actions/              # Server actions
  movie/[id]/           # Movie detail page
  tv/[id]/              # TV detail page
  person/[id]/          # Person detail page
  search/               # Search page
  lists/                # User lists (protected)
  for-you/              # Recommendations (protected)
components/             # React components
  ui/                   # Reusable UI primitives
lib/
  catalog/              # TMDb adapter (types, client, normalizers)
  db/                   # Supabase helpers (list, interactions, user)
  recs/                 # Recommendation engine
  cache/                # TTL constants
supabase/               # SQL migration
```

## Testing

```bash
pnpm test           # Run all tests
pnpm test:watch     # Watch mode
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm test` | Run test suite |
| `pnpm lint` | Run ESLint |
| `pnpm smoke` | Run deployment smoke checks |

## Operational Runbooks

- Phase 5 rollout and verification: `docs/phase-5-rollout.md`

## Data Attribution

This product uses the TMDb API but is not endorsed or certified by TMDb.
