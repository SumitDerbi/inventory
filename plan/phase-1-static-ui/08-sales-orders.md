# Phase 1 · Step 08 — Sales Orders Module

Status: ✅ Delivered

## ✅ Delivered

### Helpers & tokens

- `frontend/src/lib/orderStatus.ts` — `OrderStage` union (confirmed / processing / ready / dispatched / installed / on_hold / cancelled), `ORDER_STAGES` (7), `STEPPER_STAGES` (5 linear), `stageLabel`, `stageIndex`, `isTerminal`, `canCancel`, `canCreateDispatch`, `canRaiseInvoice`, `canAdvanceTo`.
- `StatusBadge` tokens extended with `Processing` (blue) and `Ready` (emerald).

### Mocks

- `frontend/src/mocks/orders.ts` — 20 sales orders:
  - **SO-2026-001** (processing, links to Q-2026-001): 4 line items with a Sand Filter shortage, 2 delivery plans, MRP with shortage row, partial civil readiness, readiness flag `amber`, rich activity log.
  - **SO-2026-002** (ready, links to Q-2026-003): 3 items fully in stock, 1 delivery plan, fully ready installation checklist, readiness flag `green`.
  - **SO-2026-003 … SO-2026-020**: 18 light orders spanning every stage (confirmed, processing, ready, dispatched, installed, on_hold, cancelled) with 2 carrying `pendingApproval` (1 amendment, 1 cancellation).
- Interfaces: `OrderLineItem`, `DeliveryPlan`, `MrpRow`, `InstallationChecklist`, `OrderDocument`, `OrderActivity`, `SalesOrder`. Helpers: `orderById`, `itemPending`.

### List page — `OrdersPage`

- `FilterBar` with search, stage / owner / readiness selects, from & to date inputs, and Reset.
- Export dropdown (CSV / Excel / PDF) emitting toasts.
- `DataTable<Row>` with SO #, Date, Customer, linked Quote #, Value (INR), Stage (StatusBadge), Delivery date, Readiness badge (green / amber / red), Owner. Row click → `/orders/:id`.
- `PageHeader` "New order" button nudges users toward quotation conversion via toast.

### Detail page — `OrderDetailPage`

- Header: back link, order number, stage badge, pending-approval badge, linked quotation, customer, company, project, owner.
- Pending-approval amber banner with Approve action when `pendingApproval` is set.
- **Stage stepper**: 5 linear pills, clickable next-step advance, warning row when order is `cancelled` / `on_hold`.
- Summary strip: total value, expected delivery, material readiness (red on shortage), install readiness (amber when incomplete).
- **Six tabs** (with count badges):
  - **Items** — table with ordered / reserved / dispatched / pending / backorder, dispatched progress bar per row.
  - **Delivery Plan** — scheduled deliveries list with status-tinted Truck icons, Badge per status, Add-delivery button.
  - **Material Readiness (MRP)** — rows with red background on shortages, footer warning about required acknowledgement.
  - **Installation Readiness** — checklist (civil / electrical / approvals) + site-details card (address, contact, expected date).
  - **Documents** — icon-mapped list by type (quotation / customer PO / delivery note / invoice / installation report).
  - **Activity** — timeline sorted desc with icon per activity type, actor name and relative time.
- **Six dialogs**:
  - `StageAdvanceDialog` — shortage acknowledgement gate before `ready`, install-checklist gate before `installed`.
  - `CancelOrderDialog` — required reason, fake async submit, warning toast.
  - `AmendmentDialog` — required change description, info toast.
  - `CreateDispatchDialog` — date + vehicle inputs, success toast, navigates to `/dispatch`.
  - `RaiseInvoiceDialog` — invoice type (full / partial / proforma), success toast.
  - `AddDeliveryDialog` — scheduled date + quantity + address (prefilled) + notes, success toast.

### Routing

- `frontend/src/app/router.tsx` adds lazy `OrderDetailPage` and `{ path: 'orders/:id' }`.

## Verification

- [x] `npm run lint` — clean (only the unchanged InquiryFormDrawer `watch()` compiler warning).
- [x] `npm run build` — green.
  - `OrdersPage` chunk ~5.52 kB
  - `OrderDetailPage` chunk ~27.89 kB
  - `orders` mocks chunk ~14.34 kB
- [x] List → detail navigation wired; Quote # → quotation detail wired.
- [x] Shortage acknowledgement + installation gating enforced on stage advance.

## Commit

`feat(ui): sales order module static`
