# Development Plan — Advanced Business Process Automation System

> Jai Shree Ram 🙏
> Industry: Pump & Fire Fighting Products
> Stack: React + Tailwind + shadcn/ui + Recharts (frontend) · Django REST + MySQL (pymysql) + JWT (backend)

---

## Why this plan exists

This folder is the **single source of truth** for _how_ we build the product, step by step, without rework. It is derived from:

- [docs/project_details.md](../docs/project_details.md) — business scope
- [docs/development_spec.md](../docs/development_spec.md) — DB schema + module behaviour
- [docs/ui_spec.md](../docs/ui_spec.md) — screens, components, styling
- [docs/stack.md](../docs/stack.md) — tech stack & deployment notes

Every step is **small, verifiable, and points to the next step** — so an AI agent or a human developer can resume work at any point with full context.

---

## Guiding principles

1. **Static UI first.** Ship a clickable, pixel-faithful UI with hardcoded data → get client sign-off on look, feel, fields, flows → only then touch APIs. Reduces rework by a huge margin.
2. **Foundation horizontally, features vertically.** Cross-cutting work (project setup, all models/migrations, auth, shared masters, settings, global search) is built once across the whole codebase. Feature modules (inquiries → quotations → orders → …) are then built as **vertical slices**: each module ships API + pytest + Postman + UI wiring + UI tests before the next module starts. See [SKILL.md §2.5](./SKILL.md).
3. **Every step has a verification checklist.** No step is "done" until its checklist passes.
4. **Reusable SKILL.** [SKILL.md](./SKILL.md) captures the _repeatable workflow_ — open it every time a new module/screen is picked up.
5. **Tests are not optional.** API pytest + Postman collection + UI unit tests + Playwright smoke are part of "definition of done" for every module slice.

---

## Phase map

| Phase                                                           | Goal                                          | Output                                             | Gate to next phase                         |
| --------------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------- | ------------------------------------------ |
| [Phase 1 — Static UI](./phase-1-static-ui/)                     | Pixel-faithful clickable UI with mock data    | Deployable static React app                        | Client sign-off on look/feel/fields/flows  |
| [Phase 2 — Backend API](./phase-2-backend-api/)                 | Django REST API + MySQL + JWT + tests         | Running API with Postman collection + pytest suite | All endpoints green in Postman + pytest    |
| [Phase 3 — Dynamic Integration](./phase-3-dynamic-integration/) | Wire UI ↔ API, UI tests, E2E, combined deploy | Production build served via Django `deploy.sh`     | Smoke tests pass on staging + UAT sign-off |

---

## How to use this plan

1. Read [SKILL.md](./SKILL.md) once. It is the workflow you repeat for every screen/module.
2. Open the current phase's `00-overview.md`. It lists the step files in order.
3. Open the next unchecked step file. Work only within that scope.
4. Run the **Verification** block at the bottom of the step. If it passes, tick it in the phase overview and open the **Next step** link.
5. If a step reveals a gap in the spec, **update the doc first**, then resume.

---

## Folder layout

```
plan/
├── README.md                        ← you are here
├── SKILL.md                         ← repeatable UI + API workflow (read first)
├── phase-1-static-ui/
│   ├── 00-overview.md
│   ├── 01-setup.md … 15-static-deploy.md
├── phase-2-backend-api/
│   ├── 00-overview.md
│   ├── 01-django-setup.md … 15-pytest-suite.md
├── phase-3-dynamic-integration/
│   ├── 00-overview.md
│   ├── 01-api-client.md … 06-combined-deploy.md
└── templates/
    ├── module-ui-checklist.md
    ├── module-api-checklist.md
    └── verification-checklist.md
```

---

## Progress tracker (tick as you complete)

- 🟡 Phase 1 — Static UI _(17/20 steps ✅; 18-portal, 19-invoices, 20-approvals pending; hosting + sign-off pending)_
- 🟡 Phase 2 — Backend API _(Steps 01–04c ✅: bootstrap, 84 models, full auth + 2FA + sessions, shared masters + customers + attachments + notifications, settings + numbering + email templates + approvals inbox, global staff search; per-module vertical slices next)_
- ☐ Phase 3 — Dynamic Integration + Deploy _(only cross-cutting steps remain here — see [phase-3-dynamic-integration/00-overview.md](./phase-3-dynamic-integration/00-overview.md))_

> Detailed per-step tracking lives inside each phase's `00-overview.md`.
> Per-module **wiring + UI tests** are tracked inside the Phase 2 module step (vertical slice), not in Phase 3.

---

**Next:** open [SKILL.md](./SKILL.md) → then [phase-1-static-ui/00-overview.md](./phase-1-static-ui/00-overview.md).
