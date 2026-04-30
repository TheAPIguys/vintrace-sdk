# Implementation Plan

Missing features identified by comparing `vintrace-v6-apis.yaml` and `vintrace-api-v7-combined.yaml` against the SDK implementation in `src/client/VintraceClient.ts`.

## v6 — 1 missing endpoint

- [ ] **`GET /stock/lookup`** — Get stock item by code or id (query params: `code`, `id`). Add to `InventoryClient` or create a new client.

## v7 — 14 missing endpoints

### Harvest
- [ ] **`POST /v7/harvest/blocks/{blockId}/assessments`** — Upsert block assessment (v7 version; separate from v6 block assessments)

### Wine batches
- [ ] **`GET /v7/operation/wine-batches`** — List wine batches (pagination params: `limit`, `offset`, `ids`, `include`)
- [ ] **`POST /v7/operation/wine-batches`** — Create a wine batch

### Documents
- [ ] **`PUT /v7/operation/operation/documents`** — Upload/attach a document to an operation

### Stock
- [ ] **`POST /v7/stock/receivals`** — Receive stock operation
- [ ] **`GET /v7/stock/dispatches`** — List stock dispatches (paginated)

### Vessels
- [ ] **`GET /v7/vessel/barrels/{id}`** — Get barrel details
- [ ] **`GET /v7/vessel/barrel-groups/{id}`** — Get barrel group details
- [ ] **`POST /v7/vessel/tanks`** — Create a tank
- [ ] **`GET /v7/vessel/tanks/{id}`** — Get tank details
- [ ] **`GET /v7/vessel/tankers/{id}`** — Get tanker details
- [ ] **`GET /v7/vessel/bins/{id}`** — Get bin details

### Accounting
- [ ] **`POST /v7/account/purchase-orders`** — Create or update a purchase order
- [ ] **`GET /v7/account/purchase-orders/{id}`** — Get purchase order detail

## HTTP method mismatches (spec says PUT, SDK calls POST)

- [ ] **`FruitIntakesClient.updatePricing()`** — Change from `POST` to `PUT` for `v7/operation/fruit-intakes/{fruitIntakeId}/pricing`
- [ ] **`FruitIntakesClient.updateMetrics()`** — Change from `POST` to `PUT` for `v7/operation/fruit-intakes/{fruitIntakeId}/metrics`

## Missing typed responses (returns `unknown` instead of typed schema)

- [ ] **`BlocksClient.getAll()`** — Wire `GetBlocksSuccessResponseSchema`
- [ ] **`BlocksClient.get()`** — Wire response schema
- [ ] **`CostsClient.businessUnitTransactions()`** — Wire `GetBusinessUnitTransactionsResponseSchema`
- [ ] **`AssessmentsClient.getAll()`** — Wire `GetAssessmentsResponseSchema`
- [ ] **`PartiesV7Client.getAll()`** — Wire `GetPartiesV7ResponseSchema`
- [ ] **`ShipmentsClient.getAll()`** — Wire `GetShipmentsSuccessResponseSchema`
- [ ] **`BarrelTreatmentsClient.getAll()`** — Wire `GetBarrelTreatmentsSuccessResponseSchema`
- [ ] **`BulkIntakesClient.getAll()`** — Wire `GetBulkIntakesSuccessResponseSchema`
- [ ] **`TrialBlendsClient.getAll()`** — Wire `GetTrialBlendsSuccessResponseSchema`
- [ ] **`WorkOrdersV7Client.getAll()`** — Wire `GetWorkOrdersV7ResponseSchema`
- [ ] **`TirageClient.patch()`** — Wire response schema

## Missing `getMany()` methods

- [ ] **`AssessmentsClient.getMany(ids)`** — Add batch fetch
- [ ] **`PartiesV7Client.getMany(ids)`** — Add batch fetch
- [ ] **`ShipmentsClient.getMany(ids)`** — Add batch fetch
- [ ] **`BarrelTreatmentsClient.getMany(ids)`** — Add batch fetch
- [ ] **`BulkIntakesClient.getMany(ids)`** — Add batch fetch
- [ ] **`TrialBlendsClient.getMany(ids)`** — Add batch fetch
- [ ] **`WorkOrdersV7Client.getMany(ids)`** — Add batch fetch
