import type { WorkOrderDetail, WorkOrderSearchResponse, AssignWorkResponse, SubmitWorkOrderStepsResponse } from '../../src/validation/schemas';

export const workOrderDetail: WorkOrderDetail = {
  id: 2842,
  code: 'TWL2827',
  jobCount: 2,
  jobCountText: '0 of 2 jobs',
  status: 'Not started',
  assignedTo: 'Not assigned',
  assignedBy: 'System Administrator',
  assignedDate: 149134411000,
  scheduledDate: 149330100000,
  assignedDateAsText: '04/05/2017',
  scheduledDateAsText: '04/28/2017',
  canAssign: true,
  summary: 'Add Gum Arabic - Stabivin, Measure BCF02',
  indicators: ['CRUSH', 'LAB', 'PRESS'],
  bond: 'JX2 Winery - 1234',
  winery: 'JX2 Winery',
  colourCode: '#f83a22',
  endpointURL: '/vinx2/api/v/workorders/2842',
  jobs: [
    {
      id: 482,
      code: 'AT482',
      scheduledDate: 149330100000,
      finishedDate: null,
      scheduledDateAsText: '04/28/2017',
      finishedDateAsText: '',
      status: 'Not started',
      assignedBy: 'System Administrator',
      assignedTo: 'Not assigned',
      summaryText: 'Add Gum Arabic - Stabivin to BADD01 in T1-02',
      miniSummaryText: 'Add Gum Arabic - Stabivin',
      jobColour: '#f91b2',
      jobNumber: 1,
      stepText: null,
      steps: [],
      endpointURL: '/vinx2/api/v/workorders/jobs/482',
      jobVersion: 0,
      workOrderId: 2842,
    },
  ],
};

export const workOrderSearchResponse: WorkOrderSearchResponse = {
  firstResult: 0,
  maxResult: 100,
  totalResultCount: 1,
  nextURLPath: null,
  prevURLPath: null,
  listText: 'All available',
  workOrders: [workOrderDetail],
};

export const assignWorkResponse: AssignWorkResponse = {
  status: 'OK',
  message: null,
  jobEndpointURL: null,
  workOrderEndpointURL: '/mob/api/v/workorders/25',
};

export const submitWorkOrderStepsResponse: SubmitWorkOrderStepsResponse = {
  status: 'SUCCESS',
  message: '',
};
