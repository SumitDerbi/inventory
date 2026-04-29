# Step 09 — Dispatch module slice (API + tests + Postman + UI wiring + UI tests)

> **Vertical slice.** Deliver end-to-end before Step 10. Follow [../SKILL.md §2.5](../SKILL.md).
>
> Slice scope: backend API (this file) → pytest in `apps/dispatch/tests/` (≥ 85 % cov) → Postman folder `Dispatch` → frontend wiring of [../phase-1-static-ui/10-dispatch.md](../phase-1-static-ui/10-dispatch.md) screens → Vitest+RTL+MSW unit tests → slice gate + commit `feat(slice): dispatch`.

> Before this: [08b-purchase-api.md](./08b-purchase-api.md)
> Spec: [docs/development_spec.md Module 5](../../docs/development_spec.md), [docs/project_details.md §5](../../docs/project_details.md)

---

## Endpoints

| Method | Path                                        | Purpose                       |
| ------ | ------------------------------------------- | ----------------------------- |
| CRUD   | `/api/v1/dispatch/challans/`                |                               |
| POST   | `/api/v1/dispatch/plan/`                    | create plan from ready orders |
| POST   | `/api/v1/dispatch/challans/:id/status`      | stage transitions             |
| POST   | `/api/v1/dispatch/challans/:id/pod`         | upload POD                    |
| POST   | `/api/v1/dispatch/challans/:id/exceptions`  | log exception                 |
| POST   | `/api/v1/dispatch/challans/:id/re-dispatch` | partial re-dispatch           |
| GET    | `/api/v1/dispatch/challans/:id/challan-pdf` |                               |
| CRUD   | `/api/v1/dispatch/transporters/`            |                               |
| CRUD   | `/api/v1/dispatch/vehicles/`                |                               |

---

## Rules

- Challan numbering via series (`CH-{fy}-{seq:05}`).
- Dispatch consumes reservations → posts outward stock ledger entries.
- Partial dispatch updates `qty_dispatched` per order item; remainder stays reserved.
- Stages: Planned → Packed → Loaded → In Transit → Delivered → POD Pending → Closed; optional Failed Delivery.
- Exceptions require root cause + action; "Failed Delivery" auto-reverses stock or triggers re-dispatch based on choice.
- POD upload required before Closed.

---

## Tests

- Creating challan deducts stock; cancelling restores.
- Partial dispatch math; multiple dispatches per order.
- Stage gate enforcement.
- POD upload: valid mime, required before close.
- Exception + re-dispatch flow reconciles quantities.

---

## Postman

- Folder `Dispatch`: plan → pack → in-transit → deliver → POD → close.

---

## Verification

- [ ] Coverage ≥ 85 %.
- [ ] Stock ledger entries match dispatch events 1-to-1 in tests.
- [ ] Commit: `feat(api): dispatch + pod + exceptions`.

---

**Next:** [10-jobs-api.md](./10-jobs-api.md)
