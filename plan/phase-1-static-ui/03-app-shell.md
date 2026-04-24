# Step 03 — App Shell (Sidebar, Topbar, Router) ✅

> Before this: [02-design-system.md](./02-design-system.md)
> Spec: [docs/ui_spec.md §App Shell](../../docs/ui_spec.md)

---

## Objective

Build the persistent shell that hosts every authenticated page, plus the routing skeleton with placeholder pages for all modules.

---

## Delivered

All source is TypeScript (`.tsx` / `.ts`) — the original plan said `.jsx`; switched to `.tsx` to match Step 01's TS template.

### New primitives (`src/components/ui/`)

- `Button.tsx` — CVA variants (`primary | secondary | outline | ghost | danger | link`) × sizes (`sm | md | lg | icon`); `asChild` via `@radix-ui/react-slot`.
- `Sheet.tsx` — Radix Dialog wrapper (`side=left|right|top|bottom`) used for the mobile sidebar drawer.
- `DropdownMenu.tsx` — Radix DropdownMenu wrapper (Content, Item (with `destructive` / `inset`), Label, Separator, Shortcut).

> Decision: skipped the shadcn CLI and pulled in Radix primitives directly so the hand-written Tailwind tokens from Step 02 stay authoritative. Added `tailwindcss-animate` (dev-dep) to power `data-[state]` animations.

### App wiring (`src/app/`)

- `auth-context.tsx` — `AuthProvider` with a mocked signed-in user (Priya Sharma, admin); exposes `useAuth()` → `{ user, isAuthenticated, signIn, signOut }`. Real API wiring lands in Phase 3.
- `ProtectedRoute.tsx` — redirects to `/login` (with `state.from`) when not authenticated.
- `navConfig.ts` — single source of truth for sidebar items + `NAV_BY_PATH` lookup for breadcrumbs.
- `router.tsx` — `createBrowserRouter` with public auth routes, protected `<AppShell>` group (11 modules), `/__kitchen-sink` dev route, and catch-all 404. All pages are `React.lazy` for per-route code-splitting.

### Hooks (`src/hooks/`)

- `useLocalStorage.ts` — typed `useLocalStorage<T>(key, initialValue)` with cross-tab `storage` event sync.

### Layout (`src/layouts/`)

- `Sidebar.tsx` — full (`w-60`) and collapsed-rail (`w-16`) modes, `main` / `admin` sections, user card with initials + logout.
- `Topbar.tsx` — hamburger (mobile), breadcrumb (desktop), notification `DropdownMenu` with red unread badge + 3 dummy items, user `DropdownMenu` (Profile / Change password / Sign out).
- `AppShell.tsx` — composes Sidebar + Topbar + `<Outlet>`, `useLocalStorage('sidebar.collapsed')` for desktop collapse toggle, mobile `Sheet` drawer, `<FadeIn>` route transition, `matchMedia` breakpoint switch.

### Pages (`src/pages/`)

- `dashboard/DashboardPage.tsx` — 4-up `StatCard` grid with INR-formatted revenue + placeholder empty state for charts.
- Shared `_shared/PlaceholderPage.tsx` used by the other 10 modules: `inquiries/`, `quotations/`, `orders/`, `inventory/`, `dispatch/`, `jobs/`, `documents/`, `reports/`, `admin/UsersPage.tsx`, `admin/SettingsPage.tsx`.
- `auth/LoginPage.tsx` — centred card with email/password (demo creds pre-filled); calls `signIn()` + navigates to `state.from || /dashboard`.
- `auth/ForgotPasswordPage.tsx` — email entry → success `ErrorAlert` (variant `success`).
- `NotFoundPage.tsx` — 404 with CTA back to `/dashboard`.

### Entry point

- `src/main.tsx` — now wraps with `<AuthProvider>` + `<Suspense>` + `<RouterProvider>`; `App.tsx` is no longer imported by the app (kitchen sink is reachable at `/__kitchen-sink`).

---

## Verification

- [x] Every nav item routes to its placeholder page (router + lazy chunks built, 11 modules).
- [x] Active state highlights correctly via `NavLink` (`bg-primary text-white`); breadcrumb updates from `NAV_BY_PATH`.
- [x] Sidebar collapse toggle works; state survives reload (`useLocalStorage('sidebar.collapsed')`).
- [x] Responsive: `md:` breakpoint swaps desktop rail ↔ mobile `Sheet`; `matchMedia` listener keeps it live.
- [x] Notification bell dropdown shows 3 dummy items.
- [x] User dropdown logout calls `signOut()` + `navigate('/login', { replace: true })`.
- [x] Keyboard: `NavLink`, `DropdownMenu`, `Sheet` and `Button` all inherit Radix / native focus handling (`focus-visible:ring-primary/40`).
- [x] `npm run lint` — clean.
- [x] `npm run build` — green (504 KB main JS / 161 KB gz; 25.3 KB CSS / 5.6 KB gz; per-route chunks 0.3–11 KB).
- [x] `npm run dev` — boots on http://localhost:5174.
- [x] Commit: `feat(ui): app shell + router + placeholder pages`.

---

**Next:** [04-auth.md](./04-auth.md)
