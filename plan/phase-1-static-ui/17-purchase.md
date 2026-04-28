# Step 17 — Purchase & Procurement Module (Static UI)

> Before this: [16-ui-gap-closure.md](./16-ui-gap-closure.md)
> Spec: [docs/development_spec.md Module 11](../../docs/development_spec.md), [docs/project_details.md §11](../../docs/project_details.md), [docs/ui_spec.md §14](../../docs/ui_spec.md)

---

## Objective

Static UI for the end-to-end procurement lifecycle — Vendor master, Purchase Requisition (PR), RFQ + quote comparison, Purchase Order (PO), Goods Receipt Note (GRN) with QC, vendor invoices with 3-way match, payments, returns, plus an optional Purchase dashboard. Mocks only; no API calls.

---

## Mocks

Create under `frontend/src/mocks/`:

- `vendors.ts`
  - `Vendor` interface — id, vendor_code, type (`manufacturer | distributor | trader | service | other`), company_name, contact_person, mobile, email, gst_number, pan_number, msme_number, address, payment_terms, credit_days, currency, category_tags[], performance_rating (0–5), status (`active | inactive | blacklisted | on_hold`), notes.
  - `VendorContact`, `VendorBankDetail` sub-types.
  - 12 vendors (mix of pump OEMs, valve traders, fabricators, freight, services), with 1–3 contacts each and at least 1 default bank.
  - Helpers: `vendorById`, `vendorsByCategory`, `vendorPerformance(id)` returning on-time %, avg quality, avg price-variance, lifetime spend, outstanding payable.

- `purchase-requisitions.ts`
  - `PurchaseRequisition` + `PRItem`.
  - Source enum: `manual | reorder | sales_order | site_request`. Status enum: `draft | pending_approval | approved | rejected | rfq_sent | po_created | closed | cancelled`. Priority `high|medium|low`.
  - 14 PRs (mix of statuses), some auto-generated from `inventory.reorderRows()`, some linked to a `sales_orders` mock id, some to a `jobs` mock id.
  - Helpers: `prById`, `openPRs()`, `prsForSalesOrder(id)`.

- `rfqs.ts`
  - `RFQ`, `RFQVendor`, `VendorQuote`, `VendorQuoteItem`.
  - 6 RFQs: 2 awarded, 2 awaiting responses, 1 partially responded, 1 cancelled. Each RFQ has 2–4 invited vendors with quotes.
  - Helpers: `rfqById`, `quotesForRFQ(id)`, `compareMatrix(rfqId)` returning rows = items, columns = vendors with `{ unitPrice, leadTimeDays, taxAmount, lineTotal }` and a flag for the lowest-price column per row.

- `purchase-orders.ts`
  - `PurchaseOrder`, `POItem`, `PODeliverySchedule`, `POApproval`.
  - Status: `draft | pending_approval | approved | sent | partially_received | received | closed | cancelled`.
  - 16 POs spread across all statuses; 4 linked to a `sales_order_id` (project POs); 2 with multi-line delivery schedules; 1 with rejected approval and a re-submission.
  - Helpers: `poById`, `openPOs()`, `posForVendor(id)`, `posForSalesOrder(id)`, `poTotals(po)` (subtotal/discount/tax/freight/grand-total math), `nextApprovalLevel(po)`.

- `grns.ts`
  - `GRN`, `GRNItem`, plus QC fields (`qc_status: pending|accepted|rejected|on_hold`, qc_remarks, batch_number, serial_numbers[]).
  - Status: `draft | pending_qc | completed | partially_accepted | rejected | cancelled`.
  - 10 GRNs covering full receipt, partial accept, full reject, on-hold QC, and 2 with serial-number capture.
  - Helpers: `grnById`, `grnsForPO(id)`, `pendingGRNs()`, `postToStock(grnId)` (mock — returns mutated copies of `inventory.stockLedger` rows so the UI can show the diff).

- `vendor-invoices.ts`
  - `VendorInvoice`, `VendorInvoiceItem`. Match status enum: `unmatched | matched | price_variance | qty_variance | on_hold`. Status: `draft | verified | approved | paid | partially_paid | disputed | cancelled`.
  - 12 invoices: 4 cleanly matched, 3 price-variance, 2 qty-variance, 1 on-hold, 1 disputed, 1 unmatched (no PO).
  - Helpers: `invoiceById`, `match3Way(invoiceId)` returning `{ poTotals, grnTotals, invoiceTotals, variances }`, `outstandingForVendor(id)`.

- `vendor-payments.ts`
  - `VendorPayment` (payment_type `advance | against_invoice | on_account | refund`, method `bank_transfer | cheque | cash | upi | rtgs | neft | other`, status `pending | processed | cleared | failed | cancelled`).
  - 14 payments incl. advances, allocations across multiple invoices, 1 failed, 1 with TDS.
  - Helpers: `paymentById`, `paymentsForVendor(id)`, `paymentsForInvoice(id)`, `allocateAdvance(vendorId)` mock builder.

- `purchase-returns.ts`
  - `PurchaseReturn`, `PurchaseReturnItem`. Reason codes: `damaged | wrong_item | quality_fail | excess | other`.
  - 5 returns covering each reason, 2 with debit notes, 1 still in draft.
  - Helpers: `returnById`, `returnsForVendor(id)`.

Cross-references: `inventory.reorderRows()` should grow a `raisePR()` shim that constructs a draft PR; `sales-orders.ts` should expose `mrpShortages(orderId)` so the SO detail can show a "Raise PR" CTA. Both shims are read-only / non-persisting.

---

## Pages

Create under `frontend/src/pages/purchase/`:

- `PurchaseLayout.tsx` — shared `PageHeader` with breadcrumb, summary strip (Open PRs · Open POs value · GRN pending · Invoice mismatch count · Outstanding payable), 8-tab sub-nav (Vendors / Requisitions / RFQs / Orders / GRNs / Invoices / Payments / Returns), `<Outlet/>`.

- `VendorsListPage.tsx` (`/purchase/vendors`)
  - FilterBar: search (name / GST / mobile), Select type, status, category tag, Reset.
  - Columns: Code, Company, Type, GST, Contact (mobile + email), Payment Terms, Rating (★), Status, Actions.
  - Status badges via existing `Badge` tones — Active `emerald`, Inactive `neutral`, Blacklisted `red`, On Hold `amber`.
  - Row click → detail. Header right: "+ New Vendor" Sheet (full form with tabs Profile / Bank / Tags).

- `VendorDetailPage.tsx` (`/purchase/vendors/:id`)
  - Header card with rating, lifetime spend, outstanding payable, on-time %.
  - Tabs: Overview · Contacts · Bank Details · Purchase Orders · GRNs · Invoices · Payments · Documents.
  - Quick actions: New PO · New RFQ · Toggle Blacklist (danger dialog).

- `PRListPage.tsx` (`/purchase/requisitions`)
  - FilterBar: status, source, priority, date range, requested-by.
  - Columns: PR #, Date, Source (badge), Project / SO Ref (link), Items count, Required By, Priority badge, Status badge, Requested By avatar, Actions.
  - Bulk actions (matches the inquiry pattern from step 16): Approve, Reject (reason), Send to RFQ, Export.
  - "+ New PR" Sheet with line-item editor; pickable source: blank / from reorder list / from sales order MRP.

- `PRDetailPage.tsx` (`/purchase/requisitions/:id`)
  - Header with status, source link (SO / job), required-by date.
  - Tabs: Items · Approvals (level/approver/status) · Activity · Attachments.
  - Actions: Submit for approval · Approve · Reject · Convert to RFQ · Convert to PO · Cancel.

- `RFQListPage.tsx` (`/purchase/rfqs`)
  - Columns: RFQ #, Date, PR Ref, Vendors invited, Responses received, Due date, Status, Awarded To.

- `RFQDetailPage.tsx` (`/purchase/rfqs/:id`)
  - Tabs: Vendors · Responses · **Comparison**.
  - Comparison view: matrix table — rows = items, columns = vendors. Each cell shows unit price + lead time + tax. Lowest price highlighted `bg-emerald-50`, shortest lead time `bg-sky-50`. Bottom row totals. Per-column "Award to vendor" button → confirmation dialog → status `awarded`.

- `POListPage.tsx` (`/purchase/orders`)
  - KPI strip: Open POs · Pending Approval · Awaiting GRN · Overdue Delivery · Total PO Value (this month).
  - FilterBar: status, vendor, date range, project / SO ref, warehouse.
  - Columns: PO #, Date, Vendor, Items, Grand Total, Expected Delivery, Status, Actions.
  - Header: "+ New PO" Sheet — vendor picker, link-to-PR/RFQ/SO, line items, delivery schedule, terms, taxes.

- `PODetailPage.tsx` (`/purchase/orders/:id`)
  - Header: PO #, vendor card, status badge, grand total, expected delivery; vertical stage stepper (Draft → Pending Approval → Approved → Sent → Partially Received → Received → Closed).
  - Tabs: Items · Delivery Schedule · Approvals · GRNs · Invoices · Payments · Activity · Documents.
  - Items table editable in `draft` state — product, spec, qty, unit, price, discount, tax, line total, received-qty progress bar.
  - Footer summary: subtotal, discount, tax, freight, grand total, advance paid, balance due.
  - Actions: Submit for Approval · Approve · Send to Vendor (PDF preview drawer) · Cancel · Convert to GRN · Duplicate.

- `GRNListPage.tsx` (`/purchase/grns`)
  - FilterBar: status, vendor, warehouse, date range.
  - Columns: GRN #, Date, PO Ref, Vendor, Warehouse, Status badge, Received By, Actions.

- `GRNDetailPage.tsx` (`/purchase/grns/:id`)
  - Header: GRN #, PO link, vendor, warehouse, status badge.
  - Items table: PO line · received qty · accepted qty · rejected qty · QC status (Accept / Reject / Hold radio per row) · batch / serial · warehouse location · QC remarks.
  - Sticky bottom action bar: Save Draft · Submit QC · Post to Stock (only after QC complete on every row).
  - Side panel: vehicle no, transporter, vendor invoice ref + date, attachments dropzone.

- `VendorInvoiceListPage.tsx` (`/purchase/invoices`)
  - FilterBar: status, match status, vendor, due-date range, overdue toggle.
  - Columns: Invoice #, Date, Vendor, PO Ref, GRN Ref, Grand Total, Due Date, Match Status badge, Status badge, Actions.

- `VendorInvoiceDetailPage.tsx` (`/purchase/invoices/:id`)
  - 3-pane variance viewer: Invoice vs PO vs GRN — values that differ rendered in `text-red-600` with delta tooltip.
  - Tabs: Lines · Match · Payments · Activity · Attachments.
  - Actions: Approve · Hold · Dispute · Schedule Payment.

- `PaymentListPage.tsx` (`/purchase/payments`)
  - Columns: Payment #, Date, Vendor, Type, Method, Reference, Amount, TDS, Status, Actions.
  - "+ New Payment" Dialog: vendor → outstanding invoices list (multi-select with allocation amounts) → method → reference → TDS amount.

- `PurchaseReturnListPage.tsx` (`/purchase/returns`)
  - FilterBar: vendor, reason code, status, date range.
  - Columns: Return #, Date, Vendor, GRN Ref, Reason, Qty, Debit Note #, Status, Actions.
  - "+ New Return" form: pick GRN → choose items → return qty → reason → notes; on Approve a debit note number is generated.

- (Optional) `PurchaseDashboardPage.tsx` (`/purchase/dashboard`)
  - KPI cards: Open PR Count · Open PO Value · GRN Pending · Invoice Mismatch · Outstanding Payable · Avg PO Cycle Time.
  - Charts (Recharts): Spend by Category (donut) · Top 10 Vendors by Spend (bar) · Monthly PO Trend (line) · On-time Delivery % (gauge).
  - Tables: Overdue Deliveries · Pending Approvals · Upcoming Payments.

---

## Routing

Update `frontend/src/app/router.tsx` — nested under `PurchaseLayout`:

```
/purchase                       → PurchaseLayout
  index                         → redirect to /purchase/orders (or /purchase/dashboard if built)
  /vendors                      → VendorsListPage
  /vendors/:id                  → VendorDetailPage
  /requisitions                 → PRListPage
  /requisitions/:id             → PRDetailPage
  /rfqs                         → RFQListPage
  /rfqs/:id                     → RFQDetailPage
  /orders                       → POListPage
  /orders/:id                   → PODetailPage
  /grns                         → GRNListPage
  /grns/:id                     → GRNDetailPage
  /invoices                     → VendorInvoiceListPage
  /invoices/:id                 → VendorInvoiceDetailPage
  /payments                     → PaymentListPage
  /returns                      → PurchaseReturnListPage
  /dashboard                    → PurchaseDashboardPage (optional)
```

All page modules lazy-loaded.

---

## Navigation

`app/navConfig.ts` — add a new `section: 'procurement'` (or reuse `'main'` between Inventory and Dispatch) with `Truck` / `ShoppingCart` Lucide icons:

- Vendors · Requisitions · RFQs · Purchase Orders · GRNs · Invoices · Payments · Returns · (Dashboard).

Sidebar groups under a `── Procurement ──` divider. Roles with access (mock): Admin, Purchase Manager, Purchase Executive, Accounts (read-only on financial sub-screens), Store Keeper (GRN-only).

Topbar `GlobalSearch` (step 16.1) — extend `searchAll()` to also scan `vendors`, `purchase_orders`, `vendor_invoices` so PO/GRN/Invoice numbers are findable.

---

## Cross-module wiring (mock only)

- Inventory `ReorderPage` — existing "Raise PO" buttons should now call a `raisePR()` shim and navigate to `/purchase/requisitions/new?source=reorder`.
- Sales Order detail "MRP shortage" panel — "Raise PR" CTA navigates to `/purchase/requisitions/new?source=sales_order&id=:soId`.
- GRN "Post to Stock" — renders a confirmation dialog explaining that in mock mode no ledger row is actually written; in Phase 3 wiring this becomes the API call.

---

## Additional screens & affordances (gap-fill)

### Vendor module

- **VendorsListPage** — add a **Performance** column (badge: ★ rating + on-time %); add bulk action *Toggle Active*.
- **VendorDetailPage** — add a 9th tab **Performance** with: on-time delivery %, avg QC accept %, avg price variance vs PO, lifetime spend, AP outstanding, top 5 supplied products. Renders 3 sparkline cards + a 12-month trend line.
- **VendorDetailPage** — add an **Activity** sub-tab on Overview (chronological events: PO sent, GRN posted, invoice received, payment cleared, blacklist toggled).
- Header right of every vendor screen carries an `AttachmentsTab` (vendor agreement, MSA, PAN/GST scans, MSME cert) sharing the existing `Attachments` primitive.

### PR + RFQ

- **PRListPage** bulk actions extended: Approve, Reject (reason), Send to RFQ, Convert to PO (single-vendor short-circuit), Cancel, Export.
- **PRDetailPage** — add an **Attachments** tab (specs, customer drawings, vendor catalogues).
- **RFQListPage** — "+ New RFQ" Sheet flow: pick PR (or blank) → line items inherited → invite vendors (multi-select with last-quoted-price hint) → due date → email subject + body (uses settings email template `rfq_invite`).
- **RFQDetailPage / Comparison** — add a per-line *Notes* column for buyer remarks; add an **Award split** mode that lets the buyer award different lines to different vendors (creates one PO draft per awarded vendor).
- RFQ email-send confirmation drawer mirrors quotation send pattern.

### Purchase Order

- **PODetailPage** — add an **Amendment** action (post-`sent` only): opens a side-by-side editor that diffs proposed vs current line items / qty / price; submitting kicks an approval cycle and freezes the PO until resolved (mirrors SO amend pattern).
- **PODetailPage** — add a **PDF Preview** drawer + **Send to Vendor** dialog (subject, recipients, cc, body from `po_send` email template, attachment toggle).
- **PO header** form — add **Currency** + **Exchange Rate** fields (default INR / 1.00); when non-INR, footer shows both currency totals.
- **PO line tax** — split into CGST / SGST / IGST columns (Indian compliance) with auto-derivation based on vendor state vs warehouse state; show place-of-supply read-only field in header.
- **POListPage** — add bulk actions: Approve, Send, Cancel, Export. Add column toggle for *Place of supply* and *Currency*.
- **PODetailPage** Items tab — add a **Backorder / Pending** chip per row showing `qty_pending = qty - received_quantity` so partial receipts are visible at a glance.

### GRN

- **GRNListPage** — add bulk *Submit QC* + *Post to Stock* (only if every selected GRN is QC-complete).
- **GRNDetailPage** — explicit **Direct GRN (no PO)** mode disabled by default; gated behind a feature flag + admin-only role. UI shows the toggle but a confirmation dialog explains it is disallowed in mock mode (decision documented).
- **GRNDetailPage** mobile layout — store-keeper friendly: stacked cards per item with large QC radio buttons, photo-attach button per row (uses existing dropzone primitive), "Save & next" pager between rows.
- **GRNDetailPage** — attachments tab for delivery challan scan, packing list, e-way bill copy.

### Vendor Invoices

- **VendorInvoiceListPage** — bulk *Approve* / *Hold* / *Schedule Payment*; add **Aging bucket** column (`current | 0-30 | 31-60 | 61-90 | 90+`) on Payments + Invoices lists.
- **VendorInvoiceDetailPage** — add **TDS** + **GST input credit** read-only block (computed from line totals + tax rules); footer shows net payable after TDS deduction.
- 3-way match panel — add an **Override match** dialog (admin-only) that records reason + writes audit entry, sets `match_status = on_hold`.
- Add an **Attachments** tab (scanned bill PDF + supporting docs).

### Payments

- **PaymentListPage** — add **Payable Aging** KPI strip above the table (5 buckets) sourced from `/stats/payable-aging`.
- **New Payment** dialog — add TDS computation helper (% of base) + reference attachment upload (cheque copy / UTR screenshot).
- Add **Payment Advice** action (post-`processed`): renders PDF + dialog to email vendor (uses `payment_advice` email template).
- Add **Refund / Reversal** sub-action on cleared payments (admin-only, reason required).

### Returns

- **PurchaseReturnListPage** — add bulk *Approve* + *Cancel*.
- **PurchaseReturnDetailPage** (new) — mirrors GRN detail with reverse direction; shows generated debit note PDF preview drawer; tabs Items / Activity / Attachments.

### Dashboard

- Add **Top Late Vendors** table (overdue deliveries + days late) and **Open RFQs Awaiting Response** widget.
- Charts gain CSV export action via existing `ExportButton` primitive.

### Settings (admin) cross-screen

Add two admin sub-screens under existing `/admin/settings` (consumed in step 14 admin):

- **Purchase Approval Rules** editor — conditions table (entity / field / operator / value) + level chain (role / user). Reuses existing rule-builder primitive from quotation approvals.
- **Match Tolerance** form — quantity tolerance %, unit tolerance, price tolerance %, allow-negative-variance toggle.

Mocks: `frontend/src/mocks/admin-purchase.ts` with 4 sample rules + default tolerance config.

### Cross-cutting UI primitives

- Empty states + skeletons across every list and detail page (mirrors documents/orders cadence).
- Audit log side-drawer ("View activity") on every detail page.
- Print stylesheet for PO + GRN + Debit Note PDFs.
- All money values respect the document `currency` field via the existing `formatMoney` helper (extend to accept `currency` arg).
- All pages tested at 360 / 768 / 1280 / 1536 widths; GRN detail explicitly tested on 360 (store-keeper).

### Global search + nav

- `searchAll()` extended to scan `vendors`, `purchase_requisitions`, `rfqs`, `purchase_orders`, `grns`, `vendor_invoices`, `vendor_payments`, `purchase_returns` so every numbered document is findable.
- Topbar quick-action menu gets a **+ New PO** shortcut (role-gated to purchase_manager / purchase_executive / admin).

---

## Verification (additional)

- [x] PO Amendment flow freezes the PO and unblocks only after approval action.
- [x] PO PDF preview + email-send dialog uses the `po_send` template; recipients default to the vendor primary contact.
- [ ] CGST/SGST/IGST split derives correctly when vendor state == warehouse state vs not.
- [ ] GRN mobile view at 360 px keeps every action reachable without horizontal scroll.
- [ ] Vendor performance tab renders even when vendor has zero POs (no NaN, no division-by-zero).
- [ ] Aging buckets on Invoices + Payments match dashboard KPI.
- [x] Award-split RFQ creates one draft PO per awarded vendor with correct line allocation.
- [x] All money formatting honours per-document currency.
- [x] Audit drawer accessible from every detail page.
- [x] Approval rules + tolerance settings screens render and persist to the mock store.

---

## Verification

- [x] All 14 (or 15 with dashboard) routes render without console errors.
- [x] Status / match-status badges use only existing `Badge` tones (no new tones added).
- [x] RFQ comparison highlights lowest unit price + shortest lead time per row.
- [x] PO footer math reconciles (subtotal + tax + freight − discount = grand total).
- [x] GRN "Submit QC" disabled until every row has a non-pending QC status.
- [x] Invoice 3-way match highlights price + qty variance in red.
- [ ] Payment allocation cannot exceed selected invoices' outstanding total.
- [x] Reorder "Raise PO" + SO MRP "Raise PR" navigate to the new PR form with prefilled source.
- [x] Global search returns vendor / PO / invoice hits.
- [x] `npm run lint` clean.
- [x] `npm run build` clean; per-page chunks budgeted ≤ 25 kB pre-gzip.
- [ ] Lighthouse a11y ≥ 90 on `/purchase/orders` and `/purchase/orders/:id`.

---

## Commits

One commit per major sub-area (matches Phase-1 cadence):

1. `feat(ui): purchase mocks + vendor master`
2. `feat(ui): purchase requisitions + RFQ comparison`
3. `feat(ui): purchase orders list + detail`
4. `feat(ui): GRN with QC workflow`
5. `feat(ui): vendor invoices + 3-way match`
6. `feat(ui): vendor payments + purchase returns`
7. `feat(ui): purchase dashboard + sidebar nav` (optional)
8. `feat(ui): purchase amendments + currency + tax split`
9. `feat(ui): purchase admin settings (approval rules + tolerance)`

---

**Next:** [18-client-portal.md](./18-client-portal.md)
