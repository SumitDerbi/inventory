# Step 02 — Design System & Tokens

> Before this: [01-setup.md](./01-setup.md)
> Spec: [docs/ui_spec.md §Design System](../../docs/ui_spec.md)

---

## Objective

Encode every token (color, typography, spacing, radius, badge maps, animation presets) so no screen ever uses ad-hoc values.

---

## Steps

1. **Extend `tailwind.config.js`** with semantic color aliases:
   ```js
   theme: {
     extend: {
       colors: {
         primary:   { DEFAULT: '#2563EB', dark: '#1D4ED8', light: '#EFF6FF' },
         secondary: { DEFAULT: '#334155' },
         surface:   '#FFFFFF',
         bg:        '#F8FAFC',
       },
       borderRadius: { xl: '0.875rem' },
     }
   }
   ```
2. **Global CSS** — `src/styles/index.css`:
   - Tailwind `@tailwind base; components; utilities;`
   - Base layer: body bg `bg-slate-50`, default font family, smooth scroll.
   - Component layer: `.card`, `.page-title`, `.section-header`, `.data-value`, `.caption`.
3. **Create `src/lib/cn.js`** — `clsx + tailwind-merge` helper.
4. **Create `src/components/ui/StatusBadge.jsx`**
   - Accepts `status` prop; internal map mirrors [ui_spec.md §Status Badge Color Map](../../docs/ui_spec.md).
   - Fallback to `bg-slate-100 text-slate-600`.
5. **Create `src/components/ui/PriorityBadge.jsx`** — same pattern for priority map.
6. **Create `src/components/ui/PageHeader.jsx`**
   - Props: `title`, `breadcrumb[]`, `actions` (slot).
   - Uses `text-2xl font-semibold text-slate-800`.
7. **Create `src/components/ui/StatCard.jsx`**
   - Props: `label`, `value`, `delta`, `icon`, `tone` (`blue|violet|amber|emerald`).
   - Matches dashboard KPI card in [ui_spec.md §Executive Dashboard](../../docs/ui_spec.md).
8. **Create `src/components/ui/EmptyState.jsx`**, `LoadingSkeleton.jsx`, `ErrorAlert.jsx`.
9. **Create `src/components/ui/DataTable.jsx`**
   - Wrapper around shadcn `Table` with: sticky header, zebra rows, loading skeleton rows, empty state slot, pagination footer (client-side pagination for Phase 1 via prop).
10. **Create `src/components/ui/FormField.jsx`** — `Label + Input/Select/Textarea + helper/error text` combo used across all forms.
11. **Create `src/components/ui/FilterBar.jsx`** — standard toolbar: search input, filter dropdowns (slot), date range, export menu.
12. **Create `src/components/motion/FadeIn.jsx`** — tiny Framer preset matching animation guidelines.
13. **Storybook-lite showcase page** at `/__kitchen-sink` (dev-only route) rendering every component in every state. Gets deleted before prod.

---

## Files produced

- `tailwind.config.js` (extended)
- `src/styles/index.css`
- `src/lib/cn.js`
- `src/components/ui/{StatusBadge,PriorityBadge,PageHeader,StatCard,EmptyState,LoadingSkeleton,ErrorAlert,DataTable,FormField,FilterBar}.jsx`
- `src/components/motion/FadeIn.jsx`
- `src/pages/_dev/KitchenSink.jsx`

---

## Verification

- [ ] Kitchen-sink page shows all badges, buttons, inputs, table states, empty/loading/error, StatCard, PageHeader.
- [ ] Every color matches hex codes in [ui_spec.md](../../docs/ui_spec.md).
- [ ] Badge maps: render one of each status + priority; hex values match.
- [ ] `DataTable` shows skeleton rows when `isLoading`, empty state when `rows=[]`.
- [ ] No `any-color` hex used inline in component code — only tokens/classes.
- [ ] Axe DevTools on kitchen-sink: 0 critical violations.
- [ ] Commit: `feat(ui): design system + shared components`.

---

**Next:** [03-app-shell.md](./03-app-shell.md)
