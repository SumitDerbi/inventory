# Module API Checklist (copy-paste template)

> Use as PR description / working checklist for every backend resource.

---

## App: `<name>`

## Resources: `<list>`

---

### Spec alignment

- [ ] Every field in [docs/development_spec.md](../../docs/development_spec.md) present in model
- [ ] Every business rule in [docs/project_details.md](../../docs/project_details.md) implemented

### Model

- [ ] Extends `AuditModel` (timestamps, user stamps, soft delete)
- [ ] Enums via `TextChoices`
- [ ] Money as `DecimalField(15,2)`
- [ ] Indexes on FKs + filter fields
- [ ] Unique constraints (numbers, email, sku)
- [ ] `Meta.ordering` + `__str__`

### Migrations

- [ ] `makemigrations --check --dry-run` clean
- [ ] Migration file reviewed (SQL checked via `sqlmigrate`)
- [ ] Seed fixture if applicable

### Serializer

- [ ] List / Detail / Write serializers separated where needed
- [ ] Field-level validators (regex, enums, cross-field)
- [ ] Nested read as needed; create nested write minimal

### ViewSet

- [ ] `ModelViewSet` + filter/search/ordering backends
- [ ] Permissions: JWT + role
- [ ] Soft-delete override
- [ ] Pagination defaults enforced
- [ ] Custom `@action`s for workflow transitions

### URL

- [ ] Registered under `/api/v1/<module>/`
- [ ] OpenAPI schema visible at `/api/docs/`

### Services

- [ ] Business logic outside serializers/views
- [ ] Pure functions where possible, transaction-safe where DB-bound
- [ ] Idempotency for risky ops

### Tests (pytest)

- [ ] `test_models.py`
- [ ] `test_serializers.py` (valid + invalid)
- [ ] `test_views.py` (CRUD + permissions + workflow)
- [ ] `test_services.py` for core logic
- [ ] Factories in `factories.py`
- [ ] Coverage ≥ 85 %

### Postman

- [ ] Folder created in collection
- [ ] Happy path chain written
- [ ] Tests tab on every request (status + keys + env writes)
- [ ] `newman run` green

### Cross-cutting

- [ ] Numbering series (if applicable) atomic
- [ ] Audit / activity log written
- [ ] Notifications produced on relevant events

### Handover

- [ ] Commit `feat(api): <module> <scope> + tests`
- [ ] Next step linked
