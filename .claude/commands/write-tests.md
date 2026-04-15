---
description: Write unit and integration tests for a file or feature. Pass the file path or feature name as the argument.
---

Write tests for: **$ARGUMENTS**

## Strategy

1. **Identify what to test** from $ARGUMENTS — is this a utility, a catalog adapter function, an API route, a React component, or the recs engine?

2. **Choose the right test type**:
   - Pure functions (normalizers, scoring, utilities) → **unit test** with Vitest
   - API routes → **integration test** with mocked TMDb using `msw`
   - React components → **component test** with `@testing-library/react` (only for complex interactive components)
   - DB helpers → **integration test** with a test database or mocked Prisma client

3. **Test file location**:
   - Unit: `tests/unit/{module-name}.test.ts`
   - Integration: `tests/integration/{feature-name}.test.ts`
   - Component: `tests/components/{component-name}.test.tsx`

4. **Required test cases** for each type:

   ### API route tests
   ```typescript
   describe('POST /api/list', () => {
     it('adds a list item for authenticated user')
     it('returns 401 for unauthenticated request')
     it('returns 400 for invalid mediaType')
     it('returns 400 for missing externalId')
     it('is idempotent — adding the same item twice succeeds')
   })
   ```

   ### Catalog normalizer tests
   ```typescript
   describe('normalizeMovie', () => {
     it('maps TMDb fields to internal Title shape')
     it('handles missing release_date gracefully (year: null)')
     it('handles missing overview (empty string)')
     it('extracts YouTube trailer key from videos array')
     it('returns null trailerKey when no trailer found')
   })
   ```

   ### Recs scoring tests
   ```typescript
   describe('scoreCandidate', () => {
     it('returns -Infinity for already-seen title')
     it('scores genre overlap higher than no overlap')
     it('boosts score for matching cast/crew')
     it('applies diversity penalty for recently recommended titles')
   })
   ```

5. **Run the tests**:
   ```bash
   pnpm test $ARGUMENTS
   ```

6. **Report**: count of tests written, all passing, any edge cases you could not cover and why.
