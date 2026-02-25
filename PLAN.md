# Vintrace SDK - Implementation Plan

## Project Overview

- **Package**: `vintrace-sdk` (no scope)
- **Language**: TypeScript
- **Build**: tsup (ESM + CJS dual output)
- **Package Manager**: pnpm only
- **Type Generation**: openapi-typescript from `vintrace-api-v7-combined.yaml`
- **Runtime Validation**: Zod — for both request payloads AND responses
- **Error Handling**: Go-style result tuple `[data | null, VintraceError | null]` — NO throwing, NO try/catch required by consumers
- **Node version**: >=18.0.0

---

## Architecture

### URL Construction
```
{baseUrl}/{organization}/api/{version}/{endpoint}

Example: https://oz50.vintrace.net/wrw/api/v6/workorders/list
```

### Client Configuration
```typescript
const client = new VintraceClient({
  baseUrl: 'https://oz50.vintrace.net',  // region (oz50, sandbox, etc.)
  organization: 'wrw',                    // dynamic customer code (wrw, mob, vinx2, etc.)
  token: 'bearer-token',
  options: {
    timeout: 30000,           // request timeout in ms
    maxRetries: 3,            // exponential backoff retries
    parallelLimit: 5,         // max concurrent requests for batch operations
    validateRequests: true,   // Zod validate request payloads
    validateResponses: true,  // Zod validate API responses
  }
});
```

### Go-Style Result Tuple Pattern

Every API method returns a discriminated result tuple instead of throwing. Consumers destructure and check the error:

```typescript
type VintraceResult<T> = [data: T, error: null] | [data: null, error: VintraceError] | [data: null, error: null];

// Usage at call site — no try/catch needed
const [order, error] = await client.v6.salesOrders.get('123');
if (error) {
  console.error(error.status, error.message); // fully typed VintraceError
  return;
}
console.log(order.id); // order is typed, never null here
```

- `fetch.ts` catches internally and returns result tuples instead of throwing
- `correlationId` is accessible on the `VintraceError` object as `error.correlationId`
- The result type lives in `src/types/result.ts`
- `204 No Content` returns `[null, null]` — both null indicating success with no data

### API Method Patterns
```typescript
// Auto-paginated list (yields all results across pages)
client.v6.workOrders.getAll(params)

// Single by ID
client.v6.workOrders.get(id)

// Parallel batch with configurable concurrency (default 5)
client.v6.workOrders.getMany([id1, id2, id3])

// Create
client.v6.workOrders.post(data)

// Update (PATCH or PUT depending on endpoint)
client.v6.workOrders.update(id, data)
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Type Safety** | Full TypeScript types generated from OpenAPI spec |
| **Result Tuples** | Go-style `[data, error]` return — no try/catch required |
| **Zod Validation** | Runtime validation for requests/responses using Zod schemas |
| **Auto-Pagination** | Generator-based pagination that automatically fetches all pages |
| **Parallel Batch** | Configurable concurrency for fetching multiple IDs |
| **Retry Logic** | Exponential backoff (1s → 2s → 4s) for transient errors |
| **Typed Errors** | VintraceError hierarchy with status, message, correlationId |
| **Mock Tests** | Stoplight mock server fixtures for testing |

---

## Retry Logic

- **Retries**: 3 attempts with exponential backoff
- **Delays**: 1s → 2s → 4s
- **Retryable status codes**: 408, 429, 500, 502, 503, 504
- **Correlation ID**: Sent as `X-Correlation-ID` header, echoed back in responses

---

## Error Class Hierarchy

```
VintraceError (base)
├── VintraceAuthenticationError  (401)
├── VintraceRateLimitError        (429, has .retryAfter property)
├── VintraceNotFoundError         (404)
├── VintraceValidationError       (400, 422, other 4xx - actual HTTP status passed through)
├── VintraceServerError           (500+)
└── VintraceAggregateError        (multiple errors from getMany/batchGet)
```

All errors expose: `message`, `status`, `correlationId`, `name`.

---

## v6 Endpoints (In YAML Order — v6 is higher priority than v7)

| # | Module | Methods | Status |
|---|--------|---------|--------|
| 1 | WorkOrders | getAll, get, getMany, post, update | stub only |
| 2 | SalesOrders | getAll, get, getMany, post, update | stub only |
| 3 | Refunds | getAll, get, getMany, post | stub only |
| 4 | Parties | getAll, get, getMany, post | stub only |
| 5 | Products | get, getMany, getAll, post | stub only |
| 6 | ProductUpdate | post | not started |
| 7 | Transactions | search | not started |
| 8 | IntakeOperations | search | not started |
| 9 | SampleOperations | search | not started |
| 10 | BlockAssessments | post | not started |
| 11 | MRPStock | get, updateFields, getDistributions, getHistoryItems, getRawComponents, getNotes, postNote, updateNote | not started |
| 12 | Inventory | getAll | not started |
| 13 | Search | list, lookup | not started |

---

## v7 Endpoints (In YAML Order)

| # | Module | Methods | Status |
|---|--------|---------|--------|
| 1 | Costs | businessUnitTransactions (GET) | not started |
| 2 | Blocks | getAll, get, post, update, patch, getAssessments, createAssessment | stub only |
| 3 | Assessments | getAll | not started |
| 4 | Vineyards | post | not started |
| 5 | MaturitySamples | post | not started |
| 6 | Parties | getAll, post (upsert) | not started |
| 7 | Shipments | getAll | not started |
| 8 | BarrelTreatments | getAll | not started |
| 9 | Bookings | post, deactivate | stub only |
| 10 | FruitIntakes | post, updatePricing, updateMetrics | not started |
| 11 | BulkIntakes | getAll, post, patch | not started |
| 12 | TrialBlends | getAll | not started |
| 13 | WorkOrders | getAll | not started |
| 14 | Tirage | get, patch | not started |
| 15 | BarrelsMovements | post | not started |
| 16 | VesselDetailsReport | get | done |

---

## v7 Report Endpoints (In YAML Order)

| # | Module | Methods | Status |
|---|--------|---------|--------|
| 1 | VesselDetailsReport | get | done |

---

## Directory Structure (Target)

```
vintrace-sdk/
├── src/
│   ├── types/
│   │   ├── generated.ts        # OpenAPI generated types — DO NOT EDIT
│   │   └── result.ts           # VintraceResult<T> type ✅
│   ├── client/
│   │   ├── VintraceClient.ts   # Main client class + sub-clients
│   │   ├── config.ts           # Client configuration types + DEFAULT_OPTIONS
│   │   └── errors.ts           # Typed error class hierarchy
│   ├── http/
│   │   ├── fetch.ts            # HTTP layer (result-tuple refactored)
│   │   └── pagination.ts       # paginate() async generator + batchGet()
│   ├── validation/             # ✅ Zod schemas + validation utilities
│   │   ├── index.ts            # validateRequest, validateResponse, VintraceValidationSchemaError
│   │   └── schemas.ts          # Zod schemas for common types
│   ├── api/
│   │   ├── v6/                 # EMPTY — sub-clients to be moved here
│   │   │   ├── workOrders.ts
│   │   │   ├── salesOrders.ts
│   │   │   ├── refunds.ts
│   │   │   ├── parties.ts
│   │   │   ├── products.ts
│   │   │   ├── productUpdate.ts
│   │   │   ├── transactions.ts
│   │   │   ├── intakeOperations.ts
│   │   │   ├── sampleOperations.ts
│   │   │   ├── blockAssessments.ts
│   │   │   ├── mrpStock.ts
│   │   │   ├── inventory.ts
│   │   │   ├── search.ts
│   │   │   └── index.ts
│   │   └── v7/                 # EMPTY — sub-clients to be moved here
│   │       ├── costs.ts
│   │       ├── blocks.ts
│   │       ├── assessments.ts
│   │       ├── vineyards.ts
│   │       ├── maturitySamples.ts
│   │       ├── parties.ts
│   │       ├── shipments.ts
│   │       ├── barrelTreatments.ts
│   │       ├── bookings.ts
│   │       ├── fruitIntakes.ts
│   │       ├── bulkIntakes.ts
│   │       ├── trialBlends.ts
│   │       ├── workOrders.ts
│   │       ├── tirage.ts
│   │       ├── barrelsMovements.ts
│   │       └── index.ts
│   └── index.ts                # Main barrel exports
├── tests/
│   ├── fixtures/               # Stoplight mock server responses
│   ├── client.test.ts
│   ├── pagination.test.ts
│   └── api/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── .npmignore
├── PLAN.md
├── AGENTS.md
├── vintrace-api-v7-combined.yaml   # Source OpenAPI spec (v6 + v7 combined)
├── common-schemas.yaml             # Stub — created to satisfy openapi-typescript $refs
├── common-responses.yaml           # Stub — created to satisfy openapi-typescript $refs
└── README.md
```

---

## Completion Status

### ✅ Done

| Item | Notes |
|------|-------|
| `PLAN.md` | This file |
| `AGENTS.md` | Coding agent guidelines |
| `package.json` | pnpm, tsup, vitest, ESLint, Prettier, openapi-typescript, zod |
| `tsconfig.json` | Strict mode, excludes `generated.ts` from type checking |
| `tsup.config.ts` | ESM + CJS dual output, sourcemaps |
| `.eslintrc.cjs` | TypeScript ESLint, no-floating-promises, excludes `generated.ts` |
| `.prettierrc` | Single quotes, semi, 100 width, trailing commas ES5 |
| `.gitignore` | Standard Node gitignore |
| `common-schemas.yaml` | Stub — was missing, required by main YAML |
| `common-responses.yaml` | Stub — was missing, required by main YAML |
| `src/types/generated.ts` | Generated from OpenAPI YAML via openapi-typescript |
| `src/types/result.ts` | `VintraceResult<T>` discriminated union type |
| `src/client/config.ts` | `VintraceClientConfig`, `VintraceClientOptions`, `DEFAULT_OPTIONS` |
| `src/client/errors.ts` | Full error class hierarchy + `VintraceAggregateError` |
| `src/http/fetch.ts` | HTTP layer refactored to return result tuples |
| `src/http/pagination.ts` | `paginate()` + `batchGet()` updated for result tuples |
| `src/client/VintraceClient.ts` | Main client + sub-clients with result-tuple returns |
| `src/index.ts` | Barrel exports including `VintraceResult`, `VintraceFetchError`, `VintraceAggregateError` |
| `pnpm install` | All dependencies installed |
| `pnpm build` | ✅ passes — ESM + CJS + types generated |
| `pnpm lint` | ✅ passes |
| `pnpm format` | ✅ passes |
| `pnpm typecheck` | ✅ passes |

### 🔄 Next — Zod Validation Layer

These should be done before implementing any further API modules:

1. Add Zod schemas in `src/validation/` for request and response validation
2. Wire Zod validation into the fetch layer (honour `validateRequest`/`validateResponse` options)

### ❌ Not Started

**v6 modules** (in YAML order — after refactor):
- WorkOrders — full types + Zod schemas + result pattern (currently stub only)
- SalesOrders — full types + Zod schemas + result pattern (currently stub only)
- Refunds — full types + Zod schemas + result pattern (currently stub only)
- Parties — full types + Zod schemas + result pattern (currently stub only)
- Products — full types + Zod schemas + result pattern (currently stub only)
- ProductUpdate
- Transactions
- IntakeOperations
- SampleOperations
- BlockAssessments
- MRPStock
- Inventory
- Search

**v7 modules** (in YAML order):
- Costs
- Blocks — full types + Zod schemas + result pattern (currently stub only)
- Assessments
- Vineyards
- MaturitySamples
- Parties
- Shipments
- BarrelTreatments
- Bookings — full types + Zod schemas + result pattern (currently stub only)
- FruitIntakes
- BulkIntakes
- TrialBlends
- WorkOrders
- Tirage
- BarrelsMovements

**Testing:**
- No tests written yet
- Need Vitest unit tests and integration tests using Stoplight mock server
- Mock server base URL: `https://stoplight.io/mocks/vintrace/vintrace-server/143865648`
- Store fixtures in `tests/fixtures/`

---

## Implementation Phases

### Phase 0: Result Tuple Refactor ✅ DONE
- Created `VintraceResult<T>` type
- Refactored `fetch.ts` to return result tuples
- Added `VintraceAggregateError` for batch operations
- Fixed tech debt (dead code, status codes, missing exports, 204 handling)
- Wired `validateRequest`/`validateResponse` options through (validation deferred)

### Phase 1: Zod Validation Layer ✅ DONE
- Created `src/validation/index.ts` with `validateRequest()` and `validateResponse()` utilities
- Created `src/validation/schemas.ts` with Zod schemas for WorkOrder and Product types
- Wired validation into fetch layer (honours `validateRequest`/`validateResponse` options)
- Added `VintraceValidationSchemaError` for Zod validation failures

### Phase 2: v6 API (In YAML Order)
- WorkOrders, SalesOrders, Refunds, Parties, Products
- ProductUpdate, Transactions, IntakeOperations, SampleOperations
- BlockAssessments, MRPStock, Inventory, Search

### Phase 3: v7 API (In YAML Order)
- Costs, Blocks, Assessments, Vineyards, MaturitySamples
- Parties, Shipments, BarrelTreatments, Bookings
- FruitIntakes, BulkIntakes, TrialBlends, WorkOrders, Tirage, BarrelsMovements

### Phase 4: Testing
- Unit tests with Vitest
- Integration tests using Stoplight mock server fixtures
- Test coverage for error cases and retry logic

### Phase 5: Publishing
- `README.md` with usage examples
- `.npmignore`
- npm publish workflow

---

## Usage Examples (Target API — after result-tuple refactor)

### Basic Usage
```typescript
import { VintraceClient } from 'vintrace-sdk';

const client = new VintraceClient({
  baseUrl: 'https://oz50.vintrace.net',
  organization: 'wrw',
  token: process.env.VINTRACE_TOKEN!,
});

// Get single by ID — Go-style result tuple
const [order, error] = await client.v6.salesOrders.get('123');
if (error) {
  console.error(error.status, error.message);
  return;
}
console.log(order.id); // fully typed, never null here

// Auto-paginated list
for await (const order of client.v6.salesOrders.getAll({ status: 'ACTIVE' })) {
  console.log(order.id, order.name);
}

// Batch get with parallel requests (max 5 concurrent by default)
const results = await client.v6.salesOrders.getMany(['id1', 'id2', 'id3']);

// Create new entity
const [newOrder, createError] = await client.v6.salesOrders.post({ /* payload */ });

// Update entity
const [updated, updateError] = await client.v6.salesOrders.update('123', { /* payload */ });
```

### Error Handling (Go-style)
```typescript
import { VintraceAuthenticationError, VintraceRateLimitError, VintraceNotFoundError, VintraceAggregateError } from 'vintrace-sdk';

const [order, error] = await client.v6.salesOrders.get('123');
if (error) {
  if (error instanceof VintraceAuthenticationError) {
    console.log('Invalid token');
  } else if (error instanceof VintraceRateLimitError) {
    console.log('Rate limited, retry after:', error.retryAfter);
  } else if (error instanceof VintraceNotFoundError) {
    console.log('Entity not found');
  } else if (error instanceof VintraceAggregateError) {
    console.log('Multiple errors:', error.errors.length);
    for (const e of error.errors) {
      console.log(' -', e.message);
    }
  } else {
    console.log('API error:', error.status, error.correlationId);
  }
}
```

---

## Dependencies

### Production
- `zod` — Runtime validation

### Development
- `typescript` — Type checking
- `tsup` — Build tool
- `vitest` — Testing framework
- `openapi-typescript` — Type generation from YAML
- `@typescript-eslint/eslint-plugin` + `@typescript-eslint/parser` — ESLint
- `eslint-plugin-import` — Import order linting
- `prettier` — Code formatting
- `@types/node` — Node.js types
