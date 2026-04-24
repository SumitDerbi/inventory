# Step 10 — Dispatch & Logistics (Static UI)

> Before this: [09-inventory.md](./09-inventory.md)
> Spec: [docs/development_spec.md Module 5](../../docs/development_spec.md), [docs/project_details.md §5](../../docs/project_details.md)

---

## Objective

Static UI for dispatch planning, challan generation, transporter/vehicle masters, POD upload, exception handling.

---

## Sub-screens

1. **Dispatch List** — `/dispatch`
   - Columns: Challan #, Date, Order(s), Customer, Transporter, Vehicle, Status, Delivery Date.
   - Filters: status, transporter, date range, destination city.
2. **Dispatch Detail** — `/dispatch/:id`
   - Header: status stepper (Planned → Packed → Loaded → In Transit → Delivered → POD → Closed).
   - Tabs: `Items`, `Transport`, `Documents`, `POD`, `Exceptions`, `Activity`.
   - **Items tab**: dispatched/pending/backorder qty per line.
   - **Transport tab**: transporter, vehicle, driver, freight terms, ETA, route stops.
   - **Documents tab**: generated challan, packing list, shipment summary (PDF preview placeholders).
   - **POD tab**: upload signed copy (dropzone stub), received-by, date.
   - **Exceptions tab**: add exception (damaged / short dispatch / failed) with root cause + re-dispatch action.
3. **Plan Dispatch Wizard** — from ready orders: select orders → consolidate items → pick transporter/vehicle → review → create.
4. **Transporters** — `/dispatch/transporters` master list + form.
5. **Vehicles** — `/dispatch/vehicles` master list + form.

---

## Mock data

- `src/mocks/dispatches.js` with varied statuses including exceptions and partial dispatches.
- `src/mocks/transporters.js`, `mocks/vehicles.js`.

---

## Verification

- [ ] Stage stepper gates transitions (e.g. can't mark Delivered without being In Transit).
- [ ] Plan Dispatch wizard enforces only Ready orders selectable.
- [ ] Exception form requires root cause + recommended action.
- [ ] POD tab shows file preview thumbnail after mock upload.
- [ ] Commit: `feat(ui): dispatch module static`.

---

**Next:** [11-jobs-engineer.md](./11-jobs-engineer.md)
