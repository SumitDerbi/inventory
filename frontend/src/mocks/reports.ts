// =============================================================================
// Reports & Analytics — mock data + report definitions
// -----------------------------------------------------------------------------
// Each report has a `slug`, belongs to a `module`, declares its `chart` type
// (line / bar / area / pie / stackedBar), the data series it renders, and the
// columns to show in the companion table. This keeps the Report Viewer page
// generic — it only switches on `chart.kind` and renders both chart and table
// from the same `data` array.
// =============================================================================

import { formatINR } from '@/lib/format';

export type ReportModule =
    | 'inquiries'
    | 'quotations'
    | 'orders'
    | 'inventory'
    | 'dispatch'
    | 'jobs'
    | 'sales';

export const REPORT_MODULE_LABEL: Record<ReportModule, string> = {
    inquiries: 'Inquiries',
    quotations: 'Quotations',
    orders: 'Sales orders',
    inventory: 'Inventory',
    dispatch: 'Dispatch',
    jobs: 'Jobs & engineers',
    sales: 'Sales',
};

export type ReportChartKind =
    | 'bar'
    | 'stackedBar'
    | 'line'
    | 'area'
    | 'pie'
    | 'none';

export type ReportFilterKind = 'dateRange' | 'select';

export interface ReportFilterDef {
    key: string;
    label: string;
    kind: ReportFilterKind;
    options?: { label: string; value: string }[];
    defaultValue?: string;
}

export interface ReportSeriesDef {
    key: string;
    label: string;
    color: string;
    /** Override formatter for tooltip / table cell. */
    format?: 'inr' | 'pct' | 'days' | 'count';
}

export interface ReportTableColumnDef {
    key: string;
    label: string;
    align?: 'left' | 'right';
    format?: 'inr' | 'pct' | 'days' | 'count' | 'text';
}

export interface ReportChartDef {
    kind: ReportChartKind;
    xKey: string;
    /** For pie charts: dataKey for value, nameKey for label. */
    valueKey?: string;
    nameKey?: string;
    series?: ReportSeriesDef[];
}

export interface ReportDef {
    slug: string;
    module: ReportModule;
    name: string;
    description: string;
    /** Headline metric shown on hub card. */
    headline: { label: string; value: string };
    chart: ReportChartDef;
    filters: ReportFilterDef[];
    columns: ReportTableColumnDef[];
    data: Record<string, string | number>[];
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];

const COLORS = {
    blue: '#2563EB',
    sky: '#0EA5E9',
    emerald: '#10B981',
    amber: '#F59E0B',
    red: '#EF4444',
    violet: '#8B5CF6',
    slate: '#64748B',
    pink: '#EC4899',
    indigo: '#6366F1',
};

const dateRangeFilter: ReportFilterDef = {
    key: 'range',
    label: 'Date range',
    kind: 'select',
    options: [
        { label: 'Last 30 days', value: '30d' },
        { label: 'Last 90 days', value: '90d' },
        { label: 'Last 6 months', value: '6m' },
        { label: 'YTD', value: 'ytd' },
    ],
    defaultValue: '6m',
};

export function formatCell(
    value: string | number,
    fmt?: ReportTableColumnDef['format'],
): string {
    if (typeof value === 'string') return value;
    switch (fmt) {
        case 'inr':
            return formatINR(value);
        case 'pct':
            return `${value.toFixed(1)}%`;
        case 'days':
            return `${value} d`;
        case 'count':
            return value.toLocaleString('en-IN');
        default:
            return String(value);
    }
}

// -----------------------------------------------------------------------------
// Report definitions
// -----------------------------------------------------------------------------

export const REPORTS: ReportDef[] = [
    // -------------------- Inquiries --------------------
    {
        slug: 'inquiry-aging',
        module: 'inquiries',
        name: 'Inquiry aging',
        description:
            'Open inquiries grouped by age bucket. Highlights stale leads needing attention.',
        headline: { label: 'Stale > 14d', value: '7' },
        chart: {
            kind: 'bar',
            xKey: 'bucket',
            series: [
                { key: 'count', label: 'Open inquiries', color: COLORS.blue },
            ],
        },
        filters: [dateRangeFilter],
        columns: [
            { key: 'bucket', label: 'Age bucket' },
            { key: 'count', label: 'Open', align: 'right', format: 'count' },
            {
                key: 'estValue',
                label: 'Est. value',
                align: 'right',
                format: 'inr',
            },
        ],
        data: [
            { bucket: '0–3 days', count: 14, estValue: 4_200_000 },
            { bucket: '4–7 days', count: 9, estValue: 2_800_000 },
            { bucket: '8–14 days', count: 6, estValue: 1_950_000 },
            { bucket: '15–30 days', count: 5, estValue: 1_600_000 },
            { bucket: '> 30 days', count: 2, estValue: 540_000 },
        ],
    },
    {
        slug: 'inquiry-source',
        module: 'inquiries',
        name: 'Source-wise inquiries',
        description:
            'Volume of inquiries by acquisition channel. Useful for channel ROI.',
        headline: { label: 'Top source', value: 'Website' },
        chart: { kind: 'pie', xKey: 'source', valueKey: 'count', nameKey: 'source' },
        filters: [dateRangeFilter],
        columns: [
            { key: 'source', label: 'Source' },
            { key: 'count', label: 'Inquiries', align: 'right', format: 'count' },
            {
                key: 'conversion',
                label: 'Conversion',
                align: 'right',
                format: 'pct',
            },
        ],
        data: [
            { source: 'Website', count: 38, conversion: 22.5 },
            { source: 'Referral', count: 24, conversion: 35.2 },
            { source: 'Walk-in', count: 12, conversion: 41.7 },
            { source: 'Trade show', count: 9, conversion: 28.0 },
            { source: 'Outbound', count: 7, conversion: 14.3 },
        ],
    },
    {
        slug: 'inquiry-lost-reasons',
        module: 'inquiries',
        name: 'Lost reasons',
        description: 'Why inquiries are marked lost — drives product/pricing fixes.',
        headline: { label: 'Lost (last 90d)', value: '18' },
        chart: { kind: 'pie', xKey: 'reason', valueKey: 'count', nameKey: 'reason' },
        filters: [dateRangeFilter],
        columns: [
            { key: 'reason', label: 'Reason' },
            { key: 'count', label: 'Count', align: 'right', format: 'count' },
            { key: 'share', label: 'Share', align: 'right', format: 'pct' },
        ],
        data: [
            { reason: 'Price too high', count: 7, share: 38.9 },
            { reason: 'Lost to competitor', count: 5, share: 27.8 },
            { reason: 'Project on hold', count: 3, share: 16.7 },
            { reason: 'No response', count: 2, share: 11.1 },
            { reason: 'Other', count: 1, share: 5.5 },
        ],
    },
    {
        slug: 'inquiry-funnel',
        module: 'inquiries',
        name: 'Conversion funnel',
        description: 'Inquiry → Quotation → Order → Won funnel with drop-off rates.',
        headline: { label: 'Win rate', value: '21.4%' },
        chart: {
            kind: 'bar',
            xKey: 'stage',
            series: [{ key: 'count', label: 'Records', color: COLORS.indigo }],
        },
        filters: [dateRangeFilter],
        columns: [
            { key: 'stage', label: 'Stage' },
            { key: 'count', label: 'Count', align: 'right', format: 'count' },
            { key: 'dropoff', label: 'Drop-off', align: 'right', format: 'pct' },
        ],
        data: [
            { stage: 'Inquiries', count: 90, dropoff: 0 },
            { stage: 'Quoted', count: 64, dropoff: 28.9 },
            { stage: 'Negotiation', count: 41, dropoff: 35.9 },
            { stage: 'Order placed', count: 26, dropoff: 36.6 },
            { stage: 'Won', count: 19, dropoff: 26.9 },
        ],
    },

    // -------------------- Quotations --------------------
    {
        slug: 'quotation-revisions',
        module: 'quotations',
        name: 'Revision distribution',
        description:
            'How many revisions each quotation typically goes through before being closed.',
        headline: { label: 'Avg revisions', value: '1.7' },
        chart: {
            kind: 'bar',
            xKey: 'revisions',
            series: [{ key: 'count', label: 'Quotations', color: COLORS.violet }],
        },
        filters: [dateRangeFilter],
        columns: [
            { key: 'revisions', label: 'Revisions' },
            { key: 'count', label: 'Quotations', align: 'right', format: 'count' },
        ],
        data: [
            { revisions: '0', count: 12 },
            { revisions: '1', count: 24 },
            { revisions: '2', count: 18 },
            { revisions: '3', count: 9 },
            { revisions: '4+', count: 4 },
        ],
    },
    {
        slug: 'quotation-approval-tat',
        module: 'quotations',
        name: 'Approval TAT',
        description:
            'Average turnaround for quotation approvals over time. Lower is better.',
        headline: { label: 'Avg TAT', value: '1.8 d' },
        chart: {
            kind: 'line',
            xKey: 'month',
            series: [
                { key: 'avgTat', label: 'Avg TAT (days)', color: COLORS.emerald },
                { key: 'p90Tat', label: 'P90 TAT (days)', color: COLORS.amber },
            ],
        },
        filters: [dateRangeFilter],
        columns: [
            { key: 'month', label: 'Month' },
            { key: 'avgTat', label: 'Avg TAT', align: 'right', format: 'days' },
            { key: 'p90Tat', label: 'P90 TAT', align: 'right', format: 'days' },
            { key: 'count', label: 'Approvals', align: 'right', format: 'count' },
        ],
        data: months.map((m, i) => ({
            month: m,
            avgTat: [2.4, 2.1, 1.9, 1.7, 1.5, 1.8][i],
            p90Tat: [4.6, 4.1, 3.7, 3.4, 3.0, 3.5][i],
            count: [12, 14, 18, 22, 26, 19][i],
        })),
    },
    {
        slug: 'quote-to-order',
        module: 'quotations',
        name: 'Quote → order conversion',
        description: 'Share of quotations converted into sales orders, monthly.',
        headline: { label: 'Conversion', value: '41.2%' },
        chart: {
            kind: 'area',
            xKey: 'month',
            series: [
                { key: 'rate', label: 'Conversion %', color: COLORS.sky },
            ],
        },
        filters: [dateRangeFilter],
        columns: [
            { key: 'month', label: 'Month' },
            { key: 'quotes', label: 'Quotes', align: 'right', format: 'count' },
            { key: 'orders', label: 'Orders', align: 'right', format: 'count' },
            { key: 'rate', label: 'Conversion', align: 'right', format: 'pct' },
        ],
        data: months.map((m, i) => {
            const quotes = [22, 26, 28, 31, 35, 30][i];
            const orders = [8, 10, 11, 13, 15, 12][i];
            return {
                month: m,
                quotes,
                orders,
                rate: Number(((orders / quotes) * 100).toFixed(1)),
            };
        }),
    },
    {
        slug: 'discount-leakage',
        module: 'quotations',
        name: 'Discount leakage',
        description:
            'Quotations exceeding the standard 8% discount cap, by sales owner.',
        headline: { label: 'Over cap', value: '11' },
        chart: {
            kind: 'bar',
            xKey: 'owner',
            series: [
                { key: 'avgDiscount', label: 'Avg discount %', color: COLORS.red },
            ],
        },
        filters: [dateRangeFilter],
        columns: [
            { key: 'owner', label: 'Sales owner' },
            { key: 'quotes', label: 'Quotes', align: 'right', format: 'count' },
            {
                key: 'avgDiscount',
                label: 'Avg disc.',
                align: 'right',
                format: 'pct',
            },
            { key: 'overCap', label: 'Over cap', align: 'right', format: 'count' },
        ],
        data: [
            { owner: 'Aarav Mehta', quotes: 18, avgDiscount: 7.2, overCap: 2 },
            { owner: 'Diya Shah', quotes: 14, avgDiscount: 9.4, overCap: 4 },
            { owner: 'Kabir Rao', quotes: 21, avgDiscount: 6.8, overCap: 1 },
            { owner: 'Ananya Iyer', quotes: 12, avgDiscount: 10.1, overCap: 4 },
        ],
    },

    // -------------------- Orders --------------------
    {
        slug: 'open-orders',
        module: 'orders',
        name: 'Open orders by stage',
        description: 'Snapshot of all in-flight sales orders by current stage.',
        headline: { label: 'Open orders', value: '34' },
        chart: {
            kind: 'bar',
            xKey: 'stage',
            series: [{ key: 'count', label: 'Orders', color: COLORS.indigo }],
        },
        filters: [dateRangeFilter],
        columns: [
            { key: 'stage', label: 'Stage' },
            { key: 'count', label: 'Orders', align: 'right', format: 'count' },
            { key: 'value', label: 'Value', align: 'right', format: 'inr' },
        ],
        data: [
            { stage: 'Confirmed', count: 8, value: 2_400_000 },
            { stage: 'Processing', count: 11, value: 4_100_000 },
            { stage: 'Ready', count: 7, value: 2_950_000 },
            { stage: 'Dispatched', count: 5, value: 1_600_000 },
            { stage: 'Installation', count: 3, value: 1_200_000 },
        ],
    },
    {
        slug: 'readiness-blockers',
        module: 'orders',
        name: 'Readiness blockers',
        description: 'Top reasons orders are stuck in Processing / Ready stage.',
        headline: { label: 'Blocked orders', value: '12' },
        chart: {
            kind: 'bar',
            xKey: 'reason',
            series: [{ key: 'count', label: 'Orders', color: COLORS.amber }],
        },
        filters: [dateRangeFilter],
        columns: [
            { key: 'reason', label: 'Blocker' },
            { key: 'count', label: 'Orders', align: 'right', format: 'count' },
            {
                key: 'avgAge',
                label: 'Avg age',
                align: 'right',
                format: 'days',
            },
        ],
        data: [
            { reason: 'Stock shortage', count: 5, avgAge: 6 },
            { reason: 'Awaiting QC', count: 3, avgAge: 4 },
            { reason: 'Customer hold', count: 2, avgAge: 9 },
            { reason: 'Document pending', count: 2, avgAge: 3 },
        ],
    },
    {
        slug: 'fulfilment-delay',
        module: 'orders',
        name: 'Fulfilment delay',
        description: 'Average days from order confirmation to dispatch, monthly.',
        headline: { label: 'Avg delay', value: '4.3 d' },
        chart: {
            kind: 'line',
            xKey: 'month',
            series: [
                { key: 'avgDays', label: 'Avg days', color: COLORS.blue },
                { key: 'target', label: 'Target', color: COLORS.slate },
            ],
        },
        filters: [dateRangeFilter],
        columns: [
            { key: 'month', label: 'Month' },
            { key: 'avgDays', label: 'Avg days', align: 'right', format: 'days' },
            { key: 'target', label: 'Target', align: 'right', format: 'days' },
            { key: 'orders', label: 'Orders', align: 'right', format: 'count' },
        ],
        data: months.map((m, i) => ({
            month: m,
            avgDays: [5.2, 4.8, 4.5, 4.1, 3.9, 4.3][i],
            target: 4,
            orders: [18, 22, 25, 28, 30, 24][i],
        })),
    },

    // -------------------- Inventory --------------------
    {
        slug: 'inventory-valuation',
        module: 'inventory',
        name: 'Stock valuation',
        description: 'Stock value across warehouses with month-over-month trend.',
        headline: { label: 'Stock value', value: formatINR(8_640_000) },
        chart: {
            kind: 'bar',
            xKey: 'warehouse',
            series: [
                { key: 'value', label: 'Stock value', color: COLORS.emerald, format: 'inr' },
            ],
        },
        filters: [dateRangeFilter],
        columns: [
            { key: 'warehouse', label: 'Warehouse' },
            { key: 'skuCount', label: 'SKUs', align: 'right', format: 'count' },
            { key: 'value', label: 'Value', align: 'right', format: 'inr' },
        ],
        data: [
            { warehouse: 'WH-HO (Head office)', skuCount: 38, value: 5_200_000 },
            { warehouse: 'WH-BR (Branch)', skuCount: 24, value: 2_640_000 },
            { warehouse: 'WH-SITE (Site)', skuCount: 9, value: 800_000 },
        ],
    },
    {
        slug: 'fast-slow-movers',
        module: 'inventory',
        name: 'Fast & slow movers',
        description: 'SKUs ranked by issue frequency — flag dead stock and stars.',
        headline: { label: 'Slow movers', value: '6' },
        chart: {
            kind: 'bar',
            xKey: 'sku',
            series: [
                { key: 'issued', label: 'Issued (90d)', color: COLORS.sky },
            ],
        },
        filters: [dateRangeFilter],
        columns: [
            { key: 'sku', label: 'SKU' },
            { key: 'name', label: 'Product' },
            { key: 'issued', label: 'Issued', align: 'right', format: 'count' },
            { key: 'stock', label: 'On hand', align: 'right', format: 'count' },
            { key: 'velocity', label: 'Velocity', align: 'right' },
        ],
        data: [
            { sku: 'P-001', name: 'Centrifugal pump 5HP', issued: 28, stock: 12, velocity: 'Fast' },
            { sku: 'P-014', name: 'Sand filter 30"', issued: 22, stock: 4, velocity: 'Fast' },
            { sku: 'P-008', name: 'Dosing pump 0.5HP', issued: 18, stock: 9, velocity: 'Fast' },
            { sku: 'P-022', name: 'PVC valve 2"', issued: 6, stock: 32, velocity: 'Slow' },
            { sku: 'P-031', name: 'SS strainer 4"', issued: 3, stock: 18, velocity: 'Slow' },
            { sku: 'P-040', name: 'Pressure gauge 0–10', issued: 1, stock: 24, velocity: 'Dead' },
        ],
    },
    {
        slug: 'shortage-report',
        module: 'inventory',
        name: 'Shortage / reorder',
        description:
            'Items below reorder point, with suggested PO quantity and lead time.',
        headline: { label: 'Below ROL', value: '9' },
        chart: {
            kind: 'bar',
            xKey: 'sku',
            series: [
                { key: 'available', label: 'Available', color: COLORS.amber },
                { key: 'reorderPoint', label: 'Reorder point', color: COLORS.red },
            ],
        },
        filters: [dateRangeFilter],
        columns: [
            { key: 'sku', label: 'SKU' },
            { key: 'name', label: 'Product' },
            { key: 'available', label: 'Available', align: 'right', format: 'count' },
            { key: 'reorderPoint', label: 'ROL', align: 'right', format: 'count' },
            { key: 'leadTime', label: 'Lead time', align: 'right', format: 'days' },
        ],
        data: [
            { sku: 'P-014', name: 'Sand filter 30"', available: 4, reorderPoint: 8, leadTime: 14 },
            { sku: 'P-005', name: 'Booster pump 3HP', available: 2, reorderPoint: 5, leadTime: 21 },
            { sku: 'P-019', name: 'UV sterilizer 40W', available: 1, reorderPoint: 4, leadTime: 18 },
            { sku: 'P-027', name: 'Multiport valve 1.5"', available: 3, reorderPoint: 10, leadTime: 10 },
        ],
    },

    // -------------------- Dispatch --------------------
    {
        slug: 'dispatch-on-time',
        module: 'dispatch',
        name: 'On-time dispatch %',
        description:
            'Share of dispatches that left on or before the planned date, monthly.',
        headline: { label: 'On-time', value: '92.4%' },
        chart: {
            kind: 'line',
            xKey: 'month',
            series: [
                { key: 'onTime', label: 'On-time %', color: COLORS.emerald },
            ],
        },
        filters: [dateRangeFilter],
        columns: [
            { key: 'month', label: 'Month' },
            { key: 'onTime', label: 'On-time %', align: 'right', format: 'pct' },
            { key: 'dispatched', label: 'Dispatched', align: 'right', format: 'count' },
            { key: 'delayed', label: 'Delayed', align: 'right', format: 'count' },
        ],
        data: months.map((m, i) => {
            const dispatched = [22, 26, 30, 33, 36, 30][i];
            const delayed = [3, 3, 2, 3, 2, 2][i];
            return {
                month: m,
                onTime: Number(
                    (((dispatched - delayed) / dispatched) * 100).toFixed(1),
                ),
                dispatched,
                delayed,
            };
        }),
    },
    {
        slug: 'transporter-performance',
        module: 'dispatch',
        name: 'Transporter performance',
        description: 'On-time %, exception rate and average freight per transporter.',
        headline: { label: 'Top performer', value: 'Gati Logistics' },
        chart: {
            kind: 'bar',
            xKey: 'name',
            series: [
                { key: 'onTime', label: 'On-time %', color: COLORS.blue },
            ],
        },
        filters: [dateRangeFilter],
        columns: [
            { key: 'name', label: 'Transporter' },
            { key: 'shipments', label: 'Shipments', align: 'right', format: 'count' },
            { key: 'onTime', label: 'On-time %', align: 'right', format: 'pct' },
            { key: 'exceptions', label: 'Exceptions', align: 'right', format: 'count' },
            { key: 'avgFreight', label: 'Avg freight', align: 'right', format: 'inr' },
        ],
        data: [
            { name: 'Gati Logistics', shipments: 28, onTime: 96.4, exceptions: 1, avgFreight: 8200 },
            { name: 'VRL Logistics', shipments: 22, onTime: 90.9, exceptions: 2, avgFreight: 7600 },
            { name: 'TCI Express', shipments: 18, onTime: 94.4, exceptions: 1, avgFreight: 9400 },
            { name: 'Local hand', shipments: 12, onTime: 83.3, exceptions: 2, avgFreight: 3200 },
        ],
    },
    {
        slug: 'partial-dispatch-trends',
        module: 'dispatch',
        name: 'Partial dispatch trends',
        description:
            'Share of dispatches that were partial vs full, by month.',
        headline: { label: 'Partial share', value: '23.0%' },
        chart: {
            kind: 'stackedBar',
            xKey: 'month',
            series: [
                { key: 'full', label: 'Full', color: COLORS.emerald },
                { key: 'partial', label: 'Partial', color: COLORS.amber },
            ],
        },
        filters: [dateRangeFilter],
        columns: [
            { key: 'month', label: 'Month' },
            { key: 'full', label: 'Full', align: 'right', format: 'count' },
            { key: 'partial', label: 'Partial', align: 'right', format: 'count' },
            { key: 'partialPct', label: 'Partial %', align: 'right', format: 'pct' },
        ],
        data: months.map((m, i) => {
            const full = [18, 21, 23, 25, 28, 23][i];
            const partial = [4, 5, 7, 8, 8, 7][i];
            return {
                month: m,
                full,
                partial,
                partialPct: Number(
                    ((partial / (full + partial)) * 100).toFixed(1),
                ),
            };
        }),
    },
    {
        slug: 'pod-pending',
        module: 'dispatch',
        name: 'POD pending',
        description: 'Dispatches awaiting Proof-of-Delivery upload, by age.',
        headline: { label: 'Pending POD', value: '8' },
        chart: {
            kind: 'bar',
            xKey: 'bucket',
            series: [
                { key: 'count', label: 'Pending PODs', color: COLORS.red },
            ],
        },
        filters: [dateRangeFilter],
        columns: [
            { key: 'bucket', label: 'Age' },
            { key: 'count', label: 'Pending', align: 'right', format: 'count' },
        ],
        data: [
            { bucket: '0–2 days', count: 3 },
            { bucket: '3–5 days', count: 2 },
            { bucket: '6–10 days', count: 2 },
            { bucket: '> 10 days', count: 1 },
        ],
    },

    // -------------------- Jobs --------------------
    {
        slug: 'job-completion-tat',
        module: 'jobs',
        name: 'Job completion TAT',
        description:
            'Average days from job creation to completion, by job type.',
        headline: { label: 'Avg TAT', value: '3.6 d' },
        chart: {
            kind: 'bar',
            xKey: 'type',
            series: [
                { key: 'avgDays', label: 'Avg days', color: COLORS.violet },
            ],
        },
        filters: [dateRangeFilter],
        columns: [
            { key: 'type', label: 'Job type' },
            { key: 'jobs', label: 'Jobs', align: 'right', format: 'count' },
            { key: 'avgDays', label: 'Avg days', align: 'right', format: 'days' },
            { key: 'p90Days', label: 'P90 days', align: 'right', format: 'days' },
        ],
        data: [
            { type: 'Installation', jobs: 18, avgDays: 4.2, p90Days: 7 },
            { type: 'Commissioning', jobs: 12, avgDays: 3.1, p90Days: 5 },
            { type: 'AMC visit', jobs: 24, avgDays: 1.8, p90Days: 3 },
            { type: 'Breakdown', jobs: 9, avgDays: 1.2, p90Days: 2 },
        ],
    },
    {
        slug: 'engineer-utilisation',
        module: 'jobs',
        name: 'Engineer utilisation',
        description:
            'Billable hours vs available hours per engineer for the period.',
        headline: { label: 'Avg utilisation', value: '78.4%' },
        chart: {
            kind: 'bar',
            xKey: 'engineer',
            series: [
                { key: 'utilisation', label: 'Utilisation %', color: COLORS.indigo },
            ],
        },
        filters: [dateRangeFilter],
        columns: [
            { key: 'engineer', label: 'Engineer' },
            { key: 'jobs', label: 'Jobs', align: 'right', format: 'count' },
            { key: 'hours', label: 'Hours', align: 'right', format: 'count' },
            { key: 'utilisation', label: 'Utilisation', align: 'right', format: 'pct' },
        ],
        data: [
            { engineer: 'Rohit Pawar', jobs: 22, hours: 168, utilisation: 84.0 },
            { engineer: 'Mehul Joshi', jobs: 18, hours: 154, utilisation: 77.0 },
            { engineer: 'Sneha Kulkarni', jobs: 16, hours: 148, utilisation: 74.0 },
        ],
    },

    // -------------------- Sales --------------------
    {
        slug: 'monthly-revenue',
        module: 'sales',
        name: 'Monthly revenue',
        description: 'Revenue trend with cost overlay — same series as dashboard.',
        headline: { label: 'Last month', value: formatINR(2_840_000) },
        chart: {
            kind: 'line',
            xKey: 'month',
            series: [
                { key: 'revenue', label: 'Revenue', color: COLORS.blue, format: 'inr' },
                { key: 'cost', label: 'Cost', color: COLORS.slate, format: 'inr' },
            ],
        },
        filters: [dateRangeFilter],
        columns: [
            { key: 'month', label: 'Month' },
            { key: 'revenue', label: 'Revenue', align: 'right', format: 'inr' },
            { key: 'cost', label: 'Cost', align: 'right', format: 'inr' },
            { key: 'margin', label: 'Margin', align: 'right', format: 'inr' },
        ],
        data: months.map((m, i) => {
            const revenue = [
                1_950_000, 2_120_000, 2_360_000, 2_540_000, 2_680_000, 2_840_000,
            ][i];
            const cost = [
                1_400_000, 1_510_000, 1_660_000, 1_770_000, 1_840_000, 1_930_000,
            ][i];
            return { month: m, revenue, cost, margin: revenue - cost };
        }),
    },
    {
        slug: 'customer-revenue',
        module: 'sales',
        name: 'Customer-wise revenue',
        description: 'Top customers by closed revenue in the period.',
        headline: { label: 'Top customer', value: 'Surat Textile Mills' },
        chart: {
            kind: 'bar',
            xKey: 'customer',
            series: [
                { key: 'revenue', label: 'Revenue', color: COLORS.blue, format: 'inr' },
            ],
        },
        filters: [dateRangeFilter],
        columns: [
            { key: 'customer', label: 'Customer' },
            { key: 'orders', label: 'Orders', align: 'right', format: 'count' },
            { key: 'revenue', label: 'Revenue', align: 'right', format: 'inr' },
            { key: 'avgOrder', label: 'Avg order', align: 'right', format: 'inr' },
        ],
        data: [
            { customer: 'Surat Textile Mills', orders: 6, revenue: 4_200_000, avgOrder: 700_000 },
            { customer: 'GreenLeaf Resorts', orders: 4, revenue: 2_640_000, avgOrder: 660_000 },
            { customer: 'Vapi Industries', orders: 5, revenue: 2_350_000, avgOrder: 470_000 },
            { customer: 'Pune Engineering', orders: 3, revenue: 1_580_000, avgOrder: 526_667 },
            { customer: 'Mumbai Hospitality', orders: 2, revenue: 940_000, avgOrder: 470_000 },
        ],
    },
    {
        slug: 'territory-revenue',
        module: 'sales',
        name: 'Territory-wise revenue',
        description: 'Revenue split by sales territory.',
        headline: { label: 'Top region', value: 'Gujarat' },
        chart: {
            kind: 'pie',
            xKey: 'territory',
            valueKey: 'revenue',
            nameKey: 'territory',
        },
        filters: [dateRangeFilter],
        columns: [
            { key: 'territory', label: 'Territory' },
            { key: 'orders', label: 'Orders', align: 'right', format: 'count' },
            { key: 'revenue', label: 'Revenue', align: 'right', format: 'inr' },
            { key: 'share', label: 'Share', align: 'right', format: 'pct' },
        ],
        data: [
            { territory: 'Gujarat', orders: 14, revenue: 5_400_000, share: 38.6 },
            { territory: 'Maharashtra', orders: 11, revenue: 4_120_000, share: 29.4 },
            { territory: 'Karnataka', orders: 6, revenue: 2_180_000, share: 15.6 },
            { territory: 'Tamil Nadu', orders: 4, revenue: 1_360_000, share: 9.7 },
            { territory: 'Other', orders: 3, revenue: 940_000, share: 6.7 },
        ],
    },
];

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

export function reportBySlug(slug: string): ReportDef | undefined {
    return REPORTS.find((r) => r.slug === slug);
}

export function reportsByModule(): Record<ReportModule, ReportDef[]> {
    const map = {} as Record<ReportModule, ReportDef[]>;
    REPORTS.forEach((r) => {
        if (!map[r.module]) map[r.module] = [];
        map[r.module].push(r);
    });
    return map;
}

export const PIE_COLORS = [
    COLORS.blue,
    COLORS.emerald,
    COLORS.amber,
    COLORS.violet,
    COLORS.pink,
    COLORS.sky,
    COLORS.red,
    COLORS.indigo,
    COLORS.slate,
];
