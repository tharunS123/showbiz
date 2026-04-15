---
description: Scaffold a new API route handler. Pass the route and HTTP method as the argument, e.g. "POST /api/list" or "GET /api/recs".
---

Scaffold a new API route handler for Showbiz: **$ARGUMENTS**

## Steps

1. **Parse the argument** to extract method (GET | POST | DELETE | PATCH) and path.

2. **Create the file** at `app/api/{path}/route.ts`.

3. **Apply the standard route handler template**:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'

// Define input schema
const InputSchema = z.object({
  // ... add fields
})

export async function METHOD(request: NextRequest) {
  // 1. Auth check (for protected routes)
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  // 2. Parse and validate input
  let input
  try {
    const body = await request.json()  // or request.nextUrl.searchParams
    input = InputSchema.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid input', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  // 3. Business logic
  try {
    // ...
  } catch (error) {
    console.error('[route-name]', error)
    return NextResponse.json({ error: 'Internal error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
```

4. **Apply the correct auth policy**:
   - Public (search, trending): no session check
   - Read-own-data (list, recs): session required, filter by `session.user.id`
   - Mutation (add/remove list item): session required + validate ownership

5. **Add rate limiting** for public endpoints:
   ```typescript
   import { rateLimit } from '@/lib/rate-limit'
   const { success } = await rateLimit(request)
   if (!success) return NextResponse.json({ error: 'Too many requests', code: 'RATE_LIMITED' }, { status: 429 })
   ```

6. **Write a test** in `tests/api/{path}.test.ts` with at least:
   - Happy path
   - Unauthenticated request (if protected)
   - Invalid input

7. **Run checks**:
   ```bash
   pnpm typecheck
   pnpm test tests/api/
   ```
