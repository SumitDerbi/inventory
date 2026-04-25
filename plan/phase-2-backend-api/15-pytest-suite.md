# Step 15 — Pytest Suite + Coverage Gates

> Before this: [14-postman-tests.md](./14-postman-tests.md)

---

## Objective

Consolidate the pytest suite, enforce coverage gates, wire it into CI.

---

## Structure

```
backend/
├── pytest.ini
├── conftest.py            # shared fixtures: api_client, auth_headers, users_factory
└── apps/
    └── <app>/
        └── tests/
            ├── conftest.py       # app-specific fixtures + factories
            ├── test_models.py
            ├── test_serializers.py
            ├── test_views.py
            ├── test_services.py  # business logic
            └── test_signals.py   # when applicable
```

---

## Conventions

- Use `factory_boy` factories, one per model under `apps/<app>/tests/factories.py`.
- Use `pytest.mark.django_db` with `transaction=True` only when signals/locks matter.
- Never hit external services — mock via `responses` / `respx` / MSW equivalents.
- Clock control via `freezegun`.
- Parametrise heavy business rules (pricing, approval, stage gates).
- Use `pytest-xdist` for parallel runs (`-n auto`).
- Snapshot-test PDF + email templates via byte hash of rendered output.

---

## Coverage gates

- Global: `--cov=apps --cov-report=term-missing --cov-fail-under=85`.
- Individual app minimums in `pytest.ini`: auth 90, portal 90, quotations 85, orders 85, inventory 85, documents 85, others 80.
- Report uploaded to CI as artifact; optional Codecov integration.

---

## Required cross-cutting tests

These tests live in `apps/<owner>/tests/` but are explicitly gated:

- **Concurrent stock reservation (inventory):** parametrised threaded test. N workers race to reserve the last unit; assert exactly one succeeds, ledger has one reservation row, others receive 409.
- **Cross-tenant portal isolation (portal):** matrix over (org A user, org B resource) for every portal endpoint; expect 403/404, never 200.
- **JWT realm separation (auth):** staff token → portal endpoint = 401; portal token → staff endpoint = 401.
- **Audit log coverage (core):** smoke test creates / updates / deletes one row per `@audited` model and asserts an `audit_logs` row exists with correct actor + diff.
- **Notification kind matrix (notifications):** snapshot test enumerates every producer event; asserts each maps to a registered (kind, template, recipients) tuple.
- **Sensitivity matrix (documents):** parametrised over (role × sensitivity); 100 % of expected allow/deny rows match.
- **Numbering atomicity (core/settings):** parallel finalise of two invoices in the same FY produces strictly sequential numbers.
- **Report slug registry (reports):** snapshot test loads frontend `reports.ts` mocks and asserts every slug resolves to a registered path.

---

## CI

- GitHub Actions `.github/workflows/pytest.yml`:
  1. MySQL service.
  2. Python matrix (3.11).
  3. Install, migrate, `pytest -q`.
  4. Fail PR if coverage below gate.

---

## Verification

- [ ] `pytest` green locally with `--cov-fail-under=85`.
- [ ] CI pytest job green on a test PR.
- [ ] Every app has factories + at least one test per layer (model / serializer / view / service).
- [ ] `pytest --collect-only | wc -l` > 200 (sanity: meaningful coverage).
- [ ] Commit: `test(api): consolidated pytest suite + coverage gate`.

---

**Phase 2 exit gate:** both pytest and Newman CI green. Move to [../phase-3-dynamic-integration/00-overview.md](../phase-3-dynamic-integration/00-overview.md).
