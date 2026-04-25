# Step 11b — Client Portal API

> Before this: [11-documents-api.md](./11-documents-api.md)
> Spec: [docs/development_spec.md Module 8 Client Portal](../../docs/development_spec.md), [docs/ui_spec.md — Portal screens](../../docs/ui_spec.md)
> Frontend reference: `frontend/src/pages/Portal/*` + `frontend/src/mocks/portal*.ts` (Phase 1).

---

## Scope

Phase 1 ships a portal UI bound to mocks. This step exposes a **separate, narrowly-scoped** REST surface for external (customer) users that reuses the same data but hides internal fields and enforces row-level access via `client_users.organization_id → customer_id`.

Lives under `/api/v1/portal/` with its own JWT realm (separate token claims `aud=portal`).

---

## Auth

| Method | Path                                | Purpose                            |
| ------ | ----------------------------------- | ---------------------------------- |
| POST   | `/api/v1/portal/auth/login/`        | email + password → portal JWT      |
| POST   | `/api/v1/portal/auth/refresh/`      | refresh token rotation             |
| POST   | `/api/v1/portal/auth/forgot/`       | reset link via email               |
| POST   | `/api/v1/portal/auth/reset/`        | token + new password               |
| POST   | `/api/v1/portal/auth/logout/`       | blacklist refresh                  |
| GET    | `/api/v1/portal/me/`                | current portal user + organization |
| PATCH  | `/api/v1/portal/me/password`        | change password                    |

Portal tokens carry `aud=portal`; staff middleware rejects them and vice versa. `portal_access_logs` row written on every authenticated request (sampled per minute per user).

---

## Resource endpoints (read-mostly)

| Method | Path                                                  | Purpose                                |
| ------ | ----------------------------------------------------- | -------------------------------------- |
| GET    | `/api/v1/portal/orders/`                              | list orders for org                    |
| GET    | `/api/v1/portal/orders/:id`                           | detail (limited fields)                |
| GET    | `/api/v1/portal/orders/:id/timeline`                  | milestones + dispatch + install events |
| GET    | `/api/v1/portal/quotations/`                          | quotations sent to org (sent+ status)  |
| GET    | `/api/v1/portal/quotations/:id`                       | detail + PDF link                      |
| POST   | `/api/v1/portal/quotations/:id/approve`               | client approval (audited)              |
| POST   | `/api/v1/portal/quotations/:id/reject`                | with reason                            |
| GET    | `/api/v1/portal/dispatches/`                          | challans for org                       |
| GET    | `/api/v1/portal/dispatches/:id/track`                 | status + transporter + ETA             |
| GET    | `/api/v1/portal/jobs/`                                | installation jobs for org              |
| GET    | `/api/v1/portal/jobs/:id`                             | engineer name (no contact), schedule   |
| POST   | `/api/v1/portal/jobs/:id/feedback`                    | rating + comment                       |
| GET    | `/api/v1/portal/documents/`                           | filterable: type, project, date        |
| GET    | `/api/v1/portal/documents/:id/download`               | signed URL (15 min)                    |
| GET    | `/api/v1/portal/search?q=...`                         | global across orders/quotes/docs       |
| POST   | `/api/v1/portal/support-tickets/`                     | open ticket (text + attachment)        |
| GET    | `/api/v1/portal/support-tickets/`                     | own tickets list                       |
| GET    | `/api/v1/portal/notifications/`                       | portal-targeted notifications          |
| PATCH  | `/api/v1/portal/notifications/:id/read`               |                                        |

---

## Rules

- **Row scope:** every queryset filtered by `request.user.client_user.organization.customer_id` — enforced via a base `PortalScopedViewSet`. Never trust query params for org id.
- **Field scope:** dedicated portal serializers strip internal fields (margin, cost, internal notes, assigned_to, audit metadata). One serializer per resource — never reuse staff serializers.
- **Document visibility:** portal users see only documents whose `sensitivity = public` AND linked entity belongs to their org. `internal` and `confidential` always hidden.
- **Approve/reject quotations:** only allowed when `status in (sent, revised)` and within validity window; writes `quotation_approval_steps` row + status change + notification to owner.
- **Rate-limit auth endpoints:** 5/min/IP on login, 3/hour/email on forgot.
- **Audit:** every mutation logs to `portal_access_logs` with action, ip, user_agent.

---

## Tests

- Cross-tenant isolation: user A cannot list/fetch user B's org orders, quotes, docs, jobs (403/404).
- Portal token cannot access staff endpoints (`aud` mismatch → 401).
- Staff token cannot access portal endpoints.
- Document download: confidential doc 404 even with valid id; public doc returns signed URL.
- Quotation approve only valid in `sent`/`revised`; otherwise 409.
- Login lockout after 5 failed attempts in a minute.
- Search returns only own-org rows; injection-safe (parameterised).

---

## Postman

- Separate folder `Portal` with own env vars `{{portal_token}}`, `{{portal_org_id}}`.
- Smoke flow: login → list orders → view doc → approve quote → logout.

---

## Verification

- [ ] All endpoints filtered by org; attempted leak fixtures fail 100 % of negative tests.
- [ ] Portal serializers strip internal fields (snapshot test).
- [ ] Rate-limit middleware verified via repeated login attempts.
- [ ] Coverage ≥ 90 % (security-critical surface).
- [ ] Commit: `feat(api): client portal (auth + scoped resources)`.

---

**Next:** [12-reports-api.md](./12-reports-api.md)
