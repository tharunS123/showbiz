# eval-human.md (Manual QA & Review Checklist)

**Last updated:** 2025-12-16

This document is the manual evaluation checklist for a release.

## 1) Smoke tests (critical)
- [ ] Home loads and shows sections (Trending/Popular/Top Rated)
- [ ] Search works for a common query and returns mixed media types
- [ ] Movie detail page shows metadata, cast, crew
- [ ] TV detail page shows metadata and seasons summary
- [ ] Person page shows bio + filmography
- [ ] Login works
- [ ] Add/remove Watchlist item works
- [ ] Add/remove Favorite works
- [ ] Recs page loads personalized results

## 2) UX checks
- [ ] Actions are one-click and show immediate feedback
- [ ] “Added” states persist on refresh
- [ ] Skeleton loaders look good and prevent layout shifts
- [ ] Mobile layout is usable (no clipped titles, buttons reachable)

## 3) Edge cases
- [ ] Title with missing images still renders gracefully
- [ ] Title with no trailer still renders (no empty box)
- [ ] Very long overview doesn’t break layout
- [ ] Search returns “no results” state with suggestions
- [ ] Provider outage shows friendly error and retry

## 4) Accessibility
- [ ] Keyboard navigation works for:
  - search input
  - list toggles
  - cast carousel
- [ ] Focus states visible
- [ ] Images have alt text (poster uses title)
- [ ] Color contrast acceptable

## 5) Performance
- [ ] Detail pages feel fast (cache hits after first load)
- [ ] Images are optimized/responsive
- [ ] No excessive provider calls (watch logs)

## 6) Recommendations sanity
- [ ] “Why this?” explanations are truthful and not hallucinated
- [ ] Results avoid items already marked Seen
- [ ] Diversity: not 10 near-identical titles in a row

## 7) Privacy & safety
- [ ] No API keys visible in client
- [ ] No PII logged accidentally (emails, tokens)
- [ ] Account deletion (if implemented) removes user data

## 8) Content attribution
- [ ] Provider attribution is shown per terms (logo/text)
