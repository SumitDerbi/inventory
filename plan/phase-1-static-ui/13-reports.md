# Phase 1 · Step 13 — Reports & analytics ✅ Delivered

Static reports hub plus a generic Report Viewer driven by data-only report
definitions. Filters, chart, table and exports all share the same backing
dataset; saved views persist locally.

## Mocks ✅

`frontend/src/mocks/reports.ts` (~620 LOC, single file)

- **Types:** `ReportModule` (7), `ReportChartKind` (`bar` | `stackedBar` |
  `line` | `area` | `pie` | `none`), `ReportFilterDef`, `ReportSeriesDef`,
  `ReportTableColumnDef`, `ReportChartDef`, `ReportDef`.
- **22 report definitions** covering every reporting requirement from the
  spec:
  - **Inquiries (4):** aging buckets, source-wise pie, lost reasons,
    conversion funnel.
  - **Quotations (4):** revision distribution, approval TAT (avg+P90),
    quote-to-order conversion (area), discount leakage by owner.
  - **Orders (3):** open by stage, readiness blockers, fulfilment delay
    vs target.
  - **Inventory (3):** stock valuation by warehouse, fast/slow movers,
    shortage / reorder.
  - **Dispatch (4):** on-time %, transporter performance, partial vs
    full stacked bars, POD pending by age.
  - **Jobs (2):** completion TAT by type, engineer utilisation %.
  - **Sales (3):** monthly revenue + cost line, customer-wise top 5,
    territory-wise pie.
- **Helpers:** `reportBySlug`, `reportsByModule`, `formatCell` (inr / pct
  / days / count formatters), `PIE_COLORS` palette, shared `dateRange`
  filter (30d / 90d / 6m / YTD).

## Pages ✅

### `pages/reports/ReportsPage.tsx` — Hub

- Search input, total-shown counter.
- Saved-views chip row (read from `localStorage.reports.savedViews`)
  linking back to each viewer with the saved filter combo via `?view=<id>`.
- Module-grouped card grid (3-up at lg) with per-module accent + icon
  (`ClipboardList`, `FileBarChart`, `ShoppingCart`, `Boxes`, `Truck`,
  `Wrench`, `Users`). Each card shows name, description, headline metric.
- Empty state when search returns 0.

### `pages/reports/ReportViewerPage.tsx` — Generic viewer

- `useParams().slug` → `reportBySlug`; renders 404-style PageHeader if
  unknown.
- **Filter bar** — driven by `report.filters`. Filters sync with
  `useSearchParams` so URLs are shareable. Saved-view restoration happens
  inside the `useState` lazy initializer (no `useEffect` setState — keeps
  React Compiler `set-state-in-effect` rule happy).
- **Chart panel** — `ReportChart` switches on `chart.kind`:
  `bar` / `stackedBar` (BarChart with `stackId`), `line` (LineChart),
  `area` (AreaChart), `pie` (PieChart with `Cell` colours from
  `PIE_COLORS`). All Recharts variants share `ResponsiveContainer` and
  consistent axis styling.
- **Data table** — same series rendered as a striped table with
  per-column `align` and `format` (inr / pct / days / count / text).
- **Export menu** — three buttons (CSV / Excel / PDF) firing toasts; UI
  surface only.
- **Save view dialog** — name + persist into `localStorage`; new view
  immediately appears on the hub on next visit.

### Routing

Added `/reports/:slug` lazy route in `app/router.tsx` alongside the
existing `/reports` index.

## Verification ✅

- [x] `get_errors` — clean.
- [x] `npm run lint` — clean (only the pre-existing
      `InquiryFormDrawer.tsx` `react-hook-form` watch warning).
- [x] `npm run build` — succeeds in ~4.2 s. Recharts now lives in a
      shared `LineChart-*.js` chunk (used by both Dashboard and
      ReportViewer), so `DashboardPage` shrank from 353 kB → 11.29 kB.

### Notable chunk sizes

| Asset                       | Raw       | Gzip      |
| --------------------------- | --------- | --------- |
| `ReportsPage-*.js`          | 5.96 kB   | 2.36 kB   |
| `ReportViewerPage-*.js`     | 61.06 kB  | 16.80 kB  |
| `reports-*.js` (mock data)  | 17.31 kB  | 4.91 kB   |
| `LineChart-*.js` (Recharts) | 346.12 kB | 101.76 kB |
| `DashboardPage-*.js`        | 11.29 kB  | 3.72 kB   |
| `index-*.js` (root bundle)  | 517.73 kB | 165.87 kB |

## Commit

`feat(ui): reports module static`
