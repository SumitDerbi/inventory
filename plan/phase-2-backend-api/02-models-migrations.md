# Step 02 — Models & Migrations (All Apps) ✅

> Status: **DONE** (commit `202bac0`)
> Before this: [01-django-setup.md](./01-django-setup.md)
> Source of truth: [docs/development_spec.md — Part A](../../docs/development_spec.md)

---

## Objective

Create **every table** from the spec as Django models before writing any endpoint. Treat migrations as public contract — review diffs carefully.

---

## Steps (per app)

For each app in this order (dependencies first):

1. `auth_ext` → extend `users`, create `roles`, `role_permissions`.
2. `customers` → `customers`, `contacts`, `addresses`.
3. `core` masters → `tax_rules`, `attachments`, `notifications`, `inquiry_sources`, `product_categories`, `brands`, `uom`.
4. `inventory` → `products`, `product_specifications`, `warehouses`, `stock_ledger`, `stock_batches`, `reservations`, `reorder_rules`.
5. `inquiries` → `inquiries`, `inquiry_items`, `inquiry_follow_ups`, `inquiry_activity`.
6. `quotations` → `quotations`, `quotation_versions`, `quotation_items`, `price_rules`, `discount_rules`, `approval_steps`, `approval_actions`, `terms_templates`, `communications_log`.
7. `orders` → `sales_orders`, `sales_order_items`, `delivery_schedules`, `material_checklists`, `installation_requirements`, `order_milestones`.
8. `dispatch` → `dispatch_plans`, `dispatch_challans`, `vehicles`, `transporters`, `shipments`, `shipment_items`, `delivery_stops`, `pod_documents`, `dispatch_exceptions`.
9. `jobs` → `engineer_profiles`, `skill_matrix`, `installation_jobs`, `assignments`, `visit_schedules`, `checklist_templates`, `service_reports`, `commissioning_reports`, `site_observations`.
10. `documents` → `documents`, `document_versions`, `document_access`, `invoices`, `invoice_items`, `serial_number_registry`, `certificate_templates`.
11. `settings` (under `apps/core`) → `company_profile`, `numbering_series`, `payment_terms`, `integrations`, `notification_channel_defaults`, `email_templates`. (See [04b-settings-api.md](./04b-settings-api.md).)
12. `portal` → `client_organizations`, `client_users`, `portal_access_logs`, `portal_support_tickets`. (See [11b-client-portal-api.md](./11b-client-portal-api.md).)

### Per-model rules

- Every model inherits `AuditModel`.
- Enums → `TextChoices` on the model.
- Money fields → `DecimalField(max_digits=15, decimal_places=2)`.
- FKs have explicit `on_delete` (`PROTECT` for masters, `CASCADE` only for clear parent-child).
- Add `db_index=True` on FKs and frequent filter fields (status, created_at, assigned_to, mobile, gst_number).
- Unique constraints: inquiry_number, quotation_number + version, order_number, challan_number, user.email, product.sku.
- Add `Meta.ordering`, sensible `__str__`.
- Signals for numbering series in `apps/core/numbering.py` (atomic increment per series).

### Document sensitivity (Phase 1 UI requirement)

- `documents.sensitivity` → `TextChoices('public', 'internal', 'confidential')`, default `internal`, `db_index=True`.
- `document_access` carries optional override per `(role | user)` × `(view | download | share)`.
- Default visibility matrix (seeded in fixture):
  - `public` → all authenticated staff + portal users with org match.
  - `internal` → all staff except external auditors; portal users denied.
  - `confidential` → only roles `admin`, `finance_head`, `sales_head` + explicit user grants; portal users denied.
- Enforced in `apps/documents/services/access.py` and reused by both staff (step 11) and portal (step 11b) viewsets.

### Stock summary — decision

- Implement as **managed DB view** `stock_summary_v` joining `stock_ledger` + `reservations` and computing `on_hand`, `reserved`, `available` per (product, warehouse).
- Migration uses `RunSQL` with forward + reverse to create/drop the view.
- A nightly job (`apps/inventory/jobs/refresh_stock_cache.py`) optionally materialises into a cache table `stock_summary_cache` for hot dashboards; cache invalidated on every ledger insert via signal.
- Step 08 endpoints query the view by default; cache table only when `?fast=true` is passed by dashboard widgets.

### Audit log signal pattern

Document the canonical pattern once here; every app reuses it.

```python
# apps/core/audit.py
from django.db.models.signals import post_save, post_delete
from .models import AuditLog

AUDITED_MODELS = set()  # populated by @audited decorator

def audited(cls):
    AUDITED_MODELS.add(cls)
    post_save.connect(_on_save, sender=cls, weak=False)
    post_delete.connect(_on_delete, sender=cls, weak=False)
    return cls
```

- Every domain model decorated with `@audited` (or registered via app `ready()` hook).
- Signal handlers read actor from `threadlocals` populated by `AuditMiddleware` (request user + ip + ua).
- Diff = `model_to_dict(before)` vs `model_to_dict(after)`; secrets masked via `Meta.audit_redact = ['password', 'config']`.
- Bulk operations bypass signals → use explicit `AuditLog.bulk_record()` helper.

### Migration hygiene

- Commit migrations per app, small and named (e.g. `0001_initial`, `0002_add_order_milestones`).
- Review generated SQL via `sqlmigrate`.
- Keep a seed fixture per app in `apps/<app>/fixtures/seed_<app>.json` (enums, default roles, tax rules, checklist templates).

---

## Verification

- [ ] Every table in [development_spec.md](../../docs/development_spec.md) has a matching model.
- [ ] Field types + enums match spec exactly (spot check 5 random tables).
- [ ] `documents.sensitivity` enum present + indexed; default visibility matrix seeded.
- [ ] `stock_summary_v` view created + reverse SQL works (`migrate inventory zero`).
- [ ] At least one model from each app decorated `@audited`; signal smoke test creates `audit_logs` row.
- [ ] `python manage.py makemigrations --check --dry-run` clean after commit.
- [ ] `python manage.py migrate` applies all migrations on empty DB without error.
- [ ] Seed fixtures load via `loaddata` without FK errors.
- [ ] ER diagram generated via `django-extensions graph_models` stored at `docs/generated/er-diagram.png`.
- [ ] Commit per app: `feat(api): <app> models + migrations`.

---

**Next:** [03-auth-api.md](./03-auth-api.md)
