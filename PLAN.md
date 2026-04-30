# Implementation Status

Missing features identified by comparing `vintrace-v6-apis.yaml` and `vintrace-api-v7-combined.yaml` against the SDK implementation in `src/client/VintraceClient.ts`.

## v6

- [x] **`GET /stock/lookup`** — Implemented in `InventoryClient.lookup()`. Returns `unknown` (needs schema).

## v7 — Endpoints

### Harvest
- [x] **`POST /v7/harvest/blocks/{blockId}/assessments`** — Implemented in `BlocksClient.createAssessment()`.

### Wine batches
- [x] **`GET /v7/operation/wine-batches`** — `WineBatchesClient.getAll()`, returns `unknown`.
- [x] **`POST /v7/operation/wine-batches`** — `WineBatchesClient.create()`, returns `unknown`.

### Documents
- [x] **`PUT /v7/operation/operation/documents`** — `DocumentsClient.attach()`, returns `unknown`.

### Stock
- [x] **`POST /v7/stock/receivals`** — `StockClient.receive()`, returns `unknown`.
- [x] **`GET /v7/stock/dispatches`** — `StockClient.getDispatches()`, returns `unknown`.

### Vessels
- [x] **`GET /v7/vessel/barrels/{id}`** — `VesselsClient.getBarrel()`, returns `unknown`.
- [x] **`GET /v7/vessel/barrel-groups/{id}`** — `VesselsClient.getBarrelGroup()`, returns `unknown`.
- [x] **`POST /v7/vessel/tanks`** — `VesselsClient.createTank()`, returns `unknown`.
- [x] **`GET /v7/vessel/tanks/{id}`** — `VesselsClient.getTank()`, returns `unknown`.
- [x] **`GET /v7/vessel/tankers/{id}`** — `VesselsClient.getTanker()`, returns `unknown`.
- [x] **`GET /v7/vessel/bins/{id}`** — `VesselsClient.getBin()`, returns `unknown`.

### Accounting
- [x] **`POST /v7/account/purchase-orders`** — `PurchaseOrdersClient.create()`, returns `unknown`.
- [x] **`GET /v7/account/purchase-orders/{id}`** — `PurchaseOrdersClient.get()`, returns `unknown`.

## HTTP method mismatches (spec says PUT, SDK calls POST) ✅

- [x] **`FruitIntakesClient.updatePricing()`** — Created with `PUT` for `v7/operation/fruit-intakes/{fruitIntakeId}/pricing`. Wired `UpdateFruitIntakePricingResponseSchema`.
- [x] **`FruitIntakesClient.updateMetrics()`** — Created with `PUT` for `v7/operation/fruit-intakes/{fruitIntakeId}/metrics`. Wired `UpdateMetricsResponseSchema`.

## Missing typed responses (returns `unknown` instead of typed schema)

- [ ] **`BlocksClient.get()`** — Wire response schema
- [ ] **`WineBatchesClient.getAll()`** — Wire response schema
- [ ] **`WineBatchesClient.create()`** — Wire response schema
- [ ] **`DocumentsClient.attach()`** — Wire response schema
- [ ] **`StockClient.receive()`** — Wire response schema
- [ ] **`StockClient.getDispatches()`** — Wire response schema
- [ ] **`VesselsClient.getBarrel()`** — Wire response schema
- [ ] **`VesselsClient.getBarrelGroup()`** — Wire response schema
- [ ] **`VesselsClient.createTank()`** — Wire response schema
- [ ] **`VesselsClient.getTank()`** — Wire response schema
- [ ] **`VesselsClient.getTanker()`** — Wire response schema
- [ ] **`VesselsClient.getBin()`** — Wire response schema
- [ ] **`PurchaseOrdersClient.create()`** — Wire response schema
- [ ] **`PurchaseOrdersClient.get()`** — Wire response schema

## Missing classes (referenced by VintraceV7Api getters but never defined)

- [ ] **`AssessmentsClient`** — Create with `getAll()` (wire `GetAssessmentsResponseSchema`), `get()`, `getMany()`
- [ ] **`VineyardsClient`** — Create class
- [ ] **`MaturitySamplesClient`** — Create class
- [ ] **`PartiesV7Client`** — Create with `getAll()` (wire `GetPartiesV7ResponseSchema`), `get()`, `getMany()`
- [ ] **`ShipmentsClient`** — Create with `getAll()` (wire `GetShipmentsSuccessResponseSchema`), `get()`, `getMany()`
- [ ] **`BarrelTreatmentsClient`** — Create with `getAll()` (wire `GetBarrelTreatmentsSuccessResponseSchema`), `get()`, `getMany()`
- [x] **`FruitIntakesClient`** — Created with `create()`, `updatePricing()` (PUT), `updateMetrics()` (PUT). All wired with schemas.
- [ ] **`BulkIntakesClient`** — Create with `getAll()` (wire `GetBulkIntakesSuccessResponseSchema`), `get()`, `getMany()`
- [ ] **`TrialBlendsClient`** — Create with `getAll()` (wire `GetTrialBlendsSuccessResponseSchema`), `get()`, `getMany()`
- [ ] **`WorkOrdersV7Client`** — Create with `getAll()` (wire `GetWorkOrdersV7ResponseSchema`), `get()`, `getMany()`

## Already wired with schemas ✅

- `BlocksClient.getAll()` — `GetBlocksSuccessResponseSchema`
- `CostsClient.businessUnitTransactions()` — `GetBusinessUnitTransactionsResponseSchema`
- `TirageClient.get()` / `TirageClient.patch()` — `TirageSuccessResponseSchema`
