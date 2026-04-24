# Step 14 — Admin (Users, Roles, Settings) (Static UI)

> Before this: [13-reports.md](./13-reports.md)
> Spec: [docs/development_spec.md `users` table + Module 10](../../docs/development_spec.md)

---

## Objective

Static UI for user management, role-based access, and system settings.

---

## ✅ Delivered

### Mocks

- **`frontend/src/mocks/users.ts`** — extended (backward-compatible):
  - `UserRole` union: `admin | sales_manager | sales_executive | inventory | dispatch | engineer | accounts`.
  - Optional fields on `MockUser`: mobile, employeeCode, department, designation, active, lastLoginAt, notes, avatarColor.
  - `ROLE_LABEL`, `ROLE_TONE`, `DEPARTMENTS` const.
  - 11 seeded users (added Neha Gupta — accounts).
  - `CURRENT_USER_ID = 'u-5'` (Vihaan Shah, admin).
- **`frontend/src/mocks/admin.ts`** (new, ~700 LOC):
  - Permissions: `PermissionAction` (view/create/edit/delete/approve) × `PermissionModule` (10 modules) → `PermissionMatrix`.
  - `ROLES: RoleDef[]` — 7 entries built via `buildMatrix()` with `allTrue/noAccess/viewOnly/editOnly` helpers.
  - `companyProfile`, `numberingSeries` (6 docs, token pattern `{prefix}/{fy}/{seq:N}`), `taxRules` (5 GST slabs), `paymentTerms` (5), `emailTemplates` (5 with subject/body/variables), `notificationChannels` (4), `integrations` (7).
  - `notifications` (12 items), `NOTIFICATION_KIND_LABEL`/`_TONE`, `notificationsSummary()`, `previewSeries()`.

### Pages

- **`pages/admin/UsersPage.tsx`** — `/users`. 4 summary cards (Total/Active/Admins/Engineers) + FilterBar (search, role, status). DataTable: avatar+name button, email, role Badge, department, status, lastLogin. Right-side Sheet drawer for create/edit (name, email, mobile, emp code, dept, designation, role, photo upload mock, active toggle, notes) with toast-driven save/delete.
- **`pages/admin/RolesPage.tsx`** — `/users/roles`. Two-col layout: 7-role aside (icon, name, user count, description) + permission matrix (10 modules × 5 actions) with toggle buttons (Check/X) + Bulk All/None per module.
- **`pages/admin/SettingsPage.tsx`** — `/settings`. Vertical tabs aside (260px) + main panel for 7 tabs:
  - **Company Profile**: 14 fields incl. GSTIN, PAN, CIN, address, logo upload mock.
  - **Numbering Series**: editable table (prefix, pattern, next #, FY reset) with live preview using `previewSeries`.
  - **Tax Rules**: read-only GST slab table.
  - **Payment Terms**: divide-y list.
  - **Email Templates**: 5-template list + editor (subject/body, variable pills as chips).
  - **Notification Channels**: list with custom toggle switches.
  - **Integrations**: card grid (connected/available/error states with icon + tone badge).
- **`pages/admin/ProfilePage.tsx`** — `/profile`. Avatar aside (initials, role badge, meta dl) + editable form (name/mobile/designation/notes; email disabled). `ChangePasswordDialog` enforces 4 strength rules (length≥8, uppercase, number, symbol) live + confirm-match check.
- **`pages/admin/NotificationCenterPage.tsx`** — `/notifications`. Summary strip (Total/Unread/This week) + FilterBar (search, module, read state). List with kind icon, title, body, badge, unread dot, relative time, optional link. Mark all read button.

### Routing & Topbar

- **`app/router.tsx`** — added lazy routes for `users/roles`, `profile`, `notifications`.
- **`layouts/Topbar.tsx`** — bell dropdown now uses real `notifications.slice(0,5)` with unread count + footer "View all" → `/notifications`. Profile dropdown links go to `/profile`.

---

## Verification

- ✅ Role matrix shows all 10 modules × 5 actions and toggles visibly.
- ✅ Numbering series preview substitutes `{prefix}/{fy}/{seq:N}` live as user types.
- ✅ Email template tab shows variable pills (e.g. `{customer_name}`) and placeholder body editor.
- ✅ Change password dialog: live rule ticks (4 rules), confirm mismatch error, submit disabled until valid.
- ✅ Notification center filters by module + read state with empty state.
- ✅ `npm run lint` — 0 errors (pre-existing watch() warning unchanged).
- ✅ `npm run build` — succeeded in 40.65s. Chunk sizes: UsersPage 8.42 kB, RolesPage 4.77 kB, SettingsPage 18.37 kB, ProfilePage 6.15 kB, NotificationCenterPage 4.73 kB.

---

## Commit

`feat(ui): admin module static`

---

**Next:** [15-static-deploy.md](./15-static-deploy.md)
