# Showbiz Infrastructure Rider PRD

**Purpose:** Define the operational and infrastructure requirements so the product is reliable, secure, and cost-aware.

**Last updated:** 2025-12-16

## 1. Deployment model

### Recommended (simple)
- **Vercel** (Next.js app: frontend + API routes)
- **Postgres** (Neon/Supabase/Render)
- Optional: **Redis** (Upstash/Redis Cloud) for shared cache & rate limiting

### Alternative (split services)
- Frontend: Vercel/Netlify
- Backend: Dockerized API on Render/Fly.io
- DB: managed Postgres
- Cache: Redis

## 2. Environments

- `dev` — local development
- `staging` — preview deployments + integration testing
- `prod` — production

All environments must have separate:
- API keys / secrets
- databases
- cache namespaces

## 3. Secrets & configuration

### Secrets
- Provider API key(s)
- Auth secret
- OAuth client secrets
- Database credentials
- Redis credentials (if used)

### Policies
- Never expose provider keys to the browser.
- Rotate secrets on compromise.
- Store secrets via platform secret manager (Vercel env vars, etc.).

## 4. Rate limiting & abuse protection

### Goals
- Protect provider quotas
- Prevent scraping/abuse on public endpoints
- Keep latencies stable

### Approach (MVP)
- Per-IP rate limit on search endpoints
- Per-user rate limit on list mutation endpoints
- Backoff + cached results on provider errors

### Implementation
- If Redis is present: token bucket / sliding window in Redis
- Without Redis: best-effort in-memory limits (dev only)

## 5. Caching policy

### What to cache (server-side)
- Trending/popular/top rated: 1–6 hours
- Movie/TV detail: 1–7 days
- Credits (cast/crew): 1–7 days
- Person detail/filmography: 1–7 days
- Search results: short TTL (5–30 minutes) to avoid stale relevance

### Where to cache
- Start: Next fetch cache / platform cache
- Upgrade: Redis as shared cache across server instances
- Optional: DB-backed cache table for persistent caching

### Cache invalidation
- TTL-based; do not attempt deep invalidation for MVP

## 6. Observability

### Logging
- Structured JSON logs
- Include request id, route, duration, provider status, cache hit/miss

### Error tracking
- Capture unhandled exceptions in server and client
- Tag by environment and release

### Metrics (basic)
- Requests per route
- Provider calls per route (and error rate)
- Cache hit rate
- P95 latency

## 7. Security requirements

- Enforce HTTPS in prod
- Set secure headers (CSP, HSTS, X-Content-Type-Options, etc.)
- Validate and sanitize query parameters
- Protect against SSRF: only allow known provider base URLs
- Protect against prompt injection for AI features (see `ai_prompting_context.md`)
- Use least privilege DB user where possible

## 8. Data privacy & retention

### Stored data (MVP)
- User id, email (if required by auth)
- List items
- Interaction events (for recommendations)

### Retention
- Interactions: keep 90–365 days (configurable)
- Support user data deletion:
  - delete all list items and interactions for the user

### PII
- Avoid storing raw search queries tied to user if not needed; if stored, retain short and redact.

## 9. Backups & recovery

- Managed Postgres backups enabled
- Restore drills (staging restore) at least monthly when project matures
- RPO/RTO (targets)
  - MVP: RPO 24h, RTO 24h

## 10. CI/CD

### CI checks (PR)
- Typecheck
- Lint
- Unit tests
- API contract tests (mock provider)
- Security scan (dependencies)

### CD
- Auto-deploy to staging on merge
- Manual promote to prod (or protected branch)

## 11. Cost guardrails

- Avoid catalog ingestion into DB
- Cache aggressively
- Use pagination and image CDNs (provider images)
- Limit AI usage:
  - only generate explanations on click
  - cache generated explanation per user/title for TTL
