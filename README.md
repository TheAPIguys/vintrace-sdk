# vintrace-sdk

A TypeScript SDK for the Vintrace API.

> **Disclaimer**: This SDK is not affiliated with or endorsed by Vintrace. It is an independent, third-party project. Use at your own risk. Always refer to the official Vintrace API documentation. Provided as-is without warranties. Test thoroughly before using in production.

---

## Requirements

- Node.js >= 18.0.0
- pnpm (recommended)

## Installation

```bash
npm install vintrace-sdk
# or
pnpm add vintrace-sdk
```

---

## Quick Start

```typescript
import { VintraceClient } from 'vintrace-sdk';

const client = new VintraceClient({
  baseUrl: 'https://oz50.vintrace.net',  // your region (oz50, sandbox, etc.)
  organization: 'wrw',                    // your customer/organization code
  token: process.env.VINTRACE_TOKEN!,
});

// Get a single record
const [order, error] = await client.v6.salesOrders.get('123');
if (error) {
  console.error(error.status, error.message);
  return;
}
console.log(order.id); // fully typed, never null here
```

---

## Configuration

```typescript
const client = new VintraceClient({
  baseUrl: 'https://oz50.vintrace.net',
  organization: 'wrw',
  token: 'your-bearer-token',
  options: {
    timeout: 30000,           // request timeout in ms (default: 30000)
    maxRetries: 3,            // exponential backoff retries (default: 3)
    parallelLimit: 5,         // max concurrent requests for batch operations (default: 5)
    validateRequests: true,   // Zod validate request payloads (default: true)
    validateResponses: true,  // Zod validate API responses (default: true)
  },
});
```

**URL format:** `{baseUrl}/{organization}/api/{version}/{endpoint}`

---

## Error Handling

Every API method returns a Go-style `[data, error]` result tuple — no `try/catch` required.

```typescript
import {
  VintraceAuthenticationError,
  VintraceRateLimitError,
  VintraceNotFoundError,
  VintraceAggregateError,
} from 'vintrace-sdk';

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
    for (const e of error.errors) console.log(' -', e.message);
  } else {
    console.log('API error:', error.status, error.correlationId);
  }
  return;
}
```

### Error Class Hierarchy

```
VintraceError (base)
├── VintraceAuthenticationError  (401)
├── VintraceRateLimitError        (429) — has .retryAfter
├── VintraceNotFoundError         (404)
├── VintraceValidationError       (400, 422, other 4xx)
├── VintraceServerError           (500+)
└── VintraceAggregateError        (batch operation failures)
```

All errors expose: `message`, `status`, `correlationId`, `name`.

---

## API Patterns

### Get by ID

```typescript
const [order, error] = await client.v6.salesOrders.get('123');
```

### Auto-paginated list

Automatically fetches all pages — yields one item at a time:

```typescript
for await (const order of client.v6.salesOrders.getAll({ status: 'ACTIVE' })) {
  console.log(order.id, order.name);
}
```

### Batch fetch (parallel)

Fetches multiple IDs concurrently (default: 5 at a time):

```typescript
const [results, error] = await client.v6.salesOrders.getMany(['id1', 'id2', 'id3']);
if (error) { /* handle VintraceAggregateError */ }
```

### Create

```typescript
const [newOrder, error] = await client.v6.salesOrders.post({ /* payload */ });
```

### Update

```typescript
const [updated, error] = await client.v6.salesOrders.update('123', { /* payload */ });
```

---

## Result Type

```typescript
type VintraceResult<T> =
  | [data: T,    error: null]           // success
  | [data: null, error: VintraceError]  // error
  | [data: null, error: null];          // 204 No Content
```

---

## Retry Logic

- **Attempts**: 3 (configurable via `maxRetries`)
- **Backoff**: 1s → 2s → 4s (exponential)
- **Retryable codes**: 408, 429, 500, 502, 503, 504
- **Correlation ID**: Sent as `X-Correlation-ID` header, returned on errors as `error.correlationId`

---

## API Coverage

### v6 Endpoints

| Module | Methods |
|--------|---------|
| WorkOrders | `getAll`, `get`, `getMany`, `post`, `update` |
| SalesOrders | `getAll`, `get`, `getMany`, `post`, `update` |
| Refunds | `getAll`, `get`, `getMany`, `post` |
| Parties | `getAll`, `get`, `getMany`, `post` |
| Products | `getAll`, `get`, `getMany`, `post` |
| ProductUpdate | `post` |
| Transactions | `search` |
| IntakeOperations | `search` |
| SampleOperations | `search` |
| BlockAssessments | `post` |
| MRPStock | `get`, `updateFields`, `getDistributions`, `getHistoryItems`, `getRawComponents`, `getNotes`, `postNote`, `updateNote` |
| Inventory | `getAll` |
| Search | `list`, `lookup` |

### v7 Endpoints

| Module | Methods |
|--------|---------|
| Costs | `businessUnitTransactions` |
| Blocks | `getAll`, `get`, `post`, `update`, `patch`, `getAssessments`, `createAssessment` |
| Assessments | `getAll` |
| Vineyards | `post` |
| MaturitySamples | `post` |
| Parties | `getAll`, `post` |
| Shipments | `getAll` |
| BarrelTreatments | `getAll` |
| Bookings | `post`, `deactivate` |
| FruitIntakes | `post`, `updatePricing`, `updateMetrics` |
| BulkIntakes | `getAll`, `post`, `patch` |
| TrialBlends | `getAll` |
| WorkOrders | `getAll` |
| Tirage | `get`, `patch` |
| BarrelsMovements | `post` |

---

## Development

```bash
pnpm build          # Build ESM + CJS bundles
pnpm dev            # Watch mode
pnpm typecheck      # TypeScript type checking
pnpm lint           # ESLint
pnpm lint:fix       # Auto-fix ESLint issues
pnpm format         # Prettier
pnpm test run       # Run tests once
pnpm generate-types # Regenerate types from OpenAPI YAML
```

### Output

| Format | File |
|--------|------|
| ESM | `dist/index.js` |
| CJS | `dist/index.cjs` |
| Types | `dist/index.d.ts` |

---

## License

MIT
