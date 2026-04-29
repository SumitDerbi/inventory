# Phase 3 — Dynamic Integration

> Goal: cross-cutting integration work that wraps the per-module slices delivered in Phase 2 — add UI E2E smoke and produce a combined production build served by Django (per [docs/stack.md](../../docs/stack.md)).
>
> **Scope shift:** per-module wiring (services + React Query hooks + replacing mocks + form schema sync) and per-module Vitest+RTL+MSW unit tests now happen **inside the Phase 2 module slice** for that module, _not_ in Phase 3. See [../SKILL.md §2.5](../SKILL.md). Phase 3 retains only the foundation + global tests + deploy.

---

## Ordered steps

| #   | Step                                                                 | Status |
| --- | -------------------------------------------------------------------- | ------ |
| 01  | [API client + React Query setup](./01-api-client.md) _(foundation; do **before** the first module slice)_     | ☐      |
| 02  | [Auth wiring + route guards + token refresh](./02-auth-wiring.md) _(foundation; do **before** the first module slice)_ | ☐      |
| 03  | [Per-module wiring playbook](./03-modules-wiring.md) _(reference doc — followed inside each Phase 2 module slice, not as a standalone step)_         | 📖 ref   |
| 04  | [UI unit tests harness (Vitest + RTL + MSW)](./04-ui-unit-tests.md) _(harness is foundation; per-module specs live in Phase 2 slices)_ | ☐      |
| 05  | [E2E smoke (Playwright)](./05-e2e-playwright.md) _(after all module slices)_                     | ☐      |
| 06  | [Combined deploy (build + Django template)](./06-combined-deploy.md) _(final)_ | ☐      |

Follow [../SKILL.md §2.5](../SKILL.md) for module slices and [../SKILL.md §3](../SKILL.md) for cross-cutting steps.

---

## Exit criteria

- [ ] All mock imports removed (`grep -r "mocks/"` returns only tests).
- [ ] Vitest green (per-module specs from Phase 2 slices + global harness from step 04), coverage ≥ 70 % on components.
- [ ] Playwright smoke scenario green against staging.
- [ ] Combined build deployed via `deploy.sh`.
- [ ] UAT sign-off recorded.
