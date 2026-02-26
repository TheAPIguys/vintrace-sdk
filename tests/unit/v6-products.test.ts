import { describe, it, expect, vi, afterEach } from 'vitest';
import { VintraceClient } from '../../src/client/VintraceClient';
import { VintraceAggregateError, VintraceNotFoundError } from '../../src/client/errors';
import { product, productResponse, productListResponse } from '../fixtures/products';

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

describe('v6.products', () => {
  describe('getAll()', () => {
    it('calls GET v6/products/list and returns all products', async () => {
      stubFetch(200, productListResponse);
      const client = makeClient();
      const [data, error] = await client.v6.products.getAll();
      expect(error).toBeNull();
      expect(data).toEqual(productListResponse.products);
    });

    it('passes query params to the request', async () => {
      stubFetch(200, productListResponse);
      const client = makeClient();
      await client.v6.products.getAll({ startsWith: 'BC', max: '50' });
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v6/products/list');
    });

    it('returns error on failure', async () => {
      stubFetch(500, { message: 'Internal Server Error' });
      const client = makeClient();
      const [data, error] = await client.v6.products.getAll();
      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });
  });

  describe('get()', () => {
    it('calls GET v6/products/:id and returns product', async () => {
      stubFetch(200, productResponse);
      const client = makeClient();
      const [data, error] = await client.v6.products.get('1');
      expect(error).toBeNull();
      expect(data).toEqual(productResponse);
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v6/products/1');
    });

    it('returns VintraceNotFoundError for unknown id', async () => {
      stubFetch(404, { message: 'Not Found' });
      const client = makeClient();
      const [data, error] = await client.v6.products.get('999');
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(VintraceNotFoundError);
    });
  });

  describe('create()', () => {
    it('calls POST v6/products with data and returns response', async () => {
      stubFetch(200, productResponse);
      const client = makeClient();
      const [data, error] = await client.v6.products.create({ batchCode: 'NEW01', description: 'New Product' });
      expect(error).toBeNull();
      expect(data).toEqual(productResponse);
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v6/products');
      expect(init.method).toBe('POST');
    });
  });

  describe('update()', () => {
    it('calls PUT v6/products/:id with data and returns response', async () => {
      const updateResponse = { status: 'Success', product };
      stubFetch(200, updateResponse);
      const client = makeClient();
      const [data, error] = await client.v6.products.update('1', { updateFields: [{ propertyType: 'description', propertyValue: 'Updated' }] });
      expect(error).toBeNull();
      expect(data).toEqual(updateResponse);
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v6/products/1');
      expect(init.method).toBe('PUT');
    });
  });

  describe('getMany()', () => {
    it('fetches multiple products and returns array', async () => {
      vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce({
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: vi.fn().mockResolvedValue(productResponse),
        })
        .mockResolvedValueOnce({
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: vi.fn().mockResolvedValue({ ...productResponse, product: { ...product, id: 2, batchCode: 'BCF02' } }),
        })
      );
      const client = makeClient();
      const [data, error] = await client.v6.products.getMany(['1', '2']);
      expect(error).toBeNull();
      expect(data).toHaveLength(2);
    });

    it('returns VintraceAggregateError if any request fails', async () => {
      vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce({
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: vi.fn().mockResolvedValue(productResponse),
        })
        .mockResolvedValueOnce({
          ok: false, status: 404,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: vi.fn().mockResolvedValue({}),
        })
      );
      const client = makeClient();
      const [data, error] = await client.v6.products.getMany(['1', '9999']);
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(VintraceAggregateError);
    });
  });
});
