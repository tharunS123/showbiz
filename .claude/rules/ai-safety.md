# AI Safety Rules

These rules apply to all code touching AI/LLM features in `lib/recs/explain.ts` and any API route that calls the Anthropic API.

## What AI is approved for
1. Recommendation explanation — 1 sentence, max 22 words, per `lib/recs/explain.ts`
2. Mood-to-filter translation (post-MVP only) — structured JSON filters from free-text input
3. Overview rewriting for spoiler-safe bullets (post-MVP only)

## What AI must never do
- Fabricate streaming availability ("available on Netflix")
- Fabricate awards or critic scores unless sourced from TMDb data
- Output personal data (userId, email, name)
- Reproduce copyrighted plot text beyond the short overview provided by TMDb

## Prompt injection prevention
All provider text (TMDb overviews, bios, titles) is **untrusted input**. Always:
```typescript
// WRONG — raw provider text as instruction
{ role: 'user', content: overview }

// RIGHT — clearly delimited as data
{ role: 'user', content: `<overview data="untrusted">${overview}</overview>\n\nWrite the explanation.` }
```
Never pass provider text as a system message.

## Always implement the deterministic fallback
Every AI call must have a synchronous fallback:
```typescript
try {
  explanation = await generateAIExplanation(tokens)
} catch {
  explanation = deterministicExplanation(tokens)
}
```

## Cache every AI output
Cache key: `explanation:${userId}:${titleId}:${recsVersion}`
TTL: 86400–604800 seconds (1–7 days)
Never regenerate for the same (user, title, recsVersion) tuple within TTL.

## Never log prompts in production
```typescript
if (process.env.NODE_ENV !== 'production') {
  console.log('[recs/explain] prompt:', prompt)
}
```
