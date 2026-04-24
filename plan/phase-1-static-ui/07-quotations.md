# Step 07 — Quotation Module (Static UI)

> Before this: [06-inquiries.md](./06-inquiries.md)
> Spec: [docs/development_spec.md Module 2](../../docs/development_spec.md), [docs/project_details.md §2](../../docs/project_details.md), ui in [docs/ui_spec.md](../../docs/ui_spec.md)

---

## Objective

Static UI for quotation list, multi-version editor, pricing engine preview, approval workflow, PDF preview, send-email dialog.

---

## Sub-screens

1. **Quotation List** — `/quotations`
   - Columns: Quote #, Date, Customer, Project, Version, Total, Status, Validity, Owner, Actions.
   - Filters: status, date range, customer, owner, amount range.
2. **Quotation Detail / Editor** — `/quotations/:id`
   - Header: quote # + version dropdown (all versions), status badge, actions (Edit → new version, Send, Download PDF, Approve, Reject, Convert to Order, Clone).
   - Tabs: `Line Items`, `Commercials`, `Terms & Conditions`, `Approvals`, `Communications`, `Versions`.
   - **Line Items tab**:
     - Product picker via shadcn `Command` (search by name/SKU).
     - Row: product, spec, qty, UoM, list price, discount %, net price, tax, total.
     - Auto-calc totals footer; grand total with tax breakup.
   - **Commercials tab**: freight, installation charge, payment terms dropdown, validity date, delivery period, warranty.
   - **Terms tab**: selectable template + rich-text editor (read-only textarea placeholder now).
   - **Approvals tab**: step list with approver, status, action buttons (Approve/Reject with remark).
   - **Communications tab**: sent emails, customer acknowledgements, revision requests.
   - **Versions tab**: list of versions with diff summary (count of item/price changes).
3. **Create new version** — cloning preserves history; editing a sent quote auto-triggers version bump dialog.
4. **Send via email dialog** — to/cc/bcc, subject, body (template fill-in), attach PDF toggle.
5. **PDF preview drawer** — iframe placeholder with print-like layout.

---

## Mock data

- `src/mocks/quotations.js` with ≥ 20 quotations, mixed statuses, 2–3 versions each where applicable.
- `src/mocks/products.js` (≥ 40 rows) shared with Inventory module.
- `src/mocks/termsTemplates.js`.

---

## Verification

- [ ] Totals recompute live as qty/discount/tax changes.
- [ ] Version dropdown switches view; old versions read-only.
- [ ] Editing a sent quote prompts version-bump.
- [ ] Approval chain displays sequential steps with correct gating.
- [ ] PDF preview renders with company header, grouped items, totals, terms.
- [ ] Status badges: Draft, Pending Approval, Approved, Sent, Converted, Expired — all colored per spec.
- [ ] Expired quotations shown with distinct style.
- [ ] Commit: `feat(ui): quotation module static`.

---

**Next:** [08-sales-orders.md](./08-sales-orders.md)
