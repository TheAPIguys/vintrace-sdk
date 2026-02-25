import { describe, it, expect, vi, afterEach } from 'vitest';
import { VintraceClient } from '../../src/client/VintraceClient';
import { VintraceAggregateError, VintraceNotFoundError } from '../../src/client/errors';
import { workOrderDetail, workOrderSearchResponse, assignWorkResponse, submitWorkOrderStepsResponse } from '../fixtures/workorders';

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

describe('v6.workOrders', () => {
  describe('getAll()', () => {
    it('calls GET v6/workorders/list and returns response', async () => {
      stubFetch(200, workOrderSearchResponse);
      const client = makeClient();
      const [data, error] = await client.v6.workOrders.getAll();
      expect(error).toBeNull();
      expect(data).toEqual(workOrderSearchResponse);
    });

    it('passes query params to the request', async () => {
      stubFetch(200, workOrderSearchResponse);
      const client = makeClient();
      await client.v6.workOrders.getAll({ assignedTo: 'ANYONE', workOrderState: 'IN_PROGRESS', max: '50' });
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v6/workorders/list');
    });

    it('returns error on failure', async () => {
      stubFetch(500, { message: 'Internal Server Error' });
      const client = makeClient();
      const [data, error] = await client.v6.workOrders.getAll();
      expect(data).toBeNull();
      expect(error).not.toBeNull();
    });
  });

  describe('get()', () => {
    it('calls GET v6/workorders/:id and returns work order', async () => {
      stubFetch(200, workOrderDetail);
      const client = makeClient();
      const [data, error] = await client.v6.workOrders.get('2842');
      expect(error).toBeNull();
      expect(data).toEqual(workOrderDetail);
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v6/workorders/2842');
    });

    it('returns VintraceNotFoundError for unknown id', async () => {
      stubFetch(404, { message: 'Not Found' });
      const client = makeClient();
      const [data, error] = await client.v6.workOrders.get('999');
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(VintraceNotFoundError);
    });
  });

  describe('getByCode()', () => {
    it('calls GET v6/workorders with code param', async () => {
      stubFetch(200, workOrderDetail);
      const client = makeClient();
      const [data, error] = await client.v6.workOrders.getByCode('TWL2827');
      expect(error).toBeNull();
      expect(data).toEqual(workOrderDetail);
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v6/workorders');
    });
  });

  describe('assign()', () => {
    it('calls POST v6/workorders/assign with workOrderId', async () => {
      stubFetch(200, assignWorkResponse);
      const client = makeClient();
      const [data, error] = await client.v6.workOrders.assign(25);
      expect(error).toBeNull();
      expect(data).toEqual(assignWorkResponse);
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v6/workorders/assign');
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body as string)).toEqual({ workOrderId: 25 });
    });
  });

  describe('submit()', () => {
    it('calls POST v6/workorders/submit', async () => {
      stubFetch(200, submitWorkOrderStepsResponse);
      const client = makeClient();
      const payload = { jobId: 15480, submitType: 'draft', fields: [{ fieldId: 'abc', value: 'test' }] };
      const [data, error] = await client.v6.workOrders.submit(payload);
      expect(error).toBeNull();
      expect(data).toEqual(submitWorkOrderStepsResponse);
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v6/workorders/submit');
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body as string).jobId).toBe(15480);
    });
  });

  describe('getJob()', () => {
    it('calls GET v6/workorders/jobs/:jobId', async () => {
      const jobData = { id: 482, status: 'Not started' };
      stubFetch(200, jobData);
      const client = makeClient();
      const [data, error] = await client.v6.workOrders.getJob('482');
      expect(error).toBeNull();
      expect(data).toEqual(jobData);
      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('v6/workorders/jobs/482');
    });
  });

  describe('getMany()', () => {
    it('fetches multiple work orders and returns array', async () => {
      vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce({
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: vi.fn().mockResolvedValue(workOrderDetail),
        })
        .mockResolvedValueOnce({
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: vi.fn().mockResolvedValue({ ...workOrderDetail, id: 2843, code: 'TWL2828' }),
        })
      );
      const client = makeClient();
      const [data, error] = await client.v6.workOrders.getMany(['2842', '2843']);
      expect(error).toBeNull();
      expect(data).toHaveLength(2);
    });

    it('returns VintraceAggregateError if any request fails', async () => {
      vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce({
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: vi.fn().mockResolvedValue(workOrderDetail),
        })
        .mockResolvedValueOnce({
          ok: false, status: 404,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: vi.fn().mockResolvedValue({}),
        })
      );
      const client = makeClient();
      const [data, error] = await client.v6.workOrders.getMany(['2842', '9999']);
      expect(data).toBeNull();
      expect(error).toBeInstanceOf(VintraceAggregateError);
    });
  });
});
