# concept_system.md (Domain Model, Concepts, and Event Taxonomy)

**Last updated:** 2025-12-16

This document defines the conceptual system for Showbiz: domain entities, relationships, and tracking events.

## 1) Core design principles

1. **External catalog, internal user layer**  
   We do not ingest the entire catalog. We fetch metadata on demand and cache.

2. **Stable identifiers**  
   Use provider IDs (`externalId`) + `mediaType` as the canonical identity.

3. **Composable recommendation engine**  
   Recs are a module with stable inputs (user signals + item features) and stable outputs (ranked list + explanations).

## 2) Domain entities

### 2.1 Title (Movie/TV)
**Fields (normalized)**
- `externalId` (string/int)
- `mediaType`: `movie | tv`
- `title` / `name`
- `year`
- `overview`
- `genres[]`
- `runtimeMinutes` (movie)
- `seasonCount` (tv)
- `status` (tv)
- `posterPath`, `backdropPath`
- `ratingAverage`, `ratingCount`
- `keywords[]` (optional)
- `providers[]` (optional, post-MVP)

### 2.2 Person
- `externalId`
- `name`
- `bio`
- `profilePath`
- `knownForDepartment`
- `filmography[]` (list of Title references)

### 2.3 Credit
- For a Title:
  - Cast: role/character + ordering
  - Crew: job + department
- For a Person:
  - credits by year / mediaType

### 2.4 User
- `id`
- login identity (email/oauth)
- preferences (optional)

### 2.5 ListItem
- `userId`
- `externalId`
- `mediaType`
- `listType`: `watchlist | favorite | seen`
- `createdAt`

### 2.6 Interaction Event
Used for analytics and recommendations.

- `userId`
- `eventType`
- `externalId` (optional)
- `mediaType` (optional)
- `timestamp`
- `context` JSON (page, referrer, ranking source, etc.)

## 3) Recommendation concepts

### 3.1 Candidate generation
Where do recommendation candidates come from?
- Provider “similar/recommended”
- Trending/popular filtered by user preferences
- Genre-based discovery lists

### 3.2 Ranking (rules-based MVP)
Score each candidate by:
- + genre overlap with favorites/seen
- + presence of frequently engaged actors/directors
- + recency (optional)
- - already seen
- - too similar to recently recommended items (diversity)

### 3.3 Explanation (truthful)
Explain based on actual signals:
- “Because you favorited **X** (same director)”
- “Because you watch a lot of **Sci-Fi**”

Do not claim streaming availability unless sourced.

## 4) Event taxonomy (recommended)

### 4.1 View events
- `view_title` (externalId, mediaType)
- `view_person` (externalId)

### 4.2 Search events
- `search` (query, filters)
- `search_click` (externalId, mediaType)

### 4.3 List events
- `add_watchlist` / `remove_watchlist`
- `favorite` / `unfavorite`
- `mark_seen` / `unmark_seen`

### 4.4 Recommendation events
- `rec_impression` (source, list of shown ids)
- `rec_click` (clicked id, position, source)
- `rec_why_open` (clicked "why this")

## 5) Data flow (high level)

1. User visits title page → fetch catalog metadata (cached) + query DB for list status
2. User clicks watchlist → mutate DB + emit interaction event
3. Recs endpoint reads interactions + list items → generates candidates → ranks → returns list + explanation tokens
