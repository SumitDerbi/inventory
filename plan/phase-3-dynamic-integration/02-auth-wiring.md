# Step 02 — Auth Wiring + Route Guards + Token Refresh

> Before this: [01-api-client.md](./01-api-client.md)

---

## Objective

Replace stubbed login with real JWT flow, add protected routes, role-based rendering.

---

## Steps

1. **Token storage decision** — **preferred**: `httpOnly` cookie set by API; fallback: memory + refresh in `httpOnly` cookie. No `localStorage` for tokens.
2. **AuthContext** — `src/app/AuthProvider.jsx`
   - State: `user`, `isLoading`, `isAuthenticated`.
   - On mount: call `GET /api/auth/me`; on 401 treat as anonymous.
   - `login(email, pw)` → call API → set user → navigate `/dashboard`.
   - `logout()` → call API → clear → navigate `/login`.
3. **ProtectedRoute** — redirects to `/login` preserving `?next=`.
4. **RoleGate** — component for rendering nav items / buttons based on permissions.
5. **LoginPage wiring** — replace setTimeout stub with real mutation; map 401 to field-level or form-level alert.
6. **ForgotPassword + Reset** — wire to `/api/auth/forgot` and `/api/auth/reset`.
7. **Change password dialog** (from Topbar user menu) — wired to `/api/auth/change-password`.
8. **Silent refresh** — axios interceptor handles.

---

## Verification

- [ ] Fresh browser → `/dashboard` redirects to `/login?next=/dashboard`.
- [ ] Successful login returns to `next` path.
- [ ] Logout clears state and blocks the back button from showing protected data.
- [ ] A non-admin cannot see Users / Settings nav items; direct URL shows `403` page.
- [ ] Token refresh happens transparently mid-session (simulate by shortening access TTL).
- [ ] Commit: `feat(wire): auth + route guards`.

---

**Next:** [03-modules-wiring.md](./03-modules-wiring.md)
