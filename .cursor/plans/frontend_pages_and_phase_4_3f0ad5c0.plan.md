---
name: Frontend Pages and Phase 4
overview: Build the missing frontend pages for Phase 3 backend features (custom lists, mood discovery, settings/preferences, notifications), add watch providers to TV detail, implement the ratings/notes UI, then tackle Phase 4 (Redis cache, analytics dashboard, ratings feeding into recs).
todos:
  - id: a1-custom-lists-ui
    content: "Custom Lists: API routes + list management pages + add-to-list on detail pages"
    status: completed
  - id: a2-mood-discovery
    content: "Mood Discovery: /discover page with mood search input and results grid"
    status: completed
  - id: a3-settings-page
    content: "Settings/Preferences: /settings page with genre exclusion, content rating, spoiler toggle"
    status: completed
  - id: a4-notifications
    content: "Notifications: DB helpers, API route, /notifications page, navbar bell icon"
    status: completed
  - id: a5-tv-watch-providers
    content: "TV Detail: Add watch providers (mirror movie detail pattern)"
    status: completed
  - id: a6-ratings-notes-ui
    content: "Ratings and Notes: API endpoint, star rating component, note editor, display on lists page"
    status: completed
  - id: b1-redis-cache
    content: "Redis shared cache: client wrapper, migrate TMDb caching and rate limiting"
    status: completed
  - id: b2-analytics-dashboard
    content: "Analytics dashboard: admin page with event counts, DAU, rec CTR, list depth metrics"
    status: completed
  - id: b3-ratings-in-recs
    content: "Ratings in recs: wire user ratings into signals, scoring, and embedding weights"
    status: completed
isProject: false
---

# Frontend Pages + Phase 4: Scale and Mature

All Phase 3 backend features are complete but several lack frontend pages. This plan adds those pages first, then implements Phase 4.

---

## Part A: Frontend Pages for Existing Backend Features

### A1. Custom Lists UI

The DB helpers ([lib/db/custom-lists.ts](lib/db/custom-lists.ts)) and schema ([supabase/002_custom_lists_and_providers.sql](supabase/002_custom_lists_and_providers.sql)) are done. No pages or API routes exist for custom lists yet.

**New files:**
- `app/api/custom-lists/route.ts` -- GET (user's lists) and POST (create list). Uses Clerk auth + Zod validation.
- `app/api/custom-lists/[listId]/route.ts` -- GET (list details + items), PUT (update), DELETE.
- `app/api/custom-lists/[listId]/items/route.ts` -- POST (add item), DELETE (remove item).
- `app/lists/custom/page.tsx` -- Server component displaying all user custom lists with a "Create New List" form.
- `app/lists/custom/[slug]/page.tsx` -- Public/private list view showing items in order; owner gets edit controls.
- `components/custom-list-form.tsx` -- Client component for creating/editing a list (name, description, public toggle).
- `components/add-to-custom-list.tsx` -- Dropdown/popover on title detail pages to add the current title to any custom list.

**Changes to existing files:**
- `app/lists/page.tsx` -- Add a "Custom Lists" section below Seen, linking to `/lists/custom`.
- `app/movie/[id]/page.tsx` and `app/tv/[id]/page.tsx` -- Add the `AddToCustomList` component alongside `ListToggleButtons`.
- `middleware.ts` -- Add `/api/custom-lists(.*)` to protected routes.

### A2. Mood Discovery Page

Backend exists at `GET /api/mood?q=` ([app/api/mood/route.ts](app/api/mood/route.ts)). No frontend page yet.

**New files:**
- `app/discover/page.tsx` -- Server component with a client-side mood input form. Displays results as a `TitleGrid`.
- `app/discover/loading.tsx` -- Skeleton loader.
- `components/mood-search.tsx` -- Client component: text input, debounced fetch to `/api/mood?q=`, renders results.

**Changes to existing files:**
- `components/navbar.tsx` -- Add "Discover" link to the navigation.

### A3. Settings / Preferences Page

Backend exists at `GET/PUT /api/preferences` ([app/api/preferences/route.ts](app/api/preferences/route.ts)). No frontend page yet.

**New files:**
- `app/settings/page.tsx` -- Authenticated settings page with sections for genre exclusion, content rating, and spoiler toggle.
- `app/settings/loading.tsx` -- Skeleton loader.
- `components/preferences-form.tsx` -- Client component: fetches current preferences, renders checkboxes for genre exclusion (using TMDb genre list), a dropdown for max content rating, a toggle for spoiler hiding. Saves via `PUT /api/preferences`.

**Changes to existing files:**
- `components/navbar.tsx` -- Add "Settings" link (or gear icon) visible when signed in.
- `middleware.ts` -- Add `/settings(.*)` to protected routes.

### A4. Notifications Inbox

Backend generates notifications via cron ([app/api/cron/check-releases/route.ts](app/api/cron/check-releases/route.ts)) into `user_notifications` table ([supabase/003_release_checks.sql](supabase/003_release_checks.sql)). No API to read/dismiss notifications and no UI.

**New files:**
- `lib/db/notifications.ts` -- DB helpers: `getUserNotifications(userId)`, `markNotificationRead(id)`, `dismissNotification(id)`.
- `app/api/notifications/route.ts` -- GET (list unread), PATCH (mark read/dismiss).
- `app/notifications/page.tsx` -- Authenticated page listing notifications with dismiss and "go to show" actions.
- `app/notifications/loading.tsx` -- Skeleton loader.
- `components/notification-bell.tsx` -- Navbar icon with unread count badge; links to `/notifications`.

**Changes to existing files:**
- `components/navbar.tsx` -- Add notification bell next to user avatar.
- `middleware.ts` -- Add `/api/notifications(.*)` and `/notifications(.*)` to protected routes.

### A5. Watch Providers on TV Detail Page

Movie detail already shows watch providers ([app/movie/[id]/page.tsx](app/movie/[id]/page.tsx)). TV detail ([app/tv/[id]/page.tsx](app/tv/[id]/page.tsx)) does not.

**Changes to existing file:**
- `app/tv/[id]/page.tsx` -- Import `getWatchProviders` and `WatchProviders` component. Add to the `Promise.all` fetch and render below genre chips, mirroring the movie detail layout.

### A6. Ratings and Notes UI

The `list_items` table already has `rating` and `note` columns (from migration 002). No UI to set them.

**New files:**
- `app/api/list/rate/route.ts` -- PUT endpoint to update rating/note on a list item.
- `components/rating-stars.tsx` -- Client component: 1-5 star interactive rating with current value display.
- `components/note-editor.tsx` -- Client component: inline text area for personal notes, saves on blur/enter.

**Changes to existing files:**
- `app/lists/page.tsx` -- Show star rating and note snippet under each list item.
- `lib/db/list.ts` -- Add `updateListItemRating(userId, externalId, mediaType, listType, rating, note)` helper.
- Detail pages (movie/tv) -- Show the user's rating if they've rated the title.

---

## Part B: Phase 4 -- Scale and Mature

### B1. Redis Shared Cache

Replace in-memory caching with Redis for cross-instance consistency.

**New files:**
- `lib/cache/redis.ts` -- Redis client wrapper (using `ioredis` or `@upstash/redis`). Exports `cacheGet`, `cacheSet`, `cacheDel` with TTL support.
- `lib/rate-limit-redis.ts` -- Redis-backed token bucket rate limiter replacing the in-memory one.

**Changes to existing files:**
- `lib/catalog/client.ts` -- Use Redis cache for TMDb responses instead of Next.js fetch cache.
- `lib/rate-limit.ts` -- Add a factory that returns Redis limiter if `REDIS_URL` is set, else falls back to in-memory.
- `package.json` -- Add `ioredis` or `@upstash/redis` dependency.
- `.env.example` -- Add `REDIS_URL`.

### B2. Analytics Dashboard

Build an internal dashboard for tracking engagement and rec quality.

**New files:**
- `app/admin/dashboard/page.tsx` -- Server-rendered dashboard page (protected by admin check).
- `lib/db/analytics.ts` -- Query helpers: event counts by type, daily active users, rec CTR, list depth averages.
- `components/admin/metric-card.tsx` -- Card component displaying a metric with label, value, and trend.
- `components/admin/chart.tsx` -- Simple bar/line chart component (using a lightweight library like `recharts` or pure SVG).

**Changes to existing files:**
- `middleware.ts` -- Protect `/admin(.*)` routes (check for admin role or specific Clerk metadata).
- `package.json` -- Add `recharts` (or similar lightweight charting lib).

### B3. Ratings Feeding into Recommendations

Wire user ratings into the recommendation scoring.

**Changes to existing files:**
- `lib/recs/signals.ts` -- Include rated items and their ratings in the user signal profile.
- `lib/recs/score.ts` -- Boost score for candidates similar to highly-rated items; penalize candidates similar to low-rated items.
- `lib/recs/embeddings.ts` -- Weight the user profile vector by ratings (5-star items contribute more).

---

## Data Flow Overview

```mermaid
flowchart TD
    subgraph frontend [Frontend Pages]
        CustomListsPage["Custom Lists Page"]
        MoodPage["Mood Discovery Page"]
        SettingsPage["Settings Page"]
        NotificationsPage["Notifications Page"]
        RatingUI["Rating Stars + Notes"]
        AdminDash["Admin Dashboard"]
    end

    subgraph api [API Routes]
        CustomListsAPI["POST/GET /api/custom-lists"]
        MoodAPI["GET /api/mood"]
        PrefsAPI["GET/PUT /api/preferences"]
        NotifsAPI["GET/PATCH /api/notifications"]
        RateAPI["PUT /api/list/rate"]
        RecsAPI["GET /api/recs"]
    end

    subgraph backend [Backend Services]
        DB["Supabase DB"]
        Redis["Redis Cache"]
        TMDb["TMDb API"]
        RecsEngine["Recs Engine"]
    end

    CustomListsPage --> CustomListsAPI
    MoodPage --> MoodAPI
    SettingsPage --> PrefsAPI
    NotificationsPage --> NotifsAPI
    RatingUI --> RateAPI
    AdminDash --> DB

    CustomListsAPI --> DB
    MoodAPI --> TMDb
    PrefsAPI --> DB
    NotifsAPI --> DB
    RateAPI --> DB
    RecsAPI --> RecsEngine
    RecsEngine --> DB
    RecsEngine --> TMDb
    TMDb --> Redis
