# Phase 2 — Backend API

> Goal: deliver a Django REST + MySQL + JWT API matching the schema in [docs/development_spec.md](../../docs/development_spec.md), backed by pytest and Postman test suites.
>
> **Approach:** steps 01–04c are **horizontal foundation** (one-time, codebase-wide). Steps 05–13 are **vertical module slices** — each one ships backend API + pytest + Postman folder + frontend wiring + frontend unit tests **before** the next module begins. See [../SKILL.md §2.5](../SKILL.md). Steps 14–15 are CI/coverage harnesses only.

---

## Ordered steps

### Foundation (horizontal — build once, used by every module)

| #   | Step                                                                                                     | Status |
| --- | -------------------------------------------------------------------------------------------------------- | ------ |
| 01  | [Django project setup & conventions](./01-django-setup.md)                                               | ✅      |
| 02  | [Models + migrations (all apps)](./02-models-migrations.md)                                              | ✅      |
| 03  | [Auth API (JWT, users, roles, permissions)](./03-auth-api.md)                                            | ✅      |
| 04  | [Shared masters (customers, contacts, addresses, tax, attachments, notifications)](./04-masters-api.md)  | ✅      |
| 04b | [Settings & admin config API (company, numbering, email templates, integrations)](./04b-settings-api.md) | ✅      |
| 04c | [Global staff search API](./04c-search-api.md)                                                           | ✅      |

### Module slices (vertical — each step delivers API + pytest + Postman + UI wiring + UI tests for that module)

| #   | Step                                                                         | Status |
| --- | ---------------------------------------------------------------------------- | ------ |
| 05  | [Inquiries module slice](./05-inquiries-api.md)                              | ☐      |
| 06  | [Quotations module slice](./06-quotations-api.md)                            | ☐      |
| 07  | [Sales Orders module slice](./07-orders-api.md)                              | ☐      |
| 08  | [Inventory module slice](./08-inventory-api.md)                              | ☐      |
| 08b | [Purchase & Procurement module slice](./08b-purchase-api.md)                 | ☐      |
| 09  | [Dispatch module slice](./09-dispatch-api.md)                                | ☐      |
| 10  | [Jobs & Engineer module slice](./10-jobs-api.md)                             | ☐      |
| 11  | [Documents module slice](./11-documents-api.md)                              | ☐      |
| 11b | [Client Portal module slice (separate JWT realm)](./11b-client-portal-api.md)| ☐      |
| 12  | [Reports module slice (read-only aggregations)](./12-reports-api.md)         | ☐      |
| 13  | [Notifications module slice + background jobs](./13-notifications-api.md)    | ☐      |

### CI & coverage (horizontal — wraps everything above)

| #   | Step                                                                                | Status |
| --- | ----------------------------------------------------------------------------------- | ------ |
| 14  | [Postman / Newman CI harness](./14-postman-tests.md) _(per-module folders authored inside slices 05–13)_ | ☐      |
| 15  | [Pytest coverage gates + CI integration](./15-pytest-suite.md) _(per-module tests written inside slices 05–13)_ | ☐      |

Follow [../SKILL.md §2](../SKILL.md) for foundation steps and [../SKILL.md §2.5](../SKILL.md) for module slices.

---

## Exit criteria

- [ ] All steps ticked.
- [ ] `pytest --cov` ≥ 85 % per app (≥ 90 % on `auth_ext`, `portal`).
- [ ] Postman collection runs green via `newman` in CI (staff + portal folders).
- [ ] OpenAPI schema published at `/api/schema/` + Swagger UI at `/api/docs/`.
- [ ] No staff endpoint unauthenticated except `/api/auth/login`, `/api/auth/refresh`, `/api/auth/forgot`.
- [ ] No portal endpoint unauthenticated except `/api/v1/portal/auth/{login,refresh,forgot,reset}`.
- [ ] Audit log written for every mutation across staff + portal realms.
- [ ] Notification kind matrix (step 13) covers every domain event producer.

**Next phase:** [../phase-3-dynamic-integration/00-overview.md](../phase-3-dynamic-integration/00-overview.md)
