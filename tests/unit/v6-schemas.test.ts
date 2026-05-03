import { describe, it, expect } from 'vitest';
import {
  AddressSchema,
  SendToAddressSchema,
  TaxBreakdownSchema,
  SalesOrderItemSchema,
  SalesOrderSchema,
  SalesOrderResponseSchema,
  SalesOrderUpdateResponseSchema,
  RefundLineItemSchema,
  RefundSchema,
  RefundResponseSchema,
  RefundUpdateResponseSchema,
  PartySchema,
  PartyResponseSchema,
  WorkOrderDetailSchema,
  WorkOrderSearchResponseSchema,
  AssignWorkResponseSchema,
  SubmitJobRequestSchema,
  SubmitWorkOrderStepsResponseSchema,
  ProductSchema,
  ProductResponseSchema,
  ProductListResponseSchema,
  PurchaseOrderLineSchema,
  PurchaseOrderSchema,
  PurchaseOrderResponseSchema,
} from '../../src/validation/schemas';

// ─── AddressSchema ────────────────────────────────────────────────────────────

describe('AddressSchema', () => {
  it('accepts a valid address', () => {
    const result = AddressSchema.safeParse({
      street1: '1 Some Street',
      street2: null,
      city: 'Napa',
      state: 'CA',
      postalCode: '94558',
      country: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const result = AddressSchema.safeParse({ street1: '1 Some Street' });
    expect(result.success).toBe(false);
  });
});

// ─── SendToAddressSchema ──────────────────────────────────────────────────────

describe('SendToAddressSchema', () => {
  it('accepts valid send-to address', () => {
    const result = SendToAddressSchema.safeParse({
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
    });
    expect(result.success).toBe(true);
  });

  it('accepts null address', () => {
    const result = SendToAddressSchema.safeParse({ name: 'Test', phone: null, address: null });
    expect(result.success).toBe(true);
  });
});

// ─── TaxBreakdownSchema ───────────────────────────────────────────────────────

describe('TaxBreakdownSchema', () => {
  it('accepts a valid tax breakdown entry', () => {
    const result = TaxBreakdownSchema.safeParse({ name: 'GST', amount: 19.09, ratePct: 10, inclusive: true });
    expect(result.success).toBe(true);
  });

  it('rejects missing amount', () => {
    const result = TaxBreakdownSchema.safeParse({ name: 'GST', ratePct: 10, inclusive: true });
    expect(result.success).toBe(false);
  });

  it('rejects non-boolean inclusive', () => {
    const result = TaxBreakdownSchema.safeParse({ name: 'GST', amount: 10, ratePct: 10, inclusive: 'yes' });
    expect(result.success).toBe(false);
  });
});

// ─── SalesOrderItemSchema ─────────────────────────────────────────────────────

describe('SalesOrderItemSchema', () => {
  it('accepts a valid sales order item', () => {
    const result = SalesOrderItemSchema.safeParse({
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
    });
    expect(result.success).toBe(true);
  });

  it('accepts null nullable fields', () => {
    const result = SalesOrderItemSchema.safeParse({
      unitOfMeasure: null,
      discountPct: null,
      adjustment: null,
      taxRateName: null,
    });
    expect(result.success).toBe(true);
  });
});

// ─── SalesOrderSchema ─────────────────────────────────────────────────────────

describe('SalesOrderSchema', () => {
  it('accepts a minimal valid sales order', () => {
    // All z.string() (non-optional) fields must be present; nullable fields can be null
    const result = SalesOrderSchema.safeParse({
      invoiceDate: null,
      invoiceDateAsText: '',
      salesPriceListId: null,
      salesPriceListName: null,
      orderDateAsText: '11/05/2017',
      wineryId: null,
      wineryName: null,
      fulfillmentDate: null,
      fulfillmentDateAsText: '',
      salesRegionId: null,
      salesRegionCode: null,
      notes: null,
      acctReference: null,
      posSaleReference: null,
      description: null,
      reference: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required string fields', () => {
    const result = SalesOrderSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ─── SalesOrderResponseSchema ─────────────────────────────────────────────────

describe('SalesOrderResponseSchema', () => {
  it('accepts a valid response', () => {
    const result = SalesOrderResponseSchema.safeParse({
      status: 'Success',
      message: null,
      salesOrders: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing status', () => {
    const result = SalesOrderResponseSchema.safeParse({ message: null, salesOrders: [] });
    expect(result.success).toBe(false);
  });
});

// ─── SalesOrderUpdateResponseSchema ──────────────────────────────────────────

describe('SalesOrderUpdateResponseSchema', () => {
  it('accepts a valid update response', () => {
    const result = SalesOrderUpdateResponseSchema.safeParse({
      status: 'Success',
      message: null,
    });
    expect(result.success).toBe(true);
  });
});

// ─── RefundLineItemSchema ─────────────────────────────────────────────────────

describe('RefundLineItemSchema', () => {
  it('accepts a valid refund line item', () => {
    const result = RefundLineItemSchema.safeParse({
      id: 152,
      itemId: 41,
      itemName: '11GCZIN - 12 X 750',
      unitPrice: 25,
      returnQuantity: 10,
      returnTotal: 250,
      taxAmount: 22.73,
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (all optional)', () => {
    const result = RefundLineItemSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

// ─── RefundSchema ─────────────────────────────────────────────────────────────

describe('RefundSchema', () => {
  it('accepts a valid refund', () => {
    const result = RefundSchema.safeParse({
      refundDateAsText: '04/05/2017',
      reference: null,
      storageAreaId: null,
      storageAreaName: null,
      notes: null,
      posSaleReference: null,
      acctReference: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required date text', () => {
    const result = RefundSchema.safeParse({ reference: null });
    expect(result.success).toBe(false);
  });
});

// ─── RefundResponseSchema ─────────────────────────────────────────────────────

describe('RefundResponseSchema', () => {
  it('accepts a valid response', () => {
    const result = RefundResponseSchema.safeParse({
      status: 'Success',
      message: null,
      refunds: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing refunds array', () => {
    const result = RefundResponseSchema.safeParse({ status: 'Success', message: null });
    expect(result.success).toBe(false);
  });
});

// ─── RefundUpdateResponseSchema ───────────────────────────────────────────────

describe('RefundUpdateResponseSchema', () => {
  it('accepts a valid update response', () => {
    const result = RefundUpdateResponseSchema.safeParse({
      status: 'Success',
      message: null,
    });
    expect(result.success).toBe(true);
  });
});

// ─── PartySchema ──────────────────────────────────────────────────────────────

describe('PartySchema', () => {
  it('accepts a valid organisation party', () => {
    const result = PartySchema.safeParse({
      id: 43,
      primeName: 'ABC Wine Company',
      givenName: null,
      phone: null,
      email: null,
      isOrganization: true,
    });
    expect(result.success).toBe(true);
  });

  it('accepts a valid individual party', () => {
    const result = PartySchema.safeParse({
      id: 13,
      primeName: 'Smith',
      givenName: 'Adam',
      phone: '04123457',
      email: 'smith@123.com',
      isOrganization: false,
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-string email', () => {
    const result = PartySchema.safeParse({ givenName: null, phone: null, email: 123 });
    expect(result.success).toBe(false);
  });
});

// ─── PartyResponseSchema ──────────────────────────────────────────────────────

describe('PartyResponseSchema', () => {
  it('accepts a valid response', () => {
    const result = PartyResponseSchema.safeParse({
      status: 'Success',
      message: null,
      parties: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing parties array', () => {
    const result = PartyResponseSchema.safeParse({ status: 'Success', message: null });
    expect(result.success).toBe(false);
  });
});

// ─── WorkOrderDetailSchema ────────────────────────────────────────────────────

describe('WorkOrderDetailSchema', () => {
  it('accepts a valid work order detail', () => {
    const result = WorkOrderDetailSchema.safeParse({
      id: 2842,
      code: 'TWL2827',
      status: 'READY',
      assignedDateAsText: '',
      scheduledDateAsText: '',
      scheduledDate: null,
      bond: null,
      winery: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required text fields', () => {
    const result = WorkOrderDetailSchema.safeParse({ id: 1 });
    expect(result.success).toBe(false);
  });
});

// ─── WorkOrderSearchResponseSchema ───────────────────────────────────────────

describe('WorkOrderSearchResponseSchema', () => {
  it('accepts a valid search response', () => {
    const result = WorkOrderSearchResponseSchema.safeParse({
      nextURLPath: null,
      prevURLPath: null,
      workOrders: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing nextURLPath', () => {
    const result = WorkOrderSearchResponseSchema.safeParse({ prevURLPath: null });
    expect(result.success).toBe(false);
  });
});

// ─── AssignWorkResponseSchema ─────────────────────────────────────────────────

describe('AssignWorkResponseSchema', () => {
  it('accepts a valid assign response', () => {
    const result = AssignWorkResponseSchema.safeParse({
      status: 'Success',
      message: null,
      jobEndpointURL: '/api/v6/workorders/jobs/482',
      workOrderEndpointURL: '/api/v6/workorders/2842',
    });
    expect(result.success).toBe(true);
  });

  it('accepts null jobEndpointURL', () => {
    const result = AssignWorkResponseSchema.safeParse({
      status: 'Success',
      message: null,
      jobEndpointURL: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing status', () => {
    const result = AssignWorkResponseSchema.safeParse({ message: null, jobEndpointURL: null });
    expect(result.success).toBe(false);
  });
});

// ─── SubmitJobRequestSchema ───────────────────────────────────────────────────

describe('SubmitJobRequestSchema', () => {
  it('accepts a valid submit request', () => {
    const result = SubmitJobRequestSchema.safeParse({
      jobId: 15480,
      submitType: 'draft',
      fields: [{ fieldId: 'abc', value: 'test' }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (all optional)', () => {
    const result = SubmitJobRequestSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects field without required fieldId', () => {
    const result = SubmitJobRequestSchema.safeParse({
      fields: [{ value: 'test' }],
    });
    expect(result.success).toBe(false);
  });
});

// ─── SubmitWorkOrderStepsResponseSchema ───────────────────────────────────────

describe('SubmitWorkOrderStepsResponseSchema', () => {
  it('accepts a valid response', () => {
    const result = SubmitWorkOrderStepsResponseSchema.safeParse({ status: 'Success' });
    expect(result.success).toBe(true);
  });

  it('rejects missing status', () => {
    const result = SubmitWorkOrderStepsResponseSchema.safeParse({ message: 'Done' });
    expect(result.success).toBe(false);
  });
});

// ─── ProductSchema ────────────────────────────────────────────────────────────

describe('ProductSchema', () => {
  it('accepts a valid product', () => {
    const result = ProductSchema.safeParse({
      id: 1,
      batchCode: 'BCF01',
      description: '2020 Cabernet Franc',
      liveMetrics: [],
      fieldValuePairs: [],
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (all optional)', () => {
    const result = ProductSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects non-boolean hasDipTable', () => {
    const result = ProductSchema.safeParse({ hasDipTable: 'yes' });
    expect(result.success).toBe(false);
  });
});

// ─── ProductResponseSchema ────────────────────────────────────────────────────

describe('ProductResponseSchema', () => {
  it('accepts a valid product response', () => {
    const result = ProductResponseSchema.safeParse({
      status: 'Success',
      product: { id: 1 },
      vessel: { vesselId: 10, containerType: 'Tank' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid containerType', () => {
    const result = ProductResponseSchema.safeParse({
      status: 'Success',
      vessel: { vesselId: 10, containerType: 'Silo' },
    });
    expect(result.success).toBe(false);
  });
});

// ─── ProductListResponseSchema ────────────────────────────────────────────────

describe('ProductListResponseSchema', () => {
  it('accepts a valid product list response', () => {
    const result = ProductListResponseSchema.safeParse({
      status: 'Success',
      products: [],
    });
    expect(result.success).toBe(true);
  });

  it('accepts response without optional products array', () => {
    const result = ProductListResponseSchema.safeParse({ status: 'Success' });
    expect(result.success).toBe(true);
  });
});

// ─── PurchaseOrderLineSchema ─────────────────────────────────────────────────

describe('PurchaseOrderLineSchema', () => {
  it('accepts a valid purchase order line', () => {
    const result = PurchaseOrderLineSchema.safeParse({
      id: 63872,
      type: 'STOCK',
      lineNumber: null,
      itemCode: 'LAB/SBY/SB/FR',
      vendorCode: '2025',
      description: 'Label - Sunday Bay Sauvignon Blanc Front',
      unitPrice: 0.1977,
      totalPrice: 1284.98,
      taxable: true,
      quantityOrdered: { unit: 'units', value: 6500.0 },
      quantityFulfilled: { unit: 'units', value: 6500.0 },
    });
    expect(result.success).toBe(true);
  });

  it('accepts a minimal valid line (only required fields)', () => {
    const result = PurchaseOrderLineSchema.safeParse({ id: 1, type: 'ADHOC' });
    expect(result.success).toBe(true);
  });

  it('rejects missing required id', () => {
    const result = PurchaseOrderLineSchema.safeParse({ type: 'STOCK' });
    expect(result.success).toBe(false);
  });

  it('rejects missing required type', () => {
    const result = PurchaseOrderLineSchema.safeParse({ id: 1 });
    expect(result.success).toBe(false);
  });

  it('rejects invalid line type enum', () => {
    const result = PurchaseOrderLineSchema.safeParse({ id: 1, type: 'INVALID' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid line type enums', () => {
    for (const type of ['GENERAL', 'ADHOC', 'WINE_BATCH', 'STOCK']) {
      const result = PurchaseOrderLineSchema.safeParse({ id: 1, type });
      expect(result.success).toBe(true);
    }
  });

  it('accepts null nullable fields', () => {
    const result = PurchaseOrderLineSchema.safeParse({
      id: 1,
      type: 'GENERAL',
      lineNumber: null,
      itemCode: null,
      vendorCode: null,
      description: null,
    });
    expect(result.success).toBe(true);
  });
});

// ─── PurchaseOrderSchema ────────────────────────────────────────────────────

describe('PurchaseOrderSchema', () => {
  it('accepts a complete valid purchase order', () => {
    const result = PurchaseOrderSchema.safeParse({
      id: 6000,
      name: 'VPO5886',
      state: 'NEW',
      fulfillment: 'FULFILLED',
      taxPolicy: 'TAX_EXCLUSIVE',
      freightCost: null,
      inactive: false,
      vendor: { id: 80, name: 'MCC Albany', extId: 'b929a7c9-cf61-42d4-993f-0fca5e54dcc5' },
      vendorReference: null,
      deliverBy: 1753324200000,
      notes: 'SUNDAY BAY SAB - QR - digital print',
      winery: { id: 1, name: 'Wairau River Wines', businessUnit: null },
      lines: [
        {
          id: 63872,
          type: 'STOCK' as const,
          quantityOrdered: { unit: 'units', value: 6500.0 },
          quantityFulfilled: { unit: 'units', value: 6500.0 },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts a minimal valid purchase order (only id and name)', () => {
    const result = PurchaseOrderSchema.safeParse({ id: 1, name: 'PO-1' });
    expect(result.success).toBe(true);
  });

  it('rejects missing required id', () => {
    const result = PurchaseOrderSchema.safeParse({ name: 'PO-1' });
    expect(result.success).toBe(false);
  });

  it('rejects missing required name', () => {
    const result = PurchaseOrderSchema.safeParse({ id: 1 });
    expect(result.success).toBe(false);
  });

  it('accepts null nullable fields', () => {
    const result = PurchaseOrderSchema.safeParse({
      id: 1,
      name: 'PO-1',
      freightCost: null,
      vendorReference: null,
      deliverBy: null,
      notes: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid state enum', () => {
    const result = PurchaseOrderSchema.safeParse({ id: 1, name: 'PO-1', state: 'INVALID' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid state enums', () => {
    for (const state of ['NEW', 'APPROVED']) {
      const result = PurchaseOrderSchema.safeParse({ id: 1, name: 'PO-1', state });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid fulfillment enum', () => {
    const result = PurchaseOrderSchema.safeParse({ id: 1, name: 'PO-1', fulfillment: 'INVALID' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid fulfillment enums', () => {
    for (const fulfillment of ['NOT_FULFILLED', 'PART_FULFILLED', 'FULFILLED', 'OVER_FULFILLED']) {
      const result = PurchaseOrderSchema.safeParse({ id: 1, name: 'PO-1', fulfillment });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid taxPolicy enum', () => {
    const result = PurchaseOrderSchema.safeParse({ id: 1, name: 'PO-1', taxPolicy: 'INVALID' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid taxPolicy enums', () => {
    for (const taxPolicy of ['TAX_INCLUSIVE', 'TAX_EXCLUSIVE', 'NO_TAX']) {
      const result = PurchaseOrderSchema.safeParse({ id: 1, name: 'PO-1', taxPolicy });
      expect(result.success).toBe(true);
    }
  });
});

// ─── PurchaseOrderResponseSchema ─────────────────────────────────────────────

describe('PurchaseOrderResponseSchema', () => {
  it('accepts a valid response with data', () => {
    const result = PurchaseOrderResponseSchema.safeParse({
      data: { id: 234234, name: 'PO-2' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects response missing data field', () => {
    const result = PurchaseOrderResponseSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects response with null data', () => {
    const result = PurchaseOrderResponseSchema.safeParse({ data: null });
    expect(result.success).toBe(false);
  });
});
