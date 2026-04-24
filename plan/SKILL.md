# SKILL — Repeatable UI & API Development Workflow

> Read this file **every time** you start a new module, screen, or endpoint.
> It encodes the discipline that keeps quality high and iterations low.

---

## 0. Pre-flight (do once per session)

- [ ] Read [README.md](./README.md) if unfamiliar with the plan.
- [ ] Pull latest `main`. Run `git status` — working tree clean.
- [ ] Confirm which phase you are in (Static UI / API / Dynamic).
- [ ] Open the current phase's `00-overview.md` and pick the **first unchecked** step.

---

## 1. Static UI workflow (Phase 1)

Repeat this loop for every screen.

### 1.1 Understand scope

- [ ] Open [docs/ui_spec.md](../docs/ui_spec.md) → find the exact screen section.
- [ ] Open [docs/development_spec.md](../docs/development_spec.md) → find the related entity/fields.
- [ ] List every field, every state (empty / loading / error / success), every action button.
- [ ] List every dialog/drawer/tab/sub-page reached from this screen.

### 1.2 Scaffold

- [ ] Create the page file under `src/pages/<module>/<Screen>.jsx`.
- [ ] Add the route in `src/router.jsx` (lazy-loaded).
- [ ] Add sidebar nav entry if top-level.
- [ ] Create `src/mocks/<module>.js` with realistic hardcoded data (≥ 10 rows where applicable).

### 1.3 Build UI (top-down)

- [ ] Layout shell (grid/flex containers) using tokens from [ui_spec.md](../docs/ui_spec.md) design system.
- [ ] Header (title + breadcrumb + action buttons).
- [ ] Filter bar / toolbar.
- [ ] Primary content (table / cards / form / chart).
- [ ] Empty state, loading skeletons, error alert.
- [ ] Secondary surfaces (dialog, drawer, tabs).
- [ ] Wire all buttons to **placeholder handlers** (`console.log` + `toast.success`).

### 1.4 Quality polish

- [ ] All colors/spacing/radii match tokens in [ui_spec.md §Design System](../docs/ui_spec.md).
- [ ] Status + priority badges use the exact color map.
- [ ] Responsive: test at 360, 768, 1024, 1440 px.
- [ ] Keyboard: Tab order sensible, focus ring visible, `Esc` closes dialogs.
- [ ] Accessibility: every input has a `<Label>`, icons have `aria-label`.
- [ ] Framer-motion animations light, non-blocking (≤ 200 ms).

### 1.5 Verify (gate to next screen)

- [ ] Matches spec field-by-field (check against development_spec + ui_spec).
- [ ] All link/button clicks do something visible (nav or toast).
- [ ] No console errors, no React key warnings.
- [ ] Lighthouse (desktop) ≥ 90 for Performance and Accessibility.
- [ ] Commit: `feat(ui): <module> <screen> static`.

**Only after the checklist passes**, open the next step file.

---

## 2. Backend API workflow (Phase 2)

Repeat for every resource.

### 2.1 Model

- [ ] Add Django model in `apps/<module>/models.py` matching [development_spec.md](../docs/development_spec.md) exactly (field types, enums, FKs, indexes, soft-delete).
- [ ] Include audit mixin: `created_at, updated_at, created_by, updated_by, is_deleted`.
- [ ] `python manage.py makemigrations` → review SQL → `migrate`.

### 2.2 Serializer

- [ ] `serializers.py` with `ModelSerializer` + nested read serializers where needed.
- [ ] Validation: required fields, regex (mobile/GST/PAN), enum constraints, cross-field rules.
- [ ] Separate `ListSerializer`, `DetailSerializer`, `WriteSerializer` when response shape differs.

### 2.3 View / ViewSet

- [ ] `views.py` using `ModelViewSet` with `DjangoFilterBackend` + `SearchFilter` + `OrderingFilter`.
- [ ] Permissions: JWT required; role checks via custom `IsRole(...)`.
- [ ] Soft delete override (set `is_deleted=True`, do not hard delete).
- [ ] Pagination (20 default, max 100).
- [ ] Custom actions (`@action`) for workflow transitions (e.g. inquiry → quoted).

### 2.4 URL

- [ ] Register on module router; include in project `urls.py` under `/api/v1/<module>/`.

### 2.5 Tests (pytest + DRF APIClient)

- [ ] `test_models.py` — defaults, str, constraints.
- [ ] `test_serializers.py` — valid + invalid payloads.
- [ ] `test_views.py` — list, retrieve, create, update, delete (soft), filter, search, permission denial, workflow action.
- [ ] Target: ≥ 85 % coverage per app.

### 2.6 Postman

- [ ] Add folder in `postman/inventory.postman_collection.json` for the resource.
- [ ] Requests: List, Retrieve, Create, Update, Patch, Delete, each workflow action.
- [ ] Tests tab on every request: status code, required JSON keys, chain IDs via env vars.
- [ ] Run full collection via Newman locally — all green.

### 2.7 Verify (gate)

- [ ] `pytest` green, coverage threshold met.
- [ ] `newman run` green end-to-end.
- [ ] OpenAPI schema (drf-spectacular) generates cleanly.
- [ ] Commit: `feat(api): <module> endpoints + tests`.

---

## 3. Dynamic integration workflow (Phase 3)

Repeat for every screen/module.

### 3.1 API client

- [ ] Add typed service in `src/services/<module>.js` using the shared `axios` instance.
- [ ] Wrap each endpoint with a React Query hook in `src/hooks/use<Module>.js` (`useQuery`, `useMutation`, invalidation keys).

### 3.2 Replace mocks

- [ ] Swap mock import for hook output in the page.
- [ ] Handle `isLoading` → `Skeleton`, `isError` → `Alert`, empty → empty state.
- [ ] Mutations: show toast on success, inline field errors on 400.
- [ ] Optimistic updates only where safe (status toggles).

### 3.3 Forms

- [ ] Zod schema mirrors API validation 1-to-1.
- [ ] `react-hook-form` + `zodResolver`; server-side 400 mapped to `setError`.

### 3.4 Auth

- [ ] JWT stored in `httpOnly` cookie (preferred) OR memory + refresh silent.
- [ ] Axios interceptor: attach token, refresh on 401 once, else redirect `/login`.
- [ ] Route guard based on user role.

### 3.5 UI unit tests (Vitest + RTL)

- [ ] For each page: renders, shows loading, shows data, handles error, submit happy path (MSW mocks).
- [ ] Aim ≥ 70 % component coverage.

### 3.6 E2E smoke (Playwright)

- [ ] Login → create inquiry → convert to quotation → approve → convert to order → dispatch.
- [ ] Runs against staging in CI.

### 3.7 Verify (gate)

- [ ] Vitest green, Playwright green, no console errors/warnings.
- [ ] Bundle size within budget (initial JS ≤ 300 KB gz).
- [ ] Commit: `feat(wire): <module> dynamic + tests`.

---

## 4. Cross-cutting rules

### Git

- Branch per module: `feat/ui-inquiries`, `feat/api-inquiries`, `feat/wire-inquiries`.
- Conventional Commits. One logical change per commit.
- Never force-push `main`.

### Do-not-do list

- ❌ Don't invent fields not in spec — update spec first.
- ❌ Don't couple modules; use foreign keys, not imports across apps beyond models.
- ❌ Don't hand-roll auth — use `djangorestframework-simplejwt`.
- ❌ Don't hard-delete — always soft delete.
- ❌ Don't put business logic in serializers — use service layer (`apps/<module>/services.py`).
- ❌ Don't skip the verification checklist to "come back later".

### Definition of Done (any step)

1. Code compiles / lints clean.
2. Tests written and passing (Phase 2 & 3).
3. Verification checklist in the step file ticked.
4. Committed with a Conventional Commit message.
5. Next step linked & opened.

---

## 5. Handy commands

```bash
# Frontend
npm run dev           # Vite dev server
npm run build         # production build -> dist/
npm run test          # vitest
npm run test:e2e      # playwright

# Backend
python manage.py runserver
python manage.py makemigrations && python manage.py migrate
pytest -q --cov=apps
newman run postman/inventory.postman_collection.json -e postman/local.env.json

# Deploy (combined)
./deploy.sh
```

---

**Next:** return to [README.md](./README.md) or jump to [phase-1-static-ui/00-overview.md](./phase-1-static-ui/00-overview.md).
