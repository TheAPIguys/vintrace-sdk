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

describe('v7.blocks.createAssessment()', () => {
  it('calls POST v7/harvest/blocks/:id/assessments with data', async () => {
    const mockResponse = { data: { id: 1, vintage: 2021 } };
    stubFetch(200, mockResponse);
    const client = makeClient();
    const payload = { vintage: 2021, producingForecast: { value: 15, unit: 't' } };
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
