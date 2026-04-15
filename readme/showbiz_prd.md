# Showbiz PRD (Product Requirements Document)

**Product name:** Showbiz  
**Doc owner:** Product/Engineering  
**Last updated:** 2025-12-16

## 1. Problem statement

People want a **beautiful, fast way** to explore movies and TV shows and understand:
- what it is (plot, genre, runtime, release info),
- who made it (cast/crew),
- whether they should watch it (personal recommendations),
- and how to track it (watchlist/favorites/seen).

## 2. Goals

### Primary goals
1. Build a catalog experience that feels **premium**: fast, rememberable, and easy to browse.
2. Give users **ownership of taste** via watchlist/favorites/seen and personalized recommendations.
3. Keep architecture clean: external catalog data + internal user layer + composable rec engine.

### Non-goals (for MVP)
- Streaming playback
- Full social network (comments/followers)
- Owning a complete catalog dataset in our DB

## 3. Target users & personas

- **Casual viewer:** wants trending picks and quick trailers.
- **Planner:** maintains watchlist and wants reminders for releases/new seasons.
- **Film nerd:** deep dives cast/crew, filmographies, and metadata.

## 4. Key user journeys

1. **Browse → detail → add to watchlist**
2. **Search → filter → compare → favorite**
3. **Watch history → recommendations**
4. **Actor exploration → filmography → similar titles**

## 5. MVP feature set

### 5.1 Catalog browsing
- Home sections:
  - Trending
  - Popular
  - Top rated
- Discover filters:
  - Genre
  - Year (range)
  - Rating (min)
  - Media type (movie/tv)

### 5.2 Search
- Search by title
- Autocomplete suggestions (optional)
- Show both movie & TV results with clear labels

### 5.3 Detail pages

#### Movie detail
- Poster/backdrop
- Title + year + runtime
- Overview
- Genres (chips)
- Rating / vote count
- Trailer (if available)
- Cast carousel (top-billed)
- Crew highlights (director, writers, etc.)
- Similar titles grid

#### TV detail
- Poster/backdrop
- Title + first air year + status
- Overview
- Genres
- Seasons count, episodes count
- Cast carousel
- Crew highlights
- Similar shows grid

#### Person detail
- Photo
- Bio
- Known for
- Filmography (movie/tv tabs; sorted by year)
- Links (optional)

### 5.4 User accounts & lists
- Auth: Google/GitHub/email
- Lists:
  - Watchlist
  - Favorites
  - Seen
- Optional: rating + notes (post-MVP)

### 5.5 Recommendations (MVP)
- A “For You” page that:
  - shows personalized results
  - can display a short **“why this”** explanation (deterministic)
- Recs mode v1: rules-based ranking (see `concept_system.md`)

## 6. Post-MVP features

- Custom lists (shareable)
- “Where to watch” integration (provider availability)
- New-season / upcoming release notifications
- Embeddings-based recommendations (vector search)
- Mood-based discovery prompts (“cozy mystery”, “fast action under 2 hours”)
- User preference controls (hide genres, avoid spoilers, content rating filter)

## 7. Data sources

### Catalog provider
- Primary: TMDb-like provider (movies, tv, persons, credits, recommendations, images)
- Server-side fetching only (do not expose API key in client)

### Attribution & compliance
- Follow provider terms: attribution, logo display rules, rate limiting, caching constraints.

## 8. Requirements

### 8.1 Functional requirements
- FR1: Users can browse trending/popular/top rated for movie and TV
- FR2: Users can search and filter results
- FR3: Users can open detail pages for movie, tv, person
- FR4: Users can login and manage watchlist/favorites/seen
- FR5: Recs page returns ranked items personalized to user history

### 8.2 Non-functional requirements
- NFR1: LCP < 2.5s on a typical broadband connection for key pages
- NFR2: 99% of catalog requests served under 800ms (with caching)
- NFR3: Rate-limit provider API calls; avoid hitting quotas
- NFR4: Protect API keys & secrets; secure auth
- NFR5: Accessibility baseline (keyboard nav, semantic headings, alt text)

## 9. UX guidelines

- Use consistent metadata layout:
  - “chips” for genres and tags
  - “facts grid” for runtime, release, language, rating
- Skeleton loaders for images and credits
- Clear media type labels and year everywhere
- “Add to watchlist/favorite” actions should be one-click and reversible

## 10. Analytics & events

Track events for improvement and rec quality:
- `view_title`, `view_person`
- `search`, `search_click`
- `add_watchlist`, `remove_watchlist`
- `favorite`, `unfavorite`
- `mark_seen`, `unmark_seen`
- `rec_impression`, `rec_click`

See event taxonomy in `concept_system.md`.

## 11. Success metrics

- Activation: % users who add at least one item to watchlist
- Retention: weekly returning users
- Engagement: views per session, rec click-through rate
- List depth: avg items per watchlist

## 12. Risks & mitigations

- **Provider limits** → caching + backoff + server-only requests
- **Spoilers** → avoid showing episode titles/plots by default for TV
- **Cost creep** → avoid ingesting full catalog; cache selectively
- **AI confusion** → keep explanations truthful; don’t hallucinate availability

## 13. Open questions (tracked)
- Which provider(s) and regions do we support?
- Do we include content ratings and parental controls in MVP?
- How do we handle multi-language metadata?
