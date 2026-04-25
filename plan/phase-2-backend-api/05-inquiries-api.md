# Step 05 — Inquiries API

> Before this: [04-masters-api.md](./04-masters-api.md)
> Spec: [docs/development_spec.md Module 1](../../docs/development_spec.md), [docs/project_details.md §1](../../docs/project_details.md)

---

## Endpoints

| Method | Path                                              | Purpose                         |
| ------ | ------------------------------------------------- | ------------------------------- |
| GET    | `/api/v1/inquiries/`                              | list + filter + search          |
| POST   | `/api/v1/inquiries/`                              | create (auto inquiry_number)    |
| GET    | `/api/v1/inquiries/:id`                           | detail with nested items        |
| PATCH  | `/api/v1/inquiries/:id`                           | update (blocked when status=converted/lost unless admin) |
| DELETE | `/api/v1/inquiries/:id`                           | soft delete                     |
| POST   | `/api/v1/inquiries/:id/assign`                    | `{ user_id }`                   |
| POST   | `/api/v1/inquiries/:id/status`                    | `{ status, lost_reason? }`      |
| POST   | `/api/v1/inquiries/:id/convert-to-quotation`      | returns new quotation id        |
| GET    | `/api/v1/inquiries/:id/follow-ups`                |                                 |
| POST   | `/api/v1/inquiries/:id/follow-ups`                | schedule new                    |
| PATCH  | `/api/v1/inquiries/follow-ups/:id`                | update / complete               |
| GET    | `/api/v1/inquiries/:id/activity`                  | timeline                        |
| GET    | `/api/v1/inquiries/:id/items`                     |                                 |
| POST   | `/api/v1/inquiries/:id/items`                     | add requirement line            |
| GET    | `/api/v1/inquiries/items/:id`                     |                                 |
| PATCH  | `/api/v1/inquiries/items/:id`                     |                                 |
| DELETE | `/api/v1/inquiries/items/:id`                     |                                 |
| POST   | `/api/v1/inquiries/bulk-assign`                   | `{ inquiry_ids[], user_id }`    |
| POST   | `/api/v1/inquiries/bulk-status`                   | `{ inquiry_ids[], status, lost_reason? }` |
| POST   | `/api/v1/inquiries/bulk-export`                   | `{ inquiry_ids[], format }` → file |
| GET    | `/api/v1/inquiries/stats`                         | counts by status / source       |

---

## Rules (services layer)

- Numbering: `INQ-{fiscal-year}-{seq:05}` generated atomically.
- Assignment: territory / product segment / workload logic lives in `apps.inquiries.services.auto_assign`.
- Dedupe on create: search by mobile / email / GST / project_reference; return 409 with match payload if `force=false`.
- Status machine: `new → in_progress → quoted → converted` or `→ lost` or `→ on_hold`. Invalid transitions → 422.
- `lost` status requires `lost_reason`.
- `convert-to-quotation` — creates quotation draft pre-filled with inquiry data + items; status → `quoted`; activity event written.
- All mutations write to `inquiry_activity` table (who, what, when, diff).

### Bulk operations

- All three bulk endpoints accept up to 200 ids; validate ownership/permission per row.
- Atomic: wrap in DB transaction; partial failures collected as `failed: [{ id, reason }]` with HTTP 207 if any row fails, 200 if all succeed.
- `bulk-status` runs the same status-machine validator per row; rows that would result in invalid transitions are listed in `failed`.
- `bulk-export` reuses the `ListExportMixin` (step 01) but takes ids in body to stay under URL length limits; `format=csv|xlsx|pdf`.
- Each successful row writes `inquiry_activity`.

---

## Tests

- Create with / without customer, dedupe match scenarios.
- Assignment respects territory rules.
- Status transitions valid + invalid → correct status codes.
- `convert-to-quotation` creates a quotation row, links, writes activity.
- Filter combos: status×priority×assigned_to×date_range.
- Aging computation endpoint returns expected buckets.

---

## Postman

- Folder `Inquiries` with Create → Assign → Follow-up → Convert flow, chained via env vars.

---

## Verification

- [ ] Coverage ≥ 85 %.
- [ ] All Postman flows green.
- [ ] Activity timeline shows every mutation.
- [ ] Commit: `feat(api): inquiries + workflow + tests`.

---

**Next:** [06-quotations-api.md](./06-quotations-api.md)
