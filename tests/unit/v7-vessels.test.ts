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

describe('v7.vessels', () => {
  describe('getBarrel()', () => {
    it('calls GET v7/vessel/barrels/:id', async () => {
      stubFetch(200, { id: 1, name: '2019-0012' });
      const client = makeClient();
      const [data, error] = await client.v7.vessels.getBarrel('1');
      expect(error).toBeNull();
      expect(data).toEqual({ id: 1, name: '2019-0012' });
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v7/vessel/barrels/1');
    });

    it('returns error on not found', async () => {
      stubFetch(404, {});
      const client = makeClient();
      const [data, error] = await client.v7.vessels.getBarrel('999');
      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });
  });

  describe('getBarrelGroup()', () => {
    it('calls GET v7/vessel/barrel-groups/:id', async () => {
      stubFetch(200, { id: 1, name: 'BG-1' });
      const client = makeClient();
      const [data, error] = await client.v7.vessels.getBarrelGroup('1');
      expect(error).toBeNull();
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v7/vessel/barrel-groups/1');
    });
  });

  describe('createTank()', () => {
    it('calls POST v7/vessel/tanks with data', async () => {
      stubFetch(201, { data: { id: 1, name: '15-0086' } });
      const client = makeClient();
      const payload = { name: '15-0086', capacity: { value: 225, unit: 'L' } };
      const [data, error] = await client.v7.vessels.createTank(payload);
      expect(error).toBeNull();
      expect(data).toEqual({ data: { id: 1, name: '15-0086' } });
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v7/vessel/tanks');
      expect(init.method).toBe('POST');
      expect(init.body).toBe(JSON.stringify(payload));
    });
  });

  describe('getTank()', () => {
    it('calls GET v7/vessel/tanks/:id', async () => {
      stubFetch(200, { id: 1 });
      const client = makeClient();
      const [data, error] = await client.v7.vessels.getTank('1');
      expect(error).toBeNull();
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v7/vessel/tanks/1');
    });
  });

  describe('getTanker()', () => {
    it('calls GET v7/vessel/tankers/:id', async () => {
      stubFetch(200, { id: 1 });
      const client = makeClient();
      const [data, error] = await client.v7.vessels.getTanker('1');
      expect(error).toBeNull();
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v7/vessel/tankers/1');
    });
  });

  describe('getBin()', () => {
    it('calls GET v7/vessel/bins/:id', async () => {
      stubFetch(200, { id: 1 });
      const client = makeClient();
      const [data, error] = await client.v7.vessels.getBin('1');
      expect(error).toBeNull();
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v7/vessel/bins/1');
    });
  });
});
