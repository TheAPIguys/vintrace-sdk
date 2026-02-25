import { describe, it, expect, vi, afterEach } from 'vitest';
import { VintraceClient } from '../../src/client/VintraceClient';
import { VintraceAggregateError, VintraceNotFoundError } from '../../src/client/errors';
import { party, individualParty, partyResponse } from '../fixtures/parties';

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

describe('v6.parties', () => {
  describe('getAll()', () => {
    it('calls GET v6/party/list and returns response', async () => {
      stubFetch(200, partyResponse);
      const client = makeClient();
      const [data, error] = await client.v6.parties.getAll();
      expect(error).toBeNull();
      expect(data).toEqual(partyResponse);
    });

    it('passes query params to the request', async () => {
      stubFetch(200, partyResponse);
      const client = makeClient();
      await client.v6.parties.getAll({ category: 'Organisations', max: '100' });
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v6/party/list');
    });

    it('returns error on failure', async () => {
      stubFetch(500, { message: 'Internal Server Error' });
      const client = makeClient();
      const [data, error] = await client.v6.parties.getAll();
      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });
  });

  describe('get()', () => {
    it('calls GET v6/party/:id and returns party', async () => {
      stubFetch(200, party);
      const client = makeClient();
      const [data, error] = await client.v6.parties.get('43');
      expect(error).toBeNull();
      expect(data).toEqual(party);
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v6/party/43');
    });

    it('returns VintraceNotFoundError for unknown id', async () => {
      stubFetch(404, { message: 'Not Found' });
      const client = makeClient();
      const [data, error] = await client.v6.parties.get('999');
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(VintraceNotFoundError);
    });

    it('returns individual party correctly', async () => {
      stubFetch(200, individualParty);
      const client = makeClient();
      const [data, error] = await client.v6.parties.get('13');
      expect(error).toBeNull();
      expect(data).toEqual(individualParty);
    });
  });

  describe('getMany()', () => {
    it('fetches multiple parties and returns array', async () => {
      vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce({
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: vi.fn().mockResolvedValue(party),
        })
        .mockResolvedValueOnce({
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: vi.fn().mockResolvedValue(individualParty),
        })
      );
      const client = makeClient();
      const [data, error] = await client.v6.parties.getMany(['43', '13']);
      expect(error).toBeNull();
      expect(data).toHaveLength(2);
    });

    it('returns VintraceAggregateError if any request fails', async () => {
      vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce({
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: vi.fn().mockResolvedValue(party),
        })
        .mockResolvedValueOnce({
          ok: false, status: 404,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: vi.fn().mockResolvedValue({}),
        })
      );
      const client = makeClient();
      const [data, error] = await client.v6.parties.getMany(['43', '9999']);
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(VintraceAggregateError);
    });
  });
});
