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

## Verification

- [ ] All 14 (or 15 with dashboard) routes render without console errors.
- [ ] Status / match-status badges use only existing `Badge` tones (no new tones added).
- [ ] RFQ comparison highlights lowest unit price + shortest lead time per row.
- [ ] PO footer math reconciles (subtotal + tax + freight − discount = grand total).
- [ ] GRN "Submit QC" disabled until every row has a non-pending QC status.
- [ ] Invoice 3-way match highlights price + qty variance in red.
- [ ] Payment allocation cannot exceed selected invoices' outstanding total.
- [ ] Reorder "Raise PO" + SO MRP "Raise PR" navigate to the new PR form with prefilled source.
- [ ] Global search returns vendor / PO / invoice hits.
- [ ] `npm run lint` clean.
- [ ] `npm run build` clean; per-page chunks budgeted ≤ 25 kB pre-gzip.
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

---

**Next:** Phase 2 implementation — [../phase-2-backend-api/00-overview.md](../phase-2-backend-api/00-overview.md)
