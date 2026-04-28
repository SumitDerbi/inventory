# Step 20 — Approvals Inbox (Static UI)

> Before this: [19-customer-invoices.md](./19-customer-invoices.md)
> Spec: cross-cutting — see [docs/development_spec.md §Approvals](../../docs/development_spec.md), [docs/ui_spec.md §3](../../docs/ui_spec.md)
> Backend pair: new endpoint group `/api/v1/approvals/*` to be added in [../phase-2-backend-api/04b-settings-api.md](../phase-2-backend-api/04b-settings-api.md) (or its own micro-step).

---

## Objective

Provide a single page where any approver sees every record awaiting their action across modules — Quotations, Sales Orders (amendments), Purchase Requisitions, Purchase Orders, Vendor Invoices, Purchase Returns. Today, approvals appear only as banners on each detail page; users have no aggregate view. This page **does not replace** the per-detail banners — it complements them and links into the same approval action dialogs.

---

## Mocks

Create `frontend/src/mocks/approvals.ts`:

- `ApprovalRequest` interface — id, kind (`quotation | so_amendment | pr | po | vendor_invoice | purchase_return`), entity_id, entity_label (e.g. "PO-2425-0123"), entity_link (`/purchase/orders/po-123`), submitted_by (user ref), submitted_at, level (1..N), level_role (e.g. `purchase_manager`), amount (INR), aging_hours, sla_status (`on_track | due_soon | breached`), priority, summary (short string), required_action_label.
- Helpers:
  - `approvalsForRole(role)` — returns requests where the next pending level matches the given role.
  - `approvalsForUser(userId)` — same but filtered by direct assignment when present.
  - `approveMock(id, comment?)` / `rejectMock(id, reason)` — flip the underlying entity's approval array entry and remove from inbox; emits a Toast.
  - `approvalKpis()` — counts by kind + counts by SLA bucket + total value pending.

The mock **derives** rows from existing approval arrays already present on quotations, POs, etc. — no row duplication. Adding a new approval to any module automatically surfaces in the inbox.

---

## Pages

Create under `frontend/src/pages/approvals/`:

- `ApprovalsInboxPage.tsx` (`/approvals`)
  - Breadcrumb root entry under "Workspace" group in sidebar.
  - Header: "My approvals" + role chip + a "Switch role" demo dropdown (mock-only, lets the demo client see different inboxes).
  - KPI strip: Awaiting me · Due in 24 h · Breached · Total value pending.
  - FilterBar: kind multi-select, priority, SLA status, amount range, submitted-by search, date range.
  - Table columns: Kind (icon + badge), Reference (link), Summary, Submitted by, Submitted at (relative + absolute), Amount, Level, SLA (chip — `On track` emerald, `Due soon` amber, `Breached` red), Actions (`View`, `Approve`, `Reject`).
  - Row click → navigates to the entity's detail page (`entity_link`) where the existing approval banner is the source-of-truth action surface.
  - Inline `Approve` / `Reject` use the **same** dialogs as the per-detail banners (extracted into `ApprovalActionDialog` so both surfaces share UX). Approve dialog: optional comment. Reject dialog: required reason picker + free text.
  - Bulk: select rows of the same kind → Bulk approve (with confirmation listing all references) or Bulk reject (single reason applied to all). Disabled if mixed kinds selected.

- `ApprovalHistoryPage.tsx` (`/approvals/history`)
  - Tab on the same layout. Shows last 90 days of completed approval actions by the current user, sortable by date / kind, with a CSV export.

---

## Shared component

Create `frontend/src/components/approvals/ApprovalActionDialog.tsx`:

- Single dialog used by:
  1. The new inbox page (inline + bulk).
  2. Existing per-detail banners across Quotations, SO amendments, PRs, POs, Vendor Invoices, Purchase Returns.
- Props: `kind`, `entity`, `mode: 'approve' | 'reject'`, `bulk?: { ids: string[] }`, `onConfirm`.
- Refactor existing per-detail banner buttons to import this dialog. Net effect: one consistent approve/reject UX across the app.

---

## Routing & nav wiring

- Add an `Approvals` link in the sidebar at the top under a new `── Workspace ──` divider above the Sales group, with a small badge showing "awaiting me" count derived from `approvalKpis()`.
- Topbar bell **also** surfaces approval notifications; clicking one navigates to `/approvals` (deep-linked to that row).
- `searchAll()` does not need to scan approvals (they're queryable via the inbox filter), but the inbox row's `entity_link` is the canonical navigation.

---

## Cross-module wiring (mock only)

- Each module's `submitForApproval()` mock helper writes into the approvals derived list automatically (no extra plumbing — derivation pulls from the entity's `approval_levels[]`).
- Notifications module emits `approval.requested` when a new pending row appears for a role; clicking it lands on the inbox filtered to that row.

---

## Verification

- [ ] `/approvals` lists pending requests across all six entity kinds.
- [ ] Filter combinations work; SLA chips reflect mocked aging buckets correctly.
- [ ] Inline Approve / Reject use `ApprovalActionDialog` and update the underlying entity's approval array (visible in the per-detail banner on next render).
- [ ] Bulk approve restricted to same-kind selection; confirmation lists every reference.
- [ ] Per-detail banner Approve / Reject buttons now also use `ApprovalActionDialog` (single dialog, two entry points).
- [ ] Sidebar badge updates as rows are approved/rejected.
- [ ] Empty state copy: "Nothing waiting for you. Nice."
- [ ] Bundle: approvals page lazy-loaded.
- [ ] Commit: `feat(approvals): central inbox + shared approve/reject dialog`.

---

**Next:** Phase 1 complete. Proceed to [../phase-2-backend-api/00-overview.md](../phase-2-backend-api/00-overview.md).
