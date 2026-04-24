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
