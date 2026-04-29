# Step 07 — Sales Orders module slice (API + tests + Postman + UI wiring + UI tests)

> **Vertical slice.** Deliver end-to-end before Step 08. Follow [../SKILL.md §2.5](../SKILL.md).
>
> Slice scope: backend API (this file) → pytest in `apps/orders/tests/` (≥ 85 % cov) → Postman folder `Sales Orders` → frontend wiring of [../phase-1-static-ui/08-sales-orders.md](../phase-1-static-ui/08-sales-orders.md) screens → Vitest+RTL+MSW unit tests → slice gate + commit `feat(slice): orders`.

> Before this: [06-quotations-api.md](./06-quotations-api.md)
> Spec: [docs/development_spec.md Module 3](../../docs/development_spec.md), [docs/project_details.md §3](../../docs/project_details.md)

---

## Endpoints

| Method | Path                                        | Purpose                                                  |
| ------ | ------------------------------------------- | -------------------------------------------------------- |
| GET    | `/api/v1/orders/`                           | list                                                     |
| POST   | `/api/v1/orders/`                           | create (from quotation_id)                               |
| GET    | `/api/v1/orders/:id`                        | detail                                                   |
| PATCH  | `/api/v1/orders/:id`                        | edit (stage-gated)                                       |
| POST   | `/api/v1/orders/:id/stage`                  | `{ next_stage }`                                         |
| POST   | `/api/v1/orders/:id/cancel`                 | reason required                                          |
| POST   | `/api/v1/orders/:id/amend`                  | kicks approval                                           |
| GET    | `/api/v1/orders/:id/mrp`                    | stock availability per item                              |
| POST   | `/api/v1/orders/:id/raise-prs`              | create draft PRs from MRP shortages (see [08b](./08b-purchase-api.md)) |
| POST   | `/api/v1/orders/:id/reserve`                | reserve stock                                            |
| POST   | `/api/v1/orders/:id/release`                | release reservation                                      |
| CRUD   | `/api/v1/orders/:id/delivery-schedules`     |                                                          |
| CRUD   | `/api/v1/orders/:id/material-checklist`     |                                                          |
| CRUD   | `/api/v1/orders/:id/installation-readiness` |                                                          |
| POST   | `/api/v1/orders/:id/assign`                 | `{ user_id }`                                            |
| POST   | `/api/v1/orders/bulk-assign`                | `{ order_ids[], user_id }`                               |
| POST   | `/api/v1/orders/bulk-ready`                 | `{ order_ids[] }` — stage advances per row if gates pass |
| POST   | `/api/v1/orders/bulk-export`                | `{ order_ids[], format }` → file                         |

### Customer invoices (sibling resource)

Surfaced both as a sub-collection of an order and as a standalone resource (UI in [Phase 1 step 19](../phase-1-static-ui/19-customer-invoices.md) reuses one component set across both views).

| Method | Path                                                | Purpose                                              |
| ------ | --------------------------------------------------- | ---------------------------------------------------- |
| GET    | `/api/v1/customer-invoices/`                        | list (filter by customer, status, date, balance>0)   |
| POST   | `/api/v1/customer-invoices/`                        | create direct invoice (no order link)                |
| GET    | `/api/v1/customer-invoices/:id`                     | detail                                               |
| PATCH  | `/api/v1/customer-invoices/:id`                     | edit (only when `draft`)                             |
| POST   | `/api/v1/customer-invoices/:id/send`                | email PDF + flip status to `sent`                    |
| POST   | `/api/v1/customer-invoices/:id/cancel`              | reason required                                      |
| POST   | `/api/v1/customer-invoices/:id/payments`            | record customer payment / partial                    |
| GET    | `/api/v1/orders/:id/customer-invoices/`             | list invoices for an order (filtered helper)         |
| POST   | `/api/v1/orders/:id/customer-invoices/`             | create invoice from SO (lines inherited)             |
| GET    | `/api/v1/customer-invoices/aging`                   | buckets 0-30 / 31-60 / 61-90 / 90+                   |
| POST   | `/api/v1/customer-invoices/bulk-send`               | `{ ids[] }`                                          |
| POST   | `/api/v1/customer-invoices/bulk-export`             | `{ ids[], format }`                                  |

Direct-invoice creation requires `customer_id` + line items; SO-linked creation inherits lines from the order and locks `customer_id`. Status machine: `draft → sent → partially_paid → paid` with side-branches `overdue` (cron) and `cancelled` (admin).

---

## Rules

- Stage machine: Confirmed → Processing → Ready → Dispatched → Installed. Backward moves admin-only.
- Gating rules (enforced in service):
  - Ready requires MRP = green + documentation complete + commercial clearance.
  - Dispatched requires at least one shipment with status In Transit.
  - Installed requires every installation job signed off.
- Partial fulfilment tracked at item level (`qty_dispatched`, `qty_pending`, `qty_backorder`).
- Cancellation flow requires reason + admin approval (auto-approve if not yet dispatched).
- Amendment flow writes approval requests; freezes order until resolved.

### Bulk operations

- `bulk-assign` / `bulk-ready` / `bulk-export` accept up to 200 ids; same 207-on-partial-failure contract as inquiries (step 05).
- `bulk-ready` runs the full Ready stage-gate per row; rows missing prerequisites land in `failed` with the gate name (`mrp_red`, `docs_pending`, `commercial_block`).
- All bulk endpoints write per-row `order_activity` events.

---

## Tests

- Stage transitions with + without prerequisites.
- MRP endpoint with mixed availability (ok / short / zero).
- Reserve & release update stock ledger + reservation rows correctly (idempotent where safe).
- Partial fulfilment math: sums reconcile.
- Cancel before/after dispatch: correct restrictions.

---

## Postman

- Folder `Orders`: full lifecycle chain ending in dispatch creation stub.

---

## Verification

- [ ] Coverage ≥ 85 %.
- [ ] Stage-gate matrix explicit in tests (table-driven).
- [ ] Commit: `feat(api): sales orders + mrp + stage workflow`.

---

**Next:** [08-inventory-api.md](./08-inventory-api.md)
