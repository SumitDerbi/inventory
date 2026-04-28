# Step 08b — Purchase & Procurement API

> Before this: [08-inventory-api.md](./08-inventory-api.md)
> Spec: [docs/development_spec.md Module 11](../../docs/development_spec.md), [docs/project_details.md §11](../../docs/project_details.md), [docs/ui_spec.md §14](../../docs/ui_spec.md)

---

## Endpoints

### Vendors

| Method | Path                                              | Purpose                                             |
| ------ | ------------------------------------------------- | --------------------------------------------------- |
| CRUD   | `/api/v1/purchase/vendors/`                       | list / create / detail / patch / soft-delete        |
| GET    | `/api/v1/purchase/vendors/:id/performance`        | on-time %, qc accept %, price variance, spend, AP   |
| CRUD   | `/api/v1/purchase/vendors/:id/contacts/`          |                                                     |
| CRUD   | `/api/v1/purchase/vendors/:id/bank-details/`      |                                                     |
| POST   | `/api/v1/purchase/vendors/:id/blacklist`          | `{ reason }`                                        |
| POST   | `/api/v1/purchase/vendors/:id/unblacklist`        |                                                     |

### Purchase Requisitions

| Method | Path                                              | Purpose                                             |
| ------ | ------------------------------------------------- | --------------------------------------------------- |
| CRUD   | `/api/v1/purchase/requisitions/`                  | list / create / detail / patch / cancel             |
| POST   | `/api/v1/purchase/requisitions/from-reorder`      | `{ warehouse_id?, product_ids[]? }`                 |
| POST   | `/api/v1/purchase/requisitions/from-sales-order`  | `{ sales_order_id }`                                |
| POST   | `/api/v1/purchase/requisitions/:id/submit`        | draft → pending_approval                            |
| POST   | `/api/v1/purchase/requisitions/:id/approve`       | next level / final approve                          |
| POST   | `/api/v1/purchase/requisitions/:id/reject`        | `{ reason }`                                        |
| POST   | `/api/v1/purchase/requisitions/bulk-approve`      | `{ pr_ids[] }`                                      |
| POST   | `/api/v1/purchase/requisitions/bulk-reject`       | `{ pr_ids[], reason }`                              |
| POST   | `/api/v1/purchase/requisitions/:id/convert-to-rfq`| `{ vendor_ids[] }` → returns rfq_id                 |
| POST   | `/api/v1/purchase/requisitions/:id/convert-to-po` | `{ vendor_id }` (skip-RFQ path) → returns po_id     |

### RFQs

| Method | Path                                              | Purpose                                             |
| ------ | ------------------------------------------------- | --------------------------------------------------- |
| CRUD   | `/api/v1/purchase/rfqs/`                          |                                                     |
| POST   | `/api/v1/purchase/rfqs/:id/send`                  | mark sent + dispatch email to invited vendors       |
| POST   | `/api/v1/purchase/rfqs/:id/quotes`                | record vendor quote (rfq_vendor + quote + items)    |
| GET    | `/api/v1/purchase/rfqs/:id/comparison`            | matrix view (rows = items, cols = vendor quotes)    |
| POST   | `/api/v1/purchase/rfqs/:id/award`                 | `{ vendor_id }` → status awarded + creates PO draft |
| POST   | `/api/v1/purchase/rfqs/:id/cancel`                |                                                     |

### Purchase Orders

| Method | Path                                              | Purpose                                             |
| ------ | ------------------------------------------------- | --------------------------------------------------- |
| CRUD   | `/api/v1/purchase/orders/`                        | filterable: status, vendor, project, date range     |
| POST   | `/api/v1/purchase/orders/:id/submit`              | draft → pending_approval                            |
| POST   | `/api/v1/purchase/orders/:id/approve`             | level/final approve                                 |
| POST   | `/api/v1/purchase/orders/:id/reject`              | `{ reason }` → back to draft                        |
| POST   | `/api/v1/purchase/orders/:id/send`                | approved → sent + email vendor + render PDF         |
| POST   | `/api/v1/purchase/orders/:id/cancel`              | reason required                                     |
| POST   | `/api/v1/purchase/orders/:id/duplicate`           | clone as draft                                      |
| GET    | `/api/v1/purchase/orders/:id/pdf`                 | PDF stream                                          |
| CRUD   | `/api/v1/purchase/orders/:id/delivery-schedules`  |                                                     |
| GET    | `/api/v1/purchase/orders/:id/grns`                |                                                     |
| GET    | `/api/v1/purchase/orders/:id/invoices`            |                                                     |
| POST   | `/api/v1/purchase/orders/bulk-approve`            | `{ po_ids[] }`                                      |
| POST   | `/api/v1/purchase/orders/bulk-export`             | `{ po_ids[], format }` → file                       |

### GRNs

| Method | Path                                              | Purpose                                             |
| ------ | ------------------------------------------------- | --------------------------------------------------- |
| CRUD   | `/api/v1/purchase/grns/`                          | filterable: status, po, vendor, warehouse           |
| POST   | `/api/v1/purchase/grns/:id/submit-qc`             | draft → pending_qc                                  |
| POST   | `/api/v1/purchase/grns/:id/post-to-stock`         | writes to inventory ledger (idempotent)             |
| POST   | `/api/v1/purchase/grns/:id/cancel`                |                                                     |
| PATCH  | `/api/v1/purchase/grns/:id/items/:item_id/qc`     | `{ qc_status, qc_remarks, accepted_qty, rejected_qty, batch_number, serial_numbers[] }` |

### Vendor Invoices

| Method | Path                                              | Purpose                                             |
| ------ | ------------------------------------------------- | --------------------------------------------------- |
| CRUD   | `/api/v1/purchase/invoices/`                      | filterable: status, match_status, vendor, overdue   |
| POST   | `/api/v1/purchase/invoices/:id/match`             | recompute 3-way match status                        |
| GET    | `/api/v1/purchase/invoices/:id/match-detail`      | side-by-side PO / GRN / Invoice with variances      |
| POST   | `/api/v1/purchase/invoices/:id/approve`           |                                                     |
| POST   | `/api/v1/purchase/invoices/:id/hold`              | `{ reason }`                                        |
| POST   | `/api/v1/purchase/invoices/:id/dispute`           | `{ reason }`                                        |
| POST   | `/api/v1/purchase/invoices/:id/cancel`            |                                                     |

### Payments

| Method | Path                                              | Purpose                                             |
| ------ | ------------------------------------------------- | --------------------------------------------------- |
| CRUD   | `/api/v1/purchase/payments/`                      |                                                     |
| POST   | `/api/v1/purchase/payments/:id/process`           | pending → processed                                 |
| POST   | `/api/v1/purchase/payments/:id/clear`             | processed → cleared (bank confirmation)             |
| POST   | `/api/v1/purchase/payments/:id/fail`              | `{ reason }`                                        |
| POST   | `/api/v1/purchase/payments/:id/cancel`            |                                                     |
| GET    | `/api/v1/purchase/vendors/:id/outstanding`        | open invoices + advances + on-account balance       |
| POST   | `/api/v1/purchase/payments/allocate-advance`      | `{ vendor_id, payment_id, allocations[{invoice_id, amount}] }` |

### Returns

| Method | Path                                              | Purpose                                             |
| ------ | ------------------------------------------------- | --------------------------------------------------- |
| CRUD   | `/api/v1/purchase/returns/`                       |                                                     |
| POST   | `/api/v1/purchase/returns/:id/approve`            | generates debit_note_number + reverses stock ledger |
| POST   | `/api/v1/purchase/returns/:id/dispatch`           | mark dispatched to vendor                           |
| POST   | `/api/v1/purchase/returns/:id/close`              |                                                     |
| POST   | `/api/v1/purchase/returns/:id/cancel`             |                                                     |

### Dashboard / Stats

| Method | Path                                              | Purpose                                             |
| ------ | ------------------------------------------------- | --------------------------------------------------- |
| GET    | `/api/v1/purchase/stats/summary`                  | open PR / PO / GRN / invoice mismatch / payable     |
| GET    | `/api/v1/purchase/stats/spend-by-category`        | for donut chart                                     |
| GET    | `/api/v1/purchase/stats/top-vendors`              | `?limit=10&period=ytd`                              |
| GET    | `/api/v1/purchase/stats/po-trend`                 | monthly counts + value                              |
| GET    | `/api/v1/purchase/stats/on-time-delivery`         | overall + per vendor                                |

---

## Rules

### Workflow

- **PR state machine:** `draft → pending_approval → approved → (rfq_sent | po_created) → closed`. `rejected` and `cancelled` are terminal.
- **PO state machine:** `draft → pending_approval → approved → sent → partially_received → received → closed`. `cancelled` is terminal from any pre-`received` state. Backward moves admin-only with reason.
- **GRN state machine:** `draft → pending_qc → (completed | partially_accepted | rejected) → posted_to_stock`. `cancelled` is terminal. Cannot post to stock until every line has non-`pending` QC status.
- **Invoice state machine:** `draft → verified → approved → (paid | partially_paid)`. `disputed` and `cancelled` are terminal-ish; resume only via admin override.
- **Return state machine:** `draft → approved → dispatched → closed`. `cancelled` terminal.
- **Payment state machine:** `pending → processed → cleared`. `failed` and `cancelled` terminal.

### Approval engine

- Configurable rules table: `purchase_approval_rules(entity_type, condition_field, operator, value, levels[])`.
- Conditions evaluated server-side: PO grand_total, vendor_category, product_category, project_overshoot, discount_percent.
- Multi-level approval supported; each level resolves to a user / role; full audit trail in `purchase_approvals`.
- Bulk approve/reject: 207 partial-failure contract identical to inquiries (step 05).

### 3-way match (invoice ↔ PO ↔ GRN)

- **Quantity tolerance:** configurable per company (default ±2 % or ±1 unit).
- **Price tolerance:** configurable (default ±1 %). Differences beyond tolerance set `match_status = price_variance` / `qty_variance`.
- Missing PO link → `unmatched`. Manual override sets `on_hold` with reason.
- Match runs automatically on invoice create / update and on linked GRN posting; results cached in `match_status` + denormalised `variance_amount` for reporting.

### Stock integration

- `GRN.post-to-stock` writes one `stock_ledger` row per accepted-qty per item with `transaction_type = 'purchase'`, document refs back to PO + GRN. Idempotent — repeat call is a no-op once `posted_at` is set.
- `purchase_returns.approve` writes negative `stock_ledger` rows (`transaction_type = 'purchase_return'`) and generates the debit note number via the company numbering series.
- All stock writes happen inside a DB transaction with `select_for_update` on `stock_summary_v` rows for affected (product, warehouse).

### Sales-order MRP integration

- `POST /api/v1/orders/:id/raise-prs` (added to step 07) iterates MRP shortages and creates draft PRs grouped by suggested vendor (or single PR if vendor unknown), each line back-referencing the SO line. The PR's `sales_order_id` is set so SO status surfaces "PR raised" indicators.
- When a PO sourced from a sales-order PR is `received`, the SO's MRP view is auto-recomputed and `sales_orders.readiness_flag` may flip from red → amber → green.

### Numbering

- Series managed in `settings_numbering` (step 04b): `vendor_code`, `pr_number`, `rfq_number`, `po_number`, `grn_number`, `vendor_invoice_internal_no`, `payment_number`, `return_number`, `debit_note_number`. Each supports prefix + reset cadence (yearly / never).

### Permissions

- Role `purchase_manager`: full CRUD across the module + approve up to configured limit.
- Role `purchase_executive`: CRUD on PR / RFQ / PO drafts; cannot final-approve PO above limit.
- Role `accounts`: read-only on PO; CRUD on invoices + payments.
- Role `store_keeper`: read PO; CRUD GRN + items; cannot edit invoices or payments.
- Role `admin`: full.
- Vendor PII (bank details) gated by `purchase.view_bank_details` permission.

### Audit + notifications

- Every approval action, status transition, GRN post, invoice match, and payment cleared writes to `audit_log`.
- Notification kinds (added to step 13 matrix): `pr.pending_approval`, `po.pending_approval`, `po.sent`, `grn.posted`, `invoice.variance_detected`, `invoice.due_soon`, `payment.cleared`, `payment.failed`, `vendor.blacklisted`.
- Email-out: PO PDF on send (renders via existing PDF service), payment advice on cleared.

---

## Tests (pytest)

- Vendor CRUD + blacklist toggle + bank-detail visibility gating.
- PR auto-build from reorder list — verify quantities and warehouse split.
- PR auto-build from SO MRP shortages — covers full / partial / multi-vendor cases.
- Approval engine: rule evaluation table-driven for PO grand_total breakpoints + multi-level chains.
- RFQ comparison: lowest-price-per-row flagging + tie-break by lead time.
- PO numbering uniqueness + per-year reset.
- GRN partial accept + post-to-stock writes correct ledger rows; second post-to-stock is a no-op.
- 3-way match: clean / price-variance / qty-variance / unmatched / on-hold paths, with tolerance edge-cases (exactly at threshold, just over).
- Payment allocation cannot exceed invoice outstanding; advances allocated correctly across multiple invoices.
- Purchase return reverses stock ledger and generates debit note.
- Concurrency: two GRN post-to-stock calls; only one ledger write occurs.
- Permissions matrix per role across every endpoint.

---

## Postman

Folder `Purchase` chained scenarios:

1. Create vendor → contacts → bank.
2. Auto-PR from reorder → submit → approve → convert to RFQ → invite 3 vendors → record quotes → award → PO draft → approve → send.
3. Create GRN against PO → QC accept partial → post to stock (verify inventory ledger via existing `Inventory` folder lookup).
4. Capture vendor invoice → match → approve → schedule payment → process → clear.
5. Create return against GRN → approve → verify debit note + ledger reversal.

Newman CI runs the full chain end-to-end.

---

## Verification

- [ ] Coverage ≥ 85 % across `purchase` app (≥ 90 % on the matching + approval services).
- [ ] All state machines covered by table-driven tests (one row per transition incl. illegal moves).
- [ ] 3-way match tolerance config exposed via settings API (step 04b) and tested.
- [ ] Bulk endpoints return 207 on partial failure with per-row reason codes.
- [ ] OpenAPI schema exposes every endpoint with example payloads.
- [ ] Notification kinds for purchase events present in step 13 matrix.
- [ ] Commit cadence (one per sub-area):
  - `feat(api): vendors + bank + contacts`
  - `feat(api): purchase requisitions + approval engine`
  - `feat(api): rfqs + comparison + award`
  - `feat(api): purchase orders + lifecycle + pdf`
  - `feat(api): grns + qc + post-to-stock`
  - `feat(api): vendor invoices + 3-way match`
  - `feat(api): vendor payments + allocation`
  - `feat(api): purchase returns + debit notes`
  - `feat(api): purchase stats + dashboard`

---

**Next:** [09-dispatch-api.md](./09-dispatch-api.md)

---

## Additional endpoints & rules (gap-fill)

### PO amendment

| Method | Path                                           | Purpose                                              |
| ------ | ---------------------------------------------- | ---------------------------------------------------- |
| POST   | `/api/v1/purchase/orders/:id/amend`            | submit amended lines (qty / price / delivery dates)  |
| POST   | `/api/v1/purchase/orders/:id/amend/:aid/approve` | approve a pending amendment                        |
| POST   | `/api/v1/purchase/orders/:id/amend/:aid/reject`  | reject; PO returns to prior state                  |
| GET    | `/api/v1/purchase/orders/:id/amend/history`   | full revision history (snapshots before/after)        |

- Amendment freezes the PO (`status_locked = true`) until resolved; mirrors quotations / SO amend pattern.
- Each approval write captures before/after JSON snapshot in `purchase_amendments` table (add to step 02 model list).

### Vendor performance + scorecard

| Method | Path                                              | Purpose                                          |
| ------ | ------------------------------------------------- | ------------------------------------------------ |
| GET    | `/api/v1/purchase/vendors/:id/scorecard`          | structured KPIs over a window                    |
| GET    | `/api/v1/purchase/vendors/:id/activity`           | unified timeline (PO/GRN/invoice/payment events) |

- Scorecard payload: on_time_pct, qc_accept_pct, avg_price_variance_pct, avg_lead_time_days, lifetime_spend, ap_outstanding, top_5_products.
- Computed nightly into `vendor_scorecard_cache`; live endpoint reads cache + last-N-days delta for freshness.

### RFQ award split

- Extend `POST /api/v1/purchase/rfqs/:id/award` to accept either `{ vendor_id }` (whole award) **or** `{ allocations: [{ rfq_item_id, vendor_id, qty }] }` (split award).
- Split award creates one draft PO per awarded vendor with the allocated lines; all draft POs share `rfq_id`.

### Direct GRN (no PO)

| Method | Path                                              | Purpose                                          |
| ------ | ------------------------------------------------- | ------------------------------------------------ |
| POST   | `/api/v1/purchase/grns/direct`                    | record receipt without a PO (admin-only)         |

- Feature-flagged via settings; default off. Audit log mandatory; reason field required; downstream invoice still creatable but match_status starts `unmatched`.

### Bulk endpoints (matches inquiries / orders 207 contract)

| Method | Path                                              | Purpose                                          |
| ------ | ------------------------------------------------- | ------------------------------------------------ |
| POST   | `/api/v1/purchase/orders/bulk-send`               | `{ po_ids[] }`                                   |
| POST   | `/api/v1/purchase/orders/bulk-cancel`             | `{ po_ids[], reason }`                           |
| POST   | `/api/v1/purchase/grns/bulk-submit-qc`            | `{ grn_ids[] }`                                  |
| POST   | `/api/v1/purchase/grns/bulk-post-to-stock`        | `{ grn_ids[] }`                                  |
| POST   | `/api/v1/purchase/invoices/bulk-approve`          | `{ invoice_ids[] }`                              |
| POST   | `/api/v1/purchase/invoices/bulk-hold`             | `{ invoice_ids[], reason }`                      |
| POST   | `/api/v1/purchase/invoices/bulk-export`           | `{ invoice_ids[], format }`                      |
| POST   | `/api/v1/purchase/payments/bulk-process`          | `{ payment_ids[] }`                              |
| POST   | `/api/v1/purchase/returns/bulk-approve`           | `{ return_ids[] }`                               |

All cap at 200 ids and return per-row outcomes.

### Multi-currency

- `purchase_orders` adds `currency` (default `INR`) + `exchange_rate` (default `1.0000`) fields (extend step 02 model list).
- All money columns stored in document currency; aggregate reports convert to base INR using stored `exchange_rate` at PO date.
- `vendor_invoices` inherits the PO currency; payment may be in a different currency only with admin override + variance entry.

### Indian tax split

- `purchase_order_items` and `vendor_invoice_items` add denormalised `cgst_amount`, `sgst_amount`, `igst_amount` (extend step 02).
- Derivation rule: vendor_state == warehouse_state \u2192 CGST + SGST; otherwise IGST. `place_of_supply` stored on PO header.
- TDS on payments tracked at `vendor_payments.tds_amount` (already present); add `vendor_invoices.tds_applicable` boolean + `tds_section` (e.g. `194Q`, `194C`).

### Aging + AP analytics

| Method | Path                                              | Purpose                                          |
| ------ | ------------------------------------------------- | ------------------------------------------------ |
| GET    | `/api/v1/purchase/stats/payable-aging`            | bucketed: current, 0-30, 31-60, 61-90, 90+       |
| GET    | `/api/v1/purchase/stats/payable-aging/by-vendor`  | same buckets per vendor                          |
| GET    | `/api/v1/purchase/stats/grn-pending`              | POs with pending receipts > N days               |
| GET    | `/api/v1/purchase/stats/qc-rejection`             | per-vendor QC rejection % over period            |

### Reports cross-reference (step 12)

Add to [12-reports-api.md](./12-reports-api.md):

- `/api/v1/reports/purchase/spend-by-category`
- `/api/v1/reports/purchase/spend-by-vendor`
- `/api/v1/reports/purchase/spend-by-project`
- `/api/v1/reports/purchase/po-cycle-time`
- `/api/v1/reports/purchase/vendor-performance`
- `/api/v1/reports/purchase/payable-aging`
- `/api/v1/reports/purchase/discount-leakage`

All read-only; share the standard `?from=&to=&format=json|csv|xlsx` contract.

### Cross-plan updates required

The following sibling plan files must be updated when this step is implemented (no extra plan file needed; just additions to existing ones):

1. **[02-models-migrations.md](./02-models-migrations.md)** \u2014 add a new app `purchase` listed after step 8 (`dispatch`) with the 17 tables from `docs/development_spec.md` Module 11, plus `purchase_amendments`, `purchase_approval_rules`, `vendor_scorecard_cache`. Models inherit `AuditModel`; `purchase_amendments.before_snapshot` + `after_snapshot` JSON.
2. **[04b-settings-api.md](./04b-settings-api.md)** \u2014
   - Extend `NumberingSeries.doc_type` enum with `vendor_code`, `pr_number`, `rfq_number`, `po_number`, `grn_number`, `vendor_invoice_internal_no`, `payment_number`, `return_number`, `debit_note_number`.
   - Add `PurchaseApprovalRule` CRUD endpoint set: `/api/v1/settings/purchase/approval-rules/` with rule preview.
   - Add `MatchToleranceConfig` singleton endpoint: `GET/PUT /api/v1/settings/purchase/match-tolerance/` (qty %, unit, price %, allow_negative_variance).
   - Add email templates: `rfq_invite`, `po_send`, `payment_advice`, `purchase_return_debit_note`.
3. **[04c-search-api.md](./04c-search-api.md)** \u2014 register searchable types `vendor`, `purchase_requisition`, `rfq`, `purchase_order`, `grn`, `vendor_invoice`, `vendor_payment`, `purchase_return` with the `SearchableMixin`. Add to RBAC filter chain.
4. **[11-documents-api.md](./11-documents-api.md)** \u2014 register attachment entity types: `vendor`, `purchase_requisition`, `purchase_order`, `grn`, `vendor_invoice`, `purchase_return`. Sensitivity defaults: vendor agreements = `confidential`; vendor invoice scans = `internal`; PO PDFs = `internal`; debit notes = `internal`.
5. **[12-reports-api.md](./12-reports-api.md)** \u2014 add the 7 purchase report endpoints listed above.
6. **[13-notifications-api.md](./13-notifications-api.md)** \u2014 register notification kinds:
   - `purchase.pr.pending_approval`
   - `purchase.po.pending_approval`
   - `purchase.po.sent`
   - `purchase.po.amendment_pending`
   - `purchase.grn.pending_qc`
   - `purchase.grn.posted`
   - `purchase.invoice.variance_detected`
   - `purchase.invoice.due_soon` (configurable lead-days)
   - `purchase.invoice.overdue`
   - `purchase.payment.cleared`
   - `purchase.payment.failed`
   - `purchase.vendor.blacklisted`
   - `purchase.return.dispatched`
7. **[14-postman-tests.md](./14-postman-tests.md)** \u2014 add `Purchase` folder with the chained scenario from this step plus negative cases (illegal state transitions, RBAC denials, tolerance edge-cases).
8. **[15-pytest-suite.md](./15-pytest-suite.md)** \u2014 add `apps/purchase` to coverage gates: \u2265 85 % overall, \u2265 90 % on `services/match.py`, `services/approval.py`, `services/grn_post.py`.

### RBAC \u2014 explicit permission codenames

Add to `auth_ext` permission seed (step 03):

- `purchase.vendor.*` (view, add, change, delete, view_bank_details, blacklist)
- `purchase.requisition.*` (view, add, change, approve, reject, cancel)
- `purchase.rfq.*` (view, add, send, award)
- `purchase.po.*` (view, add, change, approve, send, amend, cancel, view_pdf)
- `purchase.grn.*` (view, add, qc, post_to_stock, direct_receipt)
- `purchase.invoice.*` (view, add, change, match, approve, hold, dispute, override_match)
- `purchase.payment.*` (view, add, process, clear, refund)
- `purchase.return.*` (view, add, approve, dispatch)
- `purchase.report.*` (view)
- `purchase.settings.*` (view, change \u2014 approval rules + tolerance)

### Phase 3 (dynamic integration) cross-reference

Add to [../phase-3-dynamic-integration/03-modules-wiring.md](../phase-3-dynamic-integration/03-modules-wiring.md):

- Mock-to-API swap order for purchase: vendors \u2192 PR \u2192 RFQ \u2192 PO \u2192 GRN \u2192 invoices \u2192 payments \u2192 returns \u2192 dashboard.
- Replace `frontend/src/lib/api/purchase/*.ts` mock implementations with axios calls; keep mock fallback behind `VITE_USE_MOCKS=1`.
- Wire global search to `/api/v1/search/?type=vendor,purchase_order,vendor_invoice...`.
- E2E (Playwright) flows to add: end-to-end PR \u2192 PO \u2192 GRN \u2192 invoice \u2192 payment, RFQ comparison + award, 3-way match variance dialog.

### Tests (additional)

- PO amendment freeze + revision snapshot integrity.
- Award-split: per-vendor draft PO contains exact allocated lines and totals.
- Direct GRN: feature flag off \u2192 403; on \u2192 audit row written, ledger updated.
- Multi-currency: aggregate report converts via stored `exchange_rate` not live FX.
- Tax split: same-state vs cross-state PO produces correct CGST/SGST vs IGST split.
- TDS section validation against fixture of allowed sections.
- Aging endpoint bucket boundaries (29 days, 30 days, 31 days, 60 days, etc.) \u2014 table-driven.
- Scorecard cache freshness: cache stale \u2192 served + async refresh; cache fresh \u2192 served direct.
- Bulk endpoints: 207 partial-failure parity with inquiries / orders.
- Permission codename matrix \u2014 every endpoint hit by a user lacking the codename returns 403.

### Verification (additional)

- [ ] Models for `purchase_amendments`, `purchase_approval_rules`, `match_tolerance_config`, `vendor_scorecard_cache` registered in step 02.
- [ ] All 9 numbering series exposed by settings API.
- [ ] All 13 notification kinds registered + emit at the right hooks.
- [ ] Documents API accepts the 6 new entity types.
- [ ] Search API returns purchase types behind RBAC filtering.
- [ ] 7 purchase report endpoints listed in step 12.
- [ ] Postman + pytest folders cover Purchase folder; coverage gates met.
- [ ] Phase 3 wiring file lists purchase module swap order.
