# Step 01 — Project Setup & Tooling

> Before this: [00-overview.md](./00-overview.md)
> SKILL reference: [../SKILL.md §0–§1.2](../SKILL.md)

---

## Objective

Bootstrap a clean Vite + React project with Tailwind, shadcn/ui, routing, linting, formatting, testing, and mock data infra. No feature code yet.

---

## Steps

1. **Create app**
   ```bash
   npm create vite@latest frontend -- --template react
   cd frontend
   npm install
   ```
2. **Install core deps**
   ```bash
   npm i react-router-dom @tanstack/react-query axios zod react-hook-form @hookform/resolvers
   npm i lucide-react framer-motion recharts date-fns clsx tailwind-merge
   npm i sonner
   ```
3. **Tailwind + PostCSS**
   ```bash
   npm i -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

   - Configure `tailwind.config.js` `content: ['./index.html', './src/**/*.{js,jsx}']`.
   - Extend theme with tokens from [docs/ui_spec.md §Design System](../../docs/ui_spec.md).
4. **shadcn/ui**
   ```bash
   npx shadcn@latest init
   npx shadcn@latest add button input label select textarea dialog sheet table tabs dropdown-menu tooltip toast badge card avatar skeleton command popover calendar alert progress breadcrumb
   ```
5. **Path aliases** — configure `@/` → `src/` in `vite.config.js` + `jsconfig.json`.
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
   └── styles/            # index.css with tailwind directives
   ```
7. **Linting & formatting**
   ```bash
   npm i -D eslint prettier eslint-config-prettier eslint-plugin-react eslint-plugin-react-hooks
   ```

   - Add `.eslintrc.cjs`, `.prettierrc`, `.editorconfig`.
8. **Testing scaffolding** (write configs now, tests come in Phase 3)
   ```bash
   npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom @playwright/test msw
   ```

   - Add `vitest.config.js`, `test/setup.js`.
9. **NPM scripts** (add to `package.json`):
   ```json
   "scripts": {
     "dev": "vite",
     "build": "vite build",
     "preview": "vite preview",
     "lint": "eslint src",
     "format": "prettier --write src",
     "test": "vitest",
     "test:e2e": "playwright test"
   }
   ```
10. **Git hygiene** — add `.gitignore` (node_modules, dist, .env\*), `.nvmrc` pinning Node LTS.
11. **README in `/frontend`** — how to run, build, test.

---

## Files produced

- `frontend/package.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`
- `frontend/src/` folder structure with empty `index.js` barrels
- `.eslintrc.cjs`, `.prettierrc`, `.editorconfig`
- `frontend/README.md`

---

## Verification

- [ ] `npm run dev` opens `http://localhost:5173` with default page, no errors.
- [ ] `npm run build` completes, produces `dist/`.
- [ ] `npm run lint` passes on an empty project.
- [ ] shadcn `Button` renders when imported in `App.jsx` (smoke test then revert).
- [ ] Tailwind class (e.g. `text-blue-600`) renders the correct hex from [ui_spec.md](../../docs/ui_spec.md).
- [ ] Committed as `chore: bootstrap vite+tailwind+shadcn`.

---

**Next:** [02-design-system.md](./02-design-system.md)
