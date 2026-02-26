import { describe, it, expect, vi, afterEach } from 'vitest';
import { VintraceClient, VesselDetailsReportParams } from '../../src';

const BASE_URL = 'https://test.vintrace.net';
const ORG = 'testorg';
const TOKEN = 'test-token';

function makeClient(options = {}) {
  return new VintraceClient({ baseUrl: BASE_URL, organization: ORG, token: TOKEN, options });
}

function mockFetch(status: number, body: unknown, headers: Record<string, string> = {}) {
  const responseHeaders = new Headers({ 'content-type': 'application/json', ...headers });
  const response = {
    ok: status >= 200 && status < 300,
    status,
    headers: responseHeaders,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  };
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
  return response;
}

describe('VintraceClient v7 - vessel-details-report', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('vesselDetailsReport.get()', () => {
    it('calls the correct endpoint', async () => {
      mockFetch(200, { results: [] });
      const client = makeClient();
      await client.v7.vesselDetailsReport.get();
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain(`${BASE_URL}/${ORG}/api/v7/report/vessel-details-report`);
    });

    it('passes query parameters correctly', async () => {
      mockFetch(200, { results: [] });
      const client = makeClient();
      const params: VesselDetailsReportParams = {
        limit: 10,
        offset: 0,
        asAtDate: 1650431615057,
        vesselType: 'TANK',
      };
      await client.v7.vesselDetailsReport.get(params);
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
        string,
        RequestInit,
      ];
      expect(url).toContain('limit=10');
      expect(url).toContain('offset=0');
      expect(url).toContain('asAtDate=1650431615057');
      expect(url).toContain('vesselType=TANK');
      expect(init.method).toBe('GET');
    });

    it('returns [data, null] on success', async () => {
      const mockResponse = {
        totalResults: 1,
        offset: 0,
        limit: 10,
        results: [
          {
            id: 876,
            productId: 5252,
            name: 'T25-01',
            description: '25kgal tank',
            vesselType: 'TANK',
            detailsAsAt: 16567262652,
          },
        ],
      };
      mockFetch(200, mockResponse);
      const client = makeClient();
      const [data, error] = await client.v7.vesselDetailsReport.get();
      expect(data).toEqual(mockResponse);
      expect(error).toBeNull();
    });

    it('auto-paginates and returns aggregated results when totalResults exceeds limit', async () => {
      const page1 = {
        totalResults: 3,
        offset: 0,
        limit: 2,
        results: [
          { id: 1, name: 'Vessel 1', vesselType: 'TANK' },
          { id: 2, name: 'Vessel 2', vesselType: 'TANK' },
        ],
      };
      const page2 = {
        totalResults: 3,
        offset: 2,
        limit: 2,
        results: [{ id: 3, name: 'Vessel 3', vesselType: 'TANK' }],
      };

      const responseHeaders = new Headers({ 'content-type': 'application/json' });
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: responseHeaders,
          json: vi.fn().mockResolvedValue(page1),
          text: vi.fn().mockResolvedValue(JSON.stringify(page1)),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: responseHeaders,
          json: vi.fn().mockResolvedValue(page2),
          text: vi.fn().mockResolvedValue(JSON.stringify(page2)),
        });
      vi.stubGlobal('fetch', fetchMock);

      const client = makeClient({ parallelLimit: 2 });
      const [data, error] = await client.v7.vesselDetailsReport.get({ limit: 2 });

      expect(error).toBeNull();
      expect(data?.results).toEqual([...(page1.results ?? []), ...(page2.results ?? [])]);
      expect(fetchMock).toHaveBeenCalledTimes(2);

      const [firstUrl] = fetchMock.mock.calls[0] as [string, RequestInit];
      const [secondUrl] = fetchMock.mock.calls[1] as [string, RequestInit];
      expect(firstUrl).toContain('limit=2');
      expect(firstUrl).toContain('offset=0');
      expect(secondUrl).toContain('limit=2');
      expect(secondUrl).toContain('offset=2');
    });

    it('returns [null, error] on 401', async () => {
      const headers = new Headers({ 'content-type': 'application/json' });
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue({
            ok: false,
            status: 401,
            headers,
            json: vi.fn().mockResolvedValue({}),
          })
      );
      const client = makeClient({ maxRetries: 0 });
      const [data, error] = await client.v7.vesselDetailsReport.get();
      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error?.name).toBe('VintraceAuthenticationError');
    });

    it('returns [null, error] on 404', async () => {
      const headers = new Headers({ 'content-type': 'application/json' });
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue({
            ok: false,
            status: 404,
            headers,
            json: vi.fn().mockResolvedValue({}),
          })
      );
      const client = makeClient({ maxRetries: 0 });
      const [data, error] = await client.v7.vesselDetailsReport.get();
      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error?.name).toBe('VintraceNotFoundError');
    });

    it('returns [null, error] on 500', async () => {
      const headers = new Headers({ 'content-type': 'application/json' });
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue({
            ok: false,
            status: 500,
            headers,
            json: vi.fn().mockResolvedValue({}),
          })
      );
      const client = makeClient({ maxRetries: 0 });
      const [data, error] = await client.v7.vesselDetailsReport.get();
      expect(data).toBeNull();
      expect(error).toBeDefined();
      expect(error?.name).toBe('VintraceServerError');
    });
  });
});
