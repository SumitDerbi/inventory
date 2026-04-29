# Step 10 — Jobs & Engineer module slice (API + tests + Postman + UI wiring + UI tests)

> **Vertical slice.** Deliver end-to-end before Step 11. Follow [../SKILL.md §2.5](../SKILL.md).
>
> Slice scope: backend API (this file) → pytest in `apps/jobs/tests/` (≥ 85 % cov) → Postman folder `Jobs` → frontend wiring of [../phase-1-static-ui/11-jobs-engineer.md](../phase-1-static-ui/11-jobs-engineer.md) screens → Vitest+RTL+MSW unit tests → slice gate + commit `feat(slice): jobs`.

> Before this: [09-dispatch-api.md](./09-dispatch-api.md)
> Spec: [docs/development_spec.md Module 6](../../docs/development_spec.md), [docs/project_details.md §6](../../docs/project_details.md)

---

## Endpoints

| Method | Path                                    | Purpose                          |
| ------ | --------------------------------------- | -------------------------------- |
| CRUD   | `/api/v1/jobs/`                         |                                  |
| POST   | `/api/v1/jobs/:id/assign`               | `{ engineer_id }`                |
| POST   | `/api/v1/jobs/:id/start`                |                                  |
| POST   | `/api/v1/jobs/:id/complete`             |                                  |
| POST   | `/api/v1/jobs/:id/signoff`              | customer signoff + signature     |
| CRUD   | `/api/v1/jobs/:id/checklist-items/`     |                                  |
| POST   | `/api/v1/jobs/:id/photos`               | multipart                        |
| CRUD   | `/api/v1/jobs/:id/observations/`        |                                  |
| POST   | `/api/v1/jobs/:id/commissioning-report` | submit report + optional PDF     |
| CRUD   | `/api/v1/jobs/engineers/`               | engineer profiles + skills       |
| CRUD   | `/api/v1/jobs/checklist-templates/`     | admin                            |
| GET    | `/api/v1/jobs/scheduler`                | calendar view (range + engineer) |

---

## Rules

- Assignment suggestion: match skill, location, availability, workload. Endpoint `POST /jobs/:id/suggest-engineers` returns ranked list.
- Double-booking prevention: create / reassign validates no overlap on engineer's schedule.
- Checklist: % complete computed server-side.
- Signoff requires checklist 100 % or explicit override with reason.
- Completing a job updates the linked order: all jobs done → order stage `Installed`.

---

## Tests

- Suggestion ranking fixture-driven.
- Double-booking rejected.
- Signoff override requires reason.
- Job completion cascades to order stage when applicable.

---

## Postman

- Folder `Jobs`: create → assign → start → checklist → photos → commission → signoff.

---

## Verification

- [ ] Coverage ≥ 85 %.
- [ ] Commit: `feat(api): jobs + engineer scheduling`.

---

**Next:** [11-documents-api.md](./11-documents-api.md)
