import { describe, it, expect, vi, afterEach } from 'vitest';
import { VintraceClient, CostsBusinessUnitTransactionsParams } from '../../src';

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

describe('VintraceClient v7 - Costs', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('costs.businessUnitTransactions()', () => {
    it('calls the correct endpoint', async () => {
      mockFetch(200, { results: [] });
      const client = makeClient();
      await client.v7.costs.businessUnitTransactions({ startDate: 1704067200000, endDate: 1706745600000 });
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain(`${BASE_URL}/${ORG}/api/v7/costs/business-unit-transactions`);
    });

    it('passes query parameters correctly', async () => {
      mockFetch(200, { results: [] });
      const client = makeClient();
      const params: CostsBusinessUnitTransactionsParams = {
        startDate: 1704067200000,
        endDate: 1706745600000,
        limit: 10,
        offset: 5,
        businessUnit: 'BU001',
      };
      await client.v7.costs.businessUnitTransactions(params);
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('startDate=1704067200000');
      expect(url).toContain('endDate=1706745600000');
      expect(url).toContain('limit=10');
      expect(url).toContain('offset=5');
      expect(url).toContain('businessUnit=BU001');
      expect(init.method).toBe('GET');
    });

    it('returns [data, null] on success', async () => {
      const mockResponse = {
        totalResults: 1,
        offset: 0,
        limit: 10,
        results: [{ activityDate: 1704067200000, activityType: 'TRANSFER' }],
      };
      mockFetch(200, mockResponse);
      const client = makeClient();
      const [data, error] = await client.v7.costs.businessUnitTransactions({
        startDate: 1704067200000,
        endDate: 1706745600000,
      });
      expect(data).toEqual(mockResponse.results);
      expect(error).toBeNull();
    });
  });
});

describe('VintraceClient v7 - FruitIntakes', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fruitIntakes.updatePricing()', () => {
    it('calls the correct endpoint with fruitIntakeId', async () => {
      mockFetch(200, { data: { pricePerTon: 500 } });
      const client = makeClient();
      await client.v7.fruitIntakes.updatePricing('123', { pricePerTon: 500 });
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/${ORG}/api/v7/operation/fruit-intakes/123/pricing`);
      expect(init.method).toBe('PUT');
    });
  });

  describe('fruitIntakes.updateMetrics()', () => {
    it('calls the correct endpoint with fruitIntakeId', async () => {
      mockFetch(200, {});
      const client = makeClient();
      await client.v7.fruitIntakes.updateMetrics('123', { metrics: [{ name: 'brix', value: 22.5 }] });
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/${ORG}/api/v7/operation/fruit-intakes/123/metrics`);
      expect(init.method).toBe('PUT');
    });
  });
});

describe('VintraceClient v7 - Tirage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('tirage.get()', () => {
    it('calls the correct endpoint with operationId', async () => {
      mockFetch(200, { data: { id: 1 } });
      const client = makeClient();
      await client.v7.tirage.get('123');
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/${ORG}/api/v7/operation/tirage/123`);
      expect(init.method).toBe('GET');
    });

    it('returns [data, null] on success', async () => {
      const mockResponse = { data: { id: 1, status: 'COMPLETED' } };
      mockFetch(200, mockResponse);
      const client = makeClient();
      const [data, error] = await client.v7.tirage.get('123');
      expect(data).toEqual(mockResponse);
      expect(error).toBeNull();
    });
  });

  describe('tirage.patch()', () => {
    it('calls the correct endpoint with operationId', async () => {
      mockFetch(200, {});
      const client = makeClient();
      await client.v7.tirage.patch('123', { status: 'COMPLETED' });
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/${ORG}/api/v7/operation/tirage/123`);
      expect(init.method).toBe('PATCH');
    });
  });
});

describe('VintraceClient v7 - BarrelsMovements', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('barrelsMovements.post()', () => {
    it('calls the correct endpoint', async () => {
      mockFetch(200, { id: 1 });
      const client = makeClient();
      await client.v7.barrelsMovements.post({
        fromLocation: 'Location A',
        toLocation: 'Location B',
        barrels: ['B001', 'B002'],
      });
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/${ORG}/api/v7/operation/barrels-movements`);
      expect(init.method).toBe('POST');
      expect(init.body).toContain('Location A');
    });

    it('returns [data, null] on success', async () => {
      const mockResponse = { id: 1, fromLocation: 'Location A', toLocation: 'Location B' };
      mockFetch(200, mockResponse);
      const client = makeClient();
      const [data, error] = await client.v7.barrelsMovements.post({});
      expect(data).toEqual(mockResponse);
      expect(error).toBeNull();
    });
  });
});

describe('VintraceClient v7 - Bookings', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('bookings.post()', () => {
    it('calls the correct endpoint', async () => {
      mockFetch(200, { data: { id: 1 } });
      const client = makeClient();
      await client.v7.bookings.post({ bookingType: 'PICKING' });
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/${ORG}/api/v7/operation/bookings`);
      expect(init.method).toBe('POST');
    });

    it('returns [data, null] on success', async () => {
      const mockResponse = { data: { id: 1, bookingType: 'PICKING' } };
      mockFetch(200, mockResponse);
      const client = makeClient();
      const [data, error] = await client.v7.bookings.post({});
      expect(data).toEqual(mockResponse);
      expect(error).toBeNull();
    });
  });

  describe('bookings.deactivate()', () => {
    it('calls the correct endpoint with id', async () => {
      mockFetch(200, { status: 'success' });
      const client = makeClient();
      await client.v7.bookings.deactivate('123');
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/${ORG}/api/v7/operation/bookings/123/deactivation`);
      expect(init.method).toBe('POST');
    });
  });
});
