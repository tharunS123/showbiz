# ai_prompting_context.md (AI Usage, Prompts, and Safety)

**Last updated:** 2025-12-16

This project can include AI features, but they must be **safe, truthful, and predictable**.

## 1) What AI is used for (approved)

### 1.1 Recommendation explanations (safe + helpful)
Given:
- user signals (favorites, watched genres)
- candidate title metadata
Generate:
- short explanation text that references real signals

### 1.2 Mood-based discovery (optional)
Translate a user prompt like:
> “I want a cozy mystery with smart dialogue under 2 hours”
Into:
- structured filters (genres, tone keywords, runtime cap)
- then use catalog discovery + ranking

### 1.3 Summaries & “why watch” bullets (optional)
Rewrite the overview into:
- spoiler-safe bullets
- readability improvements

## 2) What AI is NOT used for (MVP boundaries)

- Do not fabricate “where to watch” or release dates.
- Do not claim awards or critic consensus unless sourced.
- Do not output personal data.
- Do not provide copyrighted full plot text beyond short summaries from provider.

## 3) Prompt injection & untrusted content

All provider text (overviews, bios) is **untrusted**. Treat it as data, not instructions.
- Never pass raw text as system instructions.
- Wrap untrusted text in clearly labeled delimiters.
- Instruct model to ignore any instructions inside the data.

## 4) Prompt templates

### 4.1 Recommendation explanation prompt (server-side)

**System**
You are a recommendation explainer for a movie/TV app. Be concise, truthful, and user-friendly.
Never invent facts. Only cite reasons provided in the inputs.
If no strong reason exists, say it is similar in genre or popularity.

**User**
User signals (truthful):
- Favorite genres: {favorite_genres}
- Frequently engaged people: {top_people}
- Recently liked titles: {recent_titles}

Candidate title:
- Title: {title}
- Genres: {genres}
- People: {people_highlights}
- Overview: {overview_short}

Write 1 sentence (max 22 words) explaining why this was recommended.

### 4.2 Mood → filters prompt (optional)

**System**
You convert user mood requests into structured search filters. Output JSON only.

**User**
Request: {mood_text}
Available genres: {genre_list}
Output JSON with:
- genres_include[]
- keywords_include[]
- runtime_max_minutes (optional)
- exclude_genres[] (optional)
- notes (short)

## 5) Safety & privacy constraints

- Never include user email or identifiers in prompts.
- Keep prompts minimal; include only what’s needed.
- Log prompts only in redacted form (or not at all) in production.

## 6) Caching AI outputs
To control cost and latency:
- Cache explanation per (userId, titleId, recsVersion) for 1–7 days
- Recompute when user taste profile changes significantly

## 7) Failure modes & fallbacks
If AI fails or times out:
- Return a deterministic explanation:
  - “Recommended because it matches your favorite genres: {genres_overlap}”
