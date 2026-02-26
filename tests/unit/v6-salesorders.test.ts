import { describe, it, expect, vi, afterEach } from 'vitest';
import { VintraceClient } from '../../src/client/VintraceClient';
import { VintraceAggregateError, VintraceNotFoundError } from '../../src/client/errors';
import { salesOrder, salesOrderResponse, salesOrderUpdateResponse } from '../fixtures/salesorders';

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

describe('v6.salesOrders', () => {
  describe('getAll()', () => {
    it('calls GET v6/sales-order/list and returns all sales orders', async () => {
      stubFetch(200, salesOrderResponse);
      const client = makeClient();
      const [data, error] = await client.v6.salesOrders.getAll();
      expect(error).toBeNull();
      expect(data).toEqual(salesOrderResponse.salesOrders);
    });

    it('passes query params to the request', async () => {
      stubFetch(200, salesOrderResponse);
      const client = makeClient();
      await client.v6.salesOrders.getAll({ status: 'New', customerName: 'ABC', max: '50' });
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v6/sales-order/list');
    });

    it('returns error on failure', async () => {
      stubFetch(500, { message: 'Internal Server Error' });
      const client = makeClient();
      const [data, error] = await client.v6.salesOrders.getAll();
      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });
  });

  describe('get()', () => {
    it('calls GET v6/sales-order/:id and returns sales order', async () => {
      stubFetch(200, salesOrder);
      const client = makeClient();
      const [data, error] = await client.v6.salesOrders.get('22');
      expect(error).toBeNull();
      expect(data).toEqual(salesOrder);
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v6/sales-order/22');
    });

    it('returns VintraceNotFoundError for unknown id', async () => {
      stubFetch(404, { message: 'Not Found' });
      const client = makeClient();
      const [data, error] = await client.v6.salesOrders.get('999');
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(VintraceNotFoundError);
    });
  });

  describe('getByCode()', () => {
    it('calls GET v6/sales-order with code param', async () => {
      stubFetch(200, salesOrder);
      const client = makeClient();
      const [data, error] = await client.v6.salesOrders.getByCode('VSO20');
      expect(error).toBeNull();
      expect(data).toEqual(salesOrder);
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v6/sales-order');
    });
  });

  describe('create()', () => {
    it('calls POST v6/sales-order with data and returns response', async () => {
      stubFetch(200, salesOrderUpdateResponse);
      const client = makeClient();
      const [data, error] = await client.v6.salesOrders.create({ customerId: 43, customerName: 'ABC Wine Company' });
      expect(error).toBeNull();
      expect(data).toEqual(salesOrderUpdateResponse);
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v6/sales-order');
      expect(init.method).toBe('POST');
    });
  });

  describe('update()', () => {
    it('calls PUT v6/sales-order/:id with data and returns response', async () => {
      stubFetch(200, salesOrderUpdateResponse);
      const client = makeClient();
      const [data, error] = await client.v6.salesOrders.update('22', { notes: 'Updated note' });
      expect(error).toBeNull();
      expect(data).toEqual(salesOrderUpdateResponse);
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v6/sales-order/22');
      expect(init.method).toBe('PUT');
      expect(JSON.parse(init.body as string).notes).toBe('Updated note');
    });
  });

  describe('getMany()', () => {
    it('fetches multiple sales orders and returns array', async () => {
      vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce({
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: vi.fn().mockResolvedValue(salesOrder),
        })
        .mockResolvedValueOnce({
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: vi.fn().mockResolvedValue({ ...salesOrder, id: 23, code: 'VSO21' }),
        })
      );
      const client = makeClient();
      const [data, error] = await client.v6.salesOrders.getMany(['22', '23']);
      expect(error).toBeNull();
      expect(data).toHaveLength(2);
    });

    it('returns VintraceAggregateError if any request fails', async () => {
      vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce({
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: vi.fn().mockResolvedValue(salesOrder),
        })
        .mockResolvedValueOnce({
          ok: false, status: 404,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: vi.fn().mockResolvedValue({}),
        })
      );
      const client = makeClient();
      const [data, error] = await client.v6.salesOrders.getMany(['22', '9999']);
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(VintraceAggregateError);
    });
  });
});
