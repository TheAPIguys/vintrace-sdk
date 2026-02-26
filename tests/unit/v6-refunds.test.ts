import { describe, it, expect, vi, afterEach } from 'vitest';
import { VintraceClient } from '../../src/client/VintraceClient';
import { VintraceAggregateError, VintraceNotFoundError } from '../../src/client/errors';
import { refund, refundResponse, refundUpdateResponse } from '../fixtures/refunds';

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

describe('v6.refunds', () => {
  describe('getAll()', () => {
    it('calls GET v6/refund/list and returns all refunds', async () => {
      stubFetch(200, refundResponse);
      const client = makeClient();
      const [data, error] = await client.v6.refunds.getAll();
      expect(error).toBeNull();
      expect(data).toEqual(refundResponse.refunds);
    });

    it('passes query params to the request', async () => {
      stubFetch(200, refundResponse);
      const client = makeClient();
      await client.v6.refunds.getAll({ status: 'Awaiting approval', customerName: 'ABC', max: '25' });
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v6/refund/list');
    });

    it('returns error on failure', async () => {
      stubFetch(500, { message: 'Internal Server Error' });
      const client = makeClient();
      const [data, error] = await client.v6.refunds.getAll();
      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });
  });

  describe('get()', () => {
    it('calls GET v6/refund/:id and returns refund', async () => {
      stubFetch(200, refund);
      const client = makeClient();
      const [data, error] = await client.v6.refunds.get('73');
      expect(error).toBeNull();
      expect(data).toEqual(refund);
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v6/refund/73');
    });

    it('returns VintraceNotFoundError for unknown id', async () => {
      stubFetch(404, { message: 'Not Found' });
      const client = makeClient();
      const [data, error] = await client.v6.refunds.get('999');
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(VintraceNotFoundError);
    });
  });

  describe('getByCode()', () => {
    it('calls GET v6/refund with code param', async () => {
      stubFetch(200, refund);
      const client = makeClient();
      const [data, error] = await client.v6.refunds.getByCode('VCR201');
      expect(error).toBeNull();
      expect(data).toEqual(refund);
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v6/refund');
    });
  });

  describe('create()', () => {
    it('calls POST v6/refund with data and returns response', async () => {
      stubFetch(200, refundUpdateResponse);
      const client = makeClient();
      const [data, error] = await client.v6.refunds.create({ customerId: 43, notes: 'Created from API' });
      expect(error).toBeNull();
      expect(data).toEqual(refundUpdateResponse);
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v6/refund');
      expect(init.method).toBe('POST');
    });
  });

  describe('update()', () => {
    it('calls PUT v6/refund/:id with data and returns response', async () => {
      stubFetch(200, refundUpdateResponse);
      const client = makeClient();
      const [data, error] = await client.v6.refunds.update('73', { notes: 'Updated note' });
      expect(error).toBeNull();
      expect(data).toEqual(refundUpdateResponse);
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v6/refund/73');
      expect(init.method).toBe('PUT');
      expect(JSON.parse(init.body as string).notes).toBe('Updated note');
    });
  });

  describe('getMany()', () => {
    it('fetches multiple refunds and returns array', async () => {
      vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce({
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: vi.fn().mockResolvedValue(refund),
        })
        .mockResolvedValueOnce({
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: vi.fn().mockResolvedValue({ ...refund, id: 74, name: 'VCR202' }),
        })
      );
      const client = makeClient();
      const [data, error] = await client.v6.refunds.getMany(['73', '74']);
      expect(error).toBeNull();
      expect(data).toHaveLength(2);
    });

    it('returns VintraceAggregateError if any request fails', async () => {
      vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce({
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: vi.fn().mockResolvedValue(refund),
        })
        .mockResolvedValueOnce({
          ok: false, status: 404,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: vi.fn().mockResolvedValue({}),
        })
      );
      const client = makeClient();
      const [data, error] = await client.v6.refunds.getMany(['73', '9999']);
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(VintraceAggregateError);
    });
  });
});
