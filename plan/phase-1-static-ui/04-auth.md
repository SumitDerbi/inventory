# Step 04 — Auth Screens

> Before this: [03-app-shell.md](./03-app-shell.md)
> Spec: [docs/ui_spec.md §Section 1 — Auth Screens](../../docs/ui_spec.md)

---

## Objective

Build Login + Forgot Password screens exactly per spec. No API; submit just simulates latency and redirects.

---

## Steps

1. **`AuthLayout`** — two-column on desktop, single column mobile, as per spec.
2. **`LoginPage`** — `/login`
   - Fields: email, password (with show/hide toggle).
   - Forgot password link, primary full-width submit.
   - Loading state: spinner + "Signing in…".
   - Error alert placeholder (wire via local state for demo).
   - On submit → `setTimeout(900)` → navigate `/dashboard`.
3. **`ForgotPasswordPage`** — `/forgot-password`
   - Single email input, submit.
   - Success alert: "Check your email for the reset link." Replace form.
4. **Branding panel** — gradient `from-slate-800 to-blue-900`, placeholder SVG logo, tagline, 3 feature bullets with check icons, version footer.
5. **Form validation** — zod + react-hook-form (even though static, this scaffolds the pattern).
6. **Add reusable `PasswordInput`** with show/hide toggle in `components/ui/`.

---

## Verification

- [ ] Visual matches spec at 360, 1024, 1440 px.
- [ ] Invalid email → inline field error.
- [ ] Submit disabled while loading; button shows spinner.
- [ ] Forgot password success state replaces form entirely.
- [ ] Tab order: email → password → show/hide → forgot → submit.
- [ ] Commit: `feat(ui): auth screens static`.

---

**Next:** [05-dashboard.md](./05-dashboard.md)
