# Step 18 — Client Portal (Static UI)

> Before this: [17-purchase.md](./17-purchase.md)
> Spec: [docs/development_spec.md Module 8 Client Portal](../../docs/development_spec.md), [docs/ui_spec.md — Portal screens](../../docs/ui_spec.md)
> Backend pair: [../phase-2-backend-api/11b-client-portal-api.md](../phase-2-backend-api/11b-client-portal-api.md)

---

## Objective

Static UI for an external (customer-facing) portal where clients can: view their quotations and approve/reject, track sales-order progress, see dispatch and installation timelines, download documents, raise support tickets, and read portal notifications. Mocks only — no API calls. Lives under a separate `/portal/*` route tree with its own minimal shell (no internal sidebar; portal-tone branding).

The portal **reuses internal primitives** wherever possible (`Card`, `Badge`, `Button`, `FormField`, `DataTable`, `Tabs`, `Drawer`, `Stepper`) so visual polish is free; what differs is the layout chrome, navigation, and the field set (internal margins, costs, and assignees are hidden).

---

## Mocks

Create under `frontend/src/mocks/portal/`:

- `client-users.ts`
  - `ClientUser` interface — id, organization_id, customer_id (FK to existing `customers.ts`), name, email, mobile, role (`primary | viewer | accounts`), status (`active | invited | disabled`), last_login.
  - 6 client users across 3 customer organizations.
  - Helpers: `clientUserById`, `currentClientUser()` (returns a fixed mock user for development; in Phase 3 this is replaced by the portal JWT subject).

- `portal-orders.ts`
  - Re-projection of `sales-orders.ts` filtered by `customer_id`, with internal fields stripped (margin, cost_price, internal_notes, assigned_to, audit metadata).
  - Includes a `timeline` helper that flattens dispatch + installation milestones into one chronological list per order.

- `portal-quotations.ts`
  - Re-projection of `quotations.ts` filtered by `customer_id` and `status in (sent | revised | approved | rejected)`. Hides cost columns and internal margin %.
  - Helpers: `portalQuotationById`, `canApprove(q)` (true when status is `sent` or `revised` and within validity window).

- `portal-dispatches.ts`
  - Re-projection of `dispatches.ts`; exposes challan number, transporter, vehicle, ETA, status. Hides internal cost.
  - Helper: `trackById(id)` returns the status timeline.

- `portal-jobs.ts`
  - Re-projection of `jobs.ts`; engineer name only (no contact), schedule, completion %, customer-rateable status. Hides assigned engineer's mobile and internal remarks.
  - Helper: `feedbackHistory(jobId)`.

- `portal-documents.ts`
  - Filtered view of `documents.ts` where `sensitivity === 'public'` AND linked entity belongs to current org.
  - Helpers: `portalDocsForEntity`, `signedDownloadUrl(docId)` (mock — returns a fake `https://files.example/...` string).

- `portal-tickets.ts`
  - `SupportTicket` — id, subject, body, attachments[], status (`open | in_progress | resolved | closed`), priority, created_at, last_reply_at, replies[].
  - 8 tickets across the 3 orgs in mixed statuses.

- `portal-notifications.ts`
  - `PortalNotification` — id, kind (`quotation.sent`, `order.shipped`, `job.scheduled`, `document.uploaded`, `ticket.replied`), title, body, read, link, created_at.
  - 12 notifications.

Cross-references: portal mocks **read from** the existing internal mocks via the helpers; they never duplicate row data. This keeps mock-state consistent across staff and portal views.

---

## Pages

Create under `frontend/src/pages/portal/`:

- `PortalShell.tsx` — minimal layout: branded topbar (org logo + customer name + bell + avatar dropdown), no sidebar; mobile-first responsive bottom nav (Home / Orders / Quotes / Documents / Tickets). `<Outlet/>` renders pages. Distinct route tree at `/portal/*`.

- `PortalLoginPage.tsx` (`/portal/login`)
  - Email + password, "Forgot password" link, branded panel. Submits to mock auth that sets a `portalUser` in a small Zustand store (or Context) and redirects to `/portal/home`.
  - Variants: `/portal/forgot`, `/portal/reset/:token`.

- `PortalHomePage.tsx` (`/portal/home`)
  - Hero card: "Hello, {name} — here's what's happening on your projects."
  - 4 KPI tiles: Pending quote approvals · Orders in progress · Upcoming dispatches · Open tickets.
  - Two columns: latest activity feed (mix of timeline events) + pinned documents.

- `PortalOrdersListPage.tsx` (`/portal/orders`)
  - FilterBar: status, project, date range, search.
  - Columns: Order #, PO ref, Project, Items, Stage (badge), Expected delivery, Last update.

- `PortalOrderDetailPage.tsx` (`/portal/orders/:id`)
  - Header card: order #, customer PO #, project, total (no margin), stage badge.
  - Tabs: Overview · Timeline · Items · Dispatches · Jobs · Documents.
  - Timeline tab uses `Stepper` to render confirmed → ready → dispatched → installed → closed with timestamps.

- `PortalQuotesListPage.tsx` (`/portal/quotations`)
  - Columns: Quote #, Project, Total, Status, Validity, Sent on. "Approve" / "Reject" inline actions when allowed.
  - Status colours mirror staff colours.

- `PortalQuoteDetailPage.tsx` (`/portal/quotations/:id`)
  - Two columns: line-items table (no margin column) + sticky action card (Approve / Reject with reason / Download PDF).
  - Approve flow opens a confirmation dialog requiring "Type APPROVE to confirm" with name + designation captured for audit.
  - Reject flow opens a Sheet with reason picker + free-text.
  - Both call mock helpers that flip status and append a row to the quotation's audit array.

- `PortalDispatchesPage.tsx` (`/portal/dispatches`)
  - List with track button → opens a tracking drawer (Stepper of status events + transporter info + ETA).

- `PortalJobsPage.tsx` (`/portal/jobs`)
  - List of installation jobs; click → schedule + engineer name + checklist preview.
  - Per-job `Leave feedback` action opens a Sheet with star rating + comment.

- `PortalDocumentsPage.tsx` (`/portal/documents`)
  - Filter by entity type, project, date.
  - Cards or list with inline preview for images/PDFs; download button uses `signedDownloadUrl` mock.

- `PortalTicketsListPage.tsx` (`/portal/tickets`) + `PortalTicketDetailPage.tsx` (`/portal/tickets/:id`)
  - List with status filter; "+ New ticket" Sheet captures subject + body + attachments.
  - Detail shows reply thread (customer + support rep) with composer at the bottom.

- `PortalNotificationsPage.tsx` (`/portal/notifications`)
  - Bell dropdown shows last 8; full page lists all with mark-read / mark-all-read actions.

- `PortalProfilePage.tsx` (`/portal/profile`)
  - Read-only org details + edit-only fields: name, mobile, password change.

---

## Routing & shell wiring

- Add `<Route path="/portal/*">` tree in `frontend/src/app/router.tsx` outside the staff layout. The internal Sidebar / Topbar is **not** rendered for portal routes.
- A small `PortalAuthGuard` checks the mock store and redirects to `/portal/login` if absent.
- A staff-side hidden link `/portal-preview` (admin-only) lets internal users impersonate the portal experience for the demo (toggles the mock `currentClientUser` between the 3 mock orgs).

---

## Cross-module wiring (mock only)

- Quotation **Send** action in staff UI (`QuotationDetailPage`) shows a hint: "Visible at /portal/quotations/{id} once portal is enabled."
- Sales-order **Stage advance** mock helper appends a portal-visible timeline event.
- GRN **Post to stock** doesn't touch portal data; only when a dispatch is created and shipped does the portal `track` show progress.

---

## Reused primitives

`Card`, `Badge`, `Button`, `FormField`, `Input`, `Textarea`, `DataTable`, `Tabs`, `Sheet`, `Dialog`, `Stepper`, `Toast`, `EmptyState`, `Attachments`. **Do not duplicate** — import from existing folders. Branding differences (portal accent colour, font weight on hero) are handled via a single `data-theme="portal"` attribute on `PortalShell` and a small Tailwind override in `index.css`.

---

## Verification

- [ ] `/portal/login` reachable; mock auth sets store and redirects to home.
- [ ] All 9 portal pages render without console errors.
- [ ] Approve / Reject actions on a quotation update its status in the shared mock store, and the staff UI sees the change on next render.
- [ ] Documents list never shows `internal` or `confidential` rows.
- [ ] Cost / margin / assignee columns are absent from every portal page (snapshot test or manual screenshot diff).
- [ ] Lighthouse ≥ 90 on the portal preview URL.
- [ ] Bundle: portal route tree code-split (lazy chunk).
- [ ] Commit: `feat(portal): static UI (auth + orders + quotations + dispatches + jobs + documents + tickets + notifications)`.

---

**Next:** [19-customer-invoices.md](./19-customer-invoices.md)
