# Module UI Checklist (copy-paste template)

> Use this as a **PR description template** or a working checklist every time you build or wire a UI module. Covers both static (Phase 1) and dynamic (Phase 3) phases.

---

## Module: `<name>`

## Screens: `<list>`

## Phase: [ ] Static [ ] Dynamic

---

### Scope

- Spec: [docs/development_spec.md §...](../../docs/development_spec.md), [docs/ui_spec.md §...](../../docs/ui_spec.md)
- Fields confirmed: yes / no
- Flows confirmed: yes / no

### Static UI

- [ ] Route + nav added
- [ ] List page: filters, search, pagination, export, bulk actions
- [ ] Detail page: header + tabs + actions
- [ ] Create / Edit drawer/dialog
- [ ] Workflow transition dialogs (approve/cancel/convert/etc.)
- [ ] All status + priority badges use token map
- [ ] Empty / loading / error / success states
- [ ] Responsive 360 / 768 / 1024 / 1440
- [ ] Keyboard + focus + aria-labels
- [ ] No console errors
- [ ] Mock file in `src/mocks/<module>.js`

### Dynamic wiring

- [ ] `src/services/<module>.js` implemented
- [ ] `src/hooks/use<Module>.js` implemented
- [ ] `src/schemas/<module>.js` (zod) mirrors API
- [ ] Pages use hooks, not mocks
- [ ] Loading/empty/error states fed from hook state
- [ ] Forms: react-hook-form + zodResolver + server error mapping
- [ ] URL-synced filters + pagination
- [ ] Exports hit API endpoints
- [ ] Optimistic updates where safe
- [ ] Mock file removed from runtime bundle

### Tests

- [ ] Vitest tests per page (render / loading / data / empty / error / submit)
- [ ] MSW handlers for all endpoints used
- [ ] Coverage ≥ 70 % on module files
- [ ] Playwright coverage: action included in golden-path if relevant

### Polish

- [ ] Axe 0 critical
- [ ] Lighthouse ≥ 90 accessibility on one representative page
- [ ] No `any-color` hex outside tokens
- [ ] Toast / breadcrumb / title on every screen

### Handover

- [ ] Commit `feat(<scope>): <module> <phase>`
- [ ] Next step linked
