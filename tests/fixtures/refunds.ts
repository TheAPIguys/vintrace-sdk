import type { Refund, RefundResponse, RefundUpdateResponse } from '../../src/validation/schemas';

export const refundLineItem = {
  id: 152,
  itemId: 41,
  itemName: '11GCZIN - 12 X 750',
  unitPrice: 25,
  returnQuantity: 10,
  returnTotal: 250,
  taxAmount: 22.73,
};

export const refund: Refund = {
  id: 73,
  name: 'VCR201',
  refundDate: 1493820000000,
  refundDateAsText: '04/05/2017',
  reference: null,
  stockReturned: false,
  storageAreaId: null,
  storageAreaName: null,
  customerId: 43,
  customerName: 'ABC Wine Company',
  refundStatus: 'Awaiting approval',
  notes: 'Created from API',
  salesOrderId: 20,
  salesOrderName: 'VSO258',
  subTotal: 1334.55,
  total: 1334.55,
  taxBreakdown: [
    { name: 'GST', amount: 121.32, ratePct: 10, inclusive: true },
    { name: 'WET', amount: 0, ratePct: 0, inclusive: true },
  ],
  refundLineItems: [refundLineItem],
  posSaleReference: null,
  disableAccountsSync: undefined,
  acctReference: null,
};

export const refundResponse: RefundResponse = {
  status: 'Success',
  message: null,
  refunds: [refund],
};

export const refundUpdateResponse: RefundUpdateResponse = {
  status: 'Success',
  message: null,
  refund,
};
