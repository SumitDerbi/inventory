# Step 01 — Django Project Setup & Conventions

> Before this: [00-overview.md](./00-overview.md)

---

## Objective

Bootstrap Django project with MySQL (pymysql), DRF, JWT, drf-spectacular, pytest, and project conventions.

---

## Status

✅ **Completed** — committed `0c27208` (`chore(api): bootstrap django + drf + jwt`).

Notes / deviations from the original plan:

- Used **Python 3.13** (Django 5 doesn't yet support 3.14, which is the system default) via `py -3.13 -m venv backend/.venv`.
- **`weasyprint`** intentionally **omitted** from `requirements/base.txt` (Windows GTK pain). `?format=pdf` returns HTTP 501 in `ListExportMixin` until Step 04 wires it on a Linux dev box / CI.
- **Pre-commit / black / isort / flake8 / django-upgrade** (Step 13) — deferred. Will revisit once domain code lands so the formatter has something to format.
- **Dockerfile / docker-compose** (Step 14) and **deploy.sh** (Step 15) — deferred to Phase 2 closing step. Local dev runs against sqlite via `DATABASE_URL`; MySQL is wired but only exercised in prod settings.
- **Coverage threshold** — `pytest-cov` configured but `--cov-fail-under=0` for now (raised to 85 once domain apps land in step 02+).
- **MySQL `migrate` verification** — checked against sqlite for now (env-driven; prod settings already wire MySQL via PyMySQL shim). Will re-verify on cPanel staging in Step 15.

---

## Steps

1. **Virtualenv + Django**
   ```bash
   python -m venv .venv && .venv\Scripts\activate
   pip install django==5.* djangorestframework djangorestframework-simplejwt django-filter
   pip install drf-spectacular django-cors-headers pymysql django-environ
   pip install pytest pytest-django pytest-cov factory-boy freezegun
   ```
2. **Project skeleton**
   ```bash
   django-admin startproject config backend
   cd backend
   python manage.py startapp core
   ```
   Create `apps/` folder with sub-apps: `auth_ext`, `customers`, `inquiries`, `quotations`, `orders`, `inventory`, `dispatch`, `jobs`, `documents`, `reports`, `notifications`.
3. **pymysql shim** — in `config/__init__.py`:
   ```python
   import pymysql; pymysql.install_as_MySQLdb()
   ```
4. **Requirements split**
   ```
   requirements/
   ├── base.txt
   ├── dev.txt
   └── production.txt
   ```
5. **Environment via django-environ** — `.env` / `inventory.env` referenced in [docs/stack.md](../../docs/stack.md).
6. **Settings split** — `config/settings/{base,dev,prod}.py`.
   - MySQL in `DATABASES`.
   - `INSTALLED_APPS` registers all `apps.*`.
   - DRF defaults: JWT auth, `DjangoFilterBackend`, `SearchFilter`, `OrderingFilter`, pagination (20/100).
   - `SIMPLE_JWT` — 15 min access, 7 day refresh, rotation + blacklist. Two realms: staff (`aud=staff`) and portal (`aud=portal`); claim verified in custom auth class.
   - CORS via `django-cors-headers`. `CORS_ALLOWED_ORIGINS` read from env; in dev `http://localhost:5173`, in prod the deployed frontend origin only. `CORS_ALLOW_CREDENTIALS = True` for cookie-less JWT it stays False; document either way in `.env.example`.
   - `SPECTACULAR_SETTINGS` for OpenAPI.
   - Logging: JSON in prod, console in dev.
7. **Base abstract models** — `apps/core/models.py`:
   - `TimeStampedModel`, `UserStampedModel`, `SoftDeleteModel`, combined `AuditModel`.
   - `SoftDeleteManager` excludes `is_deleted=True`.
8. **Base viewset** — `apps/core/views.py` with soft-delete override + standard filter/search/order mixins. Includes `ListExportMixin` that handles `?format=csv|xlsx|pdf` on every list endpoint: streams the filtered queryset through `tablib` (csv/xlsx) or `weasyprint` (pdf) using a per-resource `export_columns` declaration. JSON remains the default when `format` is absent. The mixin also accepts `?ids=id1,id2,...` (or `ids[]` body on bulk-export POSTs) to scope an export to an explicit selection — used by the inquiries / orders / documents bulk-action toolbars.
9. **Base permissions** — `apps/core/permissions.py`: `IsAuthenticatedActive`, `HasRole(*roles)`, `HasModulePermission`.
10. **API contract conventions** — documented once in `apps/core/README.md` and enforced in tests:
    - JSON keys: **snake_case** end-to-end. Frontend converts to camelCase at the client boundary; backend never emits camelCase.
    - Datetimes: **ISO 8601 UTC** with `Z` suffix. Dates: `YYYY-MM-DD`. Money: string decimal with 2 places, never float.
    - Nullable FKs: always present in response with `null`; never omitted.
    - Nested includes: opt-in via `?include=items,activity,attachments` (comma list); never auto-expanded.
    - Pagination envelope: `{ count, next, previous, results }` (DRF default `PageNumberPagination`).
    - Errors: `{ detail }` for top-level, `{ field: ["..."] }` for validation; HTTP codes `400` validation, `401` auth, `403` permission, `404` not found, `409` conflict, `422` business rule.
11. **URL layout** — `/api/v1/<module>/` namespaces; `/api/auth/` for staff auth; `/api/v1/portal/` for portal auth; `/api/schema/`, `/api/docs/`.
12. **Pytest config** — `pytest.ini` with `DJANGO_SETTINGS_MODULE=config.settings.dev`, `pytest-cov` threshold 85, `pytest-factoryboy`.
13. **Pre-commit** — black, isort, flake8, django-upgrade.
14. **Dockerfile (optional)** and `docker-compose.yml` for MySQL local.
15. **deploy.sh** draft per [stack.md](../../docs/stack.md) conventions (cPanel config paths).

---

## Verification

- [x] `python manage.py check` clean.
- [x] `python manage.py migrate` succeeds (sqlite for dev; MySQL wired via PyMySQL for prod, re-verified on cPanel staging in Step 15).
- [x] `python manage.py runserver` serves `/api/docs/` with Swagger (verified via `Client().get('/api/docs/')` → 200).
- [x] `pytest` runs — 2 smoke tests pass (health + schema endpoints).
- [x] Base abstract models importable (`apps.core.models.AuditModel`); soft-delete manager + `all_objects` escape hatch confirmed.
- [ ] `ListExportMixin` end-to-end smoke (csv/xlsx round-trip) — deferred to Step 04 once a real list endpoint exists. PDF returns 501 stub until weasyprint lands.
- [x] API contract conventions documented in [`apps/core/README.md`](../../backend/apps/core/README.md).
- [x] Commit: `chore(api): bootstrap django + drf + jwt` — `0c27208`.

---

**Next:** [02-models-migrations.md](./02-models-migrations.md)
