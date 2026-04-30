# AGENTS.md

This file captures non-obvious facts about vintrace-sdk that an agent is likely to miss without guidance.

## Commands

```bash
pnpm build                       # Build ESM + CJS with tsup
pnpm dev                         # Watch mode
pnpm typecheck                   # tsc --noEmit (src/ only, excludes tests + generated.ts)
pnpm lint                        # ESLint on src/ only (not tests/)
pnpm format                      # Prettier on src/**/*.ts (not tests/)
pnpm test                        # Vitest watch mode
pnpm test run                    # Vitest single run
pnpm test -- tests/path/file.ts  # Run single test file
pnpm generate-types              # openapi-typescript from v7 YAML → src/types/generated.ts
```

## Pre-commit order (format → lint → typecheck → build)

`pnpm format` only touches `src/` files. `pnpm typecheck` excludes `tests/` and `src/types/generated.ts`. Build output goes to `dist/`.

## Architecture

- **All API clients live in a single file**: `src/client/VintraceClient.ts` (2724 lines). Private classes like `WorkOrdersClient`, `SalesOrdersClient`, etc. are defined there, exposed through `VintraceV6Api` / `VintraceV7Api` getters. Do NOT add files to `src/api/v6/` or `src/api/v7/` — those directories are empty/unused.
- **Entrypoint**: `src/index.ts` re-exports `VintraceClient`, error classes, utility functions, and param/type interfaces.
- **Validation**: Zod schemas in `src/validation/schemas.ts`. `validateRequest()` and `validateResponse()` live in `src/validation/index.ts` along with the `z` re-export.
- **Generated types**: `src/types/generated.ts` — auto-generated, DO NOT EDIT.
- **Error hierarchy**: `VintraceError` base class with `status`, `correlationId`, `body`. Subclasses: `VintraceAuthenticationError` (401), `VintraceNotFoundError` (404), `VintraceRateLimitError` (429, has `retryAfter`), `VintraceValidationError` (400/422), `VintraceServerError` (500+), `VintraceAggregateError` (batch operations).
- **Batch helper**: `batchFetch()` in `src/client/utils.ts` — use instead of writing inline `Promise.allSettled` loops.

## Result tuple convention

Every API method returns `[data, error]` — never throws:

```typescript
const [order, error] = await client.v6.workOrders.get('123');
if (error) return;
```

`VintraceResult<T>` = `[data: T, error: null] | [data: null, error: VintraceError] | [data: null, error: null]`.

## Key method patterns

- List endpoints `getAll()` return full array via result tuple after auto-paginating internally. They are NOT async generators — DO NOT use `for await` on them.
- `getMany(ids)` uses `batchFetch()` from `utils.ts` returning `VintraceAggregateError` on partial failure.
- `create(data)` → POST. `update(id, data)` → PUT. `updateFields(data)` → POST to a different endpoint. `patch(id, data)` → PATCH.
- Some modules have extra methods: `workOrders.getByCode()`, `parties.getByName()`, `salesOrders.getByCode()`, `workOrders.assign()`, `workOrders.submit()`.
- `ProductAnalysisClient` and `ProductJobsClient` are separate from `ProductsClient` — they use numeric product IDs.

## Tests

- **Unit tests** in `tests/unit/` mock `fetch` via `vi.stubGlobal`.
- **Integration tests** in `tests/integration/` require `.env` with `VINTRACE_BASE_URL`, `VINTRACE_ORG`, `VINTRACE_TOKEN`. Run: `npx vitest run tests/integration/real.integration.test.ts --env-file=.env`. They are read-only (GET only).
- **Fixtures** in `tests/fixtures/`.

## Prettier quirks

Config in `.prettierrc`: `arrowParens: "always"`, `endOfLine: "lf"` (relevant on Windows where git may convert to CRLF), no `.prettierignore` — format only runs on `src/**/*.ts`.

## Config notes

- Node >= 18 (engines field)
- `tsconfig.json`: `rootDir: "./src"`, `outDir: "./dist"`, `strict: true`, excludes `tests/` and `generated.ts`
- `eslint.config.js`: only lints `src/`, ignores `dist/`, `node_modules/`, `*.cjs`, `generated.ts`
- `tsup.config.ts`: entry `src/index.ts`, formats `['esm', 'cjs']`, `dts: true`, `sourcemap: true`, `clean: true`
- `.gitignore` includes `scratch.ts` (handy scratchpad file) and `nul` (Windows quirk). `dist/` is always rebuilt, never committed.
