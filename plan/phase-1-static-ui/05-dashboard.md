# Step 05 — Executive Dashboard ✅

> Before this: [04-auth.md](./04-auth.md)
> Spec: [docs/ui_spec.md §Section 2](../../docs/ui_spec.md)

---

## ✅ Delivered

- **`src/lib/format.ts`** — added `formatRelative()` using `Intl.RelativeTimeFormat` (no extra dep).
- **`src/mocks/dashboard.ts`** — typed mocks: `kpis` (4), `revenueTrend` (6 months), `funnelStages` (5 stages), `recentActivity` (12 items), `pendingActions` (4 groups).
- **Charts (`src/components/charts/`)**:
  - `RevenueLineChart.tsx` — Recharts `LineChart` with two lines (revenue solid blue, cost dashed slate), custom tooltip with `formatINR`, compact ₹ Y-axis ticks, horizontal grid only.
  - `InquiryFunnelChart.tsx` — accessible HTML/CSS bars with stage colors + conversion %, no extra Recharts surface.
- **Widgets (`src/components/dashboard/`)**:
  - `RecentActivityFeed.tsx` — scrollable (`max-h-80`) list with per-type icon badges + `formatRelative` meta.
  - `PendingActionsList.tsx` — grouped list with icon, label, preview item, count `<Badge tone="blue">`, chevron.
- **`pages/dashboard/DashboardPage.tsx`** — 12-col responsive grid:
  - Row 1: 4× `StatCard` wrapped in `motion.div` (0.05s stagger, fade + 8px rise).
  - Row 2: Revenue chart (col-span-7) + Inquiry funnel (col-span-5) with custom legend dots.
  - Row 3: Activity feed (col-span-7) + Pending actions (col-span-5).
  - PageHeader with outline `Export` action.

---

## Verification

- [x] All 4 KPIs match spec values + deltas (arrows + tone colors via `StatCard`).
- [x] Revenue tooltip formats as `₹45,80,000` via `formatINR`.
- [x] Funnel shows 5 stages with counts + conversion %.
- [x] Activity feed scrolls within `max-h-80`.
- [x] Pending actions grouped by type with badge counts.
- [x] Responsive: `<lg` columns stack to single column.
- [x] No layout shift — `RevenueLineChart` reserves fixed `height={280}`.
- [x] `npm run lint` clean, `npm run build` green in 3.90s (DashboardPage chunk 353.42 KB / gz 103.80 KB — Recharts inlined into route chunk by lazy boundary).
- [ ] Commit: `feat(ui): executive dashboard static`.

---

**Next:** [06-inquiries.md](./06-inquiries.md)
