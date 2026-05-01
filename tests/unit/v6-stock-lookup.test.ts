import { describe, it, expect, vi, afterEach } from 'vitest';
import { VintraceClient } from '../../src/client/VintraceClient';
import { VintraceNotFoundError } from '../../src/client/errors';

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

describe('v6.inventory.lookup()', () => {
  it('calls GET v6/stock/lookup by code', async () => {
    const mockItem = { id: 37, code: '10NVCHDEMO', description: '2010 JX Napa Chard' };
    stubFetch(200, mockItem);
    const client = makeClient();
    const [data, error] = await client.v6.inventory.lookup({ code: '10NVCHDEMO' });
    expect(error).toBeNull();
    expect(data).toEqual(mockItem);
    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toContain('v6/stock/lookup');
    expect(url).toContain('code=10NVCHDEMO');
  });

  it('calls GET v6/stock/lookup by id', async () => {
    const mockItem = { id: 37, code: '10NVCHDEMO' };
    stubFetch(200, mockItem);
    const client = makeClient();
    const [data, error] = await client.v6.inventory.lookup({ id: '37' });
    expect(error).toBeNull();
    expect(data).toEqual(mockItem);
    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toContain('id=37');
  });

  it('returns error on not found', async () => {
    stubFetch(404, { message: 'Not found' });
    const client = makeClient();
    const [data, error] = await client.v6.inventory.lookup({ code: 'NONEXISTENT' });
    expect(data).toBeNull();
    expect(error).toBeInstanceOf(VintraceNotFoundError);
  });

  it('returns error on server failure', async () => {
    stubFetch(500, { message: 'Internal Server Error' });
    const client = makeClient();
    const [data, error] = await client.v6.inventory.lookup({ id: '999' });
    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });
});
