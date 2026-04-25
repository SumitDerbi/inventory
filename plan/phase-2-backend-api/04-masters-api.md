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
- Nested: `GET /api/v1/customers/:id/contacts`, `GET /api/v1/customers/:id/addresses`.
- Validation: mobile regex, GST regex, PAN regex.
- Dedupe hint: POST returns 200 with `matches[]` if potential dup on mobile/email/GST (client decides).

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
- Attachment upload: valid mime types only (whitelist), max 25 MB, version bumping works.
- Soft delete: deleted rows hidden from list but fetchable via `?include_deleted=true` (admin only).

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
