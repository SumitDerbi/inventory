# Step 19 — Customer Invoices Module (Static UI)

> Before this: [18-client-portal.md](./18-client-portal.md)
> Spec: [docs/development_spec.md Module 5 Sales Order → Invoice](../../docs/development_spec.md), [docs/ui_spec.md §5](../../docs/ui_spec.md)
> Backend pair: extends [../phase-2-backend-api/07-orders-api.md](../phase-2-backend-api/07-orders-api.md) with a sibling `/api/v1/customer-invoices/` resource.

---

## Objective

Customer (sales) invoices currently live as a sub-tab inside `SalesOrderDetailPage`. This step **promotes the same data + same components** to a top-level module so accountants can list/filter across all customers without drilling into individual orders, while leaving the SO sub-tab intact. **The two views share one component set** — there is exactly one `CustomerInvoiceTable`, one `CustomerInvoiceDetail`, and one create/edit form. The standalone module is essentially a router + filter wrapper around the same primitives.

---

## Mocks

Edit `frontend/src/mocks/customer-invoices.ts` (existing) — promote helpers so the standalone list works:

- Ensure `CustomerInvoice` carries: id, invoice_number, customer_id, sales_order_id (nullable for direct invoices), invoice_date, due_date, place_of_supply, currency, line_items[], subtotal, discount, taxable_value, cgst, sgst, igst, freight, round_off, grand_total, paid_amount, balance, status (`draft | sent | partially_paid | paid | overdue | cancelled`), payment_terms, e_invoice_irn, e_way_bill, notes.
- Mix of 18 invoices across 8 customers covering every status. At least 4 are **direct invoices** (no `sales_order_id`) — service charges, AMC, spares walk-in.
- New helpers: `customerInvoicesAll()`, `customerInvoiceById`, `invoicesForCustomer(id)`, `invoicesForOrder(id)` (used by the SO sub-tab — returns the same rows), `outstandingForCustomer(id)`, `agingBuckets()` returning 0-30/31-60/61-90/90+ totals.

No new mock file is created — we extend the existing one used by the SO sub-tab.

---

## Shared components

Create / promote under `frontend/src/components/customer-invoices/`:

- `CustomerInvoiceTable.tsx` — column set, status badges, row actions (View, Send, Mark paid, Cancel, Download PDF). Accepts `rows` + optional `hideColumns?: ('customer'|'order')[]` so the SO sub-tab can hide the customer column.
- `CustomerInvoiceDetail.tsx` — full detail view: header card, line items, tax break-up, payment history, audit drawer. Accepts an `invoice` prop and is page-agnostic.
- `CustomerInvoiceForm.tsx` — create/edit form usable in two contexts:
  1. **From SO** — customer + order pre-filled and locked, line items inherited from SO.
  2. **Standalone direct invoice** — customer pickable, no order link, line items entered manually.
- `CustomerInvoiceFilterBar.tsx` — status, customer, date range, balance>0 toggle, search.
- `CustomerInvoiceKPIRow.tsx` — Outstanding · Overdue · Paid this month · Avg DSO. Used on both the standalone list and the SO sub-tab summary strip.

The SO sub-tab is refactored to import these components instead of inlining markup. Net effect: zero behavioural change in the SO view, plus a new top-level module that wraps the same components with a list page.

---

## Pages

Create under `frontend/src/pages/sales/invoices/`:

- `CustomerInvoiceListPage.tsx` (`/sales/invoices`)
  - Breadcrumb under "Sales".
  - Renders `CustomerInvoiceKPIRow` + `CustomerInvoiceFilterBar` + `CustomerInvoiceTable` (no `hideColumns`).
  - "+ New invoice" button opens `CustomerInvoiceForm` in standalone mode (customer picker + manual lines).
  - Bulk actions: Send (email PDF), Mark paid, Export, Cancel.

- `CustomerInvoiceDetailPage.tsx` (`/sales/invoices/:id`)
  - Renders `CustomerInvoiceDetail`. If the invoice has a `sales_order_id`, header shows a "View Sales Order" chip linking back to `/orders/:id`.

Sub-tab inside `SalesOrderDetailPage` is updated to:

```tsx
<CustomerInvoiceTable
  rows={invoicesForOrder(order.id)}
  hideColumns={['customer','order']}
/>
```

and a "+ New invoice" button that opens `CustomerInvoiceForm` in **from-SO** mode. Detail click in the SO sub-tab navigates to `/sales/invoices/:id` (the new standalone detail page) — single source of truth for invoice detail.

---

## Routing & nav wiring

- Add `Invoices` entry under Sales in the sidebar (between `Sales Orders` and `Customers`).
- Topbar `+ New` quick-create menu gains "Customer Invoice".
- `searchAll()` extended to scan `customer_invoices` (type label "Invoice" — distinguish from existing `vendor_invoice` typed as "Vendor Invoice").

---

## Cross-module wiring (mock only)

- SO `Raise Invoice` action in `SalesOrderDetailPage` opens the **same** `CustomerInvoiceForm` in from-SO mode. On save it (a) appends to the shared mock store and (b) refreshes both the SO sub-tab and the standalone list.
- Portal `PortalQuoteDetailPage` and `PortalOrderDetailPage` link to read-only invoice views via the same `CustomerInvoiceDetail` component wrapped in a portal-friendly shell.
- Reports module gets two extra cards (Outstanding receivables · Aging) wired off `agingBuckets()`.

---

## Verification

- [ ] One `CustomerInvoiceTable` component used in both the standalone list and the SO sub-tab; no duplicate markup.
- [ ] Standalone list filters work and update the table.
- [ ] Direct invoice (no SO) can be created and listed; status flows draft → sent → paid via row actions.
- [ ] SO sub-tab still shows only that order's invoices and hides the customer column.
- [ ] Detail page route shared across both entry points; URL is the canonical link in audit / search.
- [ ] Search returns customer invoices under "Invoice".
- [ ] Bundle: invoice components extracted into a shared chunk to avoid duplication.
- [ ] Commit: `feat(invoices): standalone customer-invoices module reusing SO sub-tab components`.

---

**Next:** [20-approvals-inbox.md](./20-approvals-inbox.md)
