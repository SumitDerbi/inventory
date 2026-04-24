# Step 14 — Admin (Users, Roles, Settings) (Static UI)

> Before this: [13-reports.md](./13-reports.md)
> Spec: [docs/development_spec.md `users` table + Module 10](../../docs/development_spec.md)

---

## Objective

Static UI for user management, role-based access, and system settings.

---

## Sub-screens

1. **Users List** — `/users`
   - Columns: Name, Email, Role, Department, Status, Last Login, Actions.
   - Create/edit drawer: name, email, mobile, employee code, department, designation, role, active toggle, profile photo upload, notes.
2. **Roles & Permissions** — `/users/roles`
   - List of roles; detail shows permission matrix (module × action: view/create/edit/delete/approve).
3. **Settings** — `/settings`
   - Tabs: `Company Profile`, `Numbering Series` (inquiry/quotation/order/dispatch), `Tax Rules`, `Payment Terms`, `Email Templates`, `Notification Channels`, `Integrations`.
   - Each tab: simple form with save button (UI only).
4. **Profile** — `/profile` — current-user view with change password dialog.
5. **Notification Center** — `/notifications` full list page (bell shows dropdown of last 5 + link here).

---

## Verification

- [ ] Role matrix displays all modules × actions and toggles visibly.
- [ ] Numbering series preview shows next value based on pattern input.
- [ ] Email template tab has WYSIWYG placeholder + variable pills.
- [ ] Change password dialog enforces strength rules (UI only).
- [ ] Commit: `feat(ui): admin module static`.

---

**Next:** [15-static-deploy.md](./15-static-deploy.md)
