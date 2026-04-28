# Step 08 — Inventory API

> Before this: [07-orders-api.md](./07-orders-api.md)
> Spec: [docs/development_spec.md Module 4](../../docs/development_spec.md), [docs/project_details.md §4](../../docs/project_details.md)

---

## Endpoints

| Method | Path                                    | Purpose                            |
| ------ | --------------------------------------- | ---------------------------------- |
| CRUD   | `/api/v1/inventory/products/`           |                                    |
| GET    | `/api/v1/inventory/products/:id/stock`  | per-warehouse availability         |
| GET    | `/api/v1/inventory/products/:id/ledger` | paginated movements                |
| CRUD   | `/api/v1/inventory/warehouses/`         |                                    |
| GET    | `/api/v1/inventory/stock/`              | stock matrix (product × warehouse) |
| POST   | `/api/v1/inventory/adjustments/`        | reason-coded adjustment            |
| GET    | `/api/v1/inventory/reservations/`       |                                    |
| GET    | `/api/v1/inventory/reorder-alerts/`     |                                    |
| GET    | `/api/v1/inventory/stats`               | total SKUs, low/out counts, value  |

---

## Rules

- **StockLedger is append-only.** Every inward/outward/adjustment/reserve/release writes a row.
- **Available = on_hand − reserved**, computed by the managed DB view `stock_summary_v` (created in step 02). Endpoints query the view by default; pass `?fast=true` to read from `stock_summary_cache` (hot dashboards).
- Cache invalidation: `post_save` on `stock_ledger` + `reservations` enqueues a partial refresh for the affected (product, warehouse).
- Adjustments require: reason code, remark ≥ 10 chars, authoriser role.
- Reorder alerts: items where `available ≤ reorder_point`, with suggested PO qty.
- Batch / serial tracked for applicable product categories; on dispatch, specific serials consumed.
- All stock writes wrapped in DB transactions; concurrency-safe (use `select_for_update`).

---

## Tests

- Ledger append ordering + running balance correctness.
- Reservation reduces available without changing on_hand.
- Adjustment requires fields; rejects zero qty.
- Reorder alert returns correct items given a curated fixture.
- Concurrent reservation attempts: only one succeeds for last unit.

---

## Postman

- Folder `Inventory`: create product → inward stock → reserve → adjust → ledger check.

---

## Verification

- [ ] Coverage ≥ 85 %.
- [ ] Concurrency test using `pytest-django --reuse-db` + threaded case.
- [ ] Commit: `feat(api): inventory + ledger + reservations`.

---

**Next:** [08b-purchase-api.md](./08b-purchase-api.md)
