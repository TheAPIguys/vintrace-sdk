import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VintraceClient } from '../../src/client/VintraceClient';
import {
  VintraceAuthenticationError,
  VintraceNotFoundError,
  VintraceRateLimitError,
  VintraceServerError,
  VintraceValidationError,
} from '../../src/client/errors';

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

describe('VintraceClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('stores baseUrl, organization, and token', () => {
      const client = makeClient();
      expect(client.baseUrl).toBe(BASE_URL);
      expect(client.organization).toBe(ORG);
      expect(client.token).toBe(TOKEN);
    });

    it('merges options with defaults', () => {
      const client = makeClient({ timeout: 5000 });
      expect(client.options.timeout).toBe(5000);
      expect(client.options.maxRetries).toBeDefined();
    });

    it('exposes v6 and v7 namespaces', () => {
      const client = makeClient();
      expect(client.v6).toBeDefined();
      expect(client.v7).toBeDefined();
    });

    it('v6 exposes all module accessors', () => {
      const client = makeClient();
      expect(client.v6.workOrders).toBeDefined();
      expect(client.v6.salesOrders).toBeDefined();
      expect(client.v6.refunds).toBeDefined();
      expect(client.v6.parties).toBeDefined();
      expect(client.v6.products).toBeDefined();
    });
  });

  describe('request()', () => {
    it('constructs the correct URL with organization prefix', async () => {
      mockFetch(200, { ok: true });
      const client = makeClient();
      await client.request('v6/workorders/list', 'GET');
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/${ORG}/api/v6/workorders/list`);
    });

    it('sends Authorization Bearer header', async () => {
      mockFetch(200, {});
      const client = makeClient();
      await client.request('v6/workorders/list', 'GET');
      const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect((init.headers as Record<string, string>)['Authorization']).toBe(`Bearer ${TOKEN}`);
    });

    it('sends correlation-id header', async () => {
      mockFetch(200, {});
      const client = makeClient();
      await client.request('v6/workorders/list', 'GET');
      const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect((init.headers as Record<string, string>)['correlation-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });

    it('returns [data, null] on 200', async () => {
      const body = { id: 1 };
      mockFetch(200, body);
      const client = makeClient();
      const [data, error] = await client.request<{ id: number }>('v6/workorders/1', 'GET');
      expect(data).toEqual(body);
      expect(error).toBeNull();
    });

    it('returns [null, null] on 204', async () => {
      const responseHeaders = new Headers({ 'content-type': 'application/json' });
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: true, status: 204, headers: responseHeaders })
      );
      const client = makeClient();
      const [data, error] = await client.request('v6/workorders/1', 'DELETE');
      expect(data).toBeNull();
      expect(error).toBeNull();
    });

    it('returns [null, VintraceAuthenticationError] on 401', async () => {
      const headers = new Headers({ 'content-type': 'application/json' });
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: false, status: 401, headers, json: vi.fn().mockResolvedValue({}) })
      );
      const client = makeClient({ maxRetries: 0 });
      const [data, error] = await client.request('v6/workorders/list', 'GET');
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(VintraceAuthenticationError);
    });

    it('returns [null, VintraceNotFoundError] on 404', async () => {
      const headers = new Headers({ 'content-type': 'application/json' });
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: false, status: 404, headers, json: vi.fn().mockResolvedValue({}) })
      );
      const client = makeClient({ maxRetries: 0 });
      const [data, error] = await client.request('v6/workorders/999', 'GET');
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(VintraceNotFoundError);
    });

    it('returns [null, VintraceValidationError] on 400', async () => {
      const headers = new Headers({ 'content-type': 'application/json' });
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: false, status: 400, headers, json: vi.fn().mockResolvedValue({}) })
      );
      const client = makeClient({ maxRetries: 0 });
      const [data, error] = await client.request('v6/sales-order', 'POST');
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(VintraceValidationError);
    });

    it('returns [null, VintraceServerError] on 500', async () => {
      const headers = new Headers({ 'content-type': 'application/json' });
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: false, status: 500, headers, json: vi.fn().mockResolvedValue({}) })
      );
      const client = makeClient({ maxRetries: 0 });
      const [data, error] = await client.request('v6/workorders/list', 'GET');
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(VintraceServerError);
    });

    it('returns [null, VintraceRateLimitError] on 429', async () => {
      const headers = new Headers({ 'content-type': 'application/json', 'retry-after': '5' });
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: false, status: 429, headers, json: vi.fn().mockResolvedValue({}) })
      );
      const client = makeClient({ maxRetries: 0 });
      const [data, error] = await client.request('v6/workorders/list', 'GET');
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(VintraceRateLimitError);
      expect((error as VintraceRateLimitError).retryAfter).toBe(5);
    });

    it('serialises body as JSON for POST', async () => {
      mockFetch(200, {});
      const client = makeClient();
      const body = { workOrderId: 25 };
      await client.request('v6/workorders/assign', 'POST', {}, body);
      const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(init.body).toBe(JSON.stringify(body));
    });
  });
});

describe('VintraceClient retry behaviour', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('retries on 500 and eventually returns the error', async () => {
    const headers = new Headers({ 'content-type': 'application/json' });
    const failResponse = { ok: false, status: 500, headers, json: vi.fn().mockResolvedValue({}) };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(failResponse));

    const client = makeClient({ maxRetries: 1 });
    const promise = client.request('v6/workorders/list', 'GET');
    // advance past retry delay
    await vi.runAllTimersAsync();
    const [data, error] = await promise;
    expect(data).toBeNull();
    expect(error).toBeInstanceOf(VintraceServerError);
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('does not retry on 401', async () => {
    const headers = new Headers({ 'content-type': 'application/json' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 401, headers, json: vi.fn().mockResolvedValue({}) })
    );
    const client = makeClient({ maxRetries: 2 });
    const [, error] = await client.request('v6/workorders/list', 'GET');
    expect(error).toBeInstanceOf(VintraceAuthenticationError);
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
  });
});
