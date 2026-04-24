# Inventory — Frontend

React + Vite + Tailwind + shadcn/ui (TypeScript).

Part of the Advanced Business Process Automation System for the
Pump &amp; Fire Fighting Products industry. See [../plan/](../plan/) for
the step-by-step development plan.

---

## Prerequisites

- Node.js **22 LTS** (see [.nvmrc](./.nvmrc))
- npm 10+

## Setup

```bash
npm install
```

## Common scripts

| Command                 | Purpose                                                                |
| ----------------------- | ---------------------------------------------------------------------- |
| `npm run dev`           | Start dev server on `http://localhost:5173` (proxies `/api` → `:8000`) |
| `npm run build`         | Type-check + production build into `dist/`                             |
| `npm run preview`       | Preview the production build                                           |
| `npm run lint`          | Run ESLint                                                             |
| `npm run format`        | Format with Prettier                                                   |
| `npm run format:check`  | Check formatting without writing                                       |
| `npm test`              | Run Vitest in watch mode                                               |
| `npm run test:run`      | Run Vitest once                                                        |
| `npm run test:coverage` | Run Vitest with coverage                                               |
| `npm run test:e2e`      | Run Playwright end-to-end tests                                        |

## Folder structure

```
src/
├── app/           # providers, router, global auth context
├── pages/         # one folder per module (inquiries, quotations, …)
├── components/    # reusable UI atoms & molecules
│   └── ui/        # shadcn/ui generated components
├── layouts/       # AppShell, AuthLayout
├── mocks/         # hardcoded data used during Phase 1 (static UI)
├── lib/           # cn(), formatters, shared utils
├── hooks/         # React Query hooks (Phase 3)
├── services/      # axios-backed API clients (Phase 3)
├── schemas/       # zod schemas mirroring API validation (Phase 3)
└── index.css      # Tailwind directives + design tokens
test/
└── setup.ts       # Vitest + Testing Library setup
```

Path alias: `@/` → `src/`.

## Environment variables

Create `.env.local` to override any value from `.env.development`.

| Variable                | Purpose                              |
| ----------------------- | ------------------------------------ |
| `VITE_API_BASE_URL`     | API base path used by axios instance |
| `VITE_API_PROXY_TARGET` | Backend origin for Vite dev proxy    |

## Design tokens

Colors, typography, spacing, radii, and badge maps are encoded in
[tailwind.config.js](./tailwind.config.js) and the component layer of
[src/index.css](./src/index.css). Reference values live in
[../docs/ui_spec.md](../docs/ui_spec.md). **Never hand-pick hex values
in components.**

## Current status

- Step 01 — Project setup &amp; tooling: ✅
- Step 02 — Design system &amp; tokens: up next

See [../plan/phase-1-static-ui/00-overview.md](../plan/phase-1-static-ui/00-overview.md).
