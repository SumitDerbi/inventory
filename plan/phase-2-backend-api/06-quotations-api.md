# Step 06 — Quotations API

> Before this: [05-inquiries-api.md](./05-inquiries-api.md)
> Spec: [docs/development_spec.md Module 2](../../docs/development_spec.md), [docs/project_details.md §2](../../docs/project_details.md)

---

## Endpoints

| Method | Path                                       | Purpose                                    |
| ------ | ------------------------------------------ | ------------------------------------------ |
| GET    | `/api/v1/quotations/`                      | list                                       |
| POST   | `/api/v1/quotations/`                      | create draft (optionally from inquiry_id)  |
| GET    | `/api/v1/quotations/:id`                   | detail (latest version)                    |
| PATCH  | `/api/v1/quotations/:id`                   | edit → auto new version if previously sent |
| POST   | `/api/v1/quotations/:id/versions`          | explicit new version                       |
| GET    | `/api/v1/quotations/:id/versions`          |                                            |
| GET    | `/api/v1/quotations/:id/versions/:ver`     |                                            |
| POST   | `/api/v1/quotations/:id/submit-approval`   | moves to pending_approval                  |
| POST   | `/api/v1/quotations/:id/approve`           | by approver                                |
| POST   | `/api/v1/quotations/:id/reject`            | with remark                                |
| POST   | `/api/v1/quotations/:id/send`              | email send + log                           |
| GET    | `/api/v1/quotations/:id/pdf`               | generated PDF binary                       |
| POST   | `/api/v1/quotations/:id/clone`             | duplicate                                  |
| POST   | `/api/v1/quotations/:id/convert-to-order`  |                                            |
| GET    | `/api/v1/quotations/:id/communications`    |                                            |
| CRUD   | `/api/v1/quotations/:id/items`             | line item ops                              |
| GET    | `/api/v1/terms-templates/`                 |                                            |
| GET    | `/api/v1/price-rules/`, `/discount-rules/` |                                            |

---

## Services

- **Pricing engine** (`apps.quotations.pricing.calculate`): takes items → applies price rule → discount rule → tax rule → freight; returns computed totals + tax breakup. Pure function, unit-tested independently.
- **Approval engine** (`apps.quotations.approvals`): configurable matrix (discount %, gross margin, order value). Returns required approver chain.
- **Version control**: editing a `sent`/`approved`/`converted` quote creates a new version via `QuotationVersion`; old versions read-only.
- **PDF generator**: `weasyprint` (or `reportlab`); template under `apps/quotations/templates/quotation.html`.
- **Expiry cron**: daily job marks quotations past `valid_until` as `expired`.

---

## Tests

- Pricing engine: parametrised tests over 10 scenarios (base, discount, bulk, margin floor, tax-exempt, freight, rounding).
- Approval chain: correct approvers returned for thresholds.
- Version bump triggers on post-sent edits.
- `convert-to-order` creates SO mirrored items; source quote → `converted` read-only.
- PDF generates non-empty, opens valid.

---

## Postman

- Folder `Quotations` end-to-end: create from inquiry → edit items → submit → approve → send → convert to order.

---

## Verification

- [ ] Pricing unit test matrix 100 % passing.
- [ ] Coverage ≥ 85 %.
- [ ] Postman chain green.
- [ ] Commit: `feat(api): quotations + pricing + approvals`.

---

**Next:** [07-orders-api.md](./07-orders-api.md)
