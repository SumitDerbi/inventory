# Step 02 — Design System & Tokens

> Before this: [01-setup.md](./01-setup.md)
> Spec: [docs/ui_spec.md §Design System](../../docs/ui_spec.md)

> **Note:** `shadcn init` is deferred to Step 03 (app shell) so it doesn't
> clobber our hand-written Tailwind tokens. All Phase 1 primitives listed
> below are hand-built against the tokens defined in Step 01. When shadcn
> is introduced in Step 03, these wrappers can swap their internals to use
> shadcn/Radix without changing consumers.

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
3. **`src/lib/cn.ts` + `src/lib/format.ts`** — already landed in Step 01 (reused here).
4. **`src/components/ui/Badge.tsx`** — generic pill primitive with a tone prop; every status/priority badge delegates to it.
5. **`src/components/ui/StatusBadge.tsx`**
   - Accepts `status: string`; internal map mirrors [ui_spec.md §Status Badge Color Map](../../docs/ui_spec.md).
   - Unknown statuses fall back to neutral slate.
   - Also exports `STATUS_KEYS` (needs `// eslint-disable-next-line react-refresh/only-export-components`).
6. **`src/components/ui/PriorityBadge.tsx`** — same pattern for priority map.
7. **`src/components/ui/PageHeader.tsx`**
   - Props: `title`, `description?`, `breadcrumb?`, `actions?` slot.
   - Uses the `.page-title` component class.
8. **`src/components/ui/StatCard.tsx`**
   - Props: `label`, `value`, `delta?`, `deltaLabel?`, `icon?`, `tone` (`blue|violet|amber|emerald|red|slate`).
   - Matches dashboard KPI card in [ui_spec.md §Executive Dashboard](../../docs/ui_spec.md); up/down arrow auto-selected from delta sign.
9. **`src/components/ui/EmptyState.tsx`**, **`LoadingSkeleton.tsx`** (exports `Skeleton` + `LoadingSkeleton` with `stack | table` variants), **`ErrorAlert.tsx`** (`info | success | warning | danger` variants).
10. **`src/components/ui/DataTable.tsx`**
    - Generic `DataTable<Row>` with `columns`, `rows`, `rowKey`, `isLoading`, `emptyState`, `onRowClick`, `stickyHeader`.
    - Plain HTML `<table>` for Phase 1 — swap to shadcn `Table` in Step 03 without breaking consumers. Loading shows `LoadingSkeleton variant="table"`; empty shows default `EmptyState` unless overridden.
11. **`src/components/ui/FormField.tsx`** — exports `FormField` layout + `Input`, `Select`, `Textarea` primitives (forwardRef) + `TextField` convenience wrapper. All share a single `BASE_CONTROL` class chain for consistent focus/invalid states.
12. **`src/components/ui/FilterBar.tsx`** — standard toolbar: search input (lucide `Search` icon), filters slot, actions slot.
13. **`src/components/motion/FadeIn.tsx`** — `opacity 0→1, y 8→0, 0.2s` Framer Motion preset (accepts `delay` + `duration`).
14. **Storybook-lite showcase page** at `src/pages/_dev/KitchenSink.tsx` rendering every component in every state. Wired directly from `App.tsx` for Phase 1 (router arrives in Step 03). Delete or gate before prod.

---

## Files produced

- `src/components/ui/{Badge,StatusBadge,PriorityBadge,PageHeader,StatCard,EmptyState,LoadingSkeleton,ErrorAlert,DataTable,FormField,FilterBar}.tsx`
- `src/components/motion/FadeIn.tsx`
- `src/pages/_dev/KitchenSink.tsx` (wired from `src/App.tsx` until router lands in Step 03)

---

## Verification

- [x] Kitchen-sink page shows all badges, buttons, inputs, table states, empty/loading/error, StatCard, PageHeader.
- [x] Every color matches hex codes in [ui_spec.md](../../docs/ui_spec.md) (via Tailwind classes only — no inline hex).
- [x] Badge maps: render one of each status + priority; classes mirror the spec map.
- [x] `DataTable` shows skeleton rows when `isLoading`, empty state when `rows=[]`.
- [x] No ad-hoc hex used in component code — only tokens/classes.
- [x] `npm run lint` and `npm run build` both pass.
- [ ] Axe DevTools on kitchen-sink: 0 critical violations (run manually when hosting for review).
- [ ] Commit: `feat(ui): design system + shared components`.

---

**Next:** [03-app-shell.md](./03-app-shell.md)
