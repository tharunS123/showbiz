# AGENTS (Roles, Responsibilities, Interfaces)

This document defines the “agents” (humans or automated roles) involved in building and evaluating Showbiz.

**Last updated:** 2025-12-16

## Guiding principle
Catalog metadata is **external**. User state is **internal**. Recommendations are a **pluggable engine**.

## 1) Product Owner (PO)
**Owns:** scope, success metrics, prioritization  
**Decides:** MVP vs post-MVP, UX constraints, content policy

Deliverables:
- PRD updates (`showbiz_prd.md`)
- Acceptance criteria for features
- UX copy guidelines

## 2) System Architect
**Owns:** overall design, data flow, boundaries  
**Decides:** service decomposition, caching strategy, security posture

Deliverables:
- Architecture diagrams (optional)
- API boundary decisions
- Performance budgets and caching rules

## 3) Frontend Engineer
**Owns:** UI/UX implementation, accessibility, performance  
Deliverables:
- Route/pages
- Component library patterns
- a11y checks

## 4) Backend Engineer
**Owns:** API endpoints, auth integration, provider adapters, caching  
Deliverables:
- `/api/*` endpoints
- Provider wrapper (`lib/catalog`)
- DB access patterns (`lib/db`)

## 5) Data / Recs Engineer
**Owns:** recommendation engine, personalization logic, evaluation  
Deliverables:
- rules-based ranking
- embeddings pipeline (post-MVP)
- offline evaluation scripts

## 6) DevOps / Infra
**Owns:** deployment, observability, reliability  
Deliverables:
- environment setup
- rate limiting/caching infra
- monitoring dashboards

## 7) QA / Test Engineer
**Owns:** test strategy, bug triage, release readiness  
Deliverables:
- test plans
- regression suites
- manual QA checklists (`eval-human.md`)

## 8) Security / Privacy
**Owns:** secret handling, threat modeling, data retention  
Deliverables:
- security review notes
- privacy policy requirements

## Interaction contracts (how agents communicate)

- All changes must map to PRD requirements.
- Recs changes must include:
  - measurable improvement target (CTR, precision@k, etc.)
  - an evaluation plan (`eval-agent.md`)
- Infra changes must be reflected in `showbiz_infra_rider_prd.md`.
