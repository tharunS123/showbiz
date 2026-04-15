---
description: Scaffold a new Showbiz page (movie detail, TV detail, person, search, home). Pass the page name as an argument.
---

Scaffold a complete new page for Showbiz: **$ARGUMENTS**

## Steps to follow

1. **Identify the page type** from $ARGUMENTS (movie-detail | tv-detail | person | search | home | recs)

2. **Read the PRD spec** for this page type in `docs/showbiz_prd.md` section 5.3 to confirm required fields and layout.

3. **Create the page file** at the correct App Router path:
   - `app/movie/[id]/page.tsx` for movie detail
   - `app/tv/[id]/page.tsx` for TV detail
   - `app/person/[id]/page.tsx` for person
   - `app/search/page.tsx` for search
   - `app/(home)/page.tsx` for home
   - `app/for-you/page.tsx` for recs

4. **Page must include**:
   - Correct `generateMetadata` export for SEO
   - Server Component by default (mark `"use client"` only if required)
   - Skeleton loading state via `loading.tsx` sibling
   - Error boundary via `error.tsx` sibling
   - Graceful handling of missing images (poster/backdrop)
   - Correct TypeScript types — no `any`

5. **Wire up data fetching** through `lib/catalog/` — never call TMDb directly from the page.

6. **Apply UX rules**:
   - Genre chips for genre tags
   - Facts grid for metadata (year, runtime, rating, language)
   - Cast carousel with skeleton loader
   - One-click watchlist/favorite/seen toggle buttons

7. **Run checks**:
   ```bash
   pnpm typecheck
   pnpm lint
   ```

8. **Report back** with:
   - Files created/modified
   - Any data shape assumptions made
   - Any fields that need to be added to the catalog adapter
