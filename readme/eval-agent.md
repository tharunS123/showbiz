# eval-agent.md (Automated Evaluation & CI Rubric)

**Last updated:** 2025-12-16

This is the checklist and rubric for automated evaluation of the Showbiz project.

## 1) Required CI checks

### 1.1 Code quality
- ✅ Typecheck (TypeScript)
- ✅ Lint (ESLint)
- ✅ Format (Prettier) or consistent style

### 1.2 Tests
- ✅ Unit tests (utilities, ranking logic, DB helpers)
- ✅ Integration tests (API routes with mocked provider)
- ✅ Snapshot tests optional (avoid brittle UI snapshots)

### 1.3 Security checks
- ✅ Dependency vulnerability scan (e.g., npm audit / Snyk)
- ✅ Secrets scan (prevent committing `.env` keys)
- ✅ Basic headers check (CSP/HSTS in prod config)

### 1.4 Performance checks (budgets)
- ✅ Build passes without warnings treated as errors (configurable)
- ✅ Lighthouse baseline on key pages in CI (optional but recommended)

## 2) Contract tests (API)

### 2.1 Provider adapter contract
Mock provider responses and ensure:
- `getMovie(id)` returns normalized shape
- `getTv(id)` returns normalized shape
- `search(query)` returns stable minimal fields
- `getCredits(id)` includes cast/crew arrays

### 2.2 App API contract (your backend)
- `POST /api/list` add item
- `DELETE /api/list` remove item
- `GET /api/list?type=watchlist`
- `POST /api/interaction` event ingest
- `GET /api/recs` returns ranked list

All must:
- validate inputs
- enforce auth where needed
- return consistent errors (400/401/429/500)

## 3) Recommendation evaluation (offline)

### 3.1 Metrics (MVP-friendly)
- Precision@K (for users with enough history)
- Recall@K (optional)
- Coverage (diversity of genres/people)
- Novelty (avoid recommending only the same franchise)

### 3.2 A/B gating (optional)
Use `RECS_MODE` flag:
- `rules` vs `embeddings`
Run offline evaluation and require:
- no regression in Precision@10
- no major drop in coverage/diversity

## 4) Accessibility checks (automated)
- Run a11y scanner on:
  - home
  - search results
  - detail page
  - lists
Minimal requirements:
- alt text for meaningful images
- correct heading structure
- buttons have labels

## 5) Release candidate criteria (agent-enforced)
A build is **eligible for release** when:
- all required checks pass
- no high/critical vulnerabilities
- provider call rate is within configured quotas (simulated or measured)
