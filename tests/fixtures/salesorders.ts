import type { SalesOrder, SalesOrderResponse, SalesOrderUpdateResponse } from '../../src/validation/schemas';

export const salesOrderItem = {
  id: 424,
  itemId: 2,
  itemName: '11CH-SHINER/CS',
  unitPrice: 10.5,
  quantity: 20,
  unitOfMeasure: 'x12',
  discountPct: null,
  adjustment: null,
  taxAmount: 19.09,
  lineTotal: 210,
  accountId: 3,
  accountCode: 'Revenue',
  taxRateId: 5,
  taxRateName: 'GST inclusive',
};

export const salesOrder: SalesOrder = {
  id: 22,
  invoiceDate: null,
  invoiceDateAsText: '',
  customerId: 43,
  customerName: 'ABC Wine Company',
  sendTo: {
    name: 'ABC Wine Company',
    phone: null,
    address: {
      street1: '1 Some Street',
      street2: null,
      city: 'Napa',
      state: 'CA',
      postalCode: '94558',
      country: null,
    },
  },
  salesType: 'Retail',
  salesPriceListId: 7,
  salesPriceListName: 'GST inclusive',
  priceDetails: {
    countryCurrencyCode: 'AUD Australia Dollar',
    taxPolicy: 'Tax Inclusive',
  },
  salesOrderStatus: 'New',
  salesOrderItems: [salesOrderItem],
  code: 'VSO20',
  description: null,
  reference: null,
  orderDate: 1494424800000,
  orderDateAsText: '11/05/2017',
  wineryId: null,
  wineryName: null,
  fulfillment: 'Approved to send',
  fulfillmentDate: null,
  fulfillmentDateAsText: '',
  salesRegionId: null,
  salesRegionCode: null,
  notes: '',
  customerPickup: false,
  disableAccountsSync: false,
  subTotal: 210,
  taxBreakdown: [{ name: 'GST', amount: 19.09, ratePct: 10, inclusive: true }],
  total: 210,
  acctReference: 'b211a90-84ab-42b8-9c01-add4bfaf1bb',
  posSaleReference: null,
  ignoreStockError: false,
};

export const salesOrderResponse: SalesOrderResponse = {
  status: 'Success',
  message: null,
  salesOrders: [salesOrder],
};

export const salesOrderUpdateResponse: SalesOrderUpdateResponse = {
  status: 'Success',
  message: null,
  salesOrder,
};
