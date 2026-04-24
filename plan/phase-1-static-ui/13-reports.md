# Step 13 — Reports & Analytics (Static UI)

> Before this: [12-documents.md](./12-documents.md)
> Spec: reporting requirements in [docs/project_details.md](../../docs/project_details.md) (per module) + [docs/development_spec.md](../../docs/development_spec.md)

---

## Objective

Reports hub with filterable, exportable reports per module.

---

## Sub-screens

1. **Reports Hub** — `/reports`
   - Card grid grouped by module: Inquiries (Aging, Source-wise, Lost reasons, Conversion funnel), Quotations (Revision, Approval TAT, Quote-to-Order, Discount leakage), Orders (Open, Readiness blockers, Fulfilment delay), Inventory (Valuation, Fast/Slow, Shortage), Dispatch (On-time %, Transporter performance, Partial trends, POD pending), Jobs (Completion TAT, Engineer utilisation), Sales (Monthly revenue, Customer-wise, Territory-wise).
2. **Report Viewer** — `/reports/:slug`
   - Filter bar specific to report (date range, dimensions).
   - Chart (Recharts) + table combo.
   - Export menu: CSV, Excel, PDF (UI only → toast).
3. **Saved views** — user can save filter combos with a name (stored in `localStorage` for now).

---

## Mock data

- `src/mocks/reports/*.js` — one file per report.

---

## Verification

- [ ] Every reporting requirement from spec has a card on the hub.
- [ ] Each report has working client-side filters on mock data.
- [ ] Chart + table reconcile (same underlying data).
- [ ] Export options present on every report.
- [ ] Commit: `feat(ui): reports module static`.

---

**Next:** [14-admin.md](./14-admin.md)
