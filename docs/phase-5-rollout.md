# Phase 5 Rollout Guide

This guide is the production release runbook for Phase 5 work.

## 1) Pre-Deploy Checklist

- Ensure environment variables are set in target environment:
  - `TMDB_API_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `CLERK_WEBHOOK_SECRET`
  - `UPSTASH_REDIS_REST_URL` (optional but recommended)
  - `UPSTASH_REDIS_REST_TOKEN` (optional but recommended)
  - `ADMIN_EMAILS` (required for admin dashboard access)
  - `CRON_SECRET` (required for cron endpoint protection)
- Confirm Supabase schema includes:
  - `list_items.rating`
  - `list_items.note`
  - `custom_lists`, `custom_list_items`, `user_preferences`
  - `release_checks`, `user_notifications`
- Run verification locally:
  - `pnpm lint`
  - `pnpm test`
  - `pnpm build`

## 2) Deploy Sequence

1. Deploy to staging.
2. Run smoke suite against staging:
   - `SMOKE_BASE_URL=https://<staging-domain> pnpm smoke`
3. Run manual checks:
   - Custom lists create/read/update/delete
   - Discover mood query
   - Preferences save/load
   - Notifications read/dismiss
   - Admin dashboard access for admin users
4. Verify cron route:
   - `GET /api/cron/check-releases` with `Authorization: Bearer <CRON_SECRET>`
5. Promote to production.

## 3) Post-Deploy Verification

- Run smoke suite against production:
  - `SMOKE_BASE_URL=https://<prod-domain> pnpm smoke`
- Validate health endpoints:
  - `/api/health`
  - `/api/health/dependencies`
- Validate recommendation path:
  - `/api/recs` for an authenticated user
- Validate error/alert plumbing:
  - Confirm alert webhook receives test error events (if configured)

## 4) Rollback Triggers

Rollback immediately if any of the following occur:

- `api/health/dependencies` reports `down`
- Rec endpoint hard-fails for authenticated users
- Notification cron endpoint fails repeatedly
- Custom list mutations fail consistently

## 5) Rollback Steps

1. Revert deployment to previous stable version.
2. Disable cron checks temporarily if they are causing cascading failures.
3. Re-run smoke and health checks on reverted deployment.
4. Open incident note with:
   - timeframe
   - failed checks
   - affected endpoints
   - next mitigation actions
