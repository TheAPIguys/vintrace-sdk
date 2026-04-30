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

describe('v7.stock', () => {
  describe('receive()', () => {
    it('calls POST v7/stock/receivals with data', async () => {
      const mockResponse = { data: { id: 1 } };
      stubFetch(200, mockResponse);
      const client = makeClient();
      const payload = { occurredTime: 1644990021000, stockDetails: [] };
      const [data, error] = await client.v7.stock.receive(payload);
      expect(error).toBeNull();
      expect(data).toEqual(mockResponse);
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v7/stock/receivals');
      expect(init.method).toBe('POST');
      expect(init.body).toBe(JSON.stringify(payload));
    });

    it('returns error on failure', async () => {
      stubFetch(500, {});
      const client = makeClient();
      const [data, error] = await client.v7.stock.receive({});
      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });
  });

  describe('getDispatches()', () => {
    it('calls GET v7/stock/dispatches and returns results', async () => {
      const mockResponse = {
        totalResults: 1,
        offset: 0,
        limit: 100,
        results: [{ id: 1, workOrderNumber: '123' }],
      };
      stubFetch(200, mockResponse);
      const client = makeClient();
      const [data, error] = await client.v7.stock.getDispatches();
      expect(error).toBeNull();
      expect(data).toEqual(mockResponse.results);
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v7/stock/dispatches');
    });

    it('passes pagination params', async () => {
      stubFetch(200, { totalResults: 0, results: [] });
      const client = makeClient();
      await client.v7.stock.getDispatches({ limit: 50, offset: 10 });
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('limit=50');
      expect(url).toContain('offset=10');
    });

    it('returns error on failure', async () => {
      stubFetch(500, {});
      const client = makeClient();
      const [data, error] = await client.v7.stock.getDispatches();
      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });
  });
});
