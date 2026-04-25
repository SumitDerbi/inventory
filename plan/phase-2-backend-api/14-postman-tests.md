# Step 14 — Postman Collection + Newman CI

> Before this: [13-notifications-api.md](./13-notifications-api.md)

---

## Objective

Ship a single Postman collection + environment files that a new developer can import and run end-to-end.

---

## Deliverables

- `postman/inventory.postman_collection.json` — all endpoints, grouped by module.
- `postman/environments/local.env.json`, `staging.env.json`.
- `postman/README.md` — how to import, run, extend.
- Newman script `scripts/run-postman.ps1` + `.sh`.

---

## Conventions

1. **Folder per module**, ordered to follow a realistic business flow.
2. **Variables** in the environment (not inline):
   - `base_url`, `access_token`, `refresh_token`, plus resource IDs (`customer_id`, `inquiry_id`, ...).
3. **Pre-request scripts**:
   - Root-level script refreshes access token when expired (using refresh from env).
4. **Tests tab on every request**:
   - Status code matches.
   - Required JSON keys present.
   - On create: write ID to env for subsequent requests.
5. **Data-driven** runs via CSV where useful (e.g. negative validation tests).
6. **Smoke suite** folder at top — the minimum "is the API healthy" chain.
7. **Export-format probes** — for every list endpoint that the frontend exposes Export on (inquiries, quotations, orders, documents, reports), include three calls (`?format=csv`, `?format=xlsx`, `?format=pdf`) asserting `Content-Type` + non-zero body size.
8. **Realm separation probes** — folder asserting staff token → portal endpoint = 401 and vice versa.

---

## Newman CI

- GitHub Actions workflow `.github/workflows/api-tests.yml`:
  1. Spin up MySQL service.
  2. Install Python deps, run migrations, load fixtures.
  3. Start Django via `gunicorn` in background.
  4. Run `newman run postman/inventory.postman_collection.json -e postman/environments/ci.env.json --reporters cli,junit`.
  5. Upload JUnit report as artifact.
- Matrix: run both smoke and full suites; PRs require smoke green, main requires full green.

---

## Verification

- [ ] `newman run ...` locally exits 0.
- [ ] CI workflow passes on a test PR.
- [ ] README explains how to add a new request (copy template, set tests).
- [ ] Commit: `test(api): postman collection + newman ci`.

---

**Next:** [15-pytest-suite.md](./15-pytest-suite.md)
