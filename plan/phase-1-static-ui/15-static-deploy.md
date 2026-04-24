# Step 15 — Static Deploy & Client Review

> Before this: [14-admin.md](./14-admin.md)

---

## Objective

Host the static UI on a preview URL, collect structured feedback, lock scope before Phase 2.

---

## Steps

1. **Optimize build**
   - Lazy-load every page (`React.lazy`).
   - Verify bundle size: `npx vite build --report` — initial JS ≤ 300 KB gz.
   - Add `vite-plugin-compression` (gzip/brotli).
   - Remove the kitchen-sink dev route from production build (`import.meta.env.DEV` guard).
2. **Preview hosting options** (pick one)
   - GitHub Pages via Actions.
   - Netlify drop (`dist/`).
   - cPanel static upload (matches [stack.md](../../docs/stack.md) deployment).
   - Django `staticfiles` preview using a stub view that serves `dist/index.html` (dry-run of combined deploy).
3. **Smoke-test checklist** on the hosted URL:
   - Every sidebar link navigates.
   - Every dialog opens + closes.
   - Every form validates.
   - Every toast fires.
   - No console errors in Chrome, Firefox, Safari, Edge.
   - Mobile (iOS Safari, Android Chrome) — shell usable.
4. **Create client review pack**
   - `docs/review/feedback-form.md` — per-module section with fields: look & feel score, flow score, missing fields, extra fields, comments.
   - `docs/review/screenshots/` — screenshot every screen + every state.
   - Share preview URL + review form link.
5. **Capture feedback** — log each item as an issue with label `ui-feedback` + module.
6. **Triage & fix loop** — resolve all blocker + major items; document deferred minors in `docs/review/deferred.md`.
7. **Sign-off** — written approval (email/PDF) added to `docs/review/signoff.md`.

---

## Verification

- [ ] Preview URL live and shared.
- [ ] Lighthouse on 3 representative pages (dashboard, inquiry list, quotation editor) — Performance ≥ 85, Accessibility ≥ 90, Best Practices ≥ 95.
- [ ] All blocker + major feedback addressed and re-reviewed.
- [ ] Written client sign-off recorded.
- [ ] Git tag `v0.1.0-static-ui` pushed.

---

**Next phase:** [../phase-2-backend-api/00-overview.md](../phase-2-backend-api/00-overview.md)
