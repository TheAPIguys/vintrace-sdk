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

const mockBlockData = {
  id: 1,
  name: 'Block A',
  code: 'BLK-A',
  grower: { id: 10, extId: 'G-001', name: 'Grower 1' },
  vineyard: { id: 20, name: 'Vineyard 1', grower: { id: 10, extId: 'G-001', name: 'Grower 1' } },
  region: { id: 30, name: 'Region 1' },
  variety: { id: 40, name: 'Variety 1' },
};

const mockPaginatedResponse = {
  totalResults: 2,
  offset: 0,
  limit: 100,
  results: [mockBlockData],
};

describe('v7.blocks', () => {
  describe('getAll()', () => {
    it('calls GET v7/harvest/blocks with default params', async () => {
      stubFetch(200, mockPaginatedResponse);
      const client = makeClient();
      const [data, error] = await client.v7.blocks.getAll();
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].id).toBe(1);
      expect(data![0].name).toBe('Block A');
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v7/harvest/blocks');
      expect(init.method).toBe('GET');
    });

    it('passes typed query params', async () => {
      stubFetch(200, mockPaginatedResponse);
      const client = makeClient();
      await client.v7.blocks.getAll({ include: 'fruitPlacements', vintage: '2026', limit: 50 });
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('include=fruitPlacements');
      expect(url).toContain('vintage=2026');
      expect(url).toContain('limit=50');
      expect(url).toContain('offset=0');
    });

    it('returns error on failure', async () => {
      stubFetch(500, {});
      const client = makeClient();
      const [data, error] = await client.v7.blocks.getAll();
      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });

    it('returns empty array on empty body', async () => {
      stubFetch(200, {});
      const client = makeClient();
      const [data, error] = await client.v7.blocks.getAll();
      expect(data).toEqual([]);
      expect(error).toBeNull();
    });

    it('paginates across multiple pages', async () => {
      const page1 = { totalResults: 250, limit: 100, results: Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Block ${i}` })) };
      const page2 = { totalResults: 250, limit: 100, results: Array.from({ length: 100 }, (_, i) => ({ id: 100 + i, name: `Block ${100 + i}` })) };
      const page3 = { totalResults: 250, limit: 100, results: Array.from({ length: 50 }, (_, i) => ({ id: 200 + i, name: `Block ${200 + i}` })) };
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, status: 200, headers: new Headers({ 'content-type': 'application/json' }), json: vi.fn().mockResolvedValue(page1) })
        .mockResolvedValueOnce({ ok: true, status: 200, headers: new Headers({ 'content-type': 'application/json' }), json: vi.fn().mockResolvedValue(page2) })
        .mockResolvedValueOnce({ ok: true, status: 200, headers: new Headers({ 'content-type': 'application/json' }), json: vi.fn().mockResolvedValue(page3) });
      vi.stubGlobal('fetch', mockFetch);
      const client = makeClient();
      const [data, error] = await client.v7.blocks.getAll();
      expect(error).toBeNull();
      expect(data).toHaveLength(250);
    });
  });

  describe('post()', () => {
    it('calls POST v7/harvest/blocks with data and unwraps response.data', async () => {
      const mockResponse = { data: { id: 123, name: 'New Block', code: 'NB-1' } };
      stubFetch(200, mockResponse);
      const client = makeClient();
      const payload = { name: 'New Block', extId: 'EXT-001' };
      const [data, error] = await client.v7.blocks.post(payload);
      expect(error).toBeNull();
      expect(data).toEqual(mockResponse.data);
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v7/harvest/blocks');
      expect(init.method).toBe('POST');
      expect(init.body).toBe(JSON.stringify(payload));
    });

    it('returns error on failure', async () => {
      stubFetch(500, {});
      const client = makeClient();
      const [data, error] = await client.v7.blocks.post({});
      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });

    it('returns validation error when response body is empty', async () => {
      stubFetch(200, {});
      const client = makeClient();
      const [data, error] = await client.v7.blocks.post({});
      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });
  });

  describe('createAssessment()', () => {
    it('calls POST v7/harvest/blocks/:id/assessments with data', async () => {
      const mockResponse = { data: { id: 1, vintage: 2021 } };
      stubFetch(200, mockResponse);
      const client = makeClient();
      const payload = { vintage: 2021 };
      const [data, error] = await client.v7.blocks.createAssessment('123', payload);
      expect(error).toBeNull();
      expect(data).toEqual(mockResponse);
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v7/harvest/blocks/123/assessments');
      expect(init.method).toBe('POST');
      expect(init.body).toBe(JSON.stringify(payload));
    });

    it('returns error on server failure', async () => {
      stubFetch(500, { message: 'Server error' });
      const client = makeClient();
      const [data, error] = await client.v7.blocks.createAssessment('999', {});
      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });
  });

  describe('patch()', () => {
    it('calls PATCH v7/harvest/blocks/:id with data', async () => {
      stubFetch(200, { data: { id: 1 } });
      const client = makeClient();
      const payload = { description: 'Updated' };
      const [data, error] = await client.v7.blocks.patch('1', payload);
      expect(error).toBeNull();
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v7/harvest/blocks/1');
      expect(init.method).toBe('PATCH');
      expect(init.body).toBe(JSON.stringify(payload));
    });
  });
});
