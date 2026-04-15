---
description: Run the full pre-ship checklist before opening a PR. Checks types, lint, tests, security, and accessibility basics.
---

Run the complete Showbiz pre-ship checklist for the current changes.

## 1. Automated checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm audit --audit-level=high
```

Report pass/fail for each. Stop and list all errors if any fail — do not proceed.

## 2. Secret scan
Search for potential secret leakage:
```bash
grep -r "TMDB_API_KEY" app/ components/ --include="*.ts" --include="*.tsx"
grep -r "NEXT_PUBLIC_TMDB" . --include="*.ts" --include="*.tsx" --include="*.env*"
grep -rE "(sk-|Bearer |apiKey\s*=\s*['\"])" app/ lib/ --include="*.ts"
```
Any hit = BLOCK.

## 3. Auth check
For any new or modified API route, confirm:
- Mutation routes (POST, DELETE, PATCH) check for an authenticated session
- User-specific data routes check that the session userId matches the requested resource

## 4. Catalog adapter check
Confirm any new catalog fetches:
- Use `lib/catalog/` adapter (not raw `fetch('https://api.themoviedb.org...')`)
- Have a cache TTL set
- Handle provider errors with a typed catch

## 5. Accessibility spot-check
For any new UI:
- Does every `<img>` have a meaningful `alt` attribute?
- Are interactive elements (buttons, toggles) reachable by keyboard?
- Is there a visible focus ring?

## 6. Mobile layout check
- Does the page render without horizontal scroll at 375px width?
- Are all tap targets at least 44×44px?

## Output
Produce a checklist summary:
```
✅ TypeScript
✅ Lint
✅ Tests
✅ No secrets leaked
✅ Auth enforced
✅ Catalog adapter used correctly
✅ Accessibility basics
✅ Mobile layout

VERDICT: SHIP | BLOCK
```
If BLOCK, list every issue with file and line.
