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
| PATCH  | `/api/v1/inquiries/items/:id`                     |                                 |
| DELETE | `/api/v1/inquiries/items/:id`                     |                                 |
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
