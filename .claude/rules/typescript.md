# TypeScript & Code Quality Rules

These rules apply to all TypeScript/TSX files in the project.

## TypeScript
- Strict mode is enabled — never use `any`, use `unknown` and narrow it
- All function parameters and return types must be explicitly typed
- Use `satisfies` operator for object literals where type inference is needed
- Prefer `type` over `interface` for object shapes; use `interface` only for extendable contracts
- Zod schemas are the source of truth for runtime validation; derive TypeScript types from them: `type Input = z.infer<typeof InputSchema>`

## Imports
- Use `@/` path aliases (configured in `tsconfig.json`) — no relative `../../` imports
- Group imports: (1) React/Next.js, (2) third-party, (3) internal `@/lib`, (4) internal `@/components`
- No barrel exports (`index.ts`) inside `lib/` — import from the specific file

## Error handling
- Use typed error classes: `CatalogError`, `ValidationError`, `AuthError` — not plain `new Error('string')`
- Always handle the case where a catalog fetch returns `null` (title not found)
- Never swallow errors silently; either rethrow or log and return a typed error response

## Async patterns
- Use `async/await` consistently — no `.then()/.catch()` chains
- Use `Promise.all()` for independent parallel fetches (e.g., fetching detail + credits simultaneously)
- Wrap external API calls in try/catch and handle `CatalogError` explicitly

## Constants
- All TMDb endpoint paths live in `lib/catalog/endpoints.ts` — no hardcoded URLs elsewhere
- All cache TTL values live in `lib/cache/ttl.ts` — no magic numbers
- All event type strings live in `lib/events/types.ts`
