# Step 04 — Auth Screens ✅

> Before this: [03-app-shell.md](./03-app-shell.md)
> Spec: [docs/ui_spec.md §Section 1 — Auth Screens](../../docs/ui_spec.md)

---

## Delivered

### New primitives / layout
- `src/components/ui/PasswordInput.tsx` — password field with show/hide toggle (Eye / EyeOff). Forwards `ref`, supports `invalid`, pairs with `FormField`.
- `src/layouts/AuthLayout.tsx` — two-column layout. Left: gradient `from-slate-800 to-blue-900` branding panel with logo, tagline, 3 feature bullets (Workflow / ShieldCheck / Sparkles) and version footer — hidden below `lg`. Right: centered form column with mobile-only logo row.

### Schemas
- `src/pages/auth/schema.ts` — `loginSchema` (email + password min 8) and `forgotPasswordSchema` via `zod`.

### Screens
- `src/pages/auth/LoginPage.tsx` — `react-hook-form` + `@hookform/resolvers/zod`. Inline field errors, form-level `ErrorAlert` slot, 900 ms simulated latency, disabled + `Loader2` spinner while submitting, on success → `signIn()` + navigate to `state.from || /dashboard`. Demo credentials prefilled.
- `src/pages/auth/ForgotPasswordPage.tsx` — RHF + zod, 900 ms simulated latency, success state replaces the form with a green `ErrorAlert` (variant=success) + "Back to sign in" link.

Router already points to these pages from Step 03; no router changes needed.

---

## Verification

- [x] Visual: two-column desktop (≥1024 px), single-column mobile (<1024 px). Gradient branding panel hidden on mobile, logo shown inline in form column.
- [x] Invalid email → inline field error (`errors.email.message`).
- [x] Submit disabled while loading; button shows `Loader2` spinner + "Signing in…" / "Sending link…" text.
- [x] Forgot password success state replaces form entirely with success alert + back link.
- [x] Tab order: email → password → show/hide toggle → forgot link → submit.
- [x] `npm run lint` — clean.
- [x] `npm run build` — green (3.67s). New chunks: `LoginPage` 3.57 KB / 1.64 KB gz, `ForgotPasswordPage` 2.09 KB / 1.03 KB gz, shared `schema` (zod + RHF resolver) 86.77 KB / 26.3 KB gz.
- [ ] Commit: `feat(ui): auth screens static`.

---

**Next:** [05-dashboard.md](./05-dashboard.md)
