# Step 06 — Inquiry Module (Static UI)

> Before this: [05-dashboard.md](./05-dashboard.md)
> Spec: [docs/development_spec.md §Module 1](../../docs/development_spec.md), [docs/ui_spec.md Inquiry screens](../../docs/ui_spec.md), [docs/project_details.md §1](../../docs/project_details.md)

---

## Objective

Build every screen of the Inquiry lifecycle with mock data: list, detail, create/edit, status workflow, follow-ups, activity timeline, attachments.

---

## Sub-screens

1. **Inquiry List** — `/inquiries`
   - `<PageHeader>` with "New Inquiry" primary button.
   - `<FilterBar>`: search, status multi-select, priority, source, assigned-to, date range, export menu (CSV/Excel/PDF — UI only).
   - `<DataTable>` columns: Inquiry #, Date, Customer, Mobile, Project, Source, Type, Priority, Status, Assigned To, Actions (menu).
   - Row click → detail.
   - Bulk select with bulk actions (assign, status change, export) — UI only.
2. **Inquiry Detail** — `/inquiries/:id`
   - Header: inquiry #, status badge, priority badge, actions menu (Edit, Convert to Quotation, Mark Lost, Assign).
   - Tabs: `Overview`, `Requirements`, `Follow-ups`, `Activity`, `Attachments`.
   - Overview: customer info card, project info card, commercial info, lost reason (if lost).
   - Requirements tab: table of requested products/specs with add-row form.
   - Follow-ups tab: scheduled + past, add-new dialog with due date, owner, note.
   - Activity tab: chronological timeline (status changes, comments, assignments, emails).
   - Attachments tab: upload UI (dropzone), list with version + uploader + download.
3. **Inquiry Create / Edit** — `Sheet` drawer (right side) from list page.
   - Sections: Source & Type, Customer (dedupe hint on mobile/email/GST), Project, Commercial, Assignment.
   - Field-level validation via zod (required/regex) even though static.
   - Save → close sheet, toast success.
4. **Convert to Quotation** dialog — confirm + create placeholder quotation ID, navigate to quotation detail stub.
5. **Mark Lost** dialog — required `lost_reason` textarea.

---

## Mock data

- `src/mocks/inquiries.js` — ≥ 30 inquiries across every status, source, priority, type combination.
- `src/mocks/inquirySources.js`, `mocks/productCategories.js`.

---

## Verification

- [ ] Every field from [development_spec.md `inquiries` table](../../docs/development_spec.md) is represented in create/edit + detail.
- [ ] All 6 status values render with correct badge colors.
- [ ] Filter bar filters client-side over mock data.
- [ ] Export menu shows 3 options (CSV/Excel/PDF) — each fires toast "Export queued".
- [ ] Create flow validates required fields (mobile, customer name, source, type, priority).
- [ ] Status transitions gated: "Convert to Quotation" only visible when status ∈ {new, in_progress, quoted}; "Mark Lost" hidden when already lost/converted.
- [ ] Activity timeline shows at least 6 event types.
- [ ] Follow-ups dialog accepts future dates only.
- [ ] Commit: `feat(ui): inquiry module static`.

---

**Next:** [07-quotations.md](./07-quotations.md)
