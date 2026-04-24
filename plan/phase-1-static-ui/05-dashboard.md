# Step 05 — Executive Dashboard

> Before this: [04-auth.md](./04-auth.md)
> Spec: [docs/ui_spec.md §Section 2](../../docs/ui_spec.md)

---

## Objective

Deliver the executive dashboard exactly per spec: 4 KPI cards, revenue chart, inquiry funnel, recent activity feed, pending actions list.

---

## Steps

1. **Mock data** — `src/mocks/dashboard.js`:
   - `kpis[]` (4 entries matching spec values).
   - `revenueTrend[]` (6 months, revenue + cost).
   - `funnelStages[]` (New, In Progress, Quoted, Won, Lost).
   - `recentActivity[]` (≥ 12 items, timestamps via `date-fns`).
   - `pendingActions{}` (grouped by type with counts).
2. **`ExecutiveDashboard.jsx`** page:
   - Row 1: 4× `<StatCard>`.
   - Row 2 Left (7 cols): `<RevenueLineChart>` using Recharts `LineChart`, two lines, custom tooltip with ₹ formatting.
   - Row 2 Right (5 cols): `<InquiryFunnelChart>` — Recharts `FunnelChart` _or_ horizontal bar fallback.
   - Row 3 Left: `<RecentActivityFeed>` scrollable.
   - Row 3 Right: `<PendingActionsList>` grouped by type with `Badge` counts.
3. **Chart components** under `src/components/charts/`.
4. **Currency/number formatter** — `src/lib/format.js` with `formatINR`, `formatCompactINR`, `formatRelative`.
5. **Stagger animation** on KPI cards (Framer 0.05s per card).

---

## Verification

- [ ] All 4 KPIs match spec values + deltas with arrows/colors.
- [ ] Revenue chart tooltip formats as `₹12,40,000`.
- [ ] Funnel shows 5 stages with counts + conversion %.
- [ ] Activity feed scrolls within `max-h-80`.
- [ ] Pending actions list groups by type, badges correct.
- [ ] Responsive: at `<1024px` columns stack; charts remain readable.
- [ ] No layout shift after mount (reserve chart height).
- [ ] Commit: `feat(ui): executive dashboard static`.

---

**Next:** [06-inquiries.md](./06-inquiries.md)
