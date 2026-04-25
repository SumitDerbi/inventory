# Step 01 — Django Project Setup & Conventions

> Before this: [00-overview.md](./00-overview.md)

---

## Objective

Bootstrap Django project with MySQL (pymysql), DRF, JWT, drf-spectacular, pytest, and project conventions.

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
8. **Base viewset** — `apps/core/views.py` with soft-delete override + standard filter/search/order mixins.
9. **Base permissions** — `apps/core/permissions.py`: `IsAuthenticatedActive`, `HasRole(*roles)`, `HasModulePermission`.
10. **URL layout** — `/api/v1/<module>/` namespaces; `/api/auth/` for auth; `/api/schema/`, `/api/docs/`.
11. **Pytest config** — `pytest.ini` with `DJANGO_SETTINGS_MODULE=config.settings.dev`, `pytest-cov` threshold 85, `pytest-factoryboy`.
12. **Pre-commit** — black, isort, flake8, django-upgrade.
13. **Dockerfile (optional)** and `docker-compose.yml` for MySQL local.
14. **deploy.sh** draft per [stack.md](../../docs/stack.md) conventions (cPanel config paths).

---

## Verification

- [ ] `python manage.py check` clean.
- [ ] `python manage.py migrate` succeeds against MySQL.
- [ ] `python manage.py runserver` serves `/api/docs/` with Swagger.
- [ ] `pytest` runs with 0 tests, 0 errors.
- [ ] Base abstract models importable; a throwaway model using them migrates cleanly then is reverted.
- [ ] Commit: `chore(api): bootstrap django + drf + jwt`.

---

**Next:** [02-models-migrations.md](./02-models-migrations.md)
