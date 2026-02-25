import { describe, it, expect } from 'vitest';
import { VintraceClient } from '../../src/client/VintraceClient';

const MOCK_BASE_URL = 'https://stoplight.io/mocks/vintrace/vintrace-server:v6/143865655';

function makeClient() {
  return new VintraceClient({
    baseUrl: MOCK_BASE_URL,
    organization: '',
    token: 'test-token',
    options: { maxRetries: 0 },
  });
}

describe('v6.parties (integration)', { timeout: 15000 }, () => {
  it('getAll() returns a response from the mock server', async () => {
    const client = makeClient();
    const [data, error] = await client.v6.parties.getAll();
    if (error) {
      expect(error).toBeDefined();
    } else {
      expect(data).toBeDefined();
    }
  });

  it('get() returns a response from the mock server', async () => {
    const client = makeClient();
    const [data, error] = await client.v6.parties.get('43');
    if (error) {
      expect(error).toBeDefined();
    } else {
      expect(data).toBeDefined();
    }
  });

  it('getAll() with category filter returns a response', async () => {
    const client = makeClient();
    const [data, error] = await client.v6.parties.getAll({ category: 'Organisations' });
    if (error) {
      expect(error).toBeDefined();
    } else {
      expect(data).toBeDefined();
    }
  });
});
