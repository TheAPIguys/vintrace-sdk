import type { WineBatchData, GetWineBatchSuccessResponse, CreateWineBatchSuccessResponse } from '../../src/validation/schemas';

export const mockWineBatchItem: WineBatchData = {
  id: 571,
  batchCode: 'test-batchCode',
  batchNumber: 'test-batchNumber',
  description: 'test',
  productionYear: 2022,
  owner: { id: 1, extId: 'O66253', name: 'JX2 Winery' },
  grading: { scaleId: 2, scaleName: 'Wine', valueId: 67, valueName: 'A' },
  program: { id: 33, name: 'Premium Chardonnay' },
  designatedRegion: { id: 32, name: 'Napa Valley' },
  designatedSubRegion: { id: 33, name: 'SubA' },
  designatedVariety: { id: 34, name: 'Shiraz' },
  winery: { id: 5, name: 'My Winery' },
  category: { id: 1, name: 'Bulk Wine' },
  designatedProduct: { id: 625, name: 'CHNAVPREM' },
  costsTrackedPercentage: 100,
  fractionType: 'FREE_RUN',
  inactive: false,
};

export const mockPaginatedResponse: GetWineBatchSuccessResponse = {
  totalResults: 1,
  offset: 0,
  limit: 100,
  first: '/wine-batches?offset=0&limit=100',
  previous: null,
  next: null,
  last: null,
  results: [mockWineBatchItem],
};

export const mockCreateResponse: CreateWineBatchSuccessResponse = {
  data: { ...mockWineBatchItem, id: 572 },
};
