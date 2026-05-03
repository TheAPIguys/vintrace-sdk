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

describe('v7.purchaseOrders', () => {
  describe('create()', () => {
    it('calls POST v7/account/purchase-orders with data', async () => {
      const mockResponse = { data: { id: 234234, name: 'PO-2' } };
      stubFetch(200, mockResponse);
      const client = makeClient();
      const payload = { name: 'PO-2', vendor: { extId: 'ABC-2342' }, state: 'NEW' };
      const [data, error] = await client.v7.purchaseOrders.create(payload);
      expect(error).toBeNull();
      expect(data).toEqual(mockResponse);
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v7/account/purchase-orders');
      expect(init.method).toBe('POST');
      expect(init.body).toBe(JSON.stringify(payload));
    });

    it('returns error on failure', async () => {
      stubFetch(500, {});
      const client = makeClient();
      const [data, error] = await client.v7.purchaseOrders.create({});
      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });
  });

  describe('get()', () => {
    it('calls GET v7/account/purchase-orders/:id', async () => {
      const mockResponse = { data: { id: 234234, name: 'PO-2' } };
      stubFetch(200, mockResponse);
      const client = makeClient();
      const [data, error] = await client.v7.purchaseOrders.get('234234');
      expect(error).toBeNull();
      expect(data).toEqual(mockResponse.data);
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v7/account/purchase-orders/234234');
    });

    it('returns error on not found', async () => {
      stubFetch(404, {});
      const client = makeClient();
      const [data, error] = await client.v7.purchaseOrders.get('999');
      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });
  });
});
