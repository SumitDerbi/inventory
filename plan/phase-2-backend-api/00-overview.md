# Phase 2 — Backend API

> Goal: deliver a Django REST + MySQL + JWT API matching the schema in [docs/development_spec.md](../../docs/development_spec.md), backed by pytest and Postman test suites.

---

## Ordered steps

| #   | Step                                                                                                     | Status |
| --- | -------------------------------------------------------------------------------------------------------- | ------ |
| 01  | [Django project setup & conventions](./01-django-setup.md)                                               | ✅      |
| 02  | [Models + migrations (all apps)](./02-models-migrations.md)                                              | ☐      |
| 03  | [Auth API (JWT, users, roles, permissions)](./03-auth-api.md)                                            | ☐      |
| 04  | [Shared masters (customers, contacts, addresses, tax, attachments, notifications)](./04-masters-api.md)  | ☐      |
| 04b | [Settings & admin config API (company, numbering, email templates, integrations)](./04b-settings-api.md) | ☐      |
| 04c | [Global staff search API](./04c-search-api.md)                                                           | ☐      |
| 05  | [Inquiries API](./05-inquiries-api.md)                                                                   | ☐      |
| 06  | [Quotations API](./06-quotations-api.md)                                                                 | ☐      |
| 07  | [Sales Orders API](./07-orders-api.md)                                                                   | ☐      |
| 08  | [Inventory API](./08-inventory-api.md)                                                                   | ☐      |
| 08b | [Purchase & Procurement API](./08b-purchase-api.md)                                                      | ☐      |
| 09  | [Dispatch API](./09-dispatch-api.md)                                                                     | ☐      |
| 10  | [Jobs & Engineer API](./10-jobs-api.md)                                                                  | ☐      |
| 11  | [Documents API](./11-documents-api.md)                                                                   | ☐      |
| 11b | [Client Portal API (scoped, separate JWT realm)](./11b-client-portal-api.md)                             | ☐      |
| 12  | [Reports API (read-only aggregations)](./12-reports-api.md)                                              | ☐      |
| 13  | [Notifications API + background jobs](./13-notifications-api.md)                                         | ☐      |
| 14  | [Postman collection + Newman CI](./14-postman-tests.md)                                                  | ☐      |
| 15  | [Pytest suite + coverage gates](./15-pytest-suite.md)                                                    | ☐      |

Follow [../SKILL.md §2](../SKILL.md) for every resource.

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
