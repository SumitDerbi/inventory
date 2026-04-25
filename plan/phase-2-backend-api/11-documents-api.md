# Step 11 — Documents, Invoices, Certificates & Serial Registry API

> Before this: [10-jobs-api.md](./10-jobs-api.md)
> Spec: [docs/project_details.md §7 Documents](../../docs/project_details.md), [docs/development_spec.md Module 7](../../docs/development_spec.md)

---

## Documents — endpoints

| Method | Path                             | Purpose                       |
| ------ | -------------------------------- | ----------------------------- |
| GET    | `/api/v1/documents/`             | list with filters             |
| POST   | `/api/v1/documents/`             | multipart upload              |
| GET    | `/api/v1/documents/:id`          | metadata + latest version url |
| PATCH  | `/api/v1/documents/:id`          | rename / retag / re-classify  |
| DELETE | `/api/v1/documents/:id`          | soft delete                   |
| GET    | `/api/v1/documents/:id/versions` |                               |
| POST   | `/api/v1/documents/:id/versions` | upload new version            |
| GET    | `/api/v1/documents/:id/download` | signed URL (15 min)           |
| POST   | `/api/v1/documents/:id/share`    | generate share link           |
| CRUD   | `/api/v1/documents/:id/access`   | per-role / per-user access    |

### Filters

`type`, `category`, `entity_type`, `entity_id`, `sensitivity`, `uploaded_by`, `date_from/to`, `q` (filename + tags).

---

## Invoices — endpoints

| Method | Path                                  | Purpose                                |
| ------ | ------------------------------------- | -------------------------------------- |
| GET    | `/api/v1/invoices/`                   | list + filters                         |
| POST   | `/api/v1/invoices/`                   | create header (links to order)         |
| GET    | `/api/v1/invoices/:id`                | detail + items + computed totals       |
| PATCH  | `/api/v1/invoices/:id`                | header edits while `draft`             |
| DELETE | `/api/v1/invoices/:id`                | only when `draft`                      |
| CRUD   | `/api/v1/invoices/:id/items/`         | line items (qty, rate, tax, discount)  |
| POST   | `/api/v1/invoices/:id/finalise`       | locks invoice, assigns number          |
| POST   | `/api/v1/invoices/:id/cancel`         | with reason + audit                    |
| POST   | `/api/v1/invoices/:id/upload-scan`    | attach signed PDF (multipart)          |
| GET    | `/api/v1/invoices/:id/pdf`            | server-generated PDF (weasyprint)      |
| POST   | `/api/v1/invoices/:id/email`          | send PDF to customer billing email     |

### Rules

- Numbering via `NumberingSeries(doc_type=invoice)` on finalise.
- Totals computed server-side: subtotal, discount, taxable, CGST/SGST/IGST split per item, round-off, grand total. Client-supplied totals validated, never trusted.
- Once `finalised`, only `cancel` is allowed; cancellation creates a credit-note linked record.
- PDF template at `templates/invoice.html`; company profile + bank details from `settings/company`.

---

## Serial Number Registry — endpoints

| Method | Path                                       | Purpose                                  |
| ------ | ------------------------------------------ | ---------------------------------------- |
| GET    | `/api/v1/serial-numbers/`                  | list + filter by product, status, owner  |
| POST   | `/api/v1/serial-numbers/`                  | bulk create on inward                    |
| GET    | `/api/v1/serial-numbers/:serial`           | detail (current state)                   |
| PATCH  | `/api/v1/serial-numbers/:serial`           | warranty dates / notes                   |
| GET    | `/api/v1/serial-numbers/:serial/trace`     | full chain → inward, order, dispatch, install, certs, current owner |

### Trace response shape

```jsonc
{
  "serial": "PN-2024-00342",
  "product": { "id": 12, "sku": "...", "name": "..." },
  "events": [
    { "kind": "inward",   "at": "...", "ref": "GRN/...",        "warehouse": "..." },
    { "kind": "reserve",  "at": "...", "ref": "SO-...",         "qty": 1 },
    { "kind": "dispatch", "at": "...", "ref": "CH-...",         "transporter": "..." },
    { "kind": "install",  "at": "...", "ref": "JOB-...",        "engineer": "..." },
    { "kind": "certify",  "at": "...", "ref": "CERT-..."                          }
  ],
  "current_owner": { "type": "customer", "id": 87, "name": "..." },
  "warranty": { "start": "...", "end": "...", "status": "active" }
}
```

---

## Certificates — endpoints

| Method | Path                                           | Purpose                          |
| ------ | ---------------------------------------------- | -------------------------------- |
| CRUD   | `/api/v1/certificates/templates/`              | admin manages templates          |
| POST   | `/api/v1/certificates/`                        | generate from template + context |
| GET    | `/api/v1/certificates/:id`                     | metadata                         |
| GET    | `/api/v1/certificates/:id/pdf`                 | rendered PDF (signed URL)        |

Generation pulls signature image from settings; serial(s) auto-linked.

---

## Rules

- Signed URLs use short-TTL HMAC tokens; verified by download view.
- **Sensitivity enforcement** (model field added in step 02):
  - Filtering applied at queryset level via `DocumentAccessMixin.get_queryset()` based on actor role + per-doc `document_access` overrides.
  - Default matrix: `public` → all auth users; `internal` → staff except external auditors; `confidential` → admin/finance_head/sales_head + explicit grants.
  - Portal users (step 11b) only ever see `public` documents linked to their org.
- Access control: visibility inherited from linked entity AND respects sensitivity AND respects per-doc overrides (most restrictive wins).
- Virus scan hook (stub in dev, ClamAV in prod).
- Allowed mime types whitelist; max 25 MB default, configurable per type.
- Invoice PDF generation is the **same template** as the uploaded scan slot; uploaded scans take precedence in `download` endpoint when present.

---

## Tests

- Upload → retrieve → new version → old version fetchable.
- Sensitivity matrix: parametrised test for (role × sensitivity) → expected 200/403.
- Access denial for unauthorised user; per-user override grants access.
- Signed URL expires; tampered token 403.
- Share link revocation.
- Invoice: draft edit → finalise → numbered → cancel → status correct; finalised PATCH → 409.
- Invoice totals: server recomputes and ignores client-supplied totals (snapshot comparison).
- Invoice PDF generation byte-stream non-empty + correct mime.
- Serial trace returns events in chronological order; missing events omitted not faked.

---

## Postman

- Folder `Documents`: upload → share → download → access override.
- Folder `Invoices`: create draft → add items → finalise → pdf → email → cancel.
- Folder `Serials`: bulk create → trace.
- Folder `Certificates`: create template → generate → pdf.

---

## Verification

- [ ] Coverage ≥ 85 % on documents, invoices, serials, certificates apps.
- [ ] Sensitivity enforcement test matrix passes 100 %.
- [ ] Invoice number generated atomically; concurrent finalise test passes.
- [ ] Commit per surface: `feat(api): documents + sensitivity`, `feat(api): invoices + pdf`, `feat(api): serials + trace`, `feat(api): certificates`.

---

**Next:** [11b-client-portal-api.md](./11b-client-portal-api.md)
