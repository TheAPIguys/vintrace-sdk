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

describe('VintraceClient v7 - Assessments', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('assessments.getAll()', () => {
    it('calls the correct endpoint', async () => {
      mockFetch(200, { results: [] });
      const client = makeClient();
      await client.v7.assessments.getAll();
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain(`${BASE_URL}/${ORG}/api/v7/harvest/assessments`);
    });

    it('passes pagination parameters correctly', async () => {
      mockFetch(200, { results: [] });
      const client = makeClient();
      await client.v7.assessments.getAll({ limit: 20, offset: 10 });
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('limit=20');
      expect(url).toContain('offset=10');
      expect(init.method).toBe('GET');
    });

    it('returns [data, null] on success', async () => {
      const mockResponse = {
        totalResults: 2,
        offset: 0,
        limit: 10,
        results: [
          { id: 1, blockId: 100, brix: 22.5 },
          { id: 2, blockId: 101, brix: 23.0 },
        ],
      };
      mockFetch(200, mockResponse);
      const client = makeClient();
      const [data, error] = await client.v7.assessments.getAll();
      expect(data).toEqual(mockResponse.results);
      expect(error).toBeNull();
    });
  });
});

describe('VintraceClient v7 - Vineyards', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('vineyards.post()', () => {
    it('calls the correct endpoint', async () => {
      mockFetch(200, { data: { id: 1, name: 'Test Vineyard' } });
      const client = makeClient();
      await client.v7.vineyards.post({ name: 'Test Vineyard', grower: { id: 1 } });
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/${ORG}/api/v7/harvest/vineyards`);
      expect(init.method).toBe('POST');
      expect(init.body).toContain('Test Vineyard');
    });

    it('returns [data, null] on success', async () => {
      const mockResponse = { data: { id: 1, name: 'Test Vineyard', grower: { id: 1 } } };
      mockFetch(200, mockResponse);
      const client = makeClient();
      const [data, error] = await client.v7.vineyards.post({ name: 'Test Vineyard' });
      expect(data).toEqual(mockResponse);
      expect(error).toBeNull();
    });
  });
});

describe('VintraceClient v7 - MaturitySamples', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('maturitySamples.post()', () => {
    it('calls the correct endpoint', async () => {
      mockFetch(200, { data: { id: 1 } });
      const client = makeClient();
      await client.v7.maturitySamples.post({ vineyard: 'Test Vineyard' });
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/${ORG}/api/v7/harvest/maturity-samples`);
      expect(init.method).toBe('POST');
    });

    it('returns [data, null] on success', async () => {
      const mockResponse = { data: { id: 1, sampleDate: 1704067200000 } };
      mockFetch(200, mockResponse);
      const client = makeClient();
      const [data, error] = await client.v7.maturitySamples.post({});
      expect(data).toEqual(mockResponse);
      expect(error).toBeNull();
    });
  });
});

describe('VintraceClient v7 - Parties (identity)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('parties.getAll()', () => {
    it('calls the correct endpoint', async () => {
      mockFetch(200, { results: [] });
      const client = makeClient();
      await client.v7.parties.getAll();
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain(`${BASE_URL}/${ORG}/api/v7/identity/parties`);
    });

    it('passes pagination parameters correctly', async () => {
      mockFetch(200, { results: [] });
      const client = makeClient();
      await client.v7.parties.getAll({ limit: 20, offset: 10 });
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('limit=20');
      expect(url).toContain('offset=10');
      expect(init.method).toBe('GET');
    });

    it('returns [data, null] on success', async () => {
      const mockResponse = {
        totalResults: 2,
        results: [
          { id: 1, name: 'Party A' },
          { id: 2, name: 'Party B' },
        ],
      };
      mockFetch(200, mockResponse);
      const client = makeClient();
      const [data, error] = await client.v7.parties.getAll();
      expect(data).toEqual(mockResponse.results);
      expect(error).toBeNull();
    });
  });

  describe('parties.post()', () => {
    it('calls the correct endpoint', async () => {
      mockFetch(200, { id: 1, name: 'New Party' });
      const client = makeClient();
      await client.v7.parties.post({ name: 'New Party' });
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/${ORG}/api/v7/identity/parties`);
      expect(init.method).toBe('POST');
    });

    it('returns [data, null] on success', async () => {
      const mockResponse = { id: 1, name: 'New Party' };
      mockFetch(200, mockResponse);
      const client = makeClient();
      const [data, error] = await client.v7.parties.post({ name: 'New Party' });
      expect(data).toEqual(mockResponse);
      expect(error).toBeNull();
    });
  });
});

describe('VintraceClient v7 - Shipments', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('shipments.getAll()', () => {
    it('calls the correct endpoint', async () => {
      mockFetch(200, { results: [] });
      const client = makeClient();
      await client.v7.shipments.getAll();
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain(`${BASE_URL}/${ORG}/api/v7/operation/shipments`);
    });

    it('passes pagination parameters correctly', async () => {
      mockFetch(200, { results: [] });
      const client = makeClient();
      await client.v7.shipments.getAll({ limit: 20, offset: 10 });
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('limit=20');
      expect(url).toContain('offset=10');
      expect(init.method).toBe('GET');
    });

    it('returns [data, null] on success', async () => {
      const mockResponse = {
        totalResults: 1,
        results: [{ id: 1, code: 'SHIP001', status: 'COMPLETED' }],
      };
      mockFetch(200, mockResponse);
      const client = makeClient();
      const [data, error] = await client.v7.shipments.getAll();
      expect(data).toEqual(mockResponse.results);
      expect(error).toBeNull();
    });
  });
});

describe('VintraceClient v7 - BarrelTreatments', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('barrelTreatments.getAll()', () => {
    it('calls the correct endpoint', async () => {
      mockFetch(200, { results: [] });
      const client = makeClient();
      await client.v7.barrelTreatments.getAll();
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain(`${BASE_URL}/${ORG}/api/v7/operation/barrel-treatments`);
    });

    it('passes pagination parameters correctly', async () => {
      mockFetch(200, { results: [] });
      const client = makeClient();
      await client.v7.barrelTreatments.getAll({ limit: 20, offset: 10 });
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('limit=20');
      expect(url).toContain('offset=10');
      expect(init.method).toBe('GET');
    });

    it('returns [data, null] on success', async () => {
      const mockResponse = {
        totalResults: 1,
        results: [{ id: 1, treatmentDate: 1704067200000 }],
      };
      mockFetch(200, mockResponse);
      const client = makeClient();
      const [data, error] = await client.v7.barrelTreatments.getAll();
      expect(data).toEqual(mockResponse.results);
      expect(error).toBeNull();
    });
  });
});

describe('VintraceClient v7 - FruitIntakes', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fruitIntakes.post()', () => {
    it('calls the correct endpoint', async () => {
      mockFetch(200, { data: { id: 1 } });
      const client = makeClient();
      await client.v7.fruitIntakes.post({ block: 'Block A' });
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/${ORG}/api/v7/operation/fruit-intakes`);
      expect(init.method).toBe('POST');
    });

    it('returns [data, null] on success', async () => {
      const mockResponse = { data: { id: 1, block: 'Block A' } };
      mockFetch(200, mockResponse);
      const client = makeClient();
      const [data, error] = await client.v7.fruitIntakes.post({});
      expect(data).toEqual(mockResponse);
      expect(error).toBeNull();
    });
  });

  describe('fruitIntakes.updatePricing()', () => {
    it('calls the correct endpoint with fruitIntakeId', async () => {
      mockFetch(200, { data: { pricePerTon: 500 } });
      const client = makeClient();
      await client.v7.fruitIntakes.updatePricing('123', { pricePerTon: 500 });
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/${ORG}/api/v7/operation/fruit-intakes/123/pricing`);
      expect(init.method).toBe('POST');
    });
  });

  describe('fruitIntakes.updateMetrics()', () => {
    it('calls the correct endpoint with fruitIntakeId', async () => {
      mockFetch(200, {});
      const client = makeClient();
      await client.v7.fruitIntakes.updateMetrics('123', { brix: 22.5 });
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/${ORG}/api/v7/operation/fruit-intakes/123/metrics`);
      expect(init.method).toBe('POST');
    });
  });
});

describe('VintraceClient v7 - BulkIntakes', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('bulkIntakes.getAll()', () => {
    it('calls the correct endpoint', async () => {
      mockFetch(200, { results: [] });
      const client = makeClient();
      await client.v7.bulkIntakes.getAll();
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain(`${BASE_URL}/${ORG}/api/v7/operation/bulk-intakes`);
    });

    it('passes pagination parameters correctly', async () => {
      mockFetch(200, { results: [] });
      const client = makeClient();
      await client.v7.bulkIntakes.getAll({ limit: 20, offset: 10 });
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('limit=20');
      expect(url).toContain('offset=10');
      expect(init.method).toBe('GET');
    });

    it('returns [data, null] on success', async () => {
      const mockResponse = {
        totalResults: 1,
        results: [{ id: 1, code: 'BI001' }],
      };
      mockFetch(200, mockResponse);
      const client = makeClient();
      const [data, error] = await client.v7.bulkIntakes.getAll();
      expect(data).toEqual(mockResponse.results);
      expect(error).toBeNull();
    });
  });

  describe('bulkIntakes.post()', () => {
    it('calls the correct endpoint', async () => {
      mockFetch(200, { id: 1 });
      const client = makeClient();
      await client.v7.bulkIntakes.post({ code: 'BI001' });
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/${ORG}/api/v7/operation/bulk-intakes`);
      expect(init.method).toBe('POST');
    });
  });

  describe('bulkIntakes.patch()', () => {
    it('calls the correct endpoint with id', async () => {
      mockFetch(200, {});
      const client = makeClient();
      await client.v7.bulkIntakes.patch('123', { status: 'COMPLETED' });
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/${ORG}/api/v7/operation/bulk-intakes/123`);
      expect(init.method).toBe('PATCH');
    });
  });
});

describe('VintraceClient v7 - TrialBlends', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('trialBlends.getAll()', () => {
    it('calls the correct endpoint', async () => {
      mockFetch(200, { results: [] });
      const client = makeClient();
      await client.v7.trialBlends.getAll();
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain(`${BASE_URL}/${ORG}/api/v7/operation/trial-blends`);
    });

    it('passes pagination parameters correctly', async () => {
      mockFetch(200, { results: [] });
      const client = makeClient();
      await client.v7.trialBlends.getAll({ limit: 20, offset: 10 });
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('limit=20');
      expect(url).toContain('offset=10');
      expect(init.method).toBe('GET');
    });

    it('returns [data, null] on success', async () => {
      const mockResponse = {
        totalResults: 1,
        results: [{ id: 1, name: 'TB001', status: 'DRAFT' }],
      };
      mockFetch(200, mockResponse);
      const client = makeClient();
      const [data, error] = await client.v7.trialBlends.getAll();
      expect(data).toEqual(mockResponse.results);
      expect(error).toBeNull();
    });
  });
});

describe('VintraceClient v7 - WorkOrders', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('workOrders.getAll()', () => {
    it('calls the correct endpoint', async () => {
      mockFetch(200, { results: [] });
      const client = makeClient();
      await client.v7.workOrders.getAll();
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain(`${BASE_URL}/${ORG}/api/v7/operation/work-orders`);
    });

    it('passes pagination parameters correctly', async () => {
      mockFetch(200, { results: [] });
      const client = makeClient();
      await client.v7.workOrders.getAll({ limit: 20, offset: 10 });
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('limit=20');
      expect(url).toContain('offset=10');
      expect(init.method).toBe('GET');
    });

    it('returns [data, null] on success', async () => {
      const mockResponse = {
        totalResults: 1,
        results: [{ id: 1, code: 'WO001', status: 'READY' }],
      };
      mockFetch(200, mockResponse);
      const client = makeClient();
      const [data, error] = await client.v7.workOrders.getAll();
      expect(data).toEqual(mockResponse.results);
      expect(error).toBeNull();
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
