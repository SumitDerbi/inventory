# Step 05 — E2E Smoke (Playwright)

> Before this: [04-ui-unit-tests.md](./04-ui-unit-tests.md)

---

## Objective

One golden-path scenario proving the whole stack is alive on staging.

---

## Scenario

1. Log in as sales exec.
2. Create inquiry with dedupe bypass.
3. Add requirement line item.
4. Convert inquiry → quotation.
5. Add items, submit for approval.
6. Log in as approver (second context), approve.
7. Back to sales exec, convert to sales order.
8. Run MRP, reserve stock.
9. Create dispatch, mark Delivered + POD.
10. Create installation job, engineer logs in (third context), completes checklist + signoff.
11. Verify dashboard KPIs updated.

---

## Setup

- `npx playwright install chromium`.
- `playwright.config.ts` with projects: `chromium-desktop`, `chromium-mobile`.
- Test data seeded via API fixtures (new tenant / reset endpoint used only in staging).
- Screenshots + trace on failure; uploaded in CI.

---

## CI

- Workflow `.github/workflows/e2e.yml` runs on nightly + manual dispatch, plus on PRs labelled `run-e2e`.
- Uses preview deployment URL as `BASE_URL`.

---

## Verification

- [ ] `npx playwright test` green locally.
- [ ] Nightly CI green for 3 consecutive nights.
- [ ] Failure artefacts (trace + video) downloadable from Actions.
- [ ] Commit: `test(e2e): golden-path playwright suite`.

---

**Next:** [06-combined-deploy.md](./06-combined-deploy.md)
