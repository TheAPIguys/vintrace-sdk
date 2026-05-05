import { describe, it, expect, vi, afterEach } from 'vitest';
import { VintraceClient } from '../../src/client/VintraceClient';
import { mockWineBatchItem, mockPaginatedResponse, mockCreateResponse } from '../fixtures/wine-batches';
import type { WineBatchData } from '../../src/validation/schemas';

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

describe('v7.wineBatches', () => {
  describe('getAll()', () => {
    it('calls GET v7/operation/wine-batches and returns typed WineBatchData[]', async () => {
      stubFetch(200, mockPaginatedResponse);
      const client = makeClient();
      const [data, error] = await client.v7.wineBatches.getAll();
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      const item = data![0];
      expect(item.id).toBe(571);
      expect(item.batchCode).toBe('test-batchCode');
      expect(item.productionYear).toBe(2022);
      expect(item.owner).toBeDefined();
      expect(item.owner!.name).toBe('JX2 Winery');
      expect(item.grading).toBeDefined();
      expect(item.grading!.scaleName).toBe('Wine');
      expect(item.winery).toBeDefined();
      expect(item.winery!.name).toBe('My Winery');
      expect(item.fractionType).toBe('FREE_RUN');
      expect(item.inactive).toBe(false);
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v7/operation/wine-batches');
      expect(init.method).toBe('GET');
    });

    it('passes query params', async () => {
      stubFetch(200, { totalResults: 0, results: [] });
      const client = makeClient();
      await client.v7.wineBatches.getAll({ limit: 50, offset: 10, include: 'vessels' });
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('limit=50');
      expect(url).toContain('offset=10');
      expect(url).toContain('include=vessels');
    });

    it('passes ids param when provided', async () => {
      stubFetch(200, { totalResults: 0, results: [] });
      const client = makeClient();
      await client.v7.wineBatches.getAll({ ids: '1,2,3' });
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('ids=1%2C2%2C3');
    });

    it('returns validation error when response is null', async () => {
      stubFetch(200, null);
      const client = makeClient();
      const [data, error] = await client.v7.wineBatches.getAll();
      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });

    it('returns error on failure', async () => {
      stubFetch(500, {});
      const client = makeClient();
      const [data, error] = await client.v7.wineBatches.getAll();
      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });

    it('auto-paginates when totalResults > limit', async () => {
      const page1 = { totalResults: 150, offset: 0, limit: 100, results: Array.from({ length: 100 }, (_, i) => ({ ...mockWineBatchItem, id: i })) };
      const page2 = { totalResults: 150, offset: 100, limit: 100, results: Array.from({ length: 50 }, (_, i) => ({ ...mockWineBatchItem, id: 100 + i })) };
      stubFetch(200, page1);
      const fetchMock = vi.mocked(fetch);
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue(page2),
      });
      const client = makeClient();
      const [data, error] = await client.v7.wineBatches.getAll();
      expect(error).toBeNull();
      expect(data).toHaveLength(150);
    });

    it('returns validation error on malformed response', async () => {
      stubFetch(200, { totalResults: 1, results: [{ id: 'not-a-number' }] });
      const client = makeClient();
      const [data, error] = await client.v7.wineBatches.getAll();
      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });
  });

  describe('create()', () => {
    it('calls POST v7/operation/wine-batches with data and returns typed response', async () => {
      stubFetch(201, mockCreateResponse);
      const client = makeClient();
      const payload = {
        batchCode: 'new-batch',
        productionYear: 2023,
        winery: { id: 5, name: 'My Winery' },
        owner: { id: 1, name: 'Owner' },
      };
      const [data, error] = await client.v7.wineBatches.create(payload);
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.data).toBeDefined();
      expect(data!.data!.batchCode).toBe('test-batchCode');
      expect(data!.data!.id).toBe(572);
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v7/operation/wine-batches');
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body!)).toEqual(payload);
    });

    it('returns validation error when required fields are missing', async () => {
      stubFetch(201, mockCreateResponse);
      const client = makeClient();
      const [data, error] = await client.v7.wineBatches.create({} as any);
      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });

    it('returns error on failure', async () => {
      stubFetch(500, {});
      const client = makeClient();
      const payload = {
        batchCode: 'new-batch',
        productionYear: 2023,
        winery: { id: 5, name: 'My Winery' },
        owner: { id: 1, name: 'Owner' },
      };
      const [data, error] = await client.v7.wineBatches.create(payload);
      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });
  });
});
