# Step 11 — Engineer & Installation Jobs (Static UI)

> Before this: [10-dispatch.md](./10-dispatch.md)
> Spec: [docs/development_spec.md Module 6](../../docs/development_spec.md), [docs/project_details.md §6](../../docs/project_details.md)

---

## Objective

Static UI for job scheduling, engineer assignment, mobile-friendly job execution, checklists, commissioning reports.

---

## Sub-screens

1. **Jobs List** — `/jobs`
   - Columns: Job #, Order #, Customer, Site, Engineer, Schedule, Status, Priority.
   - Filters: status, engineer, date range, product category.
2. **Job Detail** — `/jobs/:id`
   - Header: status (Scheduled → In Progress → Completed → Signed Off), priority.
   - Tabs: `Overview`, `Checklist`, `Photos`, `Commissioning Report`, `Observations`, `Activity`.
   - **Checklist tab**: grouped checklist items with check / NA / fail + remark; overall progress bar.
   - **Photos**: grid of uploaded photos (dropzone stub, lightbox view).
   - **Commissioning Report**: form with test readings + upload signed PDF.
   - **Observations**: free-text notes with severity tag.
3. **Engineers** — `/users/engineers`
   - Profiles with skill matrix (product categories × proficiency).
4. **Scheduler view** — `/jobs/calendar`
   - Weekly calendar grid per engineer; click cell → create/reassign job.
5. **Mobile view** — responsive at `<768px` keeps job detail usable with single-column tabs + large tap targets.

---

## Mock data

- `src/mocks/jobs.js`, `mocks/engineers.js`, `mocks/checklistTemplates.js`.

---

## Verification

- [ ] Checklist completion % computed from items and updates progress bar.
- [ ] Photo grid supports lightbox preview.
- [ ] Scheduler view prevents double-booking (visual conflict indicator).
- [ ] Job detail is usable at 360 px width (no horizontal scroll).
- [ ] Commit: `feat(ui): jobs + engineer module static`.

---

**Next:** [12-documents.md](./12-documents.md)
