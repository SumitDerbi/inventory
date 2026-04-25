# Step 07 — Sales Orders API

> Before this: [06-quotations-api.md](./06-quotations-api.md)
> Spec: [docs/development_spec.md Module 3](../../docs/development_spec.md), [docs/project_details.md §3](../../docs/project_details.md)

---

## Endpoints

| Method | Path                                        | Purpose                     |
| ------ | ------------------------------------------- | --------------------------- |
| GET    | `/api/v1/orders/`                           | list                        |
| POST   | `/api/v1/orders/`                           | create (from quotation_id)  |
| GET    | `/api/v1/orders/:id`                        | detail                      |
| PATCH  | `/api/v1/orders/:id`                        | edit (stage-gated)          |
| POST   | `/api/v1/orders/:id/stage`                  | `{ next_stage }`            |
| POST   | `/api/v1/orders/:id/cancel`                 | reason required             |
| POST   | `/api/v1/orders/:id/amend`                  | kicks approval              |
| GET    | `/api/v1/orders/:id/mrp`                    | stock availability per item |
| POST   | `/api/v1/orders/:id/reserve`                | reserve stock               |
| POST   | `/api/v1/orders/:id/release`                | release reservation         |
| CRUD   | `/api/v1/orders/:id/delivery-schedules`     |                             |
| CRUD   | `/api/v1/orders/:id/material-checklist`     |                             |
| CRUD   | `/api/v1/orders/:id/installation-readiness` |                             |
| POST   | `/api/v1/orders/:id/assign`                 | `{ user_id }`               |
| POST   | `/api/v1/orders/bulk-assign`                | `{ order_ids[], user_id }`  |
| POST   | `/api/v1/orders/bulk-ready`                 | `{ order_ids[] }` — stage advances per row if gates pass |
| POST   | `/api/v1/orders/bulk-export`                | `{ order_ids[], format }` → file |

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
