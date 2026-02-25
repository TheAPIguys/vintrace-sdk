import type { Product, ProductResponse, ProductListResponse } from '../../src/validation/schemas';

export const product: Product = {
  id: 1,
  batchCode: 'BCF01',
  vesselId: 10,
  description: '2020 Cabernet Franc',
  descriptionCanEdit: true,
  volume: { value: 1000, unit: 'L' },
  vesselCode: 'T1-01',
  hasDipTable: false,
  colour: 'Red',
  physicalProductState: 'Bulk',
  vesselType: 'Tank',
  productStatus: 'Active',
  productAnalysisEndpoint: '/vinx2/api/v/products/1/analysis',
  productCompositionEndpoint: '/vinx2/api/v/products/1/composition',
  productEndpoint: '/vinx2/api/v/products/1',
  liveMetrics: [],
  fieldValuePairs: [],
  canAccessNotes: true,
  notesCount: 0,
  notesEndpoint: '/vinx2/api/v/products/1/notes',
};

export const productResponse: ProductResponse = {
  status: 'Success',
  product,
  vessel: { vesselId: 10, containerType: 'Tank' },
};

export const productListResponse: ProductListResponse = {
  status: 'Success',
  products: [product],
};
