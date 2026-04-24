# Step 01 — Project Setup & Tooling

> Before this: [00-overview.md](./00-overview.md)
> SKILL reference: [../SKILL.md §0–§1.2](../SKILL.md)

> **Decision log:** The frontend uses **TypeScript (.tsx)** for stronger typing
> end-to-end. All later plan steps refer to `.tsx` / `.ts` files; legacy
> references to `.jsx` should be read as their TypeScript equivalents.

---

## Objective

Bootstrap a clean Vite + React + **TypeScript** project with Tailwind, shadcn/ui, routing, linting, formatting, testing, and mock data infra. No feature code yet.

---

## Steps

1. **Create app**
   ```bash
   npm create vite@latest frontend -- --template react-ts
   cd frontend
   npm install
   ```
2. **Install core deps**
   ```bash
   npm i react-router-dom @tanstack/react-query @tanstack/react-query-devtools axios zod react-hook-form @hookform/resolvers
   npm i lucide-react framer-motion recharts date-fns clsx tailwind-merge class-variance-authority
   npm i sonner
   ```
3. **Tailwind + PostCSS** (pin Tailwind v3 for shadcn compatibility)

   ```bash
   npm i -D tailwindcss@^3.4 postcss autoprefixer
   ```

   - Hand-author `tailwind.config.js` with `content: ['./index.html', './src/**/*.{ts,tsx}']` and tokens from [docs/ui_spec.md §Design System](../../docs/ui_spec.md).
   - Hand-author `postcss.config.js` with `tailwindcss` + `autoprefixer`.
   - Replace `src/index.css` with `@tailwind base; @tailwind components; @tailwind utilities;` plus the base + component layers (`.card`, `.page-title`, `.section-header`, `.data-value`, `.caption`, `.stat-number`).

4. **shadcn/ui** (deferred to Step 02 when first components are needed)
   ```bash
   # Run inside Step 02 once DataTable/StatusBadge etc. are scaffolded
   npx shadcn@latest init
   npx shadcn@latest add button input label select textarea dialog sheet table tabs dropdown-menu tooltip badge card avatar skeleton command popover calendar alert progress breadcrumb
   # (sonner is installed as a dep directly; no shadcn wrapper required)
   ```
5. **Path aliases** — configure `@/` → `src/` in both `vite.config.ts` (resolve.alias) and `tsconfig.app.json` (`compilerOptions.paths`). TS 6 disallows `baseUrl`, so paths are written as `"@/*": ["./src/*"]` without `baseUrl`.
6. **Folder structure**
   ```
   src/
   ├── app/               # providers, layout, router
   ├── pages/             # one folder per module
   ├── components/        # reusable UI atoms/molecules
   ├── components/ui/     # shadcn generated
   ├── layouts/           # AppShell, AuthLayout
   ├── mocks/             # hardcoded data per module
   ├── lib/               # utils, cn(), formatters
   ├── hooks/             # (empty for now)
   ├── services/          # (empty for now, Phase 3)
   ├── schemas/           # (empty for now, Phase 3)
   └── index.css          # Tailwind directives + component layer
   ```
   Seed each empty folder with `.gitkeep`. Implement `src/lib/cn.ts` (clsx + tailwind-merge) and `src/lib/format.ts` (INR/number formatters) right away — every later step imports them.
7. **Linting & formatting**

   ```bash
   npm i -D eslint prettier eslint-config-prettier eslint-plugin-prettier eslint-plugin-react-hooks eslint-plugin-react-refresh typescript-eslint @eslint/js globals
   ```

   - Use Vite's generated flat config `eslint.config.js` and append `eslint-config-prettier` at the end of the `extends` array so Prettier wins formatting conflicts.
   - Add `.prettierrc.json`, `.prettierignore`, `.editorconfig`.

8. **Testing scaffolding** (write configs now, tests come in Phase 3)

   ```bash
   npm i -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @playwright/test msw
   ```

   - Keep vitest + @vitest/coverage-v8 on the **same major** (both v4.x with Vite 8 + rolldown).
   - Import `defineConfig` from `vitest/config` in `vite.config.ts` so the `test` block type-checks.
   - Create `test/setup.ts` importing `@testing-library/jest-dom/vitest` and calling `cleanup()` in `afterEach`.

9. **NPM scripts** (add to `package.json`):
   ```json
   "scripts": {
     "dev": "vite",
     "build": "tsc -b && vite build",
     "preview": "vite preview",
     "lint": "eslint .",
     "format": "prettier --write \"src/**/*.{ts,tsx,css,md}\" \"test/**/*.ts\"",
     "format:check": "prettier --check \"src/**/*.{ts,tsx,css,md}\" \"test/**/*.ts\"",
     "test": "vitest",
     "test:run": "vitest run",
     "test:coverage": "vitest run --coverage",
     "test:e2e": "playwright test"
   }
   ```
10. **Git hygiene** — extend default `.gitignore` with `coverage`, `playwright-report`, `test-results`, `.playwright`, `.env.local`, `.env.*.local`. Add `.nvmrc` pinning Node **22** LTS (avoid Node 23 — triggers EBADENGINE for ESLint 10).
11. **Vite dev proxy** — in `vite.config.ts` forward `/api` to `process.env.VITE_API_PROXY_TARGET || 'http://localhost:8000'`. Also create `.env.development` (`VITE_API_BASE_URL=/api/v1`) and `.env.production`.
12. **README in `/frontend`** — how to run, build, test; scripts table; folder layout; env vars.

---

## Files produced

- `frontend/package.json`, `vite.config.ts`, `tsconfig.app.json`, `tailwind.config.js`, `postcss.config.js`
- `frontend/src/` folder structure with `.gitkeep` barrels; `src/lib/cn.ts`, `src/lib/format.ts`; `src/index.css`; `src/App.tsx` (bootstrap landing page)
- `frontend/eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `.editorconfig`
- `frontend/test/setup.ts`
- `frontend/.env.development`, `.env.production`, `.nvmrc`
- `frontend/README.md`

---

## Verification

- [x] `npm run dev` opens `http://localhost:5173` with the bootstrap landing page, no console errors.
- [x] `npm run build` completes, produces `dist/` (tsc -b + vite build both green).
- [x] `npm run lint` passes on the empty project.
- [ ] shadcn `Button` renders when imported in `App.tsx` (smoke test then revert) — **deferred to Step 02** when `shadcn init` runs.
- [x] Tailwind class (e.g. `text-primary` / `bg-primary`) renders the correct hex from [ui_spec.md](../../docs/ui_spec.md).
- [ ] Committed as `chore: bootstrap vite+tailwind+shadcn`.

---

**Next:** [02-design-system.md](./02-design-system.md)
