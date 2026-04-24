# Step 12 — Documents (Static UI)

> Before this: [11-jobs-engineer.md](./11-jobs-engineer.md)
> Spec: [docs/project_details.md §7 Documents](../../docs/project_details.md)

---

## Objective

Central document vault with versioning, access control UI, preview.

---

## Sub-screens

1. **Documents List** — `/documents`
   - Columns: Name, Linked Entity (inquiry/order/job), Type, Version, Uploaded By, Date, Size.
   - Filters: entity type, doc type, uploader, date range.
   - Bulk download (UI stub).
2. **Document Detail Drawer** — version history, download each version, share link (copy), access list.
3. **Upload dialog** — link to entity (combobox with entity type + id), type (dropdown), tags, notes.

---

## Verification

- [ ] Version history shows every version with uploader + note.
- [ ] Access list shows per-role permissions.
- [ ] Upload dialog enforces entity type + id when "Link to entity" is selected.
- [ ] Commit: `feat(ui): documents module static`.

---

**Next:** [13-reports.md](./13-reports.md)
