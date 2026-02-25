import { VintraceClientConfig, DEFAULT_OPTIONS, VintraceClientOptions } from './config';
import { vintraceFetch, RequestOptions } from '../http/fetch';
import { VintraceResult } from '../types/result';
import { VintraceError, VintraceAggregateError } from './errors';
import type {
  WorkOrderSearchResponse,
  WorkOrderDetail,
  AssignWorkResponse,
  SubmitWorkOrderStepsResponse,
  SalesOrder,
  SalesOrderResponse,
  SalesOrderUpdateResponse,
  Refund,
  RefundResponse,
  RefundUpdateResponse,
  Party,
  PartyResponse,
  PartyUpdateResponse,
  ProductListResponse,
  ProductResponse,
  ProductUpdateResponse,
  ProductUpdateData,
  ProductAnalysisResponse,
  ProductAnalysisParams,
  ProductCompositionResponse,
} from '../validation/schemas';

export interface WorkOrderListParams {
  max?: string;
  first?: string;
  startsWith?: string;
  assignedTo?: 'AVAILABLE_TO_ME' | 'ANYONE' | 'MINE_ONLY' | 'UNASSIGNED';
  workOrderState?: 'ANY' | 'IN_PROGRESS' | 'NOT_STARTED' | 'SUBMITTED' | 'INCOMPLETE';
  fromDate?: string;
  toDate?: string;
  countOnly?: boolean;
  wineryId?: number;
}

export interface SalesOrderListParams {
  max?: string;
  first?: string;
  startsWith?: string;
  status?: string;
  customerName?: string;
  startDate?: string;
  endDate?: string;
  invStartDate?: string;
  invEndDate?: string;
  externalTransactionId?: string;
}

export interface RefundListParams {
  max?: string;
  first?: string;
  startsWith?: string;
  status?: string;
  customerName?: string;
  startDate?: string;
  endDate?: string;
  salesOrderName?: string;
}

export interface PartyListParams {
  max?: string;
  first?: string;
  startsWith?: string;
  category?: 'All' | 'Individuals' | 'Organisations';
}

export interface ProductListParams {
  max?: string;
  first?: string;
  startsWith?: string;
}

export interface TransactionSearchParams {
  dateFrom?: string;
  dateTo?: string;
  ownerName?: string;
  batchName?: string;
  wineryName?: string;
}

export interface IntakeOperationSearchParams {
  modifiedSince?: string;
  operationId?: number;
  processId?: number;
  deliveryDocket?: string;
  intakeDocket?: string;
  externalWeighTag?: string;
  externalSystemBlocksOnly?: boolean;
  externalBlockId?: string;
  blockId?: number;
  blockName?: string;
  vineyardId?: number;
  vineyardName?: string;
  wineryId?: number;
  wineryName?: string;
  growerType?: string;
  growerId?: number;
  growerName?: string;
  ownerId?: number;
  ownerName?: string;
  vintage?: string;
  recordedAfter?: string;
  recordedBefore?: string;
  customAdapter?: string;
  maxResults?: number;
  firstResult?: number;
}

export interface SampleOperationSearchParams {
  modifiedSince?: string;
  operationId?: number;
  processId?: number;
  externalSystemBlocksOnly?: boolean;
  externalBlockId?: string;
  blockId?: number;
  blockName?: string;
  vineyardId?: number;
  vineyardName?: string;
  growerId?: number;
  growerName?: string;
  ownerId?: number;
  ownerName?: string;
  vintage?: string;
  recordedAfter?: string;
  recordedBefore?: string;
  customAdapter?: string;
  maxResults?: number;
  firstResult?: number;
}

export interface InventoryListParams {
  max?: string;
  first?: string;
  date?: string;
  stockType?: string;
  ownerName?: string;
  showEquivalentType?: string;
  breakoutCosting?: boolean;
  disableCommitHeaders?: boolean;
}

export interface SearchListParams {
  type: string;
  first?: string;
  startsWith?: string;
  exactMatch?: boolean;
}

export interface MrpStockHistoryParams {
  firstResult: number;
  maxResult: number;
}

export interface MrpStockNotesParams {
  firstResult?: number;
  maxResult?: number;
}

export class VintraceClient {
  public readonly baseUrl: string;
  public readonly organization: string;
  public readonly token: string;
  public readonly options: Required<VintraceClientOptions>;

  public readonly v6: VintraceV6Api;
  public readonly v7: VintraceV7Api;

  constructor(config: VintraceClientConfig) {
    this.baseUrl = config.baseUrl;
    this.organization = config.organization;
    this.token = config.token;
    this.options = { ...DEFAULT_OPTIONS, ...config.options };

    this.v6 = new VintraceV6Api(this);
    this.v7 = new VintraceV7Api(this);
  }

  public request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    options?: RequestOptions,
    body?: unknown
  ): Promise<VintraceResult<T>> {
    return vintraceFetch<T>(
      this.baseUrl,
      this.organization,
      this.token,
      endpoint,
      method,
      {
        timeout: options?.timeout ?? this.options.timeout,
        maxRetries: options?.maxRetries ?? this.options.maxRetries,
        validateRequest: options?.validateRequest ?? this.options.validateRequests,
        validateResponse: options?.validateResponse ?? this.options.validateResponses,
      },
      body
    );
  }
}

class VintraceV6Api {
  constructor(private client: VintraceClient) {}

  get workOrders() {
    return new WorkOrdersClient(this.client);
  }

  get salesOrders() {
    return new SalesOrdersClient(this.client);
  }

  get refunds() {
    return new RefundsClient(this.client);
  }

  get parties() {
    return new PartiesClient(this.client);
  }

  get products() {
    return new ProductsClient(this.client);
  }

  get transactions() {
    return new TransactionsClient(this.client);
  }

  get intakeOperations() {
    return new IntakeOperationsClient(this.client);
  }

  get sampleOperations() {
    return new SampleOperationsClient(this.client);
  }

  get blockAssessments() {
    return new BlockAssessmentsClient(this.client);
  }

  get mrpStock() {
    return new MrpStockClient(this.client);
  }

  get inventory() {
    return new InventoryClient(this.client);
  }

  get search() {
    return new SearchClient(this.client);
  }

  get productAnalysis() {
    return new ProductAnalysisClient(this.client);
  }

  get productComposition() {
    return new ProductCompositionClient(this.client);
  }
}

class VintraceV7Api {
  constructor(private client: VintraceClient) {}

  get blocks() {
    return new BlocksClient(this.client);
  }

  get bookings() {
    return new BookingsClient(this.client);
  }
}

class WorkOrdersClient {
  constructor(private client: VintraceClient) {}

  getAll(params?: WorkOrderListParams): Promise<VintraceResult<WorkOrderSearchResponse>> {
    return this.client.request<WorkOrderSearchResponse>('v6/workorders/list', 'GET', {}, params);
  }

  get(id: string): Promise<VintraceResult<WorkOrderDetail>> {
    return this.client.request<WorkOrderDetail>(`v6/workorders/${id}`, 'GET');
  }

  getByCode(code: string): Promise<VintraceResult<WorkOrderDetail>> {
    return this.client.request<WorkOrderDetail>('v6/workorders', 'GET', {}, { code });
  }

  getJob(jobId: string): Promise<VintraceResult<unknown>> {
    return this.client.request<unknown>(`v6/workorders/jobs/${jobId}`, 'GET');
  }

  assign(workOrderId: number): Promise<VintraceResult<AssignWorkResponse>> {
    return this.client.request<AssignWorkResponse>('v6/workorders/assign', 'POST', {}, { workOrderId });
  }

  submit(data: { jobId: number; submitType?: string; fields?: { fieldId: string; value?: string }[] }): Promise<VintraceResult<SubmitWorkOrderStepsResponse>> {
    return this.client.request<SubmitWorkOrderStepsResponse>('v6/workorders/submit', 'POST', {}, data);
  }

  getMany<T>(ids: string[]): Promise<VintraceResult<T[]>> {
    return this.batchGet<T>(ids, (id) => this.get(id) as Promise<VintraceResult<T>>);
  }

  private async batchGet<T>(
    ids: string[],
    fetchFn: (id: string) => Promise<VintraceResult<T>>
  ): Promise<VintraceResult<T[]>> {
    const results = await Promise.allSettled(ids.map((id) => fetchFn(id)));
    const errors: VintraceError[] = [];
    const data: T[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const [item, error] = result.value;
        if (error) {
          errors.push(error);
        } else if (item !== null) {
          data.push(item);
        }
      } else {
        errors.push(new VintraceError(result.reason?.message ?? 'Unknown error', 0));
      }
    }

    if (errors.length > 0) {
      return [null, new VintraceAggregateError(errors)];
    }

    return [data, null];
  }
}

class SalesOrdersClient {
  constructor(private client: VintraceClient) {}

  getAll(params?: SalesOrderListParams): Promise<VintraceResult<SalesOrderResponse>> {
    return this.client.request<SalesOrderResponse>('v6/sales-order/list', 'GET', {}, params);
  }

  get(id: string): Promise<VintraceResult<SalesOrder>> {
    return this.client.request<SalesOrder>(`v6/sales-order/${id}`, 'GET');
  }

  getByCode(code: string): Promise<VintraceResult<SalesOrder>> {
    return this.client.request<SalesOrder>('v6/sales-order', 'GET', {}, { code });
  }

  create(data: Partial<SalesOrder>): Promise<VintraceResult<SalesOrderUpdateResponse>> {
    return this.client.request<SalesOrderUpdateResponse>('v6/sales-order', 'POST', {}, data);
  }

  update(id: string, data: Partial<SalesOrder>): Promise<VintraceResult<SalesOrderUpdateResponse>> {
    return this.client.request<SalesOrderUpdateResponse>(`v6/sales-order/${id}`, 'PUT', {}, data);
  }

  getMany<T>(ids: string[]): Promise<VintraceResult<T[]>> {
    return this.batchGet<T>(ids, (id) => this.get(id) as Promise<VintraceResult<T>>);
  }

  private async batchGet<T>(
    ids: string[],
    fetchFn: (id: string) => Promise<VintraceResult<T>>
  ): Promise<VintraceResult<T[]>> {
    const results = await Promise.allSettled(ids.map((id) => fetchFn(id)));
    const errors: VintraceError[] = [];
    const data: T[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const [item, error] = result.value;
        if (error) {
          errors.push(error);
        } else if (item !== null) {
          data.push(item);
        }
      } else {
        errors.push(new VintraceError(result.reason?.message ?? 'Unknown error', 0));
      }
    }

    if (errors.length > 0) {
      return [null, new VintraceAggregateError(errors)];
    }

    return [data, null];
  }
}

class RefundsClient {
  constructor(private client: VintraceClient) {}

  getAll(params?: RefundListParams): Promise<VintraceResult<RefundResponse>> {
    return this.client.request<RefundResponse>('v6/refund/list', 'GET', {}, params);
  }

  get(id: string): Promise<VintraceResult<Refund>> {
    return this.client.request<Refund>(`v6/refund/${id}`, 'GET');
  }

  getByCode(code: string): Promise<VintraceResult<Refund>> {
    return this.client.request<Refund>('v6/refund', 'GET', {}, { code });
  }

  create(data: Partial<Refund>): Promise<VintraceResult<RefundUpdateResponse>> {
    return this.client.request<RefundUpdateResponse>('v6/refund', 'POST', {}, data);
  }

  update(id: string, data: Partial<Refund>): Promise<VintraceResult<RefundUpdateResponse>> {
    return this.client.request<RefundUpdateResponse>(`v6/refund/${id}`, 'PUT', {}, data);
  }

  getMany<T>(ids: string[]): Promise<VintraceResult<T[]>> {
    return this.batchGet<T>(ids, (id) => this.get(id) as Promise<VintraceResult<T>>);
  }

  private async batchGet<T>(
    ids: string[],
    fetchFn: (id: string) => Promise<VintraceResult<T>>
  ): Promise<VintraceResult<T[]>> {
    const results = await Promise.allSettled(ids.map((id) => fetchFn(id)));
    const errors: VintraceError[] = [];
    const data: T[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const [item, error] = result.value;
        if (error) {
          errors.push(error);
        } else if (item !== null) {
          data.push(item);
        }
      } else {
        errors.push(new VintraceError(result.reason?.message ?? 'Unknown error', 0));
      }
    }

    if (errors.length > 0) {
      return [null, new VintraceAggregateError(errors)];
    }

    return [data, null];
  }
}

class PartiesClient {
  constructor(private client: VintraceClient) {}

  getAll(params?: PartyListParams): Promise<VintraceResult<PartyResponse>> {
    return this.client.request<PartyResponse>('v6/party/list', 'GET', {}, params);
  }

  get(id: string): Promise<VintraceResult<Party>> {
    return this.client.request<Party>(`v6/party/${id}`, 'GET');
  }

  getByName(name: string): Promise<VintraceResult<Party>> {
    return this.client.request<Party>('v6/party', 'GET', {}, { name });
  }

  create(data: Partial<Party>): Promise<VintraceResult<PartyUpdateResponse>> {
    return this.client.request<PartyUpdateResponse>('v6/party', 'POST', {}, data);
  }

  getMany<T>(ids: string[]): Promise<VintraceResult<T[]>> {
    return this.batchGet<T>(ids, (id) => this.get(id) as Promise<VintraceResult<T>>);
  }

  private async batchGet<T>(
    ids: string[],
    fetchFn: (id: string) => Promise<VintraceResult<T>>
  ): Promise<VintraceResult<T[]>> {
    const results = await Promise.allSettled(ids.map((id) => fetchFn(id)));
    const errors: VintraceError[] = [];
    const data: T[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const [item, error] = result.value;
        if (error) {
          errors.push(error);
        } else if (item !== null) {
          data.push(item);
        }
      } else {
        errors.push(new VintraceError(result.reason?.message ?? 'Unknown error', 0));
      }
    }

    if (errors.length > 0) {
      return [null, new VintraceAggregateError(errors)];
    }

    return [data, null];
  }
}

class ProductsClient {
  constructor(private client: VintraceClient) {}

  getAll(params?: ProductListParams): Promise<VintraceResult<ProductListResponse>> {
    return this.client.request<ProductListResponse>('v6/products/list', 'GET', {}, params);
  }

  get(id: string): Promise<VintraceResult<ProductResponse>> {
    return this.client.request<ProductResponse>(`v6/products/${id}`, 'GET');
  }

  getMany<T>(ids: string[]): Promise<VintraceResult<T[]>> {
    return this.batchGet<T>(ids, (id) => this.get(id) as Promise<VintraceResult<T>>);
  }

  create(data: unknown): Promise<VintraceResult<ProductResponse>> {
    return this.client.request<ProductResponse>('v6/products', 'POST', {}, data);
  }

  update(id: string, data: unknown): Promise<VintraceResult<ProductUpdateResponse>> {
    return this.client.request<ProductUpdateResponse>(`v6/products/${id}`, 'PUT', {}, data);
  }

  updateFields(data: ProductUpdateData): Promise<VintraceResult<ProductUpdateResponse>> {
    return this.client.request<ProductUpdateResponse>('v6/product-update', 'POST', {}, data);
  }

  private async batchGet<T>(
    ids: string[],
    fetchFn: (id: string) => Promise<VintraceResult<T>>
  ): Promise<VintraceResult<T[]>> {
    const results = await Promise.allSettled(ids.map((id) => fetchFn(id)));
    const errors: VintraceError[] = [];
    const data: T[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const [item, error] = result.value;
        if (error) {
          errors.push(error);
        } else if (item !== null) {
          data.push(item);
        }
      } else {
        errors.push(new VintraceError(result.reason?.message ?? 'Unknown error', 0));
      }
    }

    if (errors.length > 0) {
      return [null, new VintraceAggregateError(errors)];
    }

    return [data, null];
  }
}

class BlocksClient {
  constructor(private client: VintraceClient) {}

  getAll(params?: Record<string, unknown>) {
    return this.client.request<unknown>('v7/harvest/blocks', 'GET', {}, params);
  }

  get(id: string) {
    return this.client.request<unknown>(`v7/harvest/blocks/${id}`, 'GET');
  }

  getMany<T>(ids: string[]): Promise<VintraceResult<T[]>> {
    return this.batchGet<T>(ids, (id) => this.get(id) as Promise<VintraceResult<T>>);
  }

  post(data: unknown) {
    return this.client.request<unknown>('v7/harvest/blocks', 'POST', {}, data);
  }

  patch(id: string, data: unknown) {
    return this.client.request<unknown>(`v7/harvest/blocks/${id}`, 'PATCH', {}, data);
  }

  private async batchGet<T>(
    ids: string[],
    fetchFn: (id: string) => Promise<VintraceResult<T>>
  ): Promise<VintraceResult<T[]>> {
    const results = await Promise.allSettled(ids.map((id) => fetchFn(id)));
    const errors: VintraceError[] = [];
    const data: T[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const [item, error] = result.value;
        if (error) {
          errors.push(error);
        } else if (item !== null) {
          data.push(item);
        }
      } else {
        errors.push(new VintraceError(result.reason?.message ?? 'Unknown error', 0));
      }
    }

    if (errors.length > 0) {
      return [null, new VintraceAggregateError(errors)];
    }

    return [data, null];
  }
}

class BookingsClient {
  constructor(private client: VintraceClient) {}

  post(data: unknown) {
    return this.client.request<unknown>('v7/operation/bookings', 'POST', {}, data);
  }

  deactivate(id: string) {
    return this.client.request<unknown>(`v7/operation/bookings/${id}/deactivation`, 'POST');
  }
}

class TransactionsClient {
  constructor(private client: VintraceClient) {}

  search(params?: TransactionSearchParams): Promise<VintraceResult<unknown>> {
    return this.client.request<unknown>('v6/transaction/search', 'GET', {}, params);
  }
}

class IntakeOperationsClient {
  constructor(private client: VintraceClient) {}

  search(params?: IntakeOperationSearchParams): Promise<VintraceResult<unknown>> {
    return this.client.request<unknown>('v6/intake-operations/search', 'GET', {}, params);
  }
}

class SampleOperationsClient {
  constructor(private client: VintraceClient) {}

  search(params?: SampleOperationSearchParams): Promise<VintraceResult<unknown>> {
    return this.client.request<unknown>('v6/sample-operations/search', 'GET', {}, params);
  }
}

class BlockAssessmentsClient {
  constructor(private client: VintraceClient) {}

  create(data: unknown): Promise<VintraceResult<unknown>> {
    return this.client.request<unknown>('v6/block-assessments/create', 'POST', {}, data);
  }
}

class MrpStockClient {
  constructor(private client: VintraceClient) {}

  get(id: string, expand?: string): Promise<VintraceResult<unknown>> {
    return this.client.request<unknown>(`v6/mrp/stock/${id}`, 'GET', {}, expand ? { expand } : undefined);
  }

  getFields(id: string): Promise<VintraceResult<unknown>> {
    return this.client.request<unknown>(`v6/mrp/stock/${id}/fields`, 'GET');
  }

  getDistributions(id: string): Promise<VintraceResult<unknown>> {
    return this.client.request<unknown>(`v6/mrp/stock/${id}/distributions`, 'GET');
  }

  getHistoryItems(id: string, params: MrpStockHistoryParams): Promise<VintraceResult<unknown>> {
    return this.client.request<unknown>(`v6/mrp/stock/${id}/history-items`, 'GET', {}, params);
  }

  getRawComponents(id: string): Promise<VintraceResult<unknown>> {
    return this.client.request<unknown>(`v6/mrp/stock/${id}/raw-components`, 'GET');
  }

  getNotes(id: string, params?: MrpStockNotesParams): Promise<VintraceResult<unknown>> {
    return this.client.request<unknown>(`v6/mrp/stock/${id}/notes`, 'GET', {}, params);
  }

  postNote(id: string, data: unknown): Promise<VintraceResult<unknown>> {
    return this.client.request<unknown>(`v6/mrp/stock/${id}/notes`, 'POST', {}, data);
  }

  getNote(id: string, noteId: string): Promise<VintraceResult<unknown>> {
    return this.client.request<unknown>(`v6/mrp/stock/${id}/notes/${noteId}`, 'GET');
  }

  updateNote(id: string, noteId: string, data: unknown): Promise<VintraceResult<unknown>> {
    return this.client.request<unknown>(`v6/mrp/stock/${id}/notes/${noteId}/updates`, 'POST', {}, data);
  }

  getBulkInfo(id: string): Promise<VintraceResult<unknown>> {
    return this.client.request<unknown>(`v6/mrp/stock/${id}/bulk-info`, 'GET');
  }
}

class InventoryClient {
  constructor(private client: VintraceClient) {}

  getAll(params?: InventoryListParams): Promise<VintraceResult<unknown>> {
    return this.client.request<unknown>('v6/inventory', 'GET', {}, params);
  }
}

class SearchClient {
  constructor(private client: VintraceClient) {}

  list(params: SearchListParams): Promise<VintraceResult<unknown>> {
    return this.client.request<unknown>('v6/search/list', 'GET', {}, params);
  }
}

class ProductAnalysisClient {
  constructor(private client: VintraceClient) {}

  /**
   * Get analysis data for a product by its numeric ID.
   * The endpoint path matches the `productAnalysisEndpoint` field returned on a Product.
   * e.g. GET v6/product-analysis/{productId}
   */
  get(productId: number, params?: ProductAnalysisParams): Promise<VintraceResult<ProductAnalysisResponse>> {
    return this.client.request<ProductAnalysisResponse>(
      `v6/product-analysis/${productId}`,
      'GET',
      {},
      params
    );
  }

  /**
   * Fetch analysis for multiple product IDs in parallel.
   * Respects the client's `parallelLimit` option (default 5 concurrent).
   * Returns `VintraceAggregateError` if any individual request fails.
   */
  getMany(
    productIds: number[],
    params?: ProductAnalysisParams
  ): Promise<VintraceResult<ProductAnalysisResponse[]>> {
    return this.batchGet(productIds, (id) => this.get(id, params));
  }

  private async batchGet(
    ids: number[],
    fetchFn: (id: number) => Promise<VintraceResult<ProductAnalysisResponse>>
  ): Promise<VintraceResult<ProductAnalysisResponse[]>> {
    const limit = this.client.options.parallelLimit;
    const errors: VintraceError[] = [];
    const data: ProductAnalysisResponse[] = [];

    for (let i = 0; i < ids.length; i += limit) {
      const chunk = ids.slice(i, i + limit);
      const results = await Promise.allSettled(chunk.map((id) => fetchFn(id)));

      for (const result of results) {
        if (result.status === 'fulfilled') {
          const [item, error] = result.value;
          if (error) {
            errors.push(error);
          } else if (item !== null) {
            data.push(item);
          }
        } else {
          errors.push(new VintraceError(result.reason?.message ?? 'Unknown error', 0));
        }
      }
    }

    if (errors.length > 0) {
      return [null, new VintraceAggregateError(errors)];
    }

    return [data, null];
  }
}

class ProductCompositionClient {
  constructor(private client: VintraceClient) {}

  /**
   * Get composition (blend components) for a product by its numeric ID.
   * The endpoint path matches the `productCompositionEndpoint` field returned on a Product.
   * e.g. GET v6/product-composition/{productId}
   */
  get(productId: number): Promise<VintraceResult<ProductCompositionResponse>> {
    return this.client.request<ProductCompositionResponse>(
      `v6/product-composition/${productId}`,
      'GET'
    );
  }
}
