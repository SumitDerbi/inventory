# Step 11 — Engineer & installation jobs

> Status: ✅ Delivered (Phase 1 static UI)

Build the **Jobs & engineers** module covering scheduled installations/service visits, on-site execution (checklist, photos, observations), engineer roster, and a weekly scheduler. All static — no backend.

---

## ✅ Delivered — Mocks

- `frontend/src/mocks/users.ts` — extended role union with `'engineer'`; added `u-8 Manish Patel`, `u-9 Ritika Sharma`, `u-10 Arjun Joshi`.
- `frontend/src/mocks/engineers.ts` — new. Types `EngineerProficiency`, `EngineerSkill`, `Engineer`. 3 engineers (eng-1 Ahmedabad / Pumps, eng-2 Ahmedabad / Solar, eng-3 Surat / Fire-fighting) with code, skills, certifications, status (`available|on_job|on_leave`), `avgRating`, `activeJobs`, `completedThisMonth`, `nextSlotAt`. Helpers: `engineerById`, `engineersByCity`.
- `frontend/src/mocks/checklistTemplates.ts` — new. Types `ChecklistItemTemplate`, `ChecklistGroup`, `ChecklistTemplate`. 3 templates (pump install, fire-fighting commissioning, solar handover). Helpers: `checklistTemplateByCategory`, `checklistTemplateById`.
- `frontend/src/mocks/jobs.ts` — new. Types `JobStatus`, `JobPriority`, `JobType`, `ChecklistItemStatus`, `JobChecklistItem/Group`, `JobPhoto`, `ObservationSeverity`, `JobObservation`, `CommissioningReading`, `CommissioningReport`, `JobActivity`, `Job`.
  - Constants: `JOB_STATUSES`, `JOB_STATUS_LABEL`, `JOB_STATUS_TONE`, `JOB_PRIORITY_LABEL`, `JOB_PRIORITY_TONE`, `JOB_TYPE_LABEL`, `ALLOWED_NEXT`.
  - 8 seeded jobs spanning all statuses and priorities (installation, commissioning, service visit, AMC, breakdown).
  - Helpers: `jobById`, `jobsForOrder`, `jobsForEngineer`, `checklistProgress`, `jobsSummary`, `ordersAwaitingJob`, `nextJobStatuses`, `canAdvanceJob`.

---

## ✅ Delivered — Pages

- `frontend/src/pages/jobs/JobsLayout.tsx` — `PageHeader` + 4-stat strip (Total / Scheduled / In-progress / Awaiting sign-off) + sub-nav tabs (Jobs / Scheduler / Engineers) + `<Outlet />`.
- `frontend/src/pages/jobs/JobsListPage.tsx` — `FilterBar` (search + Status + Engineer + Type + Priority) + `DataTable<Job>` with Job#, Order link, Customer, Site city, Engineer, Schedule, Priority, Status. Row click → `/jobs/:id`.
- `frontend/src/pages/jobs/JobDetailPage.tsx` — full work-order view:
  - Header: job number + status + priority + type badges, customer/site summary, order link, **Advance** button gated by `nextJobStatuses`.
  - Stepper: scheduled → en-route → in-progress → completed → signed-off.
  - Open-observation alert for major/critical findings.
  - KPI strip (checklist %, engineer, schedule, travel).
  - 6 tabs:
    - **Overview** — site & contact card; engineer + helpers + top skills.
    - **Checklist** — grouped items with pass/fail/N-A badges, photo-required flag, progress bar.
    - **Photos** — responsive grid + click-to-zoom lightbox + upload dialog (mock).
    - **Commissioning** — submitted → readings table (in/out of spec) + summary + signed PDF link + customer rating; else → submit-report dialog.
    - **Observations** — severity-coloured cards + log-observation dialog.
    - **Activity** — chronological audit trail.
  - Dialogs: `AdvanceJobDialog` (checklist gate warning), `ObservationDialog` (severity + note), `PhotoUploadDialog` (mock dropzone + caption), `ReportDialog` (customer signatory + summary), `Lightbox`.
- `frontend/src/pages/jobs/SchedulerPage.tsx` — weekly calendar. Header: prev / Today / next. Grid: rows = engineers, columns = 7 days starting Monday. Cells show job cards (job#, customer, time, site, status/priority badges), overlap-detection highlights cell red. Empty cells show `—`. Click a card → detail.
- `frontend/src/pages/jobs/EngineersPage.tsx` — searchable roster. Filter pills (All / Available / On job / On leave). Cards: name, code, base + service cities, status badge, rating / active / monthly metrics, skill pills coloured by proficiency (expert / proficient / trainee), certifications, next slot, phone.

---

## ✅ Delivered — Routing

```
/jobs               JobsLayout
├── index           JobsListPage
├── /calendar       SchedulerPage
├── /engineers      EngineersPage
└── /:id            JobDetailPage
```

- Lazy imports added in `frontend/src/app/router.tsx`.
- Old `JobsPage.tsx` stub removed.

---

## ✅ Verification

- [x] `get_errors` — all new files clean.
- [x] `npm run lint` — 0 errors (1 pre-existing warning in `InquiryFormDrawer.tsx`, unrelated).
- [x] `npm run build` — passes in ~4.3 s. Key chunks:
  - `JobsLayout-*.js` — 1.91 kB (gzip 0.86 kB)
  - `JobsListPage-*.js` — 3.95 kB (gzip 1.47 kB)
  - `SchedulerPage-*.js` — 4.53 kB (gzip 1.72 kB)
  - `EngineersPage-*.js` — 5.25 kB (gzip 1.88 kB)
  - `JobDetailPage-*.js` — 25.37 kB (gzip 6.46 kB)
  - `engineers-*.js` mock — 1.71 kB
  - `jobs-*.js` mock — 14.49 kB
- [x] Nested jobs routes render: list → detail → scheduler → engineers.
- [x] React Compiler purity preserved (module-level `TODAY`, no `Date.now()` during render).

---

## Commit

```
feat(ui): jobs + engineer module static
```
