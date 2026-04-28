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
