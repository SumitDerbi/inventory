# Step 12 — Reports API (Read-only Aggregations + Saved & Scheduled)

> Before this: [11b-client-portal-api.md](./11b-client-portal-api.md)

---

## Aggregation endpoints

All `GET` only, under `/api/v1/reports/`. Path matches the **frontend slug** used by `frontend/src/mocks/reports.ts` so Phase 3 swap is a config-only change.

| Slug (frontend)               | Path                               | Purpose                            |
| ----------------------------- | ---------------------------------- | ---------------------------------- |
| `inquiry-aging`               | `inquiries/aging`                  | bucketed: 0-3, 4-7, 8-14, 15+ days |
| `inquiry-by-source`           | `inquiries/by-source`              | count + conversion %               |
| `inquiry-lost-reasons`        | `inquiries/lost-reasons`           | grouped counts                     |
| `inquiry-funnel`              | `inquiries/funnel`                 | stages → counts + %                |
| `quotation-revision`          | `quotations/revision-frequency`    |                                    |
| `quotation-approval-tat`      | `quotations/approval-tat`          | median / p90                       |
| `quote-to-order`              | `quotations/quote-to-order`        | ratio                              |
| `discount-leakage`            | `quotations/discount-leakage`      |                                    |
| `orders-open`                 | `orders/open`                      |                                    |
| `orders-readiness`            | `orders/readiness-blockers`        |                                    |
| `orders-fulfilment-delay`     | `orders/fulfilment-delay`          |                                    |
| `inventory-valuation`         | `inventory/valuation`              |                                    |
| `inventory-fast-slow`         | `inventory/fast-slow`              | by velocity                        |
| `inventory-shortage`          | `inventory/shortage-forecast`      |                                    |
| `dispatch-on-time`            | `dispatch/on-time`                 | % + trend                          |
| `dispatch-transporter`        | `dispatch/transporter-performance` |                                    |
| `dispatch-pod-pending`        | `dispatch/pod-pending`             |                                    |
| `jobs-tat`                    | `jobs/tat`                         | TAT per stage                      |
| `engineer-utilisation`        | `jobs/engineer-utilisation`        |                                    |
| `sales-monthly-revenue`       | `sales/monthly-revenue`            | + previous period comparison       |
| `sales-by-customer`           | `sales/by-customer`                |                                    |
| `sales-by-territory`          | `sales/by-territory`               |                                    |

The slug ↔ path map lives in `apps/reports/registry.py` and is the single source of truth used by the API, Postman tests, and the frontend resolver.

---

## Saved reports — endpoints

| Method | Path                                       | Purpose                                |
| ------ | ------------------------------------------ | -------------------------------------- |
| GET    | `/api/v1/reports/saved/`                   | list user's saved + shared reports     |
| POST   | `/api/v1/reports/saved/`                   | save: `{ slug, name, filters, share }` |
| GET    | `/api/v1/reports/saved/:id`                | run + return rows (uses stored filters)|
| PATCH  | `/api/v1/reports/saved/:id`                | rename / update filters / share        |
| DELETE | `/api/v1/reports/saved/:id`                | owner only                             |

Sharing: `share` enum `private | team | role:<role_slug>`; row-level read scope enforced.

---

## Scheduled reports — endpoints

| Method | Path                                       | Purpose                                          |
| ------ | ------------------------------------------ | ------------------------------------------------ |
| GET    | `/api/v1/reports/scheduled/`               | list                                             |
| POST   | `/api/v1/reports/scheduled/`               | create: saved_report_id, cron, recipients, format|
| GET    | `/api/v1/reports/scheduled/:id`            | detail + last 5 runs                             |
| PATCH  | `/api/v1/reports/scheduled/:id`            | toggle active, edit cron / recipients            |
| DELETE | `/api/v1/reports/scheduled/:id`            |                                                  |
| POST   | `/api/v1/reports/scheduled/:id/run-now`    | force-run; appends to history                    |

Cron validated via `croniter`; `next_run_at` recomputed on save. Background runner in step 13 (`scheduled_reports_dispatch`).

---

## Rules

- Filters shared: `date_from`, `date_to`, `owner_id`, `territory`, `customer_id` where relevant. Defaults match frontend mocks (e.g. last 6 months for revenue, last 30 days for funnel).
- Heavy reports use raw SQL or DB views; cached 5 minutes via `cache_page` keyed by user + filter hash.
- Every aggregation endpoint supports `?format=csv|xlsx|pdf` for export (generated on the fly, streamed).
- Export via `tablib` (csv/xlsx) and `weasyprint` (pdf) with standard templates.
- Saved-report `run` honours the saved filter snapshot; passing extra query params merges over the snapshot.
- Scheduled-report dispatch attaches PDF for ≤ 1 MB, link otherwise; recipient list validated against active users.

---

## Tests

- Slug registry: every frontend slug in `frontend/src/mocks/reports.ts` resolves to a registered path (snapshot test loads the mock file via fixtures).
- Correctness tests per aggregation using curated fixtures (expected counts).
- Export format tests: file starts with correct magic bytes.
- Filter parameter validation + defaults applied.
- Saved-report share scope: private invisible to others; team visible to same team_id; role-share visible only to that role.
- Scheduled-report cron validation rejects malformed expressions; `next_run_at` advances correctly across DST.
- `run-now` produces a run-history row regardless of cron schedule.

---

## Verification

- [ ] Every reporting requirement from spec has an endpoint.
- [ ] Slug ↔ path map snapshot test green.
- [ ] Coverage ≥ 80 % (aggregations can be lower due to SQL).
- [ ] Commit: `feat(api): reports + saved + scheduled + exports`.

---

**Next:** [13-notifications-api.md](./13-notifications-api.md)
