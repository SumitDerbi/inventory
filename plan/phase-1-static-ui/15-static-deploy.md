# Step 15 — Static Deploy & Client Review

> Before this: [14-admin.md](./14-admin.md)

---

## Objective

Host the static UI on a preview URL, collect structured feedback, lock scope before Phase 2.

---

## ✅ Delivered (automated)

### Build optimization

- **`frontend/vite.config.ts`** — added `vite-plugin-compression` for both gzip (`.gz`) and brotli (`.br`) outputs (threshold 1 KB) and a `base: process.env.VITE_BASE_PATH ?? '/'` so the GitHub Pages workflow can inject a sub-path.
- **`frontend/src/app/router.tsx`** — kitchen-sink route now gated behind `import.meta.env.DEV` (`/__kitchen-sink` only resolves in dev). Router accepts a `basename` derived from `import.meta.env.BASE_URL` so the SPA works under a sub-path on Pages.
- All page-level routes already use `React.lazy` from earlier steps — no change required.

### Bundle size (production build, gzip)

- Initial JS chunk (`index-*.js`): **164.43 KB gz** (target ≤ 300 KB) ✓
- Shared Recharts chunk (`LineChart-*.js`, lazy on Dashboard + Reports): 98.39 KB gz
- Largest route chunks: `QuotationDetailPage` 8.28 · `OrderDetailPage` 6.67 · `JobDetailPage` 6.17 · `InquiryDetailPage` 6.16 · `DocumentsPage` 7.84 · `ReportViewerPage` 16.20 · `SettingsPage` 4.26 · `UsersPage` 2.78 KB gz.
- CSS: 7.5 KB gz.

### Hosting workflow

- **`.github/workflows/deploy-pages.yml`** — GitHub Pages deploy on push to `main` (path-filtered to `frontend/**`):
  - `actions/setup-node@v4` Node 22 with npm cache.
  - Builds with `VITE_BASE_PATH=/<repo>/`.
  - Copies `dist/index.html` → `dist/404.html` (SPA fallback for client-side routing).
  - Adds `.nojekyll`, uploads via `actions/upload-pages-artifact`, deploys via `actions/deploy-pages@v4`.
  - Concurrency-grouped to prevent overlapping deploys.

### Review pack scaffolding

- **`docs/review/feedback-form.md`** — per-module rating + missing/extra fields + comments + blockers (12 sections covering shell, auth, dashboard, inquiries, quotations, orders, inventory, dispatch, jobs, documents, reports, admin) plus an overall summary.
- **`docs/review/deferred.md`** — table to track minor / nice-to-have items deferred past Phase 1 sign-off.
- **`docs/review/signoff.md`** — formal sign-off template with verification checklist + signature table.
- **`docs/review/screenshots/README.md`** — folder structure guidance for capturing every screen × every state.

---

## Manual steps (user actions)

> These steps require operator/owner involvement and cannot be automated.

1. **Pick a hosting target.** GitHub Pages workflow is committed; alternatives: Netlify drop, cPanel upload, Django staticfiles preview. To enable Pages: repo Settings → Pages → Source = "GitHub Actions" → push to `main`.
2. **Smoke-test on the live URL** following the checklist below.
3. **Run Lighthouse** on the three reference pages (dashboard, inquiry list, quotation editor). Targets: Performance ≥ 85, Accessibility ≥ 90, Best Practices ≥ 95.
4. **Capture screenshots** into `docs/review/screenshots/` per module folder (every state).
5. **Share preview URL + `feedback-form.md`** with reviewers; capture each reply as an issue with label `ui-feedback` + module label.
6. **Triage** — fix all 🔴 blocker + 🟠 major items; log 🟡 minor / 🟢 nice-to-have in `deferred.md`.
7. **Sign-off** — fill `signoff.md` with reviewer approval (email/PDF copy linked).
8. **Tag** `git tag v0.1.0-static-ui && git push origin v0.1.0-static-ui`.

### Smoke-test checklist

- [ ] Every sidebar link navigates without console errors.
- [ ] Every dialog opens and closes (escape + outside click + close button).
- [ ] Every form validates (required, email, mobile, password rules, future-date guard).
- [ ] Every toast variant fires (success / error / info / warning).
- [ ] Browsers: Chrome, Firefox, Safari, Edge — no console errors.
- [ ] Mobile shell usable: iOS Safari + Android Chrome (sidebar Sheet, sticky topbar, drawer scrolling).
- [ ] Direct-load any deep link (e.g. `/quotations/q-001`) — 404 SPA fallback resolves correctly.

---

## Verification

- ✅ Lazy-loaded every page (existing) — initial JS 164.43 KB gz (≤ 300 KB target).
- ✅ Gzip + brotli compression artifacts produced alongside JS/CSS in `dist/`.
- ✅ Kitchen-sink route stripped from production routes (only available when `import.meta.env.DEV`).
- ✅ GitHub Pages workflow committed.
- ✅ Review pack templates created in `docs/review/`.
- ☐ Preview URL live (manual, post-merge).
- ☐ Lighthouse pass on 3 representative pages.
- ☐ Blocker + major feedback resolved.
- ☐ Written client sign-off recorded in `signoff.md`.
- ☐ Git tag `v0.1.0-static-ui` pushed.

---

## Commit

`chore(deploy): static deploy + review pack`

---

**Next phase:** [../phase-2-backend-api/00-overview.md](../phase-2-backend-api/00-overview.md)
