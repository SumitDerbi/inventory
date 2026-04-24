# Step 07 — Quotation Module (Static UI) ✅

> Previous: [06-inquiries.md](./06-inquiries.md) · Next: [08-sales-orders.md](./08-sales-orders.md)
> Spec: [docs/development_spec.md Module 2](../../docs/development_spec.md), [docs/project_details.md §2](../../docs/project_details.md), ui in [docs/ui_spec.md](../../docs/ui_spec.md)

---

## ✅ Delivered

### Helpers & domain

- **`frontend/src/lib/quotationStatus.ts`** — `QuotationStatus` union (`draft`, `pending_approval`, `approved`, `sent`, `revision_requested`, `rejected`, `converted`, `expired`); labels + tones; gate helpers `canSend`, `canApprove`, `canReject`, `canConvertToOrder`, `canClone`, `requiresVersionBump`, `isTerminal`.
- **`frontend/src/components/ui/StatusBadge.tsx`** — extended `STATUS_MAP` with `Expired`, `Rejected`, `Revision Requested`.

### Mocks

- **`frontend/src/mocks/products.ts`** — 20 products spanning Pumps, Motors, Valves, Piping, Tanks, Controls, Filtration, Chemicals, Services (list price, tax rate, stock, UoM).
- **`frontend/src/mocks/termsTemplates.ts`** — 4 reusable term templates (Standard, AMC, Spare, Turnkey).
- **`frontend/src/mocks/quotations.ts`** — 20 quotations covering every status; 2 detailed multi-version records (Q-2026-001 with 3 versions ending in _converted_; Q-2026-002 pending approval v1) plus 18 lighter variants. Each version carries line items, commercials, terms, approval chain, communications timeline, change summary. Helpers exported: `quotationById`, `currentVersion`, `lineTotals`, `versionTotals`.

### Pages

- **`frontend/src/pages/quotations/QuotationsPage.tsx`** — `/quotations`
  - `FilterBar` with search, status, owner, date range, amount range, reset.
  - Export dropdown (CSV / Excel / PDF) fires toast.
  - `DataTable` columns: Quote #, Date, Customer + Company, Project, Version, Total (INR), Status badge, Valid until (red on expiry), Owner.
  - Rows link to detail; "New quotation" CTA points users to inquiry-conversion flow.

- **`frontend/src/pages/quotations/QuotationDetailPage.tsx`** — `/quotations/:id`
  - Header: version switcher dropdown (all versions listed with status), status badge, "Historical version" marker, PDF preview button, Send button (gated by `canSend`), **Actions** menu with Edit, Approve, Reject, Convert to Order, Clone — all gated by `canApprove` / `canReject` / `canConvertToOrder` / `canClone`.
  - Totals strip: subtotal, discount, tax, grand total.
  - **Tabs**
    - **Line Items** — editable table (qty, discount %) with live totals footer (subtotal, discount, tax, freight, installation, grand total). Remove row. "Add product" opens `ProductPickerDialog`. Read-only on historical / terminal versions.
    - **Commercials** — payment terms, delivery, warranty, valid-until, freight, installation; read-only flag honoured.
    - **Terms & Conditions** — template picker (4 templates) + editable body textarea.
    - **Approvals** — ordered step list with per-step status badge, active step highlighted amber.
    - **Communications** — timeline with typed icons (email sent/received, acknowledgement, revision request, call note).
    - **Versions** — full version list with totals, line-count, change summary, "View" switcher.

### Dialogs / drawers

- **`ProductPickerDialog`** — search-filtered product list, quick-add.
- **`SendEmailDialog`** — to/cc/bcc/subject/body + attach-PDF toggle; simulated send with 600 ms spinner + success toast.
- **`VersionBumpDialog`** — fired when editing a `sent`/`approved`/`converted`/`rejected`/`expired` version; explains version clone semantics.
- **`PdfPreviewSheet`** — right drawer (42 rem) with Download/Print toolbar and PDF-style rendered preview (company header, customer block, line-items table, totals box, terms body).

### Routing

- **`frontend/src/app/router.tsx`** — lazy `QuotationsPage` and `QuotationDetailPage`; routes `/quotations` and `/quotations/:id` wired under the app shell.

---

## Verification

- [x] `npm run lint` — clean (0 errors; existing RHF `watch()` compiler warning unchanged).
- [x] `npm run build` — passes; new chunks: `QuotationsPage` 5.65 kB, `QuotationDetailPage` 33.97 kB, `quotations` mocks 13.34 kB.
- [x] List page filters, sorts, and links to detail.
- [x] Detail page renders for every status; read-only mode enforced on historical / terminal versions.
- [x] Live totals update on qty / discount edits.
- [x] Gate helpers correctly show/hide Send, Approve, Reject, Convert-to-Order actions.
- [x] All dialogs (`ProductPicker`, `SendEmail`, `VersionBump`, `PdfPreview`) open, interact, and close.

---

## Commit prepared

```
feat(ui): quotation module static — list, detail, versions, approvals, PDF preview
```
