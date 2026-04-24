# Step 10 — Dispatch & Logistics (Static UI) ✅

> Before this: [09-inventory.md](./09-inventory.md)
> Spec: [docs/development_spec.md Module 5](../../docs/development_spec.md), [docs/project_details.md §5](../../docs/project_details.md)

---

## Objective

Static UI for dispatch planning, challan tracking, transporter/vehicle masters, POD upload, exception handling.

---

## ✅ Delivered

### Mocks

- `frontend/src/mocks/transporters.ts` — `Transporter` interface + 6 transporters (Gujarat Goods Carriers, BlueDart Surface, V-Trans, Coastal Freight, East-West, Own Fleet) with rating, on-time %, active shipments. `transporterById` helper.
- `frontend/src/mocks/vehicles.ts` — `Vehicle` interface + 9 vehicles across all transporters with type, capacity, driver, licence, status (`available` / `in_transit` / `maintenance`). `vehicleById`, `vehiclesForTransporter` helpers.
- `frontend/src/mocks/dispatches.ts` — `Dispatch` master with `DispatchStage` (planned → packed → loaded → in_transit → delivered → pod_received → closed, plus cancelled), `DispatchItem`, `RouteStop`, `DispatchDocument`, `DispatchException`, `PodDetails`. 10 hand-crafted dispatches (CH-2026-001..010) covering every stage incl. consolidation, POD-pending, exceptions (damaged, failed delivery), and cancelled. Helpers: `nextStages`, `canAdvanceTo`, `freightTermsLabel`, `dispatchSummary`, `readyOrders`, plus `DISPATCH_STAGES`, `DISPATCH_STAGE_LABEL`, `DISPATCH_TONE`.

### Pages

- `pages/dispatch/DispatchLayout.tsx` — page header, summary strip (Total / In transit / Awaiting POD / Open exceptions), 4-tab sub-nav (Challans / Plan dispatch / Transporters / Vehicles).
- `pages/dispatch/DispatchListPage.tsx` — FilterBar (search, stage, transporter, destination city) + DataTable with challan #, dispatch date, orders, customer, transporter+vehicle, destination, stage badge, delivery; row click → detail.
- `pages/dispatch/DispatchDetailPage.tsx` — Header with stage badge, stage stepper (Planned → Closed), open-exception alert, KPI strip (weight / packages / freight / expected delivery), 6 tabs:
  - **Items** — order#, description, ordered/dispatched/backorder, packages, weight + totals.
  - **Transport** — transporter & vehicle card, driver & freight card, route-stops timeline.
  - **Documents** — challan, packing list, shipment summary, invoice, e-way bill list with download.
  - **POD** — uploaded POD details or dropzone (only when `delivered`) + upload dialog.
  - **Exceptions** — list with type/status badges, root cause, recommended action; "Log exception" + "Re-dispatch" / "Mark resolved" actions.
  - **Activity** — chronological timeline.
  - Dialogs: **Advance stage** (next-stage Select gated by `canAdvanceTo`), **Log exception** (type + root cause + action, both ≥5 chars), **Upload POD** (mock dropzone + receiver + remarks).
- `pages/dispatch/PlanDispatchPage.tsx` — 4-step wizard (Select orders → Consolidate & schedule → Transporter & vehicle → Review). Pulls `readyOrders()`, validates each step, persists scheduled date to a stable module-level constant for React-Compiler purity, toast + redirect on create.
- `pages/dispatch/TransportersPage.tsx` — searchable card grid with rating badge, on-time %, active shipments, service cities; "New transporter" dialog (name/contact/phone/email/cities/notes).
- `pages/dispatch/VehiclesPage.tsx` — FilterBar (search, transporter, status) + DataTable (registration / type / capacity / transporter / driver / licence / status badge); "New vehicle" dialog.

### Routing

`app/router.tsx` — flat `dispatch` route replaced with nested layout:

```
/dispatch              → DispatchLayout
  index               → DispatchListPage
  /plan               → PlanDispatchPage
  /transporters       → TransportersPage
  /vehicles           → VehiclesPage
  /:id                → DispatchDetailPage
```

Old `DispatchPage.tsx` stub removed.

---

## ✅ Verification

- [x] `npm run lint` — 0 errors (1 pre-existing inquiries warning for `react-hook-form` watch).
- [x] `npm run build` — clean. Notable chunks:
  - `dispatches` mock 20.18 kB (gzip 4.60 kB)
  - `DispatchDetailPage` 21.50 kB (gzip 5.20 kB)
  - `PlanDispatchPage` 8.60 kB (gzip 2.71 kB)
  - `TransportersPage` 5.64 kB / `VehiclesPage` 5.38 kB
  - `DispatchListPage` 3.98 kB / `DispatchLayout` 1.98 kB
- [x] React Compiler purity respected — `Date.now()` lifted to module scope (`TOMORROW_ISO`).
- [x] Stage advance only offers `nextStages(stage)`; submit guarded by `canAdvanceTo`.
- [x] Exception form requires both root cause and recommended action (≥5 chars each).
- [x] POD dropzone only enabled when stage is `delivered`.

---

## Commit

```
feat(ui): dispatch module static
```
