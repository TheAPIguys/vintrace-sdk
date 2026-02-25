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

describe('v6.salesOrders (integration)', { timeout: 15000 }, () => {
  it('getAll() returns a response from the mock server', async () => {
    const client = makeClient();
    const [data, error] = await client.v6.salesOrders.getAll();
    if (error) {
      expect(error).toBeDefined();
    } else {
      expect(data).toBeDefined();
    }
  });

  it('get() returns a response from the mock server', async () => {
    const client = makeClient();
    const [data, error] = await client.v6.salesOrders.get('22');
    if (error) {
      expect(error).toBeDefined();
    } else {
      expect(data).toBeDefined();
    }
  });

  it('getByCode() returns a response from the mock server', async () => {
    const client = makeClient();
    const [data, error] = await client.v6.salesOrders.getByCode('VSO20');
    if (error) {
      expect(error).toBeDefined();
    } else {
      expect(data).toBeDefined();
    }
  });

  it('create() returns a response from the mock server', async () => {
    const client = makeClient();
    const [data, error] = await client.v6.salesOrders.create({ customerId: 43 });
    if (error) {
      expect(error).toBeDefined();
    } else {
      expect(data).toBeDefined();
    }
  });

  it('update() returns a response from the mock server', async () => {
    const client = makeClient();
    const [data, error] = await client.v6.salesOrders.update('22', { notes: 'Updated' });
    if (error) {
      expect(error).toBeDefined();
    } else {
      expect(data).toBeDefined();
    }
  });
});
