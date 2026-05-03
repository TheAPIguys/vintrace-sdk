import { describe, it, expect, vi, afterEach } from 'vitest';
import { VintraceClient } from '../../src/client/VintraceClient';

const BASE_URL = 'https://test.vintrace.net';
const ORG = 'testorg';
const TOKEN = 'test-token';

function makeClient() {
  return new VintraceClient({ baseUrl: BASE_URL, organization: ORG, token: TOKEN, options: { maxRetries: 0 } });
}

function stubFetch(status: number, body: unknown) {
  const headers = new Headers({ 'content-type': 'application/json' });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    headers,
    json: vi.fn().mockResolvedValue(body),
  }));
}

afterEach(() => vi.restoreAllMocks());

describe('v7.fruitIntakes', () => {
  describe('create()', () => {
    it('calls POST v7/operation/fruit-intakes with data', async () => {
      const mockResponse = { data: { id: 123, intakeDocket: 'D-1' } };
      stubFetch(200, mockResponse);
      const client = makeClient();
      const payload = { intakeDocket: 'D-1', block: 'Block-1', vintage: '2025' };
      const [data, error] = await client.v7.fruitIntakes.create(payload);
      expect(error).toBeNull();
      expect(data).toEqual(mockResponse);
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v7/operation/fruit-intakes');
      expect(init.method).toBe('POST');
      expect(init.body).toBe(JSON.stringify(payload));
    });

    it('returns error on failure', async () => {
      stubFetch(500, {});
      const client = makeClient();
      const [data, error] = await client.v7.fruitIntakes.create({});
      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });
  });

  describe('updatePricing()', () => {
    it('calls PUT v7/operation/fruit-intakes/:id/pricing with data', async () => {
      const mockResponse = { data: { unitPrice: { value: 1200, unit: 'tonne' } } };
      stubFetch(200, mockResponse);
      const client = makeClient();
      const payload = { unitPrice: { value: 1200, unit: 'tonne' } };
      const [data, error] = await client.v7.fruitIntakes.updatePricing('42', payload);
      expect(error).toBeNull();
      expect(data).toEqual(mockResponse);
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v7/operation/fruit-intakes/42/pricing');
      expect(init.method).toBe('PUT');
      expect(init.body).toBe(JSON.stringify(payload));
    });

    it('returns error on failure', async () => {
      stubFetch(500, {});
      const client = makeClient();
      const [data, error] = await client.v7.fruitIntakes.updatePricing('42', {});
      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });
  });

  describe('updateMetrics()', () => {
    it('calls PUT v7/operation/fruit-intakes/:id/metrics with data', async () => {
      const mockResponse = { data: { metrics: [{ name: 'Brix', value: 23 }] } };
      stubFetch(200, mockResponse);
      const client = makeClient();
      const payload = { metrics: [{ name: 'Brix', value: 23 }] };
      const [data, error] = await client.v7.fruitIntakes.updateMetrics('42', payload);
      expect(error).toBeNull();
      expect(data).toEqual(mockResponse);
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v7/operation/fruit-intakes/42/metrics');
      expect(init.method).toBe('PUT');
      expect(init.body).toBe(JSON.stringify(payload));
    });

    it('returns error on failure', async () => {
      stubFetch(500, {});
      const client = makeClient();
      const [data, error] = await client.v7.fruitIntakes.updateMetrics('42', {});
      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });
  });
});
