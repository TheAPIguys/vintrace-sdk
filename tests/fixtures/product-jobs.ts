import type { ProductJobResponse } from '../../src/validation/schemas';

export const productJobResponse: ProductJobResponse = {
  status: 'Success',
  message: null,
  jobDetails: {
    productId: 46894,
    batchId: 47513,
    vesselId: 0,
    batchCode: '25WRPG/HB29',
    vesselCode: null,
    canReverseJobs: true,
    jobs: [
      {
        operationId: 300156,
        processId: 233985,
        operatorName: 'CELLAR, Wine',
        completedDate: 1745886660000,
        completedDateText: '10 Months ago',
        summary: 'Transfer 6719 L of 25WRPG/HI02 from 2009 to 25WRPG/HB29 in 8006',
        operationName: 'Transfer',
        workOrderNumber: 'TWL32480',
        reversible: false,
        attachments: [],
      },
      {
        operationId: 300146,
        processId: 233984,
        operatorName: 'CELLAR, Wine',
        completedDate: 1745886605000,
        completedDateText: '10 Months ago',
        summary: 'Transfer 6779 L of 25WRPG/HI02 from 2009 to 25WRPG/WAI in 8004',
        operationName: 'Transfer',
        workOrderNumber: 'TWL32480',
        reversible: false,
        attachments: [],
      },
    ],
  },
};
