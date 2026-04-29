# Step 04b — Settings & Admin Config API

> Before this: [04-masters-api.md](./04-masters-api.md)
> Spec: [docs/development_spec.md — Admin Settings](../../docs/development_spec.md), [docs/ui_spec.md — Admin screens](../../docs/ui_spec.md)
> Frontend reference: `frontend/src/mocks/admin*.ts` + `pages/Admin/*` (Phase 1).

---

## Scope

The Phase 1 admin UI already binds to settings shapes (company profile, numbering series, tax rules, payment terms, integrations, notification channels, email templates). This step exposes those as REST endpoints so Phase 3 integration can swap mocks for real data without UI churn.

All endpoints are gated by `module=settings, action=manage` permission (admin role only).

---

## Resources & endpoints

| Method | Path                                             | Purpose                              |
| ------ | ------------------------------------------------ | ------------------------------------ |
| GET    | `/api/v1/settings/company/`                      | singleton company profile            |
| PUT    | `/api/v1/settings/company/`                      | update profile + logo (multipart)    |
| CRUD   | `/api/v1/settings/numbering-series/`             | one row per doc type                 |
| POST   | `/api/v1/settings/numbering-series/:id/preview`  | return next 3 numbers given config   |
| CRUD   | `/api/v1/settings/tax-rules/`                    | proxy to `tax_rules` w/ admin gate   |
| CRUD   | `/api/v1/settings/payment-terms/`                | named terms (Net 30, 50/50, etc.)    |
| CRUD   | `/api/v1/settings/integrations/`                 | SMTP, WhatsApp, SMS, S3 credentials  |
| POST   | `/api/v1/settings/integrations/:id/test`         | send test event; returns success/log |
| CRUD   | `/api/v1/settings/notification-channels/`        | per-kind opt-in defaults             |
| CRUD   | `/api/v1/settings/email-templates/`              | template CRUD                        |
| POST   | `/api/v1/settings/email-templates/:id/preview`   | render with sample context           |
| POST   | `/api/v1/settings/email-templates/:id/send-test` | send to current user's email         |

### Approvals inbox (cross-module aggregator)

Powers [Phase 1 step 20 — Approvals inbox](../phase-1-static-ui/20-approvals-inbox.md). Reads from each module's existing approval rows; no new approval store.

| Method | Path                                       | Purpose                                                        |
| ------ | ------------------------------------------ | -------------------------------------------------------------- |
| GET    | `/api/v1/approvals/inbox/`                 | pending requests where next level matches caller's role/user   |
| GET    | `/api/v1/approvals/history/`               | caller's last-90-days approve/reject actions                   |
| GET    | `/api/v1/approvals/kpis/`                  | counts by kind + SLA bucket + total value pending              |
| POST   | `/api/v1/approvals/:kind/:id/approve`      | `{ comment? }` — flips the entity's approval array entry       |
| POST   | `/api/v1/approvals/:kind/:id/reject`       | `{ reason }`                                                   |
| POST   | `/api/v1/approvals/bulk-approve`           | `{ kind, ids[], comment? }` — same-kind only; 207 on partial   |
| POST   | `/api/v1/approvals/bulk-reject`            | `{ kind, ids[], reason }`                                      |

`kind` enum: `quotation | so_amendment | pr | po | vendor_invoice | purchase_return`. Each handler delegates to the owning app's existing approve/reject service (no logic duplication). SLA buckets derived from `submitted_at` + each kind's configured SLA hours (defaults: 24 h normal / 4 h high priority).

---

## Models (added in step 02)

Add to `apps/core/models.py`:

- `CompanyProfile` (singleton; `get_solo()` pattern via `django-solo` or guarded save)
  - name, legal_name, gst_number, pan, cin, address (FK), phone, email, website, logo (file), invoice_footer (text), bank_details (JSON).
- `NumberingSeries`
  - doc_type (enum: inquiry, quotation, sales_order, dispatch_challan, invoice, service_report, certificate, job)
  - prefix, fy_reset (bool), pad_width (int), separator (default `/`), pattern (e.g. `{prefix}/{fy}/{seq:05}`), current_seq (int), current_fy (str), is_active.
  - Unique on (doc_type, current_fy).
- `PaymentTerm` — name, days, milestone_split (JSON `[{label, pct, days}]`), is_active.
- `Integration` — kind (enum: smtp, whatsapp, sms, s3, payment_gateway), name, config (JSON, secrets encrypted), is_active, last_tested_at, last_test_status.
- `NotificationChannelDefault` — kind (matches notification kinds), in_app, email, whatsapp, sms (booleans).
- `EmailTemplate` — slug (unique), subject, body_html, body_text, variables (JSON list of placeholders), is_active.

Default seed fixtures cover the 8 numbering series, 5 email templates from mocks, and 7 notification channel defaults.

---

## Rules

- **Numbering preview** uses the same atomic generator as production but rolls back; never increments `current_seq`.
- Integration secrets never returned in GET; mask as `••••••••` last 4 chars only.
- Email template variables validated server-side: rendering with sample context must not raise undefined-variable error.
- All mutations write `audit_logs` with `module=settings`, before/after diff (secrets redacted).
- `notification-channels` table seeds the per-user opt-in defaults exposed in `/api/v1/notifications/preferences` (step 13).

---

## Tests

- Company profile GET/PUT roundtrip; logo upload size limit.
- Numbering preview with `{fy}`, `{seq:N}`, custom separator → 3 sequential strings, `current_seq` unchanged.
- FY reset: changing `current_fy` resets `current_seq` to 0 atomically.
- Integration `test` endpoint: SMTP success/fail recorded; secrets masked in response.
- Email template render with missing variable → 400 with placeholder list.
- Send-test email lands in `mail.outbox` (test backend).
- Non-admin user → 403 on every endpoint.

---

## Postman

- Folder `Settings`: company → numbering preview → email template preview → send-test → integration test.

---

## Verification

- [x] All 8 doc types have a default `NumberingSeries` row in seed fixture.
- [x] All 5 email templates from `frontend/src/mocks/admin-emails.ts` (or equivalent) seeded.
- [x] Coverage ≥ 85 %.
- [x] Commit: `feat(api): settings + numbering + email templates + integrations`.

---

**Next:** [04c-search-api.md](./04c-search-api.md)
