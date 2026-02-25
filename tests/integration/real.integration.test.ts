/**
 * Real-credentials integration tests — read-only, safe to run against production.
 *
 * These tests ONLY exercise GET endpoints. No POST/PUT/PATCH/DELETE calls are made.
 *
 * Prerequisites:
 *   Create a .env file in the repo root with:
 *     VINTRACE_BASE_URL=https://yourtenant.vintrace.net
 *     VINTRACE_ORG=yourorg
 *     VINTRACE_TOKEN=your-token-here
 *
 * Run with:
 *   npx vitest run tests/integration/real.integration.test.ts --env-file=.env
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { VintraceClient } from '../../src/client/VintraceClient';

const BASE_URL = process.env.VINTRACE_BASE_URL;
const ORG = process.env.VINTRACE_ORG;
const TOKEN = process.env.VINTRACE_TOKEN;

const hasCredentials = Boolean(BASE_URL && ORG && TOKEN);

function makeClient() {
  return new VintraceClient({
    baseUrl: BASE_URL!,
    organization: ORG!,
    token: TOKEN!,
    options: { maxRetries: 0 },
  });
}

describe.skipIf(!hasCredentials)('real API — read-only integration', { timeout: 30000 }, () => {
  let client: VintraceClient;

  beforeAll(() => {
    client = makeClient();
  });

  // ── Work Orders ────────────────────────────────────────────────────────────
  describe('v6.workOrders', () => {
    it('getAll() returns data', async () => {
      const [data, error] = await client.v6.workOrders.getAll({ max: '5' });
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  // ── Sales Orders ───────────────────────────────────────────────────────────
  describe('v6.salesOrders', () => {
    it('getAll() returns data', async () => {
      const [data, error] = await client.v6.salesOrders.getAll({ max: '5' });
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  // ── Refunds ────────────────────────────────────────────────────────────────
  describe('v6.refunds', () => {
    it('getAll() returns data', async () => {
      const [data, error] = await client.v6.refunds.getAll({ max: '5' });
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  // ── Parties ────────────────────────────────────────────────────────────────
  describe('v6.parties', () => {
    it('getAll() returns data', async () => {
      const [data, error] = await client.v6.parties.getAll({ max: '5' });
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  // ── Products ───────────────────────────────────────────────────────────────
  describe('v6.products', () => {
    it('getAll() returns data', async () => {
      const [data, error] = await client.v6.products.getAll({ max: '5' });
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  // ── Transactions ───────────────────────────────────────────────────────────
  describe('v6.transactions', () => {
    it('search() returns data', async () => {
      const [data, error] = await client.v6.transactions.search();
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  // ── Intake Operations ──────────────────────────────────────────────────────
  describe('v6.intakeOperations', () => {
    it('search() returns data', async () => {
      const [data, error] = await client.v6.intakeOperations.search({ maxResults: 5 });
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  // ── Sample Operations ──────────────────────────────────────────────────────
  describe('v6.sampleOperations', () => {
    it('search() returns data', async () => {
      const [data, error] = await client.v6.sampleOperations.search({ maxResults: 5 });
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  // ── Inventory ──────────────────────────────────────────────────────────────
  describe('v6.inventory', () => {
    it('getAll() returns data', async () => {
      const [data, error] = await client.v6.inventory.getAll();
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  // ── Search ─────────────────────────────────────────────────────────────────
  describe('v6.search', () => {
    it('list() returns data for type=workorder', async () => {
      const [data, error] = await client.v6.search.list({ type: 'workorder', startsWith: 'a' });
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });
});
