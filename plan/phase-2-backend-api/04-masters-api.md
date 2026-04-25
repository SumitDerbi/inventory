# Step 04 — Shared Masters API

> Before this: [03-auth-api.md](./03-auth-api.md)

Resources: `customers`, `contacts`, `addresses`, `tax_rules`, `inquiry_sources`, `product_categories`, `brands`, `uom`, `attachments`, `notifications` (list/read only for user).

---

## Endpoints pattern (each resource)

```
GET    /api/v1/<resource>/           list + filter + search + order + paginate
POST   /api/v1/<resource>/           create
GET    /api/v1/<resource>/:id        retrieve
PATCH  /api/v1/<resource>/:id        partial update
DELETE /api/v1/<resource>/:id        soft delete
```

### Customers — extras

- `GET /api/v1/customers/search?q=...` — dedupe lookup by mobile / email / GST.
- `GET /api/v1/customers/find-duplicates?mobile=&email=&gst=` — on-blur form probe; returns `{ matches: [...] }` with score per criterion. Used by the create form for inline dedupe.
- Nested detail tabs (each filtered to the customer):
  - `GET /api/v1/customers/:id/contacts`
  - `GET /api/v1/customers/:id/addresses`
  - `GET /api/v1/customers/:id/orders` — sales orders summary
  - `GET /api/v1/customers/:id/quotations`
  - `GET /api/v1/customers/:id/documents`
  - `GET /api/v1/customers/:id/activity` — cross-module timeline
- Validation: mobile regex, GST regex, PAN regex.
- Dedupe hint: POST returns 200 with `matches[]` if potential dup on mobile/email/GST (client decides).

### Customers — merge flow

Driven by the Phase 1 merge wizard ([phase-1-static-ui/16-ui-gap-closure.md §16.5](../phase-1-static-ui/16-ui-gap-closure.md)).

| Method | Path                                          | Purpose                                                  |
| ------ | --------------------------------------------- | -------------------------------------------------------- |
| POST   | `/api/v1/customers/:id/merge-preview`         | dry-run — returns conflicting fields and impact counts  |
| POST   | `/api/v1/customers/:id/merge`                 | perform merge into `target_id` with field choices        |

Request body for merge:

```jsonc
{
  "target_id": "cust_123",
  "field_choices": {
    "name": "target",
    "gst_number": "source",
    "addresses": "both",     // multi-value fields can union
    "contacts": "both"
  }
}
```

Response: `{ merged_into: "cust_123", moved: { inquiries, quotations, orders, jobs, documents, attachments } }`.

#### Merge rules

- Source customer becomes `status=merged`, `merged_into_id=target.id`; never deleted (referential integrity for audit).
- All FK references on `inquiries`, `quotations`, `sales_orders`, `dispatch_challans`, `installation_jobs`, `documents`, `attachments`, `contacts`, `addresses` are reassigned in a single DB transaction.
- Wraps in `select_for_update` on both rows to prevent concurrent merges.
- Rejects if either side has `status=merged` already (chained merges → 409).
- Writes one `audit_logs` row per affected table with summary counts.
- Notification kind `system` to admin role on success.
- Idempotent on retry via merge-preview hash (returned in preview, required in merge body); mismatched hash → 409 (data changed, re-preview).

### Attachments — polymorphic

- `POST /api/v1/attachments/` multipart: `entity_type`, `entity_id`, file, optional `version`, `notes`.
- Validates `entity_type` whitelist; checks user has permission on that entity.
- Versioning: auto-bump `version`, set `is_latest=true`, previous latest → false.
- `GET /api/v1/attachments/?entity_type=inquiry&entity_id=42` filtered list.
- Storage: local `/media/` in dev, pluggable backend for S3 / cPanel in prod.

### Notifications

- Read-only for the user; `PATCH /api/v1/notifications/:id/read` marks read; `POST /api/v1/notifications/mark-all-read`.

---

## Tests

- Full CRUD happy paths per resource.
- Validation errors (bad mobile, bad GST) → 400 with field-scoped errors.
- Dedupe search returns multiple match criteria.
- `find-duplicates` matches by phone, email, GST independently and combined.
- Attachment upload: valid mime types only (whitelist), max 25 MB, version bumping works.
- Soft delete: deleted rows hidden from list but fetchable via `?include_deleted=true` (admin only).
- Customer detail tabs each return scoped data (orders/quotations/documents/activity) for that customer only.
- Merge: preview lists conflicts; merge moves all FK references; source row → `status=merged`, `merged_into_id` set.
- Merge: hash mismatch → 409 (data changed mid-flow).
- Merge: chained merge attempt rejected.
- Merge: concurrent merge attempts on same source — only one succeeds (`select_for_update`).

---

## Postman

- One folder per resource, each with List / Create / Retrieve / Update / Delete + extras.
- Env chain: `{{customer_id}}`, `{{attachment_id}}`.

---

## Verification

- [ ] Coverage ≥ 85 % on each app.
- [ ] Postman folders all green.
- [ ] Attachment upload works end-to-end against local storage; files saved under `/media/attachments/<entity_type>/<entity_id>/`.
- [ ] Commit per resource: `feat(api): <resource> crud + tests`.

---

**Next:** [04b-settings-api.md](./04b-settings-api.md)
