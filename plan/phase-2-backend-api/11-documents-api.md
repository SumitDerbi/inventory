# Step 11 — Documents API

> Before this: [10-jobs-api.md](./10-jobs-api.md)
> Spec: [docs/project_details.md §7 Documents](../../docs/project_details.md)

---

## Endpoints

| Method | Path                             | Purpose                       |
| ------ | -------------------------------- | ----------------------------- |
| GET    | `/api/v1/documents/`             | list with filters             |
| POST   | `/api/v1/documents/`             | multipart upload              |
| GET    | `/api/v1/documents/:id`          | metadata + latest version url |
| PATCH  | `/api/v1/documents/:id`          | rename / retag                |
| DELETE | `/api/v1/documents/:id`          | soft delete                   |
| GET    | `/api/v1/documents/:id/versions` |                               |
| POST   | `/api/v1/documents/:id/versions` | upload new version            |
| GET    | `/api/v1/documents/:id/download` | signed URL (15 min)           |
| POST   | `/api/v1/documents/:id/share`    | generate share link           |
| CRUD   | `/api/v1/documents/:id/access`   | per-role / per-user access    |

---

## Rules

- Signed URLs use short-TTL HMAC tokens; verified by download view.
- Access control: visibility inherited from linked entity; per-doc overrides allowed.
- Virus scan hook (stub in dev, ClamAV in prod).
- Allowed mime types whitelist; max 25 MB default, configurable per type.

---

## Tests

- Upload → retrieve → new version → old version fetchable.
- Access denial for unauthorised user.
- Signed URL expires; tampered token 403.
- Share link revocation.

---

## Postman

- Folder `Documents`: upload → share → download.

---

## Verification

- [ ] Coverage ≥ 85 %.
- [ ] Commit: `feat(api): documents + versions + access`.

---

**Next:** [12-reports-api.md](./12-reports-api.md)
