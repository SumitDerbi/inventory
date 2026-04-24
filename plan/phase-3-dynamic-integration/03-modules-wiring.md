# Step 03 — Per-Module Wiring Playbook

> Before this: [02-auth-wiring.md](./02-auth-wiring.md)
> Per-module checklist template: [../templates/module-ui-checklist.md](../templates/module-ui-checklist.md)

---

## Objective

Wire every module (dashboard, inquiries, quotations, orders, inventory, dispatch, jobs, documents, reports, admin) to the API using the same repeatable recipe.

---

## Recipe (repeat per module)

1. **Service** — `src/services/<module>.js` exporting pure axios-backed functions for every endpoint. Input/output typed via JSDoc + Zod schemas.
2. **Hooks** — `src/hooks/use<Module>.js` covering list / one / create / update / delete / custom actions. Use `qk` factory keys.
3. **Zod schemas** — `src/schemas/<module>.js` mirroring API validation 1-to-1. Reused by forms + response validation (optional).
4. **Page wiring**
   - Replace mock import with hook output.
   - Loading → `<LoadingSkeleton>`.
   - Empty → `<EmptyState>`.
   - Error → `<ErrorAlert>` with retry button.
5. **Form wiring**
   - `react-hook-form` + `zodResolver`.
   - On submit call mutation; `onError` maps server 400 → `setError(field, { message })`.
   - Toast success; close drawer/dialog; invalidate related query keys.
6. **Optimistic updates** — only for low-risk toggles (mark-read, quick status flips).
7. **Pagination + filters** — push state to URL (`useSearchParams`) so sharing a link preserves the view.
8. **Exports** — wire CSV / Excel / PDF endpoints to trigger browser download via a streaming fetch.
9. **Cleanup** — delete the module's mock file (keep seed generators in tests only).

---

## Module order

Follow the same order as Phase 1 for consistency:

1. Dashboard
2. Inquiries
3. Quotations
4. Sales Orders
5. Inventory
6. Dispatch
7. Jobs
8. Documents
9. Reports
10. Admin (users / roles / settings / profile / notifications)

Use [../templates/module-ui-checklist.md](../templates/module-ui-checklist.md) as a copy-paste PR template for each module.

---

## Verification (per module)

- [ ] No `mocks/<module>` import anywhere outside `tests/`.
- [ ] All CRUD + workflow actions reach the real API and update UI.
- [ ] Filters, pagination, sort reflected in URL.
- [ ] Loading, empty, error, success states render correctly.
- [ ] Form validation errors shown inline from API 400 responses.
- [ ] Commit: `feat(wire): <module> dynamic`.

---

**Next:** [04-ui-unit-tests.md](./04-ui-unit-tests.md)
