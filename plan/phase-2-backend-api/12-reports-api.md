# Step 12 — Reports API (Read-only Aggregations)

> Before this: [11-documents-api.md](./11-documents-api.md)

---

## Endpoints

All `GET` only, under `/api/v1/reports/`:

| Path                               | Purpose                            |
| ---------------------------------- | ---------------------------------- |
| `inquiries/aging`                  | bucketed: 0-3, 4-7, 8-14, 15+ days |
| `inquiries/by-source`              | count + conversion %               |
| `inquiries/lost-reasons`           | grouped counts                     |
| `inquiries/funnel`                 | stages → counts + %                |
| `quotations/revision-frequency`    |                                    |
| `quotations/approval-tat`          | median / p90                       |
| `quotations/quote-to-order`        | ratio                              |
| `quotations/discount-leakage`      |                                    |
| `orders/open`                      |                                    |
| `orders/readiness-blockers`        |                                    |
| `orders/fulfilment-delay`          |                                    |
| `inventory/valuation`              |                                    |
| `inventory/fast-slow`              | by velocity                        |
| `inventory/shortage-forecast`      |                                    |
| `dispatch/on-time`                 | % + trend                          |
| `dispatch/transporter-performance` |                                    |
| `dispatch/pod-pending`             |                                    |
| `jobs/tat`                         | TAT per stage                      |
| `jobs/engineer-utilisation`        |                                    |
| `sales/monthly-revenue`            | + previous period comparison       |
| `sales/by-customer`                |                                    |
| `sales/by-territory`               |                                    |

---

## Rules

- Filters shared: `date_from`, `date_to`, `owner_id`, `territory`, `customer_id` where relevant.
- Heavy reports use raw SQL or DB views; cached 5 minutes via `cache_page`.
- Every report supports `?format=csv|xlsx|pdf` for export (generated on the fly, streamed).
- Export via `tablib` (csv/xlsx) and `weasyprint` (pdf) with standard templates.

---

## Tests

- Correctness tests per report using curated fixtures (expected counts).
- Export format tests: file starts with correct magic bytes.
- Filter parameter validation.

---

## Verification

- [ ] Every reporting requirement from spec has an endpoint.
- [ ] Coverage ≥ 80 % (aggregations can be lower due to SQL).
- [ ] Commit: `feat(api): reports + exports`.

---

**Next:** [13-notifications-api.md](./13-notifications-api.md)
