# Phase 3 — Dynamic Integration

> Goal: wire the static UI to the live API, add UI unit tests + E2E smoke, and produce a combined production build served by Django (per [docs/stack.md](../../docs/stack.md)).

---

## Ordered steps

| #   | Step                                                                 | Status |
| --- | -------------------------------------------------------------------- | ------ |
| 01  | [API client + React Query setup](./01-api-client.md)                 | ☐      |
| 02  | [Auth wiring + route guards + token refresh](./02-auth-wiring.md)    | ☐      |
| 03  | [Per-module wiring playbook](./03-modules-wiring.md)                 | ☐      |
| 04  | [UI unit tests (Vitest + RTL + MSW)](./04-ui-unit-tests.md)          | ☐      |
| 05  | [E2E smoke (Playwright)](./05-e2e-playwright.md)                     | ☐      |
| 06  | [Combined deploy (build + Django template)](./06-combined-deploy.md) | ☐      |

Follow [../SKILL.md §3](../SKILL.md) for every module wired.

---

## Exit criteria

- [ ] All mock imports removed (`grep -r "mocks/"` returns only tests).
- [ ] Vitest green, coverage ≥ 70 % on components.
- [ ] Playwright smoke scenario green against staging.
- [ ] Combined build deployed via `deploy.sh`.
- [ ] UAT sign-off recorded.
