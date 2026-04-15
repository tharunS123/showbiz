---
description: Create and apply a new Prisma database migration. Pass a short description of the change as the argument, e.g. "add-ratings-column" or "create-list-items-table".
---

Create a new Supabase Database migration for Showbiz: **$ARGUMENTS**

## Steps

1. **Read the current schema** to understand what already exists:
   ```bash
   cat supabase/schema.prisma
   ```

2. **Make the schema change** in `supabase/schema.sql`:
   - Follow the canonical schema in `.claude/skills/db-schema/SKILL.md`
   - Use `cuid()` for all IDs
   - Add `@@index` for any field used in `WHERE` or `ORDER BY` clauses
   - Keep enum values lowercase and snake_case

3. **Generate and apply the migration**:
   ```bash
   pnpm prisma migrate dev --name $ARGUMENTS
   ```

4. **Regenerate the Prisma client**:
   ```bash
   pnpm prisma generate
   ```

5. **Run typecheck** to confirm the new client types are valid:
   ```bash
   pnpm typecheck
   ```

6. **Report**:
   - Migration file created at `prisma/migrations/.../migration.sql`
   - Tables/columns added or modified
   - Any DB helpers in `lib/db/` that need to be updated to use the new fields
