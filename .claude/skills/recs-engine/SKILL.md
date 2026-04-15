---
name: recs-engine
description: Use when building or modifying the recommendation engine in lib/recs/. Provides the scoring algorithm, candidate generation patterns, explanation prompt templates, and evaluation helpers.
---

# Recs Engine Skill

## File structure

```
lib/recs/
  index.ts           # Public API: generateRecs(userId, options)
  candidates.ts      # Candidate generation from multiple sources
  score.ts           # Scoring function
  explain.ts         # AI explanation generation + deterministic fallback
  signals.ts         # Build user taste profile from DB interactions
  types.ts           # RecsResult, ScoredCandidate, UserSignals, etc.
```

## User signals shape

```typescript
// lib/recs/types.ts
export interface UserSignals {
  userId: string
  favoriteGenreIds: number[]           // from favorites + high-engagement seen
  topPersonIds: string[]               // externalIds of frequently-engaged cast/crew
  recentTitleIds: string[]             // recently favorited or seen (last 30 days)
  seenExternalIds: Set<string>         // all seen titles — hard exclude from recs
  recentRecIds: Set<string>            // recently recommended — diversity penalty
}

export interface ScoredCandidate {
  title: Title
  score: number
  explanationTokens: ExplanationTokens
}

export interface ExplanationTokens {
  matchedGenres: string[]
  matchedPeople: string[]
  matchedTitles: string[]             // "because you liked X"
}

export interface RecsResult {
  items: Array<{
    title: Title
    explanation: string               // final 1-sentence string
  }>
  recsVersion: string                 // for cache keying
}
```

## Candidate generation

```typescript
// lib/recs/candidates.ts
export async function generateCandidates(signals: UserSignals): Promise<Title[]> {
  const [similar, trending, genreBased] = await Promise.all([
    // 1. TMDb "similar" for recently-liked titles
    fetchSimilarForTitles(signals.recentTitleIds.slice(0, 5)),
    // 2. Trending filtered by user's genres
    fetchTrendingFiltered(signals.favoriteGenreIds),
    // 3. Genre discovery lists
    fetchGenreDiscover(signals.favoriteGenreIds),
  ])

  // Deduplicate by externalId
  const seen = new Set<string>()
  return [...similar, ...trending, ...genreBased].filter(t => {
    if (seen.has(t.externalId)) return false
    seen.add(t.externalId)
    return true
  })
}
```

## Scoring function

```typescript
// lib/recs/score.ts
export function scoreCandidate(candidate: Title, signals: UserSignals): number {
  // Hard exclude
  if (signals.seenExternalIds.has(candidate.externalId)) return -Infinity

  let score = 0
  const tokens: ExplanationTokens = { matchedGenres: [], matchedPeople: [], matchedTitles: [] }

  // Genre overlap (most important signal)
  const genreMatches = candidate.genres.filter(g => signals.favoriteGenreIds.includes(g.id))
  score += genreMatches.length * 2.0
  tokens.matchedGenres = genreMatches.map(g => g.name)

  // Cast/crew overlap
  const credits = getCachedCredits(candidate.externalId)  // from catalog cache
  const peopleMatches = credits?.filter(c => signals.topPersonIds.includes(c.person.externalId)) ?? []
  score += peopleMatches.length * 1.5
  tokens.matchedPeople = peopleMatches.map(c => c.person.name)

  // Recency bonus (optional — newer titles get slight boost)
  if (candidate.year && candidate.year >= new Date().getFullYear() - 2) {
    score += 0.5
  }

  // Diversity penalty for recently recommended
  if (signals.recentRecIds.has(candidate.externalId)) {
    score -= 1.0
  }

  return score
}
```

## AI explanation prompt

Use this exact system + user prompt structure (from `docs/ai_prompting_context.md`):

**System:**
```
You are a recommendation explainer for a movie/TV app. Be concise, truthful, and user-friendly.
Never invent facts. Only cite reasons provided in the inputs.
If no strong reason exists, say it is similar in genre or popularity.
```

**User:**
```
User signals (truthful):
- Favorite genres: {favoriteGenres}
- Frequently engaged people: {topPeople}
- Recently liked titles: {recentTitles}

Candidate title:
- Title: {title}
- Genres: {genres}
- People: {peopleHighlights}
- Overview: {overviewShort}

Write 1 sentence (max 22 words) explaining why this was recommended.
```

## Deterministic fallback

Always implement this for when AI fails or times out:

```typescript
export function deterministicExplanation(tokens: ExplanationTokens): string {
  if (tokens.matchedPeople.length > 0) {
    return `Recommended because it features ${tokens.matchedPeople[0]}, who you enjoy.`
  }
  if (tokens.matchedGenres.length > 0) {
    return `Recommended because it matches your favorite genres: ${tokens.matchedGenres.join(', ')}.`
  }
  return 'Recommended based on your watch history.'
}
```

## Cache key

```typescript
const cacheKey = `explanation:${userId}:${titleId}:${recsVersion}`
// TTL: 1–7 days
```
