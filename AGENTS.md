# AGENTS.md - Vintrace SDK Development Guide

This file provides guidance for agentic coding agents working on the vintrace-sdk codebase.

---

## 1. Commands

```bash
pnpm build           # Build ESM + CJS bundles with tsup
pnpm dev             # Watch mode
pnpm typecheck       # TypeScript type checking
pnpm lint            # ESLint on src/
pnpm lint:fix        # Auto-fix ESLint issues
pnpm format          # Format with Prettier
pnpm test            # Run tests (watch mode)
pnpm test run        # Run tests once
pnpm test -- [file]  # Run single test file
pnpm test -- -t "pattern"  # Run tests matching pattern
pnpm generate-types  # Regenerate types from OpenAPI YAML
```

---

## 2. Project Structure

```
src/
├── client/          # VintraceClient, config, errors
├── http/            # fetch.ts, pagination.ts
├── types/           # generated.ts (DO NOT EDIT), result.ts
├── validation/      # Zod schemas and validation utilities
├── api/v6/          # v6 API modules (future)
├── api/v7/          # v7 API modules (future)
└── index.ts         # Main export
```

---

## 3. Code Style

- **Formatting**: Semi-colons, single quotes, print width 100, ES5 trailing commas
- **Arrow functions**: `(x) => x` for single param
- **ESLint**: No unused variables, no floating promises, no explicit `any`
- **Console**: Only `warn` and `error` allowed

---

## 4. TypeScript Guidelines

- Prefer explicit return types: `function getUser(id: string): Promise<VintraceResult<User>>`
- API responses use result tuples - destructure at call site
- Use interfaces for public APIs

---

## 5. Naming Conventions

- Classes: PascalCase (`VintraceClient`)
- Methods: camelCase (`getAll()`)
- Files: kebab-case (`vintrace-client.ts`)
- Constants: UPPER_SNAKE_CASE (`DEFAULT_OPTIONS`)

---

## 6. Import Order

1. External libraries (zod, etc.)
2. Internal packages (absolute paths from 'vintrace-sdk')
3. Relative imports

---

## 7. Error Handling - Go-Style Result Tuples

Every API method returns `[data, error]` - NO throwing:

```typescript
const [order, error] = await client.v6.workOrders.get('123');
if (error) {
  if (error instanceof VintraceAuthenticationError) { /* auth failed */ }
  else if (error instanceof VintraceRateLimitError) { /* check error.retryAfter */ }
  else if (error instanceof VintraceNotFoundError) { /* not found */ }
  else { /* generic - check error.status, error.correlationId */ }
  return;
}
console.log(order.id); // order is typed, never null
```

### Creating New Errors
```typescript
export class VintraceTimeoutError extends VintraceError {
  constructor(correlationId?: string) {
    super('Request timeout', 408, correlationId);
    this.name = 'VintraceTimeoutError';
  }
}
```

---

## 8. Adding New API Modules

```typescript
class WorkOrdersClient {
  constructor(private client: VintraceClient) {}

  getAll(params?: Record<string, unknown>) {
    return this.client.request<WorkOrder[]>('v6/workorders/list', 'GET', {}, params);
  }

  get(id: string) {
    return this.client.request<WorkOrder>(`v6/workorders/${id}`, 'GET`);
  }

  getMany<T>(ids: string[]): Promise<VintraceResult<T[]>> {
    return this.batchGet<T>(ids, (id) => this.get(id));
  }

  post(data: unknown) {
    return this.client.request<WorkOrder>('v6/workorders', 'POST', {}, data);
  }

  update(id: string, data: unknown) {
    return this.client.request<WorkOrder>(`v6/workorders/${id}`, 'PATCH', {}, data);
  }

  private async batchGet<T>(ids: string[], fetchFn: (id: string) => Promise<VintraceResult<T>>): Promise<VintraceResult<T[]>> {
    const results = await Promise.allSettled(ids.map((id) => fetchFn(id)));
    const errors: VintraceError[] = [];
    const data: T[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const [item, error] = result.value;
        if (error) errors.push(error);
        else if (item !== null) data.push(item);
      } else {
        errors.push(new VintraceError(result.reason?.message ?? 'Unknown error', 0));
      }
    }
    if (errors.length > 0) return [null, new VintraceAggregateError(errors)];
    return [data, null];
  }
}
```

---

## 9. Generated Types & Validation

- `src/types/generated.ts` - auto-generated, **DO NOT EDIT**
- `src/validation/schemas.ts` - manual Zod schemas
- Use `validateRequest()` and `validateResponse()` from `src/validation/index.ts`

---

## 10. Testing

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('VintraceClient', () => {
  it('should create client with config', () => {
    const client = new VintraceClient({
      baseUrl: 'https://test.vintrace.net',
      organization: 'test',
      token: 'test-token',
    });
    expect(client.baseUrl).toBe('https://test.vintrace.net');
  });
});
```

Mock fixtures go in `tests/fixtures/`.

---

## 11. Common Patterns

### Pagination
```typescript
for await (const item of client.v6.workOrders.getAll({ status: 'READY' })) {
  console.log(item);
}
```

### Batch Requests
```typescript
const [results, error] = await client.v6.workOrders.getMany(['id1', 'id2', 'id3']);
if (error) { /* handle VintraceAggregateError */ }
```

---

## 12. Before Committing

- [ ] `pnpm format`
- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`

---

## 13. Package Details

- **Main**: `dist/index.cjs` (CJS), `dist/index.js` (ESM)
- **Types**: `dist/index.d.ts`
- **Node**: >=18.0.0
