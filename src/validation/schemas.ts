import { z } from 'zod';

export const ExtIdentifiableEntitySchema = z.object({
  id: z.number().optional(),
  extId: z.string().optional(),
});

export const IdentifiableEntitySchema = z.object({
  id: z.number().optional(),
});

export const CodedIdentifiableEntitySchema = z.object({
  id: z.number().optional(),
  code: z.string().optional(),
});

export const ResourceLinkSchema = z.object({
  rel: z.string().optional(),
  href: z.string().optional(),
});

export const FieldValuePairSchema = z.object({
  fieldName: z.string().optional(),
  value: z.unknown().optional(),
});

export const WorkOrderJobSchema = z.object({
  id: z.number().optional(),
  type: z.enum(['WINERY', 'MRP']).optional(),
  jobNumber: z.number().optional(),
  status: z
    .enum(['INCOMPLETE', 'ASSIGNED', 'COMPLETED', 'ROLLBACK_REPLAY', 'IN_PROGRESS', 'PENDING_APPROVAL'])
    .optional(),
  scheduledTime: z.number().optional(),
  finishedTime: z.number().optional(),
  link: ResourceLinkSchema.optional(),
});

export const WineryWorkOrderJobSchema = WorkOrderJobSchema.extend({
  operationType: z.string().optional(),
});

export const WorkOrderSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
  assignedTo: ExtIdentifiableEntitySchema.optional(),
  issuedBy: ExtIdentifiableEntitySchema.optional(),
  status: z
    .enum(['DRAFT', 'READY', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'CANCELLED', 'REPLAY'])
    .optional(),
  scheduledTime: z.number().optional(),
  summary: z.string().optional(),
  jobs: WineryWorkOrderJobSchema.array().optional(),
});

export const GetWorkOrdersSuccessResponseSchema = z.object({
  totalResults: z.number().optional(),
  offset: z.number().optional(),
  limit: z.number().optional(),
  first: z.string().optional(),
  previous: z.string().optional(),
  next: z.string().optional(),
  last: z.string().optional(),
  results: WorkOrderSchema.array().optional(),
});

export const ProductLiveMetricMeasurementSchema = z.object({
  name: z.string().optional(),
  value: z.number().optional(),
  unit: z.string().optional(),
  maxVal: z.number().optional(),
});

export const ProductLiveMetricSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  measurements: ProductLiveMetricMeasurementSchema.array().optional(),
});

export const VolumeSchema = z.object({
  value: z.number().optional(),
  unit: z.string().optional(),
});

export const BeverageTypePropertiesSchema = z.record(z.string(), z.unknown());

export const ProductSchema = z.object({
  id: z.number().optional(),
  batchCode: z.string().optional(),
  vesselId: z.number().optional(),
  description: z.string().optional(),
  descriptionCanEdit: z.boolean().optional(),
  volume: VolumeSchema.optional(),
  vesselCode: z.string().optional(),
  hasDipTable: z.boolean().optional(),
  dipTableEndpoint: z.string().optional(),
  colour: z.string().optional(),
  physicalProductState: z.string().optional(),
  vesselType: z.string().optional(),
  productStatus: z.string().optional(),
  productAnalysisEndpoint: z.string().optional(),
  productCompositionEndpoint: z.string().optional(),
  productEndpoint: z.string().optional(),
  liveMetrics: ProductLiveMetricSchema.array().optional(),
  fieldValuePairs: FieldValuePairSchema.array().optional(),
  canAccessNotes: z.boolean().optional(),
  notesCount: z.number().optional(),
  notesEndpoint: z.string().optional(),
  beverageTypeProperties: BeverageTypePropertiesSchema.optional(),
});

export const ProductVesselDetailsSchema = z.object({
  vesselId: z.number().optional(),
  containerType: z
    .enum(['Tank', 'Barrel', 'Barrel group', 'Bin group', 'Press', 'Bin', 'Tanker'])
    .optional(),
});

export const ProductResponseSchema = z.object({
  status: z.string().optional(),
  product: ProductSchema.optional(),
  vessel: ProductVesselDetailsSchema.optional(),
});

export const ProductListResponseSchema = z.object({
  status: z.string().optional(),
  products: ProductSchema.array().optional(),
  totalResultCount: z.number().optional(),
  firstResult: z.number().optional(),
  maxResult: z.number().optional(),
  nextURLPath: z.string().nullable().optional(),
  prevURLPath: z.string().nullable().optional(),
});

export const ProductUpdateFieldSchema = z.object({
  propertyType: z.string().optional(),
  propertyValue: z.string().optional(),
  propertyId: z.number().optional(),
});

export const ProductUpdateDataSchema = z.object({
  productId: z.number().optional(),
  updateFields: ProductUpdateFieldSchema.array().optional(),
});

export const ProductUpdateResponseSchema = z.object({
  status: z.string().optional(),
  product: ProductSchema.optional(),
});

export const AddressSchema = z.object({
  street1: z.string().nullable(),
  street2: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  postalCode: z.string().nullable(),
  country: z.string().nullable(),
});

export const SendToAddressSchema = z.object({
  name: z.string().nullable(),
  phone: z.string().nullable(),
  address: AddressSchema.nullable(),
});

export const TaxBreakdownSchema = z.object({
  name: z.string(),
  amount: z.number(),
  ratePct: z.number(),
  inclusive: z.boolean(),
});

export const SalesOrderItemSchema = z.object({
  id: z.number().optional(),
  itemId: z.number().optional(),
  itemName: z.string().optional(),
  unitPrice: z.number().optional(),
  quantity: z.number().optional(),
  unitOfMeasure: z.string().nullable(),
  discountPct: z.number().nullable(),
  adjustment: z.number().nullable(),
  taxAmount: z.number().optional(),
  lineTotal: z.number().optional(),
  accountId: z.number().optional(),
  accountCode: z.string().optional(),
  taxRateId: z.number().optional(),
  taxRateName: z.string().nullable(),
});

export const PriceDetailsSchema = z.object({
  countryCurrencyCode: z.string().optional(),
  taxPolicy: z.string().optional(),
});

export const SalesOrderSchema = z.object({
  id: z.number().optional(),
  invoiceDate: z.number().nullable(),
  invoiceDateAsText: z.string(),
  customerId: z.number().optional(),
  customerName: z.string().optional(),
  sendTo: SendToAddressSchema.optional(),
  salesType: z.string().optional(),
  salesPriceListId: z.number().nullable(),
  salesPriceListName: z.string().nullable(),
  priceDetails: PriceDetailsSchema.optional(),
  salesOrderStatus: z.string().optional(),
  salesOrderItems: SalesOrderItemSchema.array().optional(),
  code: z.string().optional(),
  description: z.string().nullable(),
  reference: z.string().nullable(),
  orderDate: z.number().optional(),
  orderDateAsText: z.string(),
  wineryId: z.number().nullable(),
  wineryName: z.string().nullable(),
  fulfillment: z.string().optional(),
  fulfillmentDate: z.number().nullable(),
  fulfillmentDateAsText: z.string(),
  salesRegionId: z.number().nullable(),
  salesRegionCode: z.string().nullable(),
  notes: z.string().nullable(),
  customerPickup: z.boolean().optional(),
  disableAccountsSync: z.boolean().optional(),
  subTotal: z.number().optional(),
  taxBreakdown: TaxBreakdownSchema.array().optional(),
  total: z.number().optional(),
  acctReference: z.string().nullable(),
  posSaleReference: z.string().nullable(),
  ignoreStockError: z.boolean().optional(),
});

export const SalesOrderResponseSchema = z.object({
  status: z.string(),
  message: z.string().nullable(),
  salesOrders: SalesOrderSchema.array(),
  totalResultCount: z.number().optional(),
  firstResult: z.number().optional(),
  maxResult: z.number().optional(),
  nextURLPath: z.string().nullable().optional(),
  prevURLPath: z.string().nullable().optional(),
});

export const SalesOrderUpdateResponseSchema = z.object({
  status: z.string(),
  message: z.string().nullable(),
  salesOrder: SalesOrderSchema.optional(),
});

export const RefundLineItemSchema = z.object({
  id: z.number().optional(),
  itemId: z.number().optional(),
  itemName: z.string().optional(),
  unitPrice: z.number().optional(),
  returnQuantity: z.number().optional(),
  returnTotal: z.number().optional(),
  taxAmount: z.number().optional(),
});

export const RefundSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
  refundDate: z.number().optional(),
  refundDateAsText: z.string(),
  reference: z.string().nullable(),
  stockReturned: z.boolean().optional(),
  storageAreaId: z.number().nullable(),
  storageAreaName: z.string().nullable(),
  customerId: z.number().optional(),
  customerName: z.string().optional(),
  refundStatus: z.string().optional(),
  notes: z.string().nullable(),
  salesOrderId: z.number().optional(),
  salesOrderName: z.string().optional(),
  subTotal: z.number().optional(),
  total: z.number().optional(),
  taxBreakdown: TaxBreakdownSchema.array().optional(),
  refundLineItems: RefundLineItemSchema.array().optional(),
  posSaleReference: z.string().nullable(),
  disableAccountsSync: z.boolean().optional(),
  acctReference: z.string().nullable(),
});

export const RefundResponseSchema = z.object({
  status: z.string(),
  message: z.string().nullable(),
  refunds: RefundSchema.array(),
  totalResultCount: z.number().optional(),
  firstResult: z.number().optional(),
  maxResult: z.number().optional(),
  nextURLPath: z.string().nullable().optional(),
  prevURLPath: z.string().nullable().optional(),
});

export const RefundUpdateResponseSchema = z.object({
  status: z.string(),
  message: z.string().nullable(),
  refund: RefundSchema.optional(),
});

export const PartySchema = z.object({
  id: z.number().optional(),
  primeName: z.string().optional(),
  givenName: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: AddressSchema.optional(),
  isOrganization: z.boolean().optional(),
});

export const PartyResponseSchema = z.object({
  status: z.string(),
  message: z.string().nullable(),
  parties: PartySchema.array(),
  totalResultCount: z.number().optional(),
  firstResult: z.number().optional(),
  maxResult: z.number().optional(),
  nextURLPath: z.string().nullable().optional(),
  prevURLPath: z.string().nullable().optional(),
});

export const WorkOrderJobDetailSchema = z.object({
  id: z.number().optional(),
  code: z.string().optional(),
  scheduledDate: z.number().nullable(),
  finishedDate: z.number().nullable(),
  scheduledDateAsText: z.string(),
  finishedDateAsText: z.string(),
  status: z.string().optional(),
  assignedBy: z.string().optional(),
  assignedTo: z.string().optional(),
  summaryText: z.string().optional(),
  miniSummaryText: z.string().optional(),
  jobColour: z.string().optional(),
  jobNumber: z.number().optional(),
  stepText: z.string().nullable(),
  steps: z.array(z.unknown()).optional(),
  endpointURL: z.string().optional(),
  jobVersion: z.number().optional(),
  workOrderId: z.number().optional(),
});

export const WorkOrderDetailSchema = z.object({
  id: z.number().optional(),
  code: z.string().optional(),
  jobCount: z.number().optional(),
  jobCountText: z.string().optional(),
  status: z.string().optional(),
  assignedTo: z.string().optional(),
  assignedBy: z.string().optional(),
  assignedDate: z.number().optional(),
  scheduledDate: z.number().nullable(),
  assignedDateAsText: z.string(),
  scheduledDateAsText: z.string(),
  canAssign: z.boolean().optional(),
  summary: z.string().optional(),
  indicators: z.array(z.string()).optional(),
  bond: z.string().nullable(),
  winery: z.string().nullable(),
  jobs: WorkOrderJobDetailSchema.array().optional(),
  colourCode: z.string().optional(),
  endpointURL: z.string().optional(),
});

export const WorkOrderSearchResponseSchema = z.object({
  firstResult: z.number().optional(),
  maxResult: z.number().optional(),
  totalResultCount: z.number().optional(),
  nextURLPath: z.string().nullable(),
  prevURLPath: z.string().nullable(),
  listText: z.string().optional(),
  workOrders: WorkOrderDetailSchema.array().optional(),
});

export const AssignWorkDataSchema = z.object({
  workOrderId: z.number().optional(),
});

export const AssignWorkResponseSchema = z.object({
  status: z.string(),
  message: z.string().nullable(),
  jobEndpointURL: z.string().nullable(),
  workOrderEndpointURL: z.string().optional(),
});

export const SubmitJobFieldSchema = z.object({
  fieldId: z.string(),
  value: z.string().optional(),
});

export const SubmitJobRequestSchema = z.object({
  jobId: z.number().optional(),
  submitType: z.string().optional(),
  fields: SubmitJobFieldSchema.array().optional(),
});

export const SubmitWorkOrderStepsResponseSchema = z.object({
  status: z.string(),
  message: z.string().optional(),
});

export const PartyUpdateResponseSchema = z.object({
  status: z.string(),
  message: z.string().nullable(),
  party: PartySchema.optional(),
});

// Partial write schemas — used for request validation on create/update methods
// where callers supply Partial<T> rather than the full entity shape.
export const SalesOrderWriteSchema = SalesOrderSchema.partial();
export const RefundWriteSchema = RefundSchema.partial();
export const PartyWriteSchema = PartySchema.partial();

export const TransactionSearchParamsSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  ownerName: z.string().optional(),
  batchName: z.string().optional(),
  wineryName: z.string().optional(),
  maxResults: z.number().optional(),
  firstResult: z.number().optional(),
});

export const IntakeOperationSearchParamsSchema = z.object({
  modifiedSince: z.string().optional(),
  operationId: z.number().optional(),
  processId: z.number().optional(),
  deliveryDocket: z.string().optional(),
  intakeDocket: z.string().optional(),
  externalWeighTag: z.string().optional(),
  externalSystemBlocksOnly: z.boolean().optional(),
  externalBlockId: z.string().optional(),
  blockId: z.number().optional(),
  blockName: z.string().optional(),
  vineyardId: z.number().optional(),
  vineyardName: z.string().optional(),
  wineryId: z.number().optional(),
  wineryName: z.string().optional(),
  growerType: z.string().optional(),
  growerId: z.number().optional(),
  growerName: z.string().optional(),
  ownerId: z.number().optional(),
  ownerName: z.string().optional(),
  vintage: z.string().optional(),
  recordedAfter: z.string().optional(),
  recordedBefore: z.string().optional(),
  customAdapter: z.string().optional(),
  maxResults: z.number().optional(),
  firstResult: z.number().optional(),
});

export const SampleOperationSearchParamsSchema = z.object({
  modifiedSince: z.string().optional(),
  operationId: z.number().optional(),
  processId: z.number().optional(),
  externalSystemBlocksOnly: z.boolean().optional(),
  externalBlockId: z.string().optional(),
  blockId: z.number().optional(),
  blockName: z.string().optional(),
  vineyardId: z.number().optional(),
  vineyardName: z.string().optional(),
  growerId: z.number().optional(),
  growerName: z.string().optional(),
  ownerId: z.number().optional(),
  ownerName: z.string().optional(),
  vintage: z.string().optional(),
  recordedAfter: z.string().optional(),
  recordedBefore: z.string().optional(),
  customAdapter: z.string().optional(),
  maxResults: z.number().optional(),
  firstResult: z.number().optional(),
});

export const InventoryListParamsSchema = z.object({
  max: z.string().optional(),
  first: z.string().optional(),
  date: z.string().optional(),
  stockType: z.string().optional(),
  ownerName: z.string().optional(),
  showEquivalentType: z.string().optional(),
  breakoutCosting: z.boolean().optional(),
  disableCommitHeaders: z.boolean().optional(),
});

export const SearchListParamsSchema = z.object({
  type: z.string(),
  first: z.string().optional(),
  startsWith: z.string().optional(),
  exactMatch: z.boolean().optional(),
  max: z.string().optional(),
});

export const MrpStockHistoryParamsSchema = z.object({
  firstResult: z.number(),
  maxResult: z.number(),
});

export const MrpStockNotesParamsSchema = z.object({
  firstResult: z.number().optional(),
  maxResult: z.number().optional(),
});

// ---------------------------------------------------------------------------
// Product Analysis
// ---------------------------------------------------------------------------

export const RateOfChangeSchema = z.object({
  value: z.number().nullable(),
  sign: z.string().nullable(),
  absValue: z.number().nullable(),
  unit: z.string().nullable(),
  description: z.string().nullable(),
});

export const AnalysisMeasurementSchema = z.object({
  value: z.string(),
  rateOfChange: RateOfChangeSchema.nullable(),
  measurementDateText: z.string(),
  measurementDate: z.number(),
  resultId: z.number(),
  processId: z.number(),
  canDelete: z.boolean(),
  canEdit: z.boolean(),
  canReverse: z.boolean(),
  measurementValidity: z.string(),
});

export const AnalysisMetricDataSchema = z.object({
  id: z.number(),
  name: z.string(),
  unit: z.string(),
  dataType: z.string(),
  dataTypeValues: z.unknown().nullable(),
  minVal: z.number().nullable(),
  maxVal: z.number().nullable(),
  grouping: z.unknown().nullable(),
  canAddValue: z.boolean(),
  measurements: AnalysisMeasurementSchema.array(),
  result: z.unknown().nullable(),
});

export const ProductMetricDataSchema = z.object({
  id: z.number(),
  name: z.string(),
  nextURL: z.string().nullable(),
  metricDataList: AnalysisMetricDataSchema.array(),
});

export const ProductAnalysisResponseSchema = z.object({
  productId: z.number(),
  batchCode: z.string(),
  description: z.string(),
  canAddResult: z.boolean(),
  productMetricDataList: ProductMetricDataSchema.array(),
});

export const ProductAnalysisParamsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  metricId: z.number().optional(),
  weighting: z.number().optional(),
});

// ---------------------------------------------------------------------------
// Product Composition
// ---------------------------------------------------------------------------

export const CompositionComponentSchema = z.object({
  productId: z.number().optional(),
  batchCode: z.string().optional(),
  description: z.string().optional(),
  vintage: z.string().nullable().optional(),
  variety: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  percentage: z.number().optional(),
  volume: VolumeSchema.optional(),
});

export const ProductCompositionResponseSchema = z.object({
  productId: z.number().optional(),
  batchCode: z.string().optional(),
  description: z.string().optional(),
  components: CompositionComponentSchema.array().optional(),
});

export type WorkOrder = z.infer<typeof WorkOrderSchema>;
export type GetWorkOrdersSuccessResponse = z.infer<typeof GetWorkOrdersSuccessResponseSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type ProductResponse = z.infer<typeof ProductResponseSchema>;
export type ProductListResponse = z.infer<typeof ProductListResponseSchema>;
export type ProductUpdateResponse = z.infer<typeof ProductUpdateResponseSchema>;
export type SalesOrder = z.infer<typeof SalesOrderSchema>;
export type SalesOrderResponse = z.infer<typeof SalesOrderResponseSchema>;
export type SalesOrderUpdateResponse = z.infer<typeof SalesOrderUpdateResponseSchema>;
export type Refund = z.infer<typeof RefundSchema>;
export type RefundResponse = z.infer<typeof RefundResponseSchema>;
export type RefundUpdateResponse = z.infer<typeof RefundUpdateResponseSchema>;
export type Party = z.infer<typeof PartySchema>;
export type PartyResponse = z.infer<typeof PartyResponseSchema>;
export type WorkOrderDetail = z.infer<typeof WorkOrderDetailSchema>;
export type WorkOrderSearchResponse = z.infer<typeof WorkOrderSearchResponseSchema>;
export type AssignWorkResponse = z.infer<typeof AssignWorkResponseSchema>;
export type SubmitWorkOrderStepsResponse = z.infer<typeof SubmitWorkOrderStepsResponseSchema>;
export type PartyUpdateResponse = z.infer<typeof PartyUpdateResponseSchema>;
export type ProductUpdateData = z.infer<typeof ProductUpdateDataSchema>;
export type TransactionSearchParams = z.infer<typeof TransactionSearchParamsSchema>;
export type IntakeOperationSearchParams = z.infer<typeof IntakeOperationSearchParamsSchema>;
export type SampleOperationSearchParams = z.infer<typeof SampleOperationSearchParamsSchema>;
export type InventoryListParams = z.infer<typeof InventoryListParamsSchema>;
export type SearchListParams = z.infer<typeof SearchListParamsSchema>;
export type MrpStockHistoryParams = z.infer<typeof MrpStockHistoryParamsSchema>;
export type MrpStockNotesParams = z.infer<typeof MrpStockNotesParamsSchema>;
export type RateOfChange = z.infer<typeof RateOfChangeSchema>;
export type AnalysisMeasurement = z.infer<typeof AnalysisMeasurementSchema>;
export type AnalysisMetricData = z.infer<typeof AnalysisMetricDataSchema>;
export type ProductMetricData = z.infer<typeof ProductMetricDataSchema>;
export type ProductAnalysisResponse = z.infer<typeof ProductAnalysisResponseSchema>;
export type ProductAnalysisParams = z.infer<typeof ProductAnalysisParamsSchema>;
export type CompositionComponent = z.infer<typeof CompositionComponentSchema>;
export type ProductCompositionResponse = z.infer<typeof ProductCompositionResponseSchema>;
export type SalesOrderWrite = z.infer<typeof SalesOrderWriteSchema>;
export type RefundWrite = z.infer<typeof RefundWriteSchema>;
export type PartyWrite = z.infer<typeof PartyWriteSchema>;

// ---------------------------------------------------------------------------
// Generic Paginated Response Schemas (v7 style)
// ---------------------------------------------------------------------------

export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    totalResults: z.number().optional(),
    offset: z.number().optional(),
    limit: z.number().optional(),
    first: z.string().nullable().optional(),
    previous: z.string().nullable().optional(),
    next: z.string().nullable().optional(),
    last: z.string().nullable().optional(),
    results: z.array(itemSchema).optional(),
  });

export const BlockDataSchema = z.object({
  id: z.number(),
  code: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  extId: z.string().optional(),
  inactive: z.boolean().optional(),
});

export const GetBlocksSuccessResponseSchema = PaginatedResponseSchema(BlockDataSchema);

// ---------------------------------------------------------------------------
// v6-style paginated responses: totalResultCount + first/max params
// ---------------------------------------------------------------------------

export const V6PaginatedResponseSchema = z.object({
  totalResultCount: z.number().optional(),
  firstResult: z.number().optional(),
  maxResult: z.number().optional(),
  nextURLPath: z.string().nullable().optional(),
  prevURLPath: z.string().nullable().optional(),
  results: z.array(z.unknown()).optional(),
});

export const InventoryResponseSchema = V6PaginatedResponseSchema;
export const TransactionSearchResponseSchema = V6PaginatedResponseSchema;
export const IntakeOperationSearchResponseSchema = V6PaginatedResponseSchema;
export const SampleOperationSearchResponseSchema = V6PaginatedResponseSchema;
export const SearchListResponseSchema = V6PaginatedResponseSchema;

// ---------------------------------------------------------------------------
// Type exports for new schemas
// ---------------------------------------------------------------------------

export type GetBlocksSuccessResponse = z.infer<typeof GetBlocksSuccessResponseSchema>;
export type BlockData = z.infer<typeof BlockDataSchema>;
export type InventoryResponse = z.infer<typeof InventoryResponseSchema>;
export type TransactionSearchResponse = z.infer<typeof TransactionSearchResponseSchema>;
export type IntakeOperationSearchResponse = z.infer<typeof IntakeOperationSearchResponseSchema>;
export type SampleOperationSearchResponse = z.infer<typeof SampleOperationSearchResponseSchema>;
export type SearchListResponse = z.infer<typeof SearchListResponseSchema>;
export type V6PaginatedResponse = z.infer<typeof V6PaginatedResponseSchema>;
