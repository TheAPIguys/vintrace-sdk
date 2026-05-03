# PRD: Wire typed schemas for BlocksClient

**Issue**: [#2](https://github.com/TheAPIguys/vintrace-sdk/issues/2)

## Problem Statement

`BlocksClient.get(id)` calls `GET /v7/harvest/blocks/{id}` — an endpoint that does not exist in the v7 OpenAPI spec. There is no single-block retrieval endpoint in v7. The only GET endpoint is the paginated list `GET /v7/harvest/blocks`. Additionally:

- `getMany(ids)` delegates to the non-existent `get(id)`, so it is also broken.
- `getAll()` is wired with `GetBlocksSuccessResponseSchema`, but the underlying `BlockDataSchema` has only 6 fields — it is missing all nested entity fields (`grower`, `vineyard`, `region`, `subRegion`, `variety`, `intendedUse`, `grading`, `fruitPlacement`) that the API actually returns.
- `post()` returns `unknown` — no response schema validation.

Consumers cannot safely access block data without type errors or runtime surprises.

## Solution

Remove the broken `get()` and `getMany()` methods. Expand `BlockDataSchema` to match the full OpenAPI `BlockData` component including all nested typed sub-schemas. Create a full `BlockSchema` for the `post()` response and wire it with a `BlockResponse` envelope. Add a typed `BlocksListParams` interface for `getAll()`.

## User Stories

1. As an SDK consumer, I want `BlocksClient.get()` removed so that I don't accidentally call a non-existent endpoint.
2. As an SDK consumer, I want `BlocksClient.getMany()` removed so that I use `getAll()` with `VintraceEntityIds` instead.
3. As an SDK consumer, I want `BlockData` to include all fields the API returns (`grower`, `vineyard`, `region`, `subRegion`, `variety`, `intendedUse`, `grading`, `fruitPlacement`, `description`, `rowNumbers`, `estate`) so that I can safely access them with autocomplete.
4. As an SDK consumer, I want nested entities (`grower`, `vineyard`, `region`, `subRegion`, `variety`, `intendedUse`) to have typed `id` and `name` fields so that I don't need to cast them.
5. As an SDK consumer, I want `fruitPlacement` to be typed with its `vintage` and `bulkStocks` array so that I can iterate over bulk stock allocations without `unknown` casts.
6. As an SDK consumer, I want `grading` to be typed with `id`, `value`, `scaleName`, and `scaleId` so that I can read grading information safely.
7. As an SDK consumer, I want `getAll()` to accept typed parameters (`include`, `vintage`, `VintraceEntityIds`) instead of `Record<string, unknown>` so that I get autocomplete and validation.
8. As an SDK consumer, I want `post()` to return a properly typed `Block` response so that I can access the created block's fields without casting.
9. As a developer, I want unit tests covering `getAll()` schema validation and `post()` response validation so that regressions are caught.
10. As a developer, I want an integration test for `getAll()` with `include=fruitPlacements&vintage=2026` to verify real API compatibility.

## Implementation Decisions

1. **Remove `get(id)` and `getMany(ids)`** — The endpoint `GET /v7/harvest/blocks/{id}` does not exist. Callers needing a single block should use `getAll({ VintraceEntityIds: id, limit: 1 })`.
2. **Expand `BlockDataSchema` to match OpenAPI `BlockData` component** — Includes `code`, `description`, `grower` (ExtIdentifiableEntity), `vineyard` (VineyardIdentifiableEntity), `region` (IdentifiableEntity), `subRegion` (IdentifiableEntity), `variety` (IdentifiableEntity), `rowNumbers`, `estate`, `intendedUse` (IdentifiableEntity), `grading` (Grading), `inactive`, `fruitPlacement` (FruitPlacement).
3. **Reuse existing common schemas** — `ExtIdentifiableEntitySchema` already exists in the codebase. Create new sub-schemas for `VineyardIdentifiableEntity` (has nested grower), `IdentifiableEntity` (id + name), `Grading`, `FruitPlacement` (vintage + bulkStocks[]), `BulkStock`, and `Volume` (value + unit).
4. **Create full `BlockSchema`** — 38 fields from the OpenAPI `Block` component for the `post()` `BlockResponse.data` envelope. Fields not commonly returned will be `.optional()`.
5. **`BlockResponseSchema`** — `z.object({ data: BlockSchema })` envelope pattern consistent with `PurchaseOrderResponseSchema`.
6. **`BlocksListParams` interface** — Typed params with `include` (string), `vintage` (string), `VintraceEntityIds` (string — CSV), `limit` (number), `offset` (number), plus standard pagination params from the spec.
7. **`post()` return type** — `Promise<VintraceResult<Block>>` with `BlockResponseSchema` validation, unwrapping `response.data`.
8. **No schema changes to `createAssessment()`** — That method already works and returns a separate assessment schema. Not in scope.
9. **Schema definitions go in `src/validation/schemas.ts`** — Following the existing convention.
10. **New types exported from `src/index.ts`** — `Block`, `BlockData`, `BlocksListParams` for external consumers.
11. **Follow `PurchaseOrdersClient` patterns** — The most recently completed schema wiring serves as the prior art for method structure, schema wrapping, and `data` unwrapping.
12. **`getAll()` response schema stays as `GetBlocksSuccessResponseSchema(BlockDataSchema)`** — The paginated list wrapper remains unchanged; only the inner `BlockDataSchema` expands.

## Testing Decisions

1. **What makes a good test**: Test external behavior only — verify the correct URL is called, validate that a valid response parses correctly and unwraps `data` where applicable, verify error handling (404, empty body, validation failure). Do not test internal implementation details.
2. **Modules tested**: All remaining methods on `BlocksClient` — `getAll()` (with typed params, pagination logic), `post()` (response unwrapping), `createAssessment()` (existing, verify unchanged behavior).
3. **Prior art**: `tests/unit/v7-purchase-orders.test.ts` — mock `fetch` via `vi.stubGlobal`, test happy path, 404, and empty body.
4. **Integration test**: `tests/integration/real.integration.test.ts` — add a test for `client.v7.blocks.getAll({ include: 'fruitPlacements', vintage: '2026' })` that calls the real API and validates the response contains typed fields like `fruitPlacement.bulkStocks`.
5. **Integration test is read-only** — GET only, following the existing read-only integration test convention.

## Out of Scope

- Creating a single-block `get(id)` endpoint wrapper — the endpoint simply does not exist in v7.
- Wiring `createAssessment()` response — that method already returns a typed schema (`BlockAssessmentResponse`).
- Any v6 blocks endpoints — this is v7 only.
- Expanding any other client's schemas — this issue is scoped to `BlocksClient` only.

## Further Notes

- The `BlockData` component in the OpenAPI spec has `required: [id, name, grower, vineyard, region, variety]`. The remaining fields should be `.optional()`.
- The `FruitPlacement` schema varies with the `include` query param — when `include=fruitPlacements` is passed, `bulkStocks` can be an array. Without it, `fruitPlacement` may be absent or empty.
- `Grading` is `null` in many blocks — this is intentional; the schema should mark it as `.nullable()`.
