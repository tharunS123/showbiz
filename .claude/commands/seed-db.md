---
description: Seed the local database with test users, list items, and interaction events for development and testing.
---

Seed the local Showbiz database for development.

## Steps

1. **Check Prisma is set up**:
   ```bash
   pnpm prisma migrate status
   ```
   If migrations are pending, run them first:
   ```bash
   pnpm prisma migrate dev
   ```

2. **Create or update `prisma/seed.ts`** with:
   - 2–3 test users (no real emails — use `test-user-1@example.com` etc.)
   - 5–10 list items per user (mix of movie + tv, mix of watchlist / favorites / seen)
   - 20–50 interaction events per user (view_title, search_click, rec_click, favorite, add_watchlist)
   - Use real TMDb externalIds so catalog lookups work in dev (e.g. movie 550 = Fight Club, tv 1399 = Game of Thrones)

3. **Run the seed**:
   ```bash
   pnpm prisma db seed
   ```

4. **Verify in Prisma Studio**:
   ```bash
   pnpm prisma studio
   ```

5. **Report**: how many rows were inserted into each table.

## Seed data reference (real TMDb IDs)
```
Movies: 550 (Fight Club), 27205 (Inception), 155 (Dark Knight), 680 (Pulp Fiction), 13 (Forrest Gump)
TV:     1399 (Game of Thrones), 1396 (Breaking Bad), 66732 (Stranger Things), 1418 (Big Bang Theory)
```
