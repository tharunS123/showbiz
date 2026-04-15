---
description: Run an offline evaluation of the recommendation engine. Measures precision@10, coverage, diversity, and checks for explanation hallucinations.
---

Run an offline evaluation of the Showbiz recommendation engine.

## Steps

1. **Load test users** from the DB (or seed data) — need users with at least 5 interaction events.

2. **For each test user, run the recs engine**:
   ```typescript
   import { generateRecs } from '@/lib/recs'
   const recs = await generateRecs(userId, { limit: 10 })
   ```

3. **Compute metrics**:

   ### Precision@10
   For each user, check: what fraction of top-10 recommendations match at least one of the user's favorite genres?
   Target: ≥ 0.6

   ### Coverage
   Across all users, how many distinct genres appear in recommendations?
   Target: ≥ 5 distinct genres represented

   ### Novelty
   Are recommendations dominated by a single franchise or creator? Flag if >3 of 10 results share the same director or primary cast member.

   ### Already-seen filter
   Verify zero recommendations appear in the user's `seen` list.

4. **Check 10 sample explanations**:
   For each explanation, verify:
   - [ ] References only genres, people, or titles present in user signals
   - [ ] No mention of streaming availability
   - [ ] No mention of awards or critic scores (unless in TMDb data)
   - [ ] Under 22 words
   - [ ] Grammatically correct

5. **Output report**:
   ```
   === Recs Evaluation Report ===
   Users evaluated: N
   Precision@10: X.XX (target ≥ 0.6)
   Genre coverage: N genres (target ≥ 5)
   Novelty issues: N users flagged
   Already-seen leakage: N items (must be 0)
   Explanation quality: N/10 passed

   VERDICT: PASS | FAIL
   ```

6. If FAIL, identify which component of the scoring function is causing the issue and suggest a fix.
