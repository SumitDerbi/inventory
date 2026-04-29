# Step 04 — UI Unit Tests harness (Vitest + RTL + MSW)

> **Harness only.** Per-module test specs are written **inside each Phase 2 module slice** (see [../SKILL.md §2.5](../SKILL.md) and [../phase-2-backend-api/00-overview.md](../phase-2-backend-api/00-overview.md)). This step delivers the shared test infrastructure so those module-level specs run consistently.
>
> Before this: [02-auth-wiring.md](./02-auth-wiring.md) (foundation). Per-module wiring playbook: [03-modules-wiring.md](./03-modules-wiring.md).

---

## Objective

Stand up the Vitest + RTL + MSW harness once: shared `setup.ts`, MSW handlers per module folder, custom render with QueryClient + AuthProvider, coverage config. Per-module test specs **live with the module** in `src/pages/<module>/__tests__/` and are written during that module's Phase 2 slice.

---

## Structure

```
frontend/
├── test/
│   ├── setup.js                     # RTL + jest-dom + MSW server
│   ├── msw/
│   │   ├── handlers/<module>.js     # per-module handlers
│   │   └── server.js
│   └── utils.jsx                    # renderWithProviders(AuthCtx + QueryClient + Router)
└── src/
    └── pages/<module>/__tests__/
        └── <Screen>.test.jsx
```

---

## Patterns

- `renderWithProviders(<Page />, { route, user, queryClient })` is the only render helper.
- Arrange-act-assert strictly.
- Never `waitFor(() => expect(... > 0))` — assert on concrete elements.
- Prefer `findByRole` / `findByText` over test-ids; add `data-testid` only where roles are insufficient.
- Co-locate MSW handlers per module; override in individual tests for error / empty / loading scenarios.

---

## Test list (baseline per page)

For each primary page:

1. Renders title + primary action.
2. Shows loading skeleton initially.
3. Shows data after fetch.
4. Shows empty state when API returns zero rows.
5. Shows error alert with retry on 500.
6. Filter change triggers refetch with new params.
7. Primary create form: happy submit + server-side validation error mapping.

For workflow actions (approve, convert, etc.):

- Clicking action opens dialog, requires required fields, calls correct endpoint, shows toast.

---

## Coverage target

- ≥ 70 % lines on `src/pages/**` and `src/components/**`.
- Helpers (`src/lib/**`) ≥ 90 %.

---

## Verification

- [ ] `npm run test -- --coverage` meets gates.
- [ ] CI workflow `.github/workflows/ui-tests.yml` green on PR.
- [ ] Flaky-test budget: 0; re-run a random 3× to confirm stability.
- [ ] Commit: `test(ui): vitest + msw suite`.

---

**Next:** [05-e2e-playwright.md](./05-e2e-playwright.md)
