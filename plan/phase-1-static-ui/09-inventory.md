# Phase 1 · Step 09 — Inventory Module

Status: ✅ Delivered

## ✅ Delivered

### Mocks

- `frontend/src/mocks/warehouses.ts` — 3 warehouses (WH-HO Ahmedabad, WH-BR Surat, WH-SITE Rajkot site) with zones/racks, contact and address.
- `frontend/src/mocks/inventory.ts` — rich inventory layer:
  - `InventoryProduct` extends base `MockProduct` with `brand`, `reorderPoint`, `reservedQty`, `specifications`, `stockByWarehouse`, `attachments`.
  - **42 products** — existing 20 + 22 new (fire fighting, spares, accessories) covering pumps, motors, valves, piping, tanks, controls, filtration, chemicals, fire fighting, spares and services.
  - Deterministic stock split across warehouses with forced low-stock (`p-3`, `p-5`, `p-11`, `p-15`, `p-42`) and out-of-stock (`p-12`, `p-28`) rows.
  - `stockLedger` — 240 movements (purchase / sale / transfer-in/out / reservation / release / adjustment) with running balance per product+warehouse.
  - `reservations` — 10 active/partial/released/shipped reservations linked to sales orders.
  - `adjustments` — 6 historical entries with reason codes.
  - Helpers: `availableQty`, `stockStatus`, `stockValueINR`, `reorderRows`, `inventorySummary`, `ledgerForProduct`, `ledgerForWarehouse`, `reservationsForProduct`.
- `mocks/users.ts` extended with `u-6` (inventory) and `u-7` (dispatch) to support adjustment authorisation.

### Pages

- `pages/inventory/InventoryLayout.tsx` — shared PageHeader, 4-stat summary strip (Total SKUs / Low stock / Out of stock / Stock value) and sub-nav tabs (Products, Reorder alerts, Reservations, Adjustments, Warehouses) with `<Outlet/>`.
- `ProductsListPage` (`/inventory/products`) — FilterBar (category / brand / warehouse / stock status + Reset), per-row background highlight (amber for low, red for out), columns SKU, Name, Category, UoM, Stock, Reserved, Available, Reorder pt, Status; row click → detail.
- `ProductDetailPage` (`/inventory/products/:id`) — back link, header with status badge, 4-stat KPI strip, **6 tabs**:
  - Specifications (key-value grid)
  - Stock by Warehouse (per-warehouse totals)
  - Ledger (paginated "Load more", relative time, running balance, typed badges, actor)
  - Reservations (order-linked entries, status badge)
  - Pricing (list / dealer / project / OEM tiers + GST)
  - Attachments (datasheets and certificates)
- `ReorderPage` (`/inventory/reorder`) — severity + warehouse + search filters, red/amber row tints, shortfall, suggested PO qty, estimated value, per-row "Raise PO" + bulk "Raise PO for all".
- `ReservationsPage` (`/inventory/reservations`) — status + warehouse filters, columns Order (→ order detail), Customer, Product, Warehouse, Qty, Status, Reserved, Expected dispatch.
- `AdjustmentsPage` (`/inventory/adjustments`) — filters + DataTable + **adjustment dialog** requiring warehouse, product, direction (+/−), qty, reason code (6 codes), authoriser (sales manager / admin / inventory) and remark.
- `WarehousesPage` (`/inventory/warehouses`) — split master/detail: left list cards with SKU count + value + movements, right panel with address, in-charge contact, zones & racks, and "Top items by value" linking to product detail.

### Routing

- Nested route tree under `/inventory` via `InventoryLayout` + 6 children; `/inventory` redirects to `/inventory/products`.
- Stub `InventoryPage.tsx` removed.

## Verification

- [x] Product detail spec tab renders key-value grid.
- [x] Ledger shows running balance column and paginates via "Load more".
- [x] Low-stock / out-of-stock row highlighting works in list and reorder page; counts surface in layout strip.
- [x] Adjustment dialog requires reason code + authoriser (Save disabled otherwise).
- [x] Reservation rows link back to the originating sales order.
- [x] `npm run lint` clean (only the unchanged InquiryFormDrawer `watch()` compiler warning).
- [x] `npm run build` green.
  - `InventoryLayout` ~1.98 kB
  - `ProductsListPage` ~4.65 kB
  - `ProductDetailPage` ~10.93 kB
  - `ReorderPage` ~4.69 kB
  - `ReservationsPage` ~2.95 kB
  - `AdjustmentsPage` ~5.71 kB
  - `WarehousesPage` ~5.30 kB
  - `inventory` mocks chunk ~12.23 kB

## Commit

`feat(ui): inventory module static`
