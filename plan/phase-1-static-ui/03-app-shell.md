# Step 03 — App Shell (Sidebar, Topbar, Router)

> Before this: [02-design-system.md](./02-design-system.md)
> Spec: [docs/ui_spec.md §App Shell](../../docs/ui_spec.md)

---

## Objective

Build the persistent shell that hosts every authenticated page, plus the routing skeleton with placeholder pages for all modules.

---

## Steps

1. **Router** — `src/app/router.jsx` using `createBrowserRouter`.
   - Public routes: `/login`, `/forgot-password`.
   - Protected routes (under `<AppShell/>`): `/dashboard`, `/inquiries`, `/quotations`, `/orders`, `/inventory`, `/dispatch`, `/jobs`, `/documents`, `/reports`, `/users`, `/settings`.
   - `<ProtectedRoute>` stub (always-true for now, real auth in Phase 3).
2. **AppShell layout** — `src/layouts/AppShell.jsx`.
   - Grid: `<Sidebar />` (240 px) + `<main>` with `<Topbar />` + `<Outlet />`.
   - Collapse state persisted in `localStorage`.
3. **Sidebar** — `src/layouts/Sidebar.jsx`.
   - Logo area (`h-16`), nav items (Lucide icons), Admin section separator, bottom user card.
   - Active item uses `bg-blue-600 text-white rounded-lg mx-2` (per spec).
   - Mobile: renders inside shadcn `Sheet` triggered by hamburger.
4. **Topbar** — `src/layouts/Topbar.jsx`.
   - Left: breadcrumb (derived from route meta).
   - Right: notification bell with unread badge + user `DropdownMenu` (Profile, Change password, Logout).
5. **Nav meta** — single source of truth in `src/app/navConfig.js`:
   ```js
   [{ label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, section: 'main' }, ...]
   ```
6. **Placeholder pages** — one per route, each a `<PageHeader>` + empty `<EmptyState>` so routing works end-to-end.
7. **404** page.
8. **Responsive**:
   - `<768px`: sidebar hidden, hamburger opens Sheet.
   - `768–1024px`: sidebar collapses to icon-only (`w-16`).
   - `>1024px`: full sidebar.
9. **Page transitions** — `<FadeIn>` wrapper around `<Outlet />`.

---

## Verification

- [ ] Every nav item routes to its placeholder page.
- [ ] Active state highlights correctly, breadcrumb updates.
- [ ] Sidebar collapse toggle works; state survives reload.
- [ ] Responsive: resize from 360→1440 — no overflow, no clipped text.
- [ ] Notification bell dropdown shows 3 dummy items.
- [ ] User dropdown logout navigates back to `/login`.
- [ ] Keyboard: Tab reaches every nav item; `Enter` activates.
- [ ] Commit: `feat(ui): app shell + router + placeholder pages`.

---

**Next:** [04-auth.md](./04-auth.md)
