# Step 16 — UI Gap Closure (search, bulk actions, sessions, 2FA, customer merge)

> Before this: [15-static-deploy.md](./15-static-deploy.md)
> Reason: backend plan (Phase 2) added endpoints whose UI affordances were never wired in Phase 1. This step adds those affordances so Phase 3 wiring is mock → real swap only.

---

## Objective

Five additions, all mock-backed, all matching shapes the Phase 2 API will return.

1. **Global search** in Topbar.
2. **Bulk select + bulk actions** on Inquiries and Orders lists.
3. **Active sessions** section on ProfilePage.
4. **Two-factor auth** toggle on ProfilePage (TOTP).
5. **Customers module** with **merge** flow.

---

## 16.1 — Global search (Topbar)

### Mock

Add `frontend/src/mocks/search.ts`:

```ts
export interface SearchResult {
  id: string;
  type: 'inquiry' | 'quotation' | 'order' | 'job' | 'document' | 'customer';
  title: string;          // e.g. "INQ-2026-014 — Acme Pumps"
  subtitle: string;       // small line under title
  href: string;           // route link
  matchedField: string;   // "number", "customer", "tag" etc.
}

export function searchAll(q: string): SearchResult[];
```

Implementation: scan existing module mocks (`inquiries`, `quotations`, `orders`, `jobs`, `documents`, `customers` once added), score by prefix/substring, return top 8 grouped by `type`.

### UI

- Topbar gets a search input (left of notifications dropdown), placeholder `Search inquiries, quotes, orders...`, keyboard shortcut `Ctrl+K` / `⌘K`.
- Click or `Ctrl+K` opens a command palette dialog (`@/components/ui/CommandDialog` — new wrapper around Radix Dialog) with grouped results.
- Empty state with "Try `INQ-`, `QT-`, `SO-`, customer name, document tag".
- Up/Down arrow navigation, `Enter` to navigate.
- Mobile: full-screen sheet.

### Verification

- [ ] `Ctrl+K` and click both open the palette.
- [ ] Typing 2+ chars renders grouped results within 16ms (mock).
- [ ] `Esc` closes; `Enter` navigates and closes.
- [ ] No layout shift in topbar at any breakpoint.
- [ ] Commit: `feat(ui): global search palette (Ctrl+K)`.

---

## 16.2 — Bulk select + bulk actions (Inquiries + Orders)

### Affordances

Both list pages (`InquiriesPage.tsx`, `OrdersPage.tsx`) gain:

- Leading checkbox column with header "select all on page".
- Sticky bulk-action bar that slides in when ≥ 1 row selected (matches existing DocumentsPage pattern).
- Actions per module:

  **Inquiries**
  - Reassign to user… (opens dialog with user picker).
  - Change status… (opens dialog with allowed transitions).
  - Mark lost… (with reason).
  - Export selected (CSV / Excel / PDF).

  **Orders**
  - Reassign to user…
  - Mark ready for dispatch (only allowed when stage permits; disabled per row otherwise).
  - Export selected.

### Mocks

No new mock files. Add helpers in existing `inquiriesService` / `ordersService` mocks (or inline in the page) for bulk reassign / status change that mutate in-memory and toast.

### Rules

- Selection persists across pagination only when same filter set; cleared on filter change.
- Bulk action button in the bar disabled while any selected row is in a state that doesn't allow the action (with hover tooltip naming the offending IDs).
- Confirmation dialog before destructive actions (lost, cancel).

### Verification

- [ ] Select-all toggles only current page rows; partial state when some rows already selected.
- [ ] Bulk reassign updates owner column for all selected; toast shows count.
- [ ] Bulk lost requires reason; cannot submit empty.
- [ ] Filter change clears selection.
- [ ] Keyboard: `Shift+click` range selects.
- [ ] Commit: `feat(ui): bulk actions on inquiries + orders`.

---

## 16.3 — Active sessions (Profile)

### Mock

Add to `frontend/src/mocks/admin.ts` (or new `mocks/sessions.ts`):

```ts
export interface ActiveSession {
  id: string;
  device: string;        // "Chrome on Windows 11"
  ip: string;
  location: string;      // "Mumbai, IN"
  lastSeenAt: string;
  current: boolean;
}

export const activeSessions: ActiveSession[] = [...];
```

### UI

In `ProfilePage.tsx`, add a "Signed-in devices" section under "Change password":

- List of session cards: device + ip + location + last seen + "Current" badge or `Sign out` button.
- "Sign out everywhere else" button at the section header (confirms via dialog).
- Empty state never shown (current session always exists).

### Verification

- [ ] Current session is listed with badge and disabled `Sign out`.
- [ ] `Sign out` on another row removes it with toast.
- [ ] `Sign out everywhere else` removes all non-current rows.
- [ ] Commit: `feat(ui): active sessions on profile`.

---

## 16.4 — Two-factor auth toggle (Profile)

### Mock

Add `frontend/src/mocks/auth-2fa.ts`:

```ts
export interface TwoFactorState {
  enabled: boolean;
  method: 'totp' | null;
  enrolledAt: string | null;
}
export const twoFactor: TwoFactorState = { enabled: false, method: null, enrolledAt: null };
export function enable2FA(): { secret: string; otpauth: string; qrSvg: string };
export function confirm2FA(code: string): boolean;  // mock: accepts "123456"
export function disable2FA(password: string): boolean;
```

### UI

In `ProfilePage.tsx`, add a "Two-factor authentication" section:

- When disabled: card with `Enable 2FA` button.
- Enable flow (modal, 3 steps):
  1. Show QR code + manual secret + recovery codes (downloadable as txt).
  2. Ask user to enter 6-digit code from authenticator app.
  3. Success state.
- When enabled: shows method (TOTP), enrolled date, `Disable 2FA` (requires current password).
- Recovery codes section with regenerate button.

### Notes

- Pure UI — no real OTP library. Mock generates a fake `secret`, returns inline SVG QR (use `qrcode` lib or static SVG placeholder).
- `confirm2FA` accepts only `123456` for the demo; non-match shows error.

### Verification

- [ ] Enable wizard reaches step 3 only when `123456` entered.
- [ ] Recovery codes downloadable; regenerate replaces them.
- [ ] Disable requires password; mock accepts `password123`.
- [ ] Commit: `feat(ui): 2FA setup wizard on profile`.

---

## 16.5 — Customers module + merge

### Mock

Currently no `customers` page exists; only used as nested data on inquiries/orders. Add proper module.

`frontend/src/mocks/customers.ts`:

```ts
export interface Customer {
  id: string;
  name: string;
  legalName?: string;
  gstNumber?: string;
  pan?: string;
  primaryContact: { name: string; phone: string; email: string };
  addresses: { id: string; line1: string; city: string; state: string; pincode: string; type: 'billing' | 'shipping' }[];
  industry?: string;
  territory?: string;
  segment?: 'enterprise' | 'mid_market' | 'sme';
  status: 'active' | 'inactive';
  totalOrders: number;
  lifetimeValue: number;
  createdAt: string;
}

export const customers: Customer[] = [...];     // ~30 rows
export function searchCustomers(q: string): Customer[];
export function findDuplicates(c: Customer): Customer[];   // by mobile / email / GST
export function mergeCustomers(sourceId: string, targetId: string): Customer;
```

### Pages

- `/customers` — list (table: name, GST, primary contact, segment, lifetime value, status). Filters: status, segment, territory. Search.
- `/customers/:id` — detail with tabs: **Overview**, **Contacts**, **Addresses**, **Orders**, **Quotations**, **Documents**, **Activity**.
- `/customers/new` — create form (with dedupe check on blur of mobile/email/GST → shows match suggestions).

### Merge flow

Trigger:
1. From customer list — select 2 rows → "Merge…" action button.
2. From detail page — "Find duplicates" button → opens dialog showing potential matches (`findDuplicates()`); pick a match → opens merge wizard.

Merge wizard (modal, 3 steps):
1. **Choose target** — left pane (source, will be merged away), right pane (target, kept). Toggle to swap.
2. **Resolve conflicts** — for each field that differs (name, gst, pan, addresses, contacts), radio choose source / target / both (multi-value fields).
3. **Confirm** — diff summary + warning "All inquiries, quotations, orders, jobs, documents linked to source will move to target. Source will be archived." → checkbox "I understand", `Merge` button.

After merge: toast, redirect to target detail; source becomes 404 / shows "Merged into <target>" stub.

### Verification

- [ ] List + detail + create routes registered, sidebar entry under "Masters".
- [ ] Dedupe on create flags matches by phone/email/GST and offers "Use existing" CTA.
- [ ] Merge wizard 3-step flow; cannot proceed without resolving every conflict.
- [ ] Confirm step requires checkbox.
- [ ] Source customer post-merge shows merged-into banner.
- [ ] Commit: `feat(ui): customers module + merge wizard`.

---

## Cross-cutting

- Update `frontend/src/app/navConfig.ts` to add Customers under Masters.
- Update `frontend/src/app/router.tsx` with new routes (`/customers`, `/customers/:id`, `/customers/new`).
- Update `frontend/src/mocks/index.ts` exports.
- Tailwind + lucide-react only; no new heavy deps. For QR, use `qrcode` (small).

## Dependencies to add

```bash
cd frontend
npm i qrcode
npm i -D @types/qrcode
```

## Tests

Light pass — Phase 1 has no Vitest yet. Manual checklist in each Verification block.

## Step exit

- [ ] All 5 sub-steps ticked.
- [ ] `npm run build` clean; bundle size delta ≤ 25 KB gzipped (qrcode is the only new dep).
- [ ] Lighthouse a11y ≥ 90 retained.
- [ ] Commit per sub-step (5 commits total).

---

**Next:** Phase 2 implementation — [../phase-2-backend-api/01-django-setup.md](../phase-2-backend-api/01-django-setup.md).
