# Step 05 — Inquiries module slice (API + tests + Postman + UI wiring + UI tests)

> **Vertical slice.** Deliver this module **end-to-end** before starting Step 06. Follow [../SKILL.md §2.5](../SKILL.md).
>
> Slice scope:
> 1. Backend API (this file).
> 2. Pytest for `apps/inquiries` (≥ 85 % cov, target tests inside `apps/inquiries/tests/`).
> 3. Postman folder `Inquiries` in `postman/inventory.postman_collection.json` with chained env vars.
> 4. Frontend wiring — swap mocks for live API in [../phase-1-static-ui/06-inquiries.md](../phase-1-static-ui/06-inquiries.md) screens (services + React Query hooks + form zod sync, follow [../SKILL.md §3.1–3.4](../SKILL.md)).
> 5. Frontend unit tests for those screens (Vitest + RTL + MSW, [../SKILL.md §3.5](../SKILL.md)).
> 6. Slice gate: pytest green, newman green for Inquiries folder, vitest green for inquiry pages, no console errors. Commit `feat(slice): inquiries`.

> Before this: [04c-search-api.md](./04c-search-api.md)
> Spec: [docs/development_spec.md Module 1](../../docs/development_spec.md), [docs/project_details.md §1](../../docs/project_details.md)

---

## Endpoints

| Method | Path                                         | Purpose                                                  |
| ------ | -------------------------------------------- | -------------------------------------------------------- |
| GET    | `/api/v1/inquiries/`                         | list + filter + search                                   |
| POST   | `/api/v1/inquiries/`                         | create (auto inquiry_number)                             |
| GET    | `/api/v1/inquiries/:id`                      | detail with nested items                                 |
| PATCH  | `/api/v1/inquiries/:id`                      | update (blocked when status=converted/lost unless admin) |
| DELETE | `/api/v1/inquiries/:id`                      | soft delete                                              |
| POST   | `/api/v1/inquiries/:id/assign`               | `{ user_id }`                                            |
| POST   | `/api/v1/inquiries/:id/status`               | `{ status, lost_reason? }`                               |
| POST   | `/api/v1/inquiries/:id/convert-to-quotation` | returns new quotation id                                 |
| GET    | `/api/v1/inquiries/:id/follow-ups`           |                                                          |
| POST   | `/api/v1/inquiries/:id/follow-ups`           | schedule new                                             |
| PATCH  | `/api/v1/inquiries/follow-ups/:id`           | update / complete                                        |
| GET    | `/api/v1/inquiries/:id/activity`             | timeline                                                 |
| GET    | `/api/v1/inquiries/:id/items`                |                                                          |
| POST   | `/api/v1/inquiries/:id/items`                | add requirement line                                     |
| GET    | `/api/v1/inquiries/items/:id`                |                                                          |
| PATCH  | `/api/v1/inquiries/items/:id`                |                                                          |
| DELETE | `/api/v1/inquiries/items/:id`                |                                                          |
| POST   | `/api/v1/inquiries/bulk-assign`              | `{ inquiry_ids[], user_id }`                             |
| POST   | `/api/v1/inquiries/bulk-status`              | `{ inquiry_ids[], status, lost_reason? }`                |
| POST   | `/api/v1/inquiries/bulk-export`              | `{ inquiry_ids[], format }` → file                       |
| GET    | `/api/v1/inquiries/stats`                    | counts by status / source                                |

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

- [x] Coverage ≥ 85 %. _(5a — 20 tests, 103/103 suite green)_
- [x] All Postman flows green. _(5b — newman 13/13 assertions, 0 failures)_
- [x] Activity timeline shows every mutation. _(5a — created/updated/assigned/status_changed/follow_up_scheduled/follow_up_updated/line_item_added/line_item_updated/line_item_deleted/converted_to_quotation)_
- [x] Commit: `feat(api): inquiries + workflow + tests`. _(5a backend slice)_

---

**Next:** [06-quotations-api.md](./06-quotations-api.md)
