# Step 01 — API Client + React Query Setup

> Before this: [00-overview.md](./00-overview.md)

---

## Objective

Centralise HTTP + data-fetching so every module follows the same pattern.

---

## Steps

1. **Axios instance** — `src/lib/api.js`:
   - `baseURL` from `import.meta.env.VITE_API_BASE_URL`.
   - Request interceptor: attach `Authorization: Bearer <access>`.
   - Response interceptor: on 401, try refresh once, else redirect `/login`.
   - Global error normaliser → always returns `{ message, fields, status }` shape.
2. **React Query** — provide `QueryClient` at app root with:
   - `defaultOptions.queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false }`.
   - Dev tools in non-prod.
3. **Query key factory** — `src/services/keys.js`:
   ```js
   export const qk = {
     inquiries: {
       all: ["inquiries"],
       list: (f) => ["inquiries", "list", f],
       detail: (id) => ["inquiries", "detail", id],
     },
     // ...
   };
   ```
4. **Service template** — `src/services/_template.js` documenting the pattern (list / retrieve / create / update / delete / custom actions).
5. **Hook template** — `src/hooks/_template.js` for `useList`, `useOne`, `useCreate`, `useUpdate`, `useDelete`, `useAction`.
6. **Global error toast** — from mutation `onError`; field errors surfaced via `useApiForm` helper that maps 400 → `setError`.
7. **Env files** — `.env.development`, `.env.production` with `VITE_API_BASE_URL`.
8. **CORS + auth dev proxy** — Vite `server.proxy` for `/api` to avoid CORS in dev.

---

## Verification

- [ ] Hitting a 401 on any endpoint silently refreshes and retries once.
- [ ] Expired refresh → redirect to `/login`.
- [ ] All 5xx render a consistent error toast.
- [ ] React Query devtools show cached data.
- [ ] Commit: `feat(wire): api client + react query`.

---

**Next:** [02-auth-wiring.md](./02-auth-wiring.md)
