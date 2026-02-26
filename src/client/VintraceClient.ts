import { VintraceClientConfig, DEFAULT_OPTIONS, VintraceClientOptions } from './config';
import { vintraceFetch, RequestOptions } from '../http/fetch';
import { VintraceResult } from '../types/result';
import { VintraceError, VintraceAggregateError } from './errors';
import { batchFetch } from './utils';
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
  Product,
  ProductAnalysisResponse,
  ProductAnalysisParams,
  ProductCompositionResponse,
  GetBlocksSuccessResponse,
  InventoryResponse,
  InventoryListParams,
  TransactionSearchResponse,
  TransactionSearchParams,
  IntakeOperationSearchResponse,
  IntakeOperationSearchParams,
  SampleOperationSearchResponse,
  SampleOperationSearchParams,
  SearchListResponse,
  SearchListParams,
  MrpStockHistoryParams,
  MrpStockNotesParams,
} from '../validation/schemas';
import {
  WorkOrderSearchResponseSchema,
  WorkOrderDetailSchema,
  AssignWorkResponseSchema,
  AssignWorkDataSchema,
  SubmitWorkOrderStepsResponseSchema,
  SubmitJobRequestSchema,
  SalesOrderSchema,
  SalesOrderWriteSchema,
  SalesOrderResponseSchema,
  SalesOrderUpdateResponseSchema,
  RefundSchema,
  RefundWriteSchema,
  RefundResponseSchema,
  RefundUpdateResponseSchema,
  PartySchema,
  PartyWriteSchema,
  PartyResponseSchema,
  PartyUpdateResponseSchema,
  ProductListResponseSchema,
  ProductResponseSchema,
  ProductUpdateResponseSchema,
  ProductUpdateDataSchema,
  ProductSchema,
  ProductAnalysisResponseSchema,
  ProductCompositionResponseSchema,
  GetBlocksSuccessResponseSchema,
  InventoryResponseSchema,
  TransactionSearchResponseSchema,
  IntakeOperationSearchResponseSchema,
  SampleOperationSearchResponseSchema,
  SearchListResponseSchema,
} from '../validation/schemas';

export interface WorkOrderListParams {
  /**
   * Filter work orders starting from this date (ISO yyyy-MM-dd).
   * Example: `2024-01-01`
   */
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
  /**
   * startDate and endDate filter the sales orders by date (ISO yyyy-MM-dd).
   * Example: `2024-01-01`
   */
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
  /**
   * startDate and endDate filter refunds by date (ISO yyyy-MM-dd).
   * Example: `2024-01-01`
   */
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

export interface VesselDetailsReportParams {
  limit?: number;
  offset?: number;
  /**
   * asAtDate is the report date expressed as epoch milliseconds.
   * Example: `1704067200000` (represents 2024-01-01T00:00:00.000Z)
   */
  asAtDate?: number;
  businessUnit?: string;
  batch?: string;
  vessel?: string;
  owner?: string;
  extraFields?: string;
  vesselId?: number;
  productId?: number;
  wineryId?: number;
  wineryName?: string;
  vesselType?: 'TANK' | 'BIN' | 'BARREL' | 'BARREL_GROUP' | 'BIN_GROUP' | 'PRESS' | 'TANKER';
}

export class VintraceClient {
  /**
   * The base URL of the Vintrace API.
   */
  public readonly baseUrl: string;
  /**
   * The organization identifier.
   */
  public readonly organization: string;
  /**
   * The API token for authentication.
   */
  public readonly token: string;
  /**
   * Client options with default values applied.
   */
  public readonly options: Required<VintraceClientOptions>;

  /**
   * v6 API endpoints.
   */
  public readonly v6: VintraceV6Api;
  /**
   * v7 API endpoints.
   */
  public readonly v7: VintraceV7Api;

  /**
   * Creates a new VintraceClient instance.
   *
   * @param config - The client configuration containing baseUrl, organization, and token.
   */
  constructor(config: VintraceClientConfig) {
    this.baseUrl = config.baseUrl;
    this.organization = config.organization;
    this.token = config.token;
    this.options = { ...DEFAULT_OPTIONS, ...config.options };

    this.v6 = new VintraceV6Api(this);
    this.v7 = new VintraceV7Api(this);
  }

  /**
   * Makes a request to the Vintrace API.
   *
   * @param endpoint - The API endpoint path (e.g., 'v6/workorders/list')
   * @param method - The HTTP method (GET, POST, PUT, PATCH, DELETE)
   * @param options - Request options including timeout, maxRetries, and validation settings
   * @param body - Optional request body for POST, PUT, PATCH requests
   * @returns A promise that resolves to a VintraceResult tuple [data, error]
   */
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
  private _workOrders?: WorkOrdersClient;
  private _salesOrders?: SalesOrdersClient;
  private _refunds?: RefundsClient;
  private _parties?: PartiesClient;
  private _products?: ProductsClient;
  private _transactions?: TransactionsClient;
  private _intakeOperations?: IntakeOperationsClient;
  private _sampleOperations?: SampleOperationsClient;
  private _blockAssessments?: BlockAssessmentsClient;
  private _mrpStock?: MrpStockClient;
  private _inventory?: InventoryClient;
  private _search?: SearchClient;
  private _productAnalysis?: ProductAnalysisClient;
  private _productComposition?: ProductCompositionClient;

  constructor(private client: VintraceClient) {}

  get workOrders(): WorkOrdersClient {
    return (this._workOrders ??= new WorkOrdersClient(this.client));
  }

  get salesOrders(): SalesOrdersClient {
    return (this._salesOrders ??= new SalesOrdersClient(this.client));
  }

  get refunds(): RefundsClient {
    return (this._refunds ??= new RefundsClient(this.client));
  }

  get parties(): PartiesClient {
    return (this._parties ??= new PartiesClient(this.client));
  }

  get products(): ProductsClient {
    return (this._products ??= new ProductsClient(this.client));
  }

  get transactions(): TransactionsClient {
    return (this._transactions ??= new TransactionsClient(this.client));
  }

  get intakeOperations(): IntakeOperationsClient {
    return (this._intakeOperations ??= new IntakeOperationsClient(this.client));
  }

  get sampleOperations(): SampleOperationsClient {
    return (this._sampleOperations ??= new SampleOperationsClient(this.client));
  }

  get blockAssessments(): BlockAssessmentsClient {
    return (this._blockAssessments ??= new BlockAssessmentsClient(this.client));
  }

  get mrpStock(): MrpStockClient {
    return (this._mrpStock ??= new MrpStockClient(this.client));
  }

  get inventory(): InventoryClient {
    return (this._inventory ??= new InventoryClient(this.client));
  }

  get search(): SearchClient {
    return (this._search ??= new SearchClient(this.client));
  }

  get productAnalysis(): ProductAnalysisClient {
    return (this._productAnalysis ??= new ProductAnalysisClient(this.client));
  }

  get productComposition(): ProductCompositionClient {
    return (this._productComposition ??= new ProductCompositionClient(this.client));
  }
}

class VintraceV7Api {
  private _blocks?: BlocksClient;
  private _bookings?: BookingsClient;
  private _vesselDetailsReport?: VesselDetailsReportClient;

  constructor(private client: VintraceClient) {}

  get blocks(): BlocksClient {
    return (this._blocks ??= new BlocksClient(this.client));
  }

  get bookings(): BookingsClient {
    return (this._bookings ??= new BookingsClient(this.client));
  }

  get vesselDetailsReport(): VesselDetailsReportClient {
    return (this._vesselDetailsReport ??= new VesselDetailsReportClient(this.client));
  }
}

class WorkOrdersClient {
  constructor(private client: VintraceClient) {}

  /**
   * List available work orders.
   *
   * By default returns a list of all work orders that are in "Ready",
   * "In progress", or "Submitted" states and are assigned to me or unassigned
   * with a date range from 7 days ago to 3 days from now.
   */
  async getAll(params?: WorkOrderListParams): Promise<VintraceResult<WorkOrderDetail[]>> {
    /**
     * List available work orders.
     *
     * Maps to GET /workorders/list (v6). By default this returns work orders
     * in Ready, In progress or Submitted states and assigned to the caller or
     * unassigned. Use `fromDate` / `toDate` to filter by scheduled date using
     * YYYY-MM-DD format (example: `2024-01-01`). `assignedTo` accepts:
     * AVAILABLE_TO_ME | ANYONE | MINE_ONLY | UNASSIGNED. `workOrderState` accepts
     * ANY | IN_PROGRESS | NOT_STARTED | SUBMITTED | INCOMPLETE.
     */
    const limit = params?.max ? parseInt(params.max, 10) : 100;
    const firstResponse = await this.client.request<WorkOrderSearchResponse>(
      'v6/workorders/list',
      'GET',
      { responseSchema: WorkOrderSearchResponseSchema },
      { ...params, max: String(limit), first: '0' }
    );

    if (firstResponse[1]) {
      return [null, firstResponse[1]];
    }

    const response = firstResponse[0];
    if (!response) {
      return [[], null];
    }

    const totalCount = response.totalResultCount ?? response.workOrders?.length ?? 0;
    if (totalCount <= limit) {
      return [response.workOrders ?? [], null];
    }

    const pagesNeeded = Math.ceil(totalCount / limit);
    const parallelLimit = this.client.options.parallelLimit;

    const allResults: WorkOrderDetail[] = [...(response.workOrders ?? [])];

    for (let i = 1; i < pagesNeeded; i += parallelLimit) {
      const batchSize = Math.min(parallelLimit, pagesNeeded - i);
      const batchPromises: Promise<VintraceResult<WorkOrderSearchResponse>>[] = [];

      for (let j = 0; j < batchSize; j++) {
        const offset = (i + j) * limit;
        batchPromises.push(
          this.client.request<WorkOrderSearchResponse>(
            'v6/workorders/list',
            'GET',
            { responseSchema: WorkOrderSearchResponseSchema },
            { ...params, max: String(limit), first: String(offset) }
          )
        );
      }

      const batchResults = await Promise.all(batchPromises);
      for (const [pageData, pageError] of batchResults) {
        if (pageError) {
          return [null, pageError];
        }
        if (pageData?.workOrders) {
          allResults.push(...pageData.workOrders);
        }
      }
    }

    return [allResults, null];
  }

  get(id: string): Promise<VintraceResult<WorkOrderDetail>> {
    /**
     * Get work order details by id or code.
     *
     * Returns a single work order with a given id or code.
     */
    return this.client.request<WorkOrderDetail>(`v6/workorders/${id}`, 'GET', {
      responseSchema: WorkOrderDetailSchema,
    });
  }

  getByCode(code: string): Promise<VintraceResult<WorkOrderDetail>> {
    /**
     * Get work order details by code.
     *
     * Returns a work order by its TWL code (e.g. `TWL2827`).
     */
    return this.client.request<WorkOrderDetail>(
      'v6/workorders',
      'GET',
      { responseSchema: WorkOrderDetailSchema },
      { code }
    );
  }

  getJob(jobId: string): Promise<VintraceResult<unknown>> {
    /**
     * Get job details by id.
     *
     * Retrieve details for a single job by id.
     */
    return this.client.request<unknown>(`v6/workorders/jobs/${jobId}`, 'GET');
  }

  assign(workOrderId: number): Promise<VintraceResult<AssignWorkResponse>> {
    /**
     * Assign a work order.
     *
     * Assign a work order to the calling operator.
     */
    return this.client.request<AssignWorkResponse>(
      'v6/workorders/assign',
      'POST',
      { responseSchema: AssignWorkResponseSchema, requestSchema: AssignWorkDataSchema },
      { workOrderId }
    );
  }

  submit(data: {
    jobId: number;
    submitType?: string;
    fields?: { fieldId: string; value?: string }[];
  }): Promise<VintraceResult<SubmitWorkOrderStepsResponse>> {
    /**
     * Submit job details.
     *
     * Submit job step results. `data` should include `jobId` and optional
     * `submitType` (e.g. 'draft') and `fields` array with { fieldId, value }.
     */
    return this.client.request<SubmitWorkOrderStepsResponse>(
      'v6/workorders/submit',
      'POST',
      { responseSchema: SubmitWorkOrderStepsResponseSchema, requestSchema: SubmitJobRequestSchema },
      data
    );
  }

  getMany(ids: string[]): Promise<VintraceResult<WorkOrderDetail[]>> {
    /**
     * Get multiple work orders by ids.
     *
     * Batch fetch multiple work orders by their IDs. Returns VintraceAggregateError if any request fails.
     */
    return batchFetch(ids, (id) => this.get(id));
  }
}

class SalesOrdersClient {
  constructor(private client: VintraceClient) {}
  /**
   * List available sales orders.
   *
   * Returns a list of the first 100 sales orders.
   */
  async getAll(params?: SalesOrderListParams): Promise<VintraceResult<SalesOrder[]>> {
    const limit = params?.max ? parseInt(params.max, 10) : 100;
    const firstResponse = await this.client.request<SalesOrderResponse>(
      'v6/sales-order/list',
      'GET',
      { responseSchema: SalesOrderResponseSchema },
      { ...params, max: String(limit), first: '0' }
    );

    if (firstResponse[1]) {
      return [null, firstResponse[1]];
    }

    const response = firstResponse[0];
    if (!response) {
      return [[], null];
    }

    const totalCount = response.totalResultCount ?? response.salesOrders?.length ?? 0;
    if (totalCount <= limit) {
      return [response.salesOrders ?? [], null];
    }

    const pagesNeeded = Math.ceil(totalCount / limit);
    const parallelLimit = this.client.options.parallelLimit;

    const allResults: SalesOrder[] = [...(response.salesOrders ?? [])];

    for (let i = 1; i < pagesNeeded; i += parallelLimit) {
      const batchSize = Math.min(parallelLimit, pagesNeeded - i);
      const batchPromises: Promise<VintraceResult<SalesOrderResponse>>[] = [];

      for (let j = 0; j < batchSize; j++) {
        const offset = (i + j) * limit;
        batchPromises.push(
          this.client.request<SalesOrderResponse>(
            'v6/sales-order/list',
            'GET',
            { responseSchema: SalesOrderResponseSchema },
            { ...params, max: String(limit), first: String(offset) }
          )
        );
      }

      const batchResults = await Promise.all(batchPromises);
      for (const [pageData, pageError] of batchResults) {
        if (pageError) {
          return [null, pageError];
        }
        if (pageData?.salesOrders) {
          allResults.push(...pageData.salesOrders);
        }
      }
    }

    return [allResults, null];
  }

  get(id: string): Promise<VintraceResult<SalesOrder>> {
    /**
     * Get sales order details by id.
     *
     * Returns a single sales order with a given id.
     */
    return this.client.request<SalesOrder>(`v6/sales-order/${id}`, 'GET', {
      responseSchema: SalesOrderSchema,
    });
  }

  getByCode(code: string): Promise<VintraceResult<SalesOrder>> {
    /**
     * Get sales order details by code.
     *
     * Returns a single sales order with a given code (e.g. 'VSO20').
     */
    return this.client.request<SalesOrder>(
      'v6/sales-order',
      'GET',
      { responseSchema: SalesOrderSchema },
      { code }
    );
  }

  create(data: Partial<SalesOrder>): Promise<VintraceResult<SalesOrderUpdateResponse>> {
    /**
     * Create or update a sales order.
     *
     * If updating, include the `id` field in `data`. Note: for discounts, use
     * `discountPct` when accounting integration (Xero) is on; otherwise use
     * `adjustment` for a dollar value.
     */
    return this.client.request<SalesOrderUpdateResponse>(
      'v6/sales-order',
      'POST',
      { responseSchema: SalesOrderUpdateResponseSchema, requestSchema: SalesOrderWriteSchema },
      data
    );
  }

  update(id: string, data: Partial<SalesOrder>): Promise<VintraceResult<SalesOrderUpdateResponse>> {
    /**
     * Update a sales order by id.
     *
     * Replace (update) a sales order by id. Provide the SalesOrder fields to
     * update in `data`.
     */
    return this.client.request<SalesOrderUpdateResponse>(
      `v6/sales-order/${id}`,
      'PUT',
      { responseSchema: SalesOrderUpdateResponseSchema, requestSchema: SalesOrderWriteSchema },
      data
    );
  }

  getMany(ids: string[]): Promise<VintraceResult<SalesOrder[]>> {
    /**
     * Get multiple sales orders by ids.
     *
     * Batch fetch multiple sales orders by their IDs. Returns VintraceAggregateError if any request fails.
     */
    return batchFetch(ids, (id) => this.get(id));
  }
}

class RefundsClient {
  constructor(private client: VintraceClient) {}

  /**
   * List available refunds.
   *
   * Returns a list of the first 100 refunds.
   */
  async getAll(params?: RefundListParams): Promise<VintraceResult<Refund[]>> {
    /**
     * List available refunds.
     *
     * Maps to GET /refund/list (v6). Filter with `startDate`/`endDate` in
     * YYYY-MM-DD format (example: `2024-01-01`).
     */
    const limit = params?.max ? parseInt(params.max, 10) : 100;
    const firstResponse = await this.client.request<RefundResponse>(
      'v6/refund/list',
      'GET',
      { responseSchema: RefundResponseSchema },
      { ...params, max: String(limit), first: '0' }
    );

    if (firstResponse[1]) {
      return [null, firstResponse[1]];
    }

    const response = firstResponse[0];
    if (!response) {
      return [[], null];
    }

    const totalCount = response.totalResultCount ?? response.refunds?.length ?? 0;
    if (totalCount <= limit) {
      return [response.refunds ?? [], null];
    }

    const pagesNeeded = Math.ceil(totalCount / limit);
    const parallelLimit = this.client.options.parallelLimit;

    const allResults: Refund[] = [...(response.refunds ?? [])];

    for (let i = 1; i < pagesNeeded; i += parallelLimit) {
      const batchSize = Math.min(parallelLimit, pagesNeeded - i);
      const batchPromises: Promise<VintraceResult<RefundResponse>>[] = [];

      for (let j = 0; j < batchSize; j++) {
        const offset = (i + j) * limit;
        batchPromises.push(
          this.client.request<RefundResponse>(
            'v6/refund/list',
            'GET',
            { responseSchema: RefundResponseSchema },
            { ...params, max: String(limit), first: String(offset) }
          )
        );
      }

      const batchResults = await Promise.all(batchPromises);
      for (const [pageData, pageError] of batchResults) {
        if (pageError) {
          return [null, pageError];
        }
        if (pageData?.refunds) {
          allResults.push(...pageData.refunds);
        }
      }
    }

    return [allResults, null];
  }

  get(id: string): Promise<VintraceResult<Refund>> {
    /**
     * Get refund details by id.
     *
     * Returns a single refund with a given id.
     */
    return this.client.request<Refund>(`v6/refund/${id}`, 'GET', { responseSchema: RefundSchema });
  }

  getByCode(code: string): Promise<VintraceResult<Refund>> {
    /**
     * Get refund details by code.
     *
     * Returns a single refund with a given code.
     */
    return this.client.request<Refund>(
      'v6/refund',
      'GET',
      { responseSchema: RefundSchema },
      { code }
    );
  }

  create(data: Partial<Refund>): Promise<VintraceResult<RefundUpdateResponse>> {
    /**
     * Create or update a refund.
     *
     * To update, include `id` in `data`.
     */
    return this.client.request<RefundUpdateResponse>(
      'v6/refund',
      'POST',
      { responseSchema: RefundUpdateResponseSchema, requestSchema: RefundWriteSchema },
      data
    );
  }

  update(id: string, data: Partial<Refund>): Promise<VintraceResult<RefundUpdateResponse>> {
    /**
     * Update a refund by id.
     *
     * Replace (update) a refund by id. Provide the Refund fields to
     * update in `data`.
     */
    return this.client.request<RefundUpdateResponse>(
      `v6/refund/${id}`,
      'PUT',
      { responseSchema: RefundUpdateResponseSchema, requestSchema: RefundWriteSchema },
      data
    );
  }

  getMany(ids: string[]): Promise<VintraceResult<Refund[]>> {
    /**
     * Get multiple refunds by ids.
     *
     * Batch fetch multiple refunds by their IDs. Returns VintraceAggregateError if any request fails.
     */
    return batchFetch(ids, (id) => this.get(id));
  }
}

class PartiesClient {
  constructor(private client: VintraceClient) {}

  /**
   * List parties.
   *
   * Returns a list of the first 100 parties.
   */
  async getAll(params?: PartyListParams): Promise<VintraceResult<Party[]>> {
    /**
     * List parties.
     *
     * Maps to GET /party/list (v6). Use `startsWith` to filter by name start
     * and `category` with values All | Individuals | Organisations.
     */
    const limit = params?.max ? parseInt(params.max, 10) : 100;
    const firstResponse = await this.client.request<PartyResponse>(
      'v6/party/list',
      'GET',
      { responseSchema: PartyResponseSchema },
      { ...params, max: String(limit), first: '0' }
    );

    if (firstResponse[1]) {
      return [null, firstResponse[1]];
    }

    const response = firstResponse[0];
    if (!response) {
      return [[], null];
    }

    const totalCount = response.totalResultCount ?? response.parties?.length ?? 0;
    if (totalCount <= limit) {
      return [response.parties ?? [], null];
    }

    const pagesNeeded = Math.ceil(totalCount / limit);
    const parallelLimit = this.client.options.parallelLimit;

    const allResults: Party[] = [...(response.parties ?? [])];

    for (let i = 1; i < pagesNeeded; i += parallelLimit) {
      const batchSize = Math.min(parallelLimit, pagesNeeded - i);
      const batchPromises: Promise<VintraceResult<PartyResponse>>[] = [];

      for (let j = 0; j < batchSize; j++) {
        const offset = (i + j) * limit;
        batchPromises.push(
          this.client.request<PartyResponse>(
            'v6/party/list',
            'GET',
            { responseSchema: PartyResponseSchema },
            { ...params, max: String(limit), first: String(offset) }
          )
        );
      }

      const batchResults = await Promise.all(batchPromises);
      for (const [pageData, pageError] of batchResults) {
        if (pageError) {
          return [null, pageError];
        }
        if (pageData?.parties) {
          allResults.push(...pageData.parties);
        }
      }
    }

    return [allResults, null];
  }

  get(id: string): Promise<VintraceResult<Party>> {
    /**
     * Get party details by id.
     *
     * Returns a single party with a given id.
     */
    return this.client.request<Party>(`v6/party/${id}`, 'GET', { responseSchema: PartySchema });
  }

  getByName(name: string): Promise<VintraceResult<Party>> {
    /**
     * Get party details by name.
     *
     * Returns a party by its name.
     */
    return this.client.request<Party>('v6/party', 'GET', { responseSchema: PartySchema }, { name });
  }

  create(data: Partial<Party>): Promise<VintraceResult<PartyUpdateResponse>> {
    /**
     * Create or update a party.
     *
     * Include `id` in `data` to update an existing party; otherwise a new party will be created.
     */
    return this.client.request<PartyUpdateResponse>(
      'v6/party',
      'POST',
      { responseSchema: PartyUpdateResponseSchema, requestSchema: PartyWriteSchema },
      data
    );
  }

  getMany(ids: string[]): Promise<VintraceResult<Party[]>> {
    /**
     * Get multiple parties by ids.
     *
     * Batch fetch multiple parties by their IDs. Returns VintraceAggregateError if any request fails.
     */
    return batchFetch(ids, (id) => this.get(id));
  }
}

class ProductsClient {
  constructor(private client: VintraceClient) {}

  /**
   * List available products.
   *
   * Returns a list of all active products.
   */
  async getAll(params?: ProductListParams): Promise<VintraceResult<Product[]>> {
    const limit = params?.max ? parseInt(params.max, 10) : 100;
    const firstResponse = await this.client.request<ProductListResponse>(
      'v6/products/list',
      'GET',
      { responseSchema: ProductListResponseSchema },
      { ...params, max: String(limit), first: '0' }
    );

    if (firstResponse[1]) {
      return [null, firstResponse[1]];
    }

    const response = firstResponse[0];
    if (!response) {
      return [[], null];
    }

    const totalCount = response.totalResultCount ?? response.products?.length ?? 0;
    if (totalCount <= limit) {
      return [response.products ?? [], null];
    }

    const pagesNeeded = Math.ceil(totalCount / limit);
    const parallelLimit = this.client.options.parallelLimit;

    const allResults: Product[] = [...(response.products ?? [])];

    for (let i = 1; i < pagesNeeded; i += parallelLimit) {
      const batchSize = Math.min(parallelLimit, pagesNeeded - i);
      const batchPromises: Promise<VintraceResult<ProductListResponse>>[] = [];

      for (let j = 0; j < batchSize; j++) {
        const offset = (i + j) * limit;
        batchPromises.push(
          this.client.request<ProductListResponse>(
            'v6/products/list',
            'GET',
            { responseSchema: ProductListResponseSchema },
            { ...params, max: String(limit), first: String(offset) }
          )
        );
      }

      const batchResults = await Promise.all(batchPromises);
      for (const [pageData, pageError] of batchResults) {
        if (pageError) {
          return [null, pageError];
        }
        if (pageData?.products) {
          allResults.push(...pageData.products);
        }
      }
    }

    return [allResults, null];
  }

  get(id: string): Promise<VintraceResult<ProductResponse>> {
    /**
     * Search for a product by id.
     *
     * Searches for a product using an id and returns the product details and vessel information.
     */
    return this.client.request<ProductResponse>(`v6/products/${id}`, 'GET', {
      responseSchema: ProductResponseSchema,
    });
  }

  async getMany(ids: string[]): Promise<VintraceResult<Product[]>> {
    /**
     * Get multiple products by ids.
     *
     * Batch fetch multiple products by their IDs. Returns VintraceAggregateError if any request fails.
     */
    const results = await Promise.allSettled(ids.map((id) => this.get(id)));
    const errors: VintraceError[] = [];
    const data: Product[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const [envelope, error] = result.value;
        if (error) {
          errors.push(error);
        } else if (envelope?.product) {
          data.push(envelope.product);
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

  create(data: unknown): Promise<VintraceResult<ProductResponse>> {
    /**
     * Create a new product.
     *
     * Creates a new product with the provided data.
     */
    return this.client.request<ProductResponse>(
      'v6/products',
      'POST',
      { responseSchema: ProductResponseSchema, requestSchema: ProductSchema },
      data
    );
  }

  update(id: string, data: unknown): Promise<VintraceResult<ProductUpdateResponse>> {
    /**
     * Update a product by id.
     *
     * Replace (update) a product by id with the provided data.
     */
    return this.client.request<ProductUpdateResponse>(
      `v6/products/${id}`,
      'PUT',
      { responseSchema: ProductUpdateResponseSchema, requestSchema: ProductSchema },
      data
    );
  }

  updateFields(data: ProductUpdateData): Promise<VintraceResult<ProductUpdateResponse>> {
    /**
     * Update specific fields on a product.
     *
     * Partially update product fields using the provided data.
     */
    return this.client.request<ProductUpdateResponse>(
      'v6/product-update',
      'POST',
      { responseSchema: ProductUpdateResponseSchema, requestSchema: ProductUpdateDataSchema },
      data
    );
  }
}

class BlocksClient {
  constructor(private client: VintraceClient) {}

  /**
   * Get all blocks in the system.
   *
   * Get all the blocks that matches the provided query params in the system.
   * By default, the block data returned in this endpoint only includes:
   * id, code, name, description, grower, vineyard, region, subRegion, varietal,
   * rowNumbers, estate, intendedUse, grading, externalId, inactive
   *
   * API consumer can use the include and vintage query params to request including more information in the response.
   */
  async getAll(params?: Record<string, unknown>): Promise<VintraceResult<unknown[]>> {
    const limit = params?.limit ? parseInt(String(params.limit), 10) : 100;
    const firstResponse = await this.client.request<GetBlocksSuccessResponse>(
      'v7/harvest/blocks',
      'GET',
      { responseSchema: GetBlocksSuccessResponseSchema },
      { ...params, limit: String(limit), offset: '0' }
    );

    if (firstResponse[1]) {
      return [null, firstResponse[1]];
    }

    const response = firstResponse[0];
    if (!response) {
      return [[], null];
    }

    const totalCount = response.totalResults ?? 0;
    if (totalCount <= limit) {
      return [response.results ?? [], null];
    }

    const pagesNeeded = Math.ceil(totalCount / limit);
    const parallelLimit = this.client.options.parallelLimit;

    const allResults: unknown[] = [...(response.results ?? [])];

    for (let i = 1; i < pagesNeeded; i += parallelLimit) {
      const batchSize = Math.min(parallelLimit, pagesNeeded - i);
      const batchPromises: Promise<VintraceResult<GetBlocksSuccessResponse>>[] = [];

      for (let j = 0; j < batchSize; j++) {
        const offset = (i + j) * limit;
        batchPromises.push(
          this.client.request<GetBlocksSuccessResponse>(
            'v7/harvest/blocks',
            'GET',
            { responseSchema: GetBlocksSuccessResponseSchema },
            { ...params, limit: String(limit), offset: String(offset) }
          )
        );
      }

      const batchResults = await Promise.all(batchPromises);
      for (const [pageData, pageError] of batchResults) {
        if (pageError) {
          return [null, pageError];
        }
        if (pageData?.results) {
          allResults.push(...pageData.results);
        }
      }
    }

    return [allResults, null];
  }

  get(id: string) {
    /**
     * Get a single block by id.
     *
     * Retrieve a single block by its id. The API supports fetching a subset of
     * fields by using query params such as `include` and `vintage` (see server docs).
     * Path parameter `id` is the numeric/internal identifier for the block.
     */
    return this.client.request<unknown>(`v7/harvest/blocks/${id}`, 'GET');
  }

  getMany(ids: string[]): Promise<VintraceResult<unknown[]>> {
    /**
     * Get multiple blocks by ids.
     *
     * Batch fetch multiple blocks by their IDs. Returns VintraceAggregateError if any request fails.
     */
    return batchFetch(ids, (id) => this.get(id));
  }

  post(data: unknown) {
    /**
     * Upsert block data into system.
     *
     * Create or update block data in the system. Provide a Block object in `data`.
     * Example fields: `extId`, `name`, `estate`, `vineyard`, `variety`, `area`.
     */
    return this.client.request<unknown>('v7/harvest/blocks', 'POST', {}, data);
  }

  patch(id: string, data: unknown) {
    /**
     * Partially update some fields in the block record.
     *
     * Provide functionality to update only some fields in the bulk intake record.
     * Note, not all fields will support this PATCH operation.
     */
    return this.client.request<unknown>(`v7/harvest/blocks/${id}`, 'PATCH', {}, data);
  }
}

class BookingsClient {
  constructor(private client: VintraceClient) {}

  post(data: unknown) {
    /**
     * Upsert a booking into vintrace.
     *
     * Create or update a booking record.
     */
    return this.client.request<unknown>('v7/operation/bookings', 'POST', {}, data);
  }

  deactivate(id: string) {
    /**
     * Deactivate this booking record.
     *
     * Deactivates a booking by its ID.
     */
    return this.client.request<unknown>(`v7/operation/bookings/${id}/deactivation`, 'POST');
  }
}

class VesselDetailsReportClient {
  constructor(private client: VintraceClient) {}

  /**
   * Get vessel details report.
   *
   * Returns a vessel details report based on the provided parameters.
   */
  get(params?: VesselDetailsReportParams): Promise<VintraceResult<unknown>> {
    return this.client.request<unknown>('v7/report/vessel-details-report', 'GET', {}, params);
  }
}

class TransactionsClient {
  constructor(private client: VintraceClient) {}

  /**
   * Transaction search.
   *
   * Returns a list of transactions matching search criteria.
   */
  async search(params?: TransactionSearchParams): Promise<VintraceResult<unknown[]>> {
    const limit = params?.maxResults ? params.maxResults : 100;
    const firstResponse = await this.client.request<TransactionSearchResponse>(
      'v6/transaction/search',
      'GET',
      { responseSchema: TransactionSearchResponseSchema },
      { ...params, maxResults: limit, firstResult: 0 }
    );

    if (firstResponse[1]) {
      return [null, firstResponse[1]];
    }

    const response = firstResponse[0];
    if (!response) {
      return [[], null];
    }

    const totalCount = response.totalResultCount ?? response.results?.length ?? 0;
    if (totalCount <= limit) {
      return [response.results ?? [], null];
    }

    const pagesNeeded = Math.ceil(totalCount / limit);
    const parallelLimit = this.client.options.parallelLimit;

    const allResults: unknown[] = [...(response.results ?? [])];

    for (let i = 1; i < pagesNeeded; i += parallelLimit) {
      const batchSize = Math.min(parallelLimit, pagesNeeded - i);
      const batchPromises: Promise<VintraceResult<TransactionSearchResponse>>[] = [];

      for (let j = 0; j < batchSize; j++) {
        const offset = (i + j) * limit;
        batchPromises.push(
          this.client.request<TransactionSearchResponse>(
            'v6/transaction/search',
            'GET',
            { responseSchema: TransactionSearchResponseSchema },
            { ...params, maxResults: limit, firstResult: offset }
          )
        );
      }

      const batchResults = await Promise.all(batchPromises);
      for (const [pageData, pageError] of batchResults) {
        if (pageError) {
          return [null, pageError];
        }
        if (pageData?.results) {
          allResults.push(...pageData.results);
        }
      }
    }

    return [allResults, null];
  }
}

class IntakeOperationsClient {
  constructor(private client: VintraceClient) {}

  /**
   * Fruit intake operation search.
   *
   * Returns a list of fruit intake operations matching search criteria.
   */
  async search(params?: IntakeOperationSearchParams): Promise<VintraceResult<unknown[]>> {
    const limit = params?.maxResults ? params.maxResults : 100;
    const firstResponse = await this.client.request<IntakeOperationSearchResponse>(
      'v6/intake-operations/search',
      'GET',
      { responseSchema: IntakeOperationSearchResponseSchema },
      { ...params, maxResults: limit, firstResult: 0 }
    );

    if (firstResponse[1]) {
      return [null, firstResponse[1]];
    }

    const response = firstResponse[0];
    if (!response) {
      return [[], null];
    }

    const totalCount = response.totalResultCount ?? response.results?.length ?? 0;
    if (totalCount <= limit) {
      return [response.results ?? [], null];
    }

    const pagesNeeded = Math.ceil(totalCount / limit);
    const parallelLimit = this.client.options.parallelLimit;

    const allResults: unknown[] = [...(response.results ?? [])];

    for (let i = 1; i < pagesNeeded; i += parallelLimit) {
      const batchSize = Math.min(parallelLimit, pagesNeeded - i);
      const batchPromises: Promise<VintraceResult<IntakeOperationSearchResponse>>[] = [];

      for (let j = 0; j < batchSize; j++) {
        const offset = (i + j) * limit;
        batchPromises.push(
          this.client.request<IntakeOperationSearchResponse>(
            'v6/intake-operations/search',
            'GET',
            { responseSchema: IntakeOperationSearchResponseSchema },
            { ...params, maxResults: limit, firstResult: offset }
          )
        );
      }

      const batchResults = await Promise.all(batchPromises);
      for (const [pageData, pageError] of batchResults) {
        if (pageError) {
          return [null, pageError];
        }
        if (pageData?.results) {
          allResults.push(...pageData.results);
        }
      }
    }

    return [allResults, null];
  }
}

class SampleOperationsClient {
  constructor(private client: VintraceClient) {}

  /**
   * Maturity samples search.
   *
   * Returns a list of maturity samples matching search criteria.
   */
  async search(params?: SampleOperationSearchParams): Promise<VintraceResult<unknown[]>> {
    const limit = params?.maxResults ? params.maxResults : 100;
    const firstResponse = await this.client.request<SampleOperationSearchResponse>(
      'v6/sample-operations/search',
      'GET',
      { responseSchema: SampleOperationSearchResponseSchema },
      { ...params, maxResults: limit, firstResult: 0 }
    );

    if (firstResponse[1]) {
      return [null, firstResponse[1]];
    }

    const response = firstResponse[0];
    if (!response) {
      return [[], null];
    }

    const totalCount = response.totalResultCount ?? response.results?.length ?? 0;
    if (totalCount <= limit) {
      return [response.results ?? [], null];
    }

    const pagesNeeded = Math.ceil(totalCount / limit);
    const parallelLimit = this.client.options.parallelLimit;

    const allResults: unknown[] = [...(response.results ?? [])];

    for (let i = 1; i < pagesNeeded; i += parallelLimit) {
      const batchSize = Math.min(parallelLimit, pagesNeeded - i);
      const batchPromises: Promise<VintraceResult<SampleOperationSearchResponse>>[] = [];

      for (let j = 0; j < batchSize; j++) {
        const offset = (i + j) * limit;
        batchPromises.push(
          this.client.request<SampleOperationSearchResponse>(
            'v6/sample-operations/search',
            'GET',
            { responseSchema: SampleOperationSearchResponseSchema },
            { ...params, maxResults: limit, firstResult: offset }
          )
        );
      }

      const batchResults = await Promise.all(batchPromises);
      for (const [pageData, pageError] of batchResults) {
        if (pageError) {
          return [null, pageError];
        }
        if (pageData?.results) {
          allResults.push(...pageData.results);
        }
      }
    }

    return [allResults, null];
  }
}

class BlockAssessmentsClient {
  constructor(private client: VintraceClient) {}

  /**
   * Create a block assessment.
   *
   * Upsert the assessment data for a block.
   */
  create(data: unknown): Promise<VintraceResult<unknown>> {
    return this.client.request<unknown>('v6/block-assessments/create', 'POST', {}, data);
  }
}

class MrpStockClient {
  constructor(private client: VintraceClient) {}

  /**
   * View a single stock item.
   *
   * Get a single stock item by ID with optional expand parameter.
   */
  get(id: string, expand?: string): Promise<VintraceResult<unknown>> {
    return this.client.request<unknown>(
      `v6/mrp/stock/${id}`,
      'GET',
      {},
      expand ? { expand } : undefined
    );
  }

  getFields(id: string): Promise<VintraceResult<unknown>> {
    /**
     * View list of details fields.
     *
     * Returns a list of detail fields for a stock item.
     */
    return this.client.request<unknown>(`v6/mrp/stock/${id}/fields`, 'GET');
  }

  getDistributions(id: string): Promise<VintraceResult<unknown>> {
    /**
     * View distributions.
     *
     * Returns distributions for a stock item.
     */
    return this.client.request<unknown>(`v6/mrp/stock/${id}/distributions`, 'GET');
  }

  getHistoryItems(id: string, params: MrpStockHistoryParams): Promise<VintraceResult<unknown>> {
    /**
     * View History items.
     *
     * A paginated list of history items for a stock item.
     */
    return this.client.request<unknown>(`v6/mrp/stock/${id}/history-items`, 'GET', {}, params);
  }

  getRawComponents(id: string): Promise<VintraceResult<unknown>> {
    /**
     * View raw components.
     *
     * Returns a paginated list of raw components for a stock item.
     */
    return this.client.request<unknown>(`v6/mrp/stock/${id}/raw-components`, 'GET');
  }

  getNotes(id: string, params?: MrpStockNotesParams): Promise<VintraceResult<unknown>> {
    /**
     * Get notes for a stock item.
     *
     * Returns notes associated with a stock item.
     */
    return this.client.request<unknown>(`v6/mrp/stock/${id}/notes`, 'GET', {}, params);
  }

  postNote(id: string, data: unknown): Promise<VintraceResult<unknown>> {
    /**
     * Create a note for a stock item.
     *
     * Adds a new note to a stock item.
     */
    return this.client.request<unknown>(`v6/mrp/stock/${id}/notes`, 'POST', {}, data);
  }

  getNote(id: string, noteId: string): Promise<VintraceResult<unknown>> {
    /**
     * Get a specific note for a stock item.
     *
     * Returns a specific note by ID for a stock item.
     */
    return this.client.request<unknown>(`v6/mrp/stock/${id}/notes/${noteId}`, 'GET');
  }

  updateNote(id: string, noteId: string, data: unknown): Promise<VintraceResult<unknown>> {
    /**
     * Update a note for a stock item.
     *
     * Updates an existing note on a stock item.
     */
    return this.client.request<unknown>(
      `v6/mrp/stock/${id}/notes/${noteId}/updates`,
      'POST',
      {},
      data
    );
  }

  getBulkInfo(id: string): Promise<VintraceResult<unknown>> {
    /**
     * Get bulk info for a stock item.
     *
     * Returns bulk information for a stock item.
     */
    return this.client.request<unknown>(`v6/mrp/stock/${id}/bulk-info`, 'GET');
  }
}

class InventoryClient {
  constructor(private client: VintraceClient) {}

  /**
   * List available stock.
   *
   * Returns a list of all stock items.
   */
  async getAll(params?: InventoryListParams): Promise<VintraceResult<unknown[]>> {
    const limit = params?.max ? parseInt(params.max, 10) : 100;
    const firstResponse = await this.client.request<InventoryResponse>(
      'v6/inventory',
      'GET',
      { responseSchema: InventoryResponseSchema },
      { ...params, max: String(limit), first: '0' }
    );

    if (firstResponse[1]) {
      return [null, firstResponse[1]];
    }

    const response = firstResponse[0];
    if (!response) {
      return [[], null];
    }

    const totalCount = response.totalResultCount ?? response.results?.length ?? 0;
    if (totalCount <= limit) {
      return [response.results ?? [], null];
    }

    const pagesNeeded = Math.ceil(totalCount / limit);
    const parallelLimit = this.client.options.parallelLimit;

    const allResults: unknown[] = [...(response.results ?? [])];

    for (let i = 1; i < pagesNeeded; i += parallelLimit) {
      const batchSize = Math.min(parallelLimit, pagesNeeded - i);
      const batchPromises: Promise<VintraceResult<InventoryResponse>>[] = [];

      for (let j = 0; j < batchSize; j++) {
        const offset = (i + j) * limit;
        batchPromises.push(
          this.client.request<InventoryResponse>(
            'v6/inventory',
            'GET',
            { responseSchema: InventoryResponseSchema },
            { ...params, max: String(limit), first: String(offset) }
          )
        );
      }

      const batchResults = await Promise.all(batchPromises);
      for (const [pageData, pageError] of batchResults) {
        if (pageError) {
          return [null, pageError];
        }
        if (pageData?.results) {
          allResults.push(...pageData.results);
        }
      }
    }

    return [allResults, null];
  }
}

class SearchClient {
  constructor(private client: VintraceClient) {}

  /**
   * List results for item type.
   *
   * Returns search results for a specific item type.
   * Supported types are grading, owner, program, varietal, vintage,
   * productState, region, block, grower, productCategory, batch, product, tank,
   * vessel, containerEquipment, barrel, bin.
   */
  async list(params: SearchListParams): Promise<VintraceResult<unknown[]>> {
    const limit = params?.max ? parseInt(params.max, 10) : 100;
    const firstResponse = await this.client.request<SearchListResponse>(
      'v6/search/list',
      'GET',
      { responseSchema: SearchListResponseSchema },
      { ...params, max: String(limit), first: '0' }
    );

    if (firstResponse[1]) {
      return [null, firstResponse[1]];
    }

    const response = firstResponse[0];
    if (!response) {
      return [[], null];
    }

    const totalCount = response.totalResultCount ?? response.results?.length ?? 0;
    if (totalCount <= limit) {
      return [response.results ?? [], null];
    }

    const pagesNeeded = Math.ceil(totalCount / limit);
    const parallelLimit = this.client.options.parallelLimit;

    const allResults: unknown[] = [...(response.results ?? [])];

    for (let i = 1; i < pagesNeeded; i += parallelLimit) {
      const batchSize = Math.min(parallelLimit, pagesNeeded - i);
      const batchPromises: Promise<VintraceResult<SearchListResponse>>[] = [];

      for (let j = 0; j < batchSize; j++) {
        const offset = (i + j) * limit;
        batchPromises.push(
          this.client.request<SearchListResponse>(
            'v6/search/list',
            'GET',
            { responseSchema: SearchListResponseSchema },
            { ...params, max: String(limit), first: String(offset) }
          )
        );
      }

      const batchResults = await Promise.all(batchPromises);
      for (const [pageData, pageError] of batchResults) {
        if (pageError) {
          return [null, pageError];
        }
        if (pageData?.results) {
          allResults.push(...pageData.results);
        }
      }
    }

    return [allResults, null];
  }
}

class ProductAnalysisClient {
  constructor(private client: VintraceClient) {}

  /**
   * Get analysis data for a product by its numeric ID.
   * The endpoint path matches the `productAnalysisEndpoint` field returned on a Product.
   * e.g. GET v6/product-analysis/{productId}
   */
  get(
    productId: number,
    params?: ProductAnalysisParams
  ): Promise<VintraceResult<ProductAnalysisResponse>> {
    return this.client.request<ProductAnalysisResponse>(
      `v6/product-analysis/${productId}`,
      'GET',
      { responseSchema: ProductAnalysisResponseSchema },
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
      'GET',
      { responseSchema: ProductCompositionResponseSchema }
    );
  }
}
