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

describe('v7.documents.attach()', () => {
  it('calls PUT v7/operation/operation/documents with data', async () => {
    const mockResponse = { documents: [{ id: 12345, name: 'delivery-docket.pdf' }], process: { id: 789, type: 'DELIVERY' } };
    stubFetch(200, mockResponse);
    const client = makeClient();
    const payload = { processId: 789, documentIds: [12345] };
    const [data, error] = await client.v7.documents.attach(payload);
    expect(error).toBeNull();
    expect(data).toEqual(mockResponse);
    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toContain('v7/operation/operation/documents');
    expect(init.method).toBe('PUT');
    expect(init.body).toBe(JSON.stringify(payload));
  });

  it('returns error on failure', async () => {
    stubFetch(500, {});
    const client = makeClient();
    const [data, error] = await client.v7.documents.attach({});
    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });
});
