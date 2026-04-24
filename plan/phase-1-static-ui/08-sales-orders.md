# Step 08 — Sales Orders (Static UI)

> Before this: [07-quotations.md](./07-quotations.md)
> Spec: [docs/development_spec.md Module 3](../../docs/development_spec.md), [docs/project_details.md §3](../../docs/project_details.md)

---

## Objective

Static UI for order lifecycle: list, detail with MRP view, delivery schedule, installation readiness, stage transitions.

---

## Sub-screens

1. **Order List** — `/orders`
   - Columns: SO #, Date, Customer, Quote #, Value, Stage, Delivery Date, Site, Owner.
   - Filters: stage, owner, date range, customer, readiness flag.
2. **Order Detail** — `/orders/:id`
   - Header: SO #, stage stepper (Confirmed → Processing → Ready → Dispatched → Installed), actions (Edit, Cancel, Create Dispatch, Raise Invoice).
   - Tabs: `Items`, `Delivery Plan`, `Material Readiness (MRP)`, `Installation Readiness`, `Documents`, `Activity`.
   - **Items tab**: per line — ordered qty, reserved, dispatched, pending, backorder; partial fulfilment shown inline.
   - **Delivery Plan tab**: multiple delivery schedules (date, qty, address) with add/edit.
   - **MRP tab**: per-item stock available, reserved, shortage, procurement dependency; color-coded.
   - **Installation Readiness tab**: checklist (civil ready, electrical ready, approvals, site contact, expected date).
   - **Documents tab**: linked quotation, PO from customer, delivery notes, invoices.
3. **Stage transition dialogs** — each gated transition opens a confirmation with required inputs (e.g. shortage acknowledgement when moving to Ready).
4. **Cancel / Amendment flow** — dialog with reason; triggers approval banner in detail.

---

## Mock data

- `src/mocks/orders.js` with orders across every stage, including partial fulfilment + shortages.
- Cross-reference quotations from mocks/quotations.js.

---

## Verification

- [ ] Stage stepper visually tracks current stage, gated transitions disabled when prerequisites unmet.
- [ ] MRP tab highlights shortages in red; tooltip explains.
- [ ] Partial fulfilment numbers reconcile (ordered = dispatched + pending).
- [ ] Installation readiness checklist enforces completion before "Installed" transition.
- [ ] Cancel/amend flows show approval-pending banner.
- [ ] Commit: `feat(ui): sales order module static`.

---

**Next:** [09-inventory.md](./09-inventory.md)
