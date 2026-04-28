# Core — API Contract

This package owns conventions every domain app inherits.

## JSON shape

| Concern         | Rule                                                                              |
| --------------- | --------------------------------------------------------------------------------- |
| Keys            | **`snake_case`** end-to-end. Frontend converts at the client boundary.            |
| Datetimes       | ISO 8601 UTC with `Z` suffix.                                                     |
| Dates           | `YYYY-MM-DD`.                                                                     |
| Money           | String decimal, two places (e.g. `"125000.00"`). Never float.                     |
| Nullable FKs    | Always present in response with `null`. Never omitted.                            |
| Nested includes | Opt-in via `?include=items,activity,attachments`. Never auto-expanded.            |

## Pagination

Standard DRF envelope:

```json
{
  "count": 123,
  "next": "https://.../?page=2",
  "previous": null,
  "results": [...]
}
```

Defaults: `page_size=20`, max `100` via `?page_size=`. See
[`pagination.py`](pagination.py).

## Errors

| HTTP | Meaning              | Body shape                                                |
| ---- | -------------------- | --------------------------------------------------------- |
| 400  | Validation failure   | `{ "field_name": ["error msg", ...] }`                    |
| 401  | Auth required        | `{ "detail": "Authentication credentials were not..." }`  |
| 403  | Permission denied    | `{ "detail": "You do not have permission..." }`           |
| 404  | Not found            | `{ "detail": "Not found." }`                              |
| 409  | Conflict             | `{ "detail": "...", "code": "..." }`                      |
| 422  | Business rule        | `{ "detail": "...", "code": "..." }`                      |

## Audit & soft-delete

Every domain model inherits `AuditModel` (see [`models.py`](models.py)):

* `created_at`, `updated_at` — `auto_now_add` / `auto_now`.
* `created_by`, `updated_by` — set by `AuditModelViewSet` from `request.user`.
* `is_deleted`, `deleted_at` — flipped on `DELETE` via `soft_delete()`.

The default manager hides soft-deleted rows. Use `Model.all_objects` to
see them (admin / data tools).

## Permissions

* `IsAuthenticatedActive` — authenticated and `is_active=True`.
* `HasRole('admin', 'sales_manager')` — pass if any role matches.
* `HasModulePermission` — checks `user.profile.permissions[module][action]`
  once `apps.auth_ext` is wired (step 03).

## Exports

Mix in `ListExportMixin` (already inherited via `AuditModelViewSet`) and
declare `export_columns`:

```python
class InquiryViewSet(AuditModelViewSet):
    export_columns = [
        ("number",          "Number"),
        ("company_name",    "Company"),
        ("status",          "Status"),
        ("created_at",      "Created"),
    ]
```

Then any list URL accepts `?format=csv`, `?format=xlsx`, or
`?format=pdf` (PDF returns 501 until weasyprint is wired). `?ids=a,b,c`
or a POST body `ids[]` scopes to a selection — used by bulk-action
toolbars on the frontend.

## URL layout

* `/api/auth/...`            — staff JWT endpoints.
* `/api/v1/<module>/...`     — staff resource endpoints.
* `/api/v1/portal/...`       — portal realm (separate JWT audience).
* `/api/schema/`, `/api/docs/`, `/api/redoc/` — OpenAPI surfaces.
