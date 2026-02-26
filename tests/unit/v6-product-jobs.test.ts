import { describe, it, expect, vi, afterEach } from 'vitest';
import { VintraceClient } from '../../src/client/VintraceClient';
import { VintraceAggregateError, VintraceNotFoundError } from '../../src/client/errors';
import { productJobResponse } from '../fixtures/product-jobs';

const BASE_URL = 'https://test.vintrace.net';
const ORG = 'testorg';
const TOKEN = 'test-token';

function makeClient() {
  return new VintraceClient({
    baseUrl: BASE_URL,
    organization: ORG,
    token: TOKEN,
    options: { maxRetries: 0 },
  });
}

function stubFetch(status: number, body: unknown) {
  const headers = new Headers({ 'content-type': 'application/json' });
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      headers,
      json: vi.fn().mockResolvedValue(body),
    })
  );
}

afterEach(() => vi.restoreAllMocks());

describe('v6.productJobs', () => {
  describe('get()', () => {
    it('calls GET v6/product-jobs/:productId and returns job details', async () => {
      stubFetch(200, productJobResponse);
      const client = makeClient();
      const [data, error] = await client.v6.productJobs.get(46894);
      expect(error).toBeNull();
      expect(data).toEqual(productJobResponse);
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v6/product-jobs/46894');
    });

    it('returns VintraceNotFoundError for unknown product id', async () => {
      stubFetch(404, { message: 'Product not found' });
      const client = makeClient();
      const [data, error] = await client.v6.productJobs.get(99999);
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(VintraceNotFoundError);
    });

    it('returns error on failure', async () => {
      stubFetch(500, { message: 'Internal Server Error' });
      const client = makeClient();
      const [data, error] = await client.v6.productJobs.get(46894);
      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });
  });

  describe('getAll()', () => {
    it('fetches multiple product jobs and returns array', async () => {
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: vi.fn().mockResolvedValue(productJobResponse),
          })
          .mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: vi
              .fn()
              .mockResolvedValue({
                ...productJobResponse,
                jobDetails: { ...productJobResponse.jobDetails, productId: 47895 },
              }),
          })
      );
      const client = makeClient();
      const [data, error] = await client.v6.productJobs.getAll([46894, 47895]);
      expect(error).toBeNull();
      expect(data).toHaveLength(2);
    });

    it('returns VintraceAggregateError if any request fails', async () => {
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: vi.fn().mockResolvedValue(productJobResponse),
          })
          .mockResolvedValueOnce({
            ok: false,
            status: 404,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: vi.fn().mockResolvedValue({}),
          })
      );
      const client = makeClient();
      const [data, error] = await client.v6.productJobs.getAll([46894, 99999]);
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(VintraceAggregateError);
    });
  });
});
