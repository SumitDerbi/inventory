# Step 02 — Models & Migrations (All Apps)

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
10. `documents` → `documents`, `document_versions`, `document_access`.

### Per-model rules

- Every model inherits `AuditModel`.
- Enums → `TextChoices` on the model.
- Money fields → `DecimalField(max_digits=15, decimal_places=2)`.
- FKs have explicit `on_delete` (`PROTECT` for masters, `CASCADE` only for clear parent-child).
- Add `db_index=True` on FKs and frequent filter fields (status, created_at, assigned_to, mobile, gst_number).
- Unique constraints: inquiry_number, quotation_number + version, order_number, challan_number, user.email, product.sku.
- Add `Meta.ordering`, sensible `__str__`.
- Signals for numbering series in `apps/core/numbering.py` (atomic increment per series).

### Migration hygiene

- Commit migrations per app, small and named (e.g. `0001_initial`, `0002_add_order_milestones`).
- Review generated SQL via `sqlmigrate`.
- Keep a seed fixture per app in `apps/<app>/fixtures/seed_<app>.json` (enums, default roles, tax rules, checklist templates).

---

## Verification

- [ ] Every table in [development_spec.md](../../docs/development_spec.md) has a matching model.
- [ ] Field types + enums match spec exactly (spot check 5 random tables).
- [ ] `python manage.py makemigrations --check --dry-run` clean after commit.
- [ ] `python manage.py migrate` applies all migrations on empty DB without error.
- [ ] Seed fixtures load via `loaddata` without FK errors.
- [ ] ER diagram generated via `django-extensions graph_models` stored at `docs/generated/er-diagram.png`.
- [ ] Commit per app: `feat(api): <app> models + migrations`.

---

**Next:** [03-auth-api.md](./03-auth-api.md)
