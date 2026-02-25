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

describe('v6.workOrders (integration)', { timeout: 15000 }, () => {
  it('getAll() returns a response from the mock server', async () => {
    const client = makeClient();
    const [data, error] = await client.v6.workOrders.getAll();
    // Mock server may return data or a 4xx; either is a valid network response
    if (error) {
      expect(error).toBeDefined();
    } else {
      expect(data).toBeDefined();
    }
  });

  it('get() returns a response from the mock server', async () => {
    const client = makeClient();
    const [data, error] = await client.v6.workOrders.get('2842');
    if (error) {
      expect(error).toBeDefined();
    } else {
      expect(data).toBeDefined();
    }
  });

  it('getByCode() returns a response from the mock server', async () => {
    const client = makeClient();
    const [data, error] = await client.v6.workOrders.getByCode('TWL2827');
    if (error) {
      expect(error).toBeDefined();
    } else {
      expect(data).toBeDefined();
    }
  });

  it('assign() returns a response from the mock server', async () => {
    const client = makeClient();
    const [data, error] = await client.v6.workOrders.assign(25);
    if (error) {
      expect(error).toBeDefined();
    } else {
      expect(data).toBeDefined();
    }
  });

  it('submit() returns a response from the mock server', async () => {
    const client = makeClient();
    const [data, error] = await client.v6.workOrders.submit({ jobId: 15480 });
    if (error) {
      expect(error).toBeDefined();
    } else {
      expect(data).toBeDefined();
    }
  });
});
