import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    ArrowLeft,
    BookmarkPlus,
    Download,
    FileSpreadsheet,
    FileText,
    Save,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/FormField';
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import {
    PIE_COLORS,
    REPORT_MODULE_LABEL,
    formatCell,
    reportBySlug,
    type ReportDef,
    type ReportSeriesDef,
    type ReportTableColumnDef,
} from '@/mocks/reports';

interface SavedView {
    id: string;
    name: string;
    slug: string;
    filters: Record<string, string>;
    createdAt: number;
}

function loadSavedViews(): SavedView[] {
    try {
        const raw = localStorage.getItem('reports.savedViews');
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as SavedView[]) : [];
    } catch {
        return [];
    }
}

function persistSavedViews(views: SavedView[]) {
    localStorage.setItem('reports.savedViews', JSON.stringify(views));
}

export default function ReportViewerPage() {
    const { slug = '' } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { push } = useToast();

    const report = useMemo(() => reportBySlug(slug), [slug]);

    const [filters, setFilters] = useState<Record<string, string>>(() => {
        if (!report) return {};
        // Saved view (?view=<id>) takes precedence; falls back to URL params,
        // then per-filter defaults.
        const viewId = searchParams.get('view');
        const savedFilters =
            viewId && report
                ? loadSavedViews().find(
                      (x) => x.id === viewId && x.slug === report.slug,
                  )?.filters
                : undefined;
        const init: Record<string, string> = {};
        report.filters.forEach((f) => {
            init[f.key] =
                savedFilters?.[f.key] ??
                searchParams.get(f.key) ??
                f.defaultValue ??
                '';
        });
        return init;
    });

    const [savedViews, setSavedViews] = useState<SavedView[]>(() =>
        loadSavedViews(),
    );
    const [saveOpen, setSaveOpen] = useState(false);
    const [viewName, setViewName] = useState('');

    if (!report) {
        return (
            <div className="p-6 md:p-8">
                <PageHeader
                    title="Report not found"
                    description={`No report exists for slug “${slug}”.`}
                    actions={
                        <Button
                            variant="outline"
                            onClick={() => navigate('/reports')}
                        >
                            <ArrowLeft className="size-4" aria-hidden="true" />
                            Back to reports
                        </Button>
                    }
                />
            </div>
        );
    }

    function updateFilter(key: string, value: string) {
        setFilters((prev) => {
            const next = { ...prev, [key]: value };
            const params = new URLSearchParams(searchParams);
            if (value) params.set(key, value);
            else params.delete(key);
            setSearchParams(params, { replace: true });
            return next;
        });
    }

    function saveView() {
        const name = viewName.trim();
        if (!name) return;
        const next: SavedView[] = [
            ...savedViews.filter(
                (v) => !(v.slug === report!.slug && v.name === name),
            ),
            {
                id: `${report!.slug}-${name.toLowerCase().replace(/\s+/g, '-')}`,
                name,
                slug: report!.slug,
                filters: { ...filters },
                createdAt: Date.now(),
            },
        ];
        setSavedViews(next);
        persistSavedViews(next);
        setSaveOpen(false);
        setViewName('');
        push({
            variant: 'success',
            title: 'View saved',
            description: name,
        });
    }

    return (
        <div className="p-6 md:p-8">
            <div className="mb-3">
                <Link
                    to="/reports"
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-primary"
                >
                    <ArrowLeft className="size-3" aria-hidden="true" />
                    All reports
                </Link>
            </div>

            <PageHeader
                title={report.name}
                description={report.description}
                actions={
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSaveOpen(true)}
                        >
                            <BookmarkPlus
                                className="size-4"
                                aria-hidden="true"
                            />
                            Save view
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                push({
                                    variant: 'success',
                                    title: 'CSV export queued',
                                    description: `${report.name}.csv`,
                                })
                            }
                        >
                            <FileText className="size-4" aria-hidden="true" />
                            CSV
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                push({
                                    variant: 'success',
                                    title: 'Excel export queued',
                                    description: `${report.name}.xlsx`,
                                })
                            }
                        >
                            <FileSpreadsheet
                                className="size-4"
                                aria-hidden="true"
                            />
                            Excel
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                push({
                                    variant: 'success',
                                    title: 'PDF export queued',
                                    description: `${report.name}.pdf`,
                                })
                            }
                        >
                            <Download className="size-4" aria-hidden="true" />
                            PDF
                        </Button>
                    </div>
                }
            />

            <div className="mb-3 flex items-center gap-2">
                <Badge tone="sky">{REPORT_MODULE_LABEL[report.module]}</Badge>
                <Badge tone="neutral">
                    {report.headline.label}: {report.headline.value}
                </Badge>
            </div>

            {report.filters.length > 0 && (
                <section
                    aria-label="Report filters"
                    className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3"
                >
                    {report.filters.map((f) => (
                        <div key={f.key} className="flex flex-col gap-1">
                            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                {f.label}
                            </label>
                            {f.kind === 'select' && f.options ? (
                                <Select
                                    value={filters[f.key] ?? ''}
                                    onChange={(e) =>
                                        updateFilter(f.key, e.target.value)
                                    }
                                    className="w-44"
                                >
                                    {f.options.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </Select>
                            ) : (
                                <Input
                                    value={filters[f.key] ?? ''}
                                    onChange={(e) =>
                                        updateFilter(f.key, e.target.value)
                                    }
                                    className="w-44"
                                />
                            )}
                        </div>
                    ))}
                </section>
            )}

            <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Visualisation
                </h2>
                <ReportChart report={report} />
            </section>

            <section className="rounded-xl border border-slate-200 bg-white">
                <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Data
                    </h2>
                    <span className="text-xs text-slate-400">
                        {report.data.length} rows
                    </span>
                </header>
                <ReportTable report={report} />
            </section>

            <SaveViewDialog
                open={saveOpen}
                value={viewName}
                onChange={setViewName}
                onCancel={() => {
                    setSaveOpen(false);
                    setViewName('');
                }}
                onSave={saveView}
            />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Chart                                                               */
/* ------------------------------------------------------------------ */

function ReportChart({ report }: { report: ReportDef }) {
    const { chart, data } = report;

    if (chart.kind === 'pie' && chart.valueKey && chart.nameKey) {
        const valueKey = chart.valueKey;
        const nameKey = chart.nameKey;
        return (
            <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey={valueKey}
                            nameKey={nameKey}
                            cx="50%"
                            cy="50%"
                            outerRadius={110}
                            innerRadius={64}
                            paddingAngle={2}
                        >
                            {data.map((_, i) => (
                                <Cell
                                    key={i}
                                    fill={PIE_COLORS[i % PIE_COLORS.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                            iconType="circle"
                            wrapperStyle={{ fontSize: 12 }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        );
    }

    if (chart.kind === 'line') {
        return (
            <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                    <LineChart
                        data={data}
                        margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#E2E8F0"
                            vertical={false}
                        />
                        <XAxis
                            dataKey={chart.xKey}
                            stroke="#94A3B8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#94A3B8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            width={56}
                        />
                        <Tooltip />
                        <Legend
                            iconType="circle"
                            wrapperStyle={{ fontSize: 12 }}
                        />
                        {(chart.series ?? []).map((s) => (
                            <Line
                                key={s.key}
                                type="monotone"
                                dataKey={s.key}
                                name={s.label}
                                stroke={s.color}
                                strokeWidth={2.5}
                                dot={{ r: 3, fill: s.color }}
                                activeDot={{ r: 5 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        );
    }

    if (chart.kind === 'area') {
        return (
            <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                    <AreaChart
                        data={data}
                        margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#E2E8F0"
                            vertical={false}
                        />
                        <XAxis
                            dataKey={chart.xKey}
                            stroke="#94A3B8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#94A3B8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            width={56}
                        />
                        <Tooltip />
                        <Legend
                            iconType="circle"
                            wrapperStyle={{ fontSize: 12 }}
                        />
                        {(chart.series ?? []).map((s) => (
                            <Area
                                key={s.key}
                                type="monotone"
                                dataKey={s.key}
                                name={s.label}
                                stroke={s.color}
                                fill={s.color}
                                fillOpacity={0.18}
                                strokeWidth={2.5}
                            />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        );
    }

    // Bar / stacked bar fallback
    const stacked = chart.kind === 'stackedBar';
    return (
        <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
                <BarChart
                    data={data}
                    margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#E2E8F0"
                        vertical={false}
                    />
                    <XAxis
                        dataKey={chart.xKey}
                        stroke="#94A3B8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                    />
                    <YAxis
                        stroke="#94A3B8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        width={56}
                    />
                    <Tooltip />
                    <Legend
                        iconType="circle"
                        wrapperStyle={{ fontSize: 12 }}
                    />
                    {(chart.series ?? []).map((s: ReportSeriesDef) => (
                        <Bar
                            key={s.key}
                            dataKey={s.key}
                            name={s.label}
                            fill={s.color}
                            stackId={stacked ? 'stack' : undefined}
                            radius={stacked ? 0 : [4, 4, 0, 0]}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Table                                                               */
/* ------------------------------------------------------------------ */

function ReportTable({ report }: { report: ReportDef }) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead>
                    <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {report.columns.map((c) => (
                            <th
                                key={c.key}
                                className={cn(
                                    'px-4 py-2.5',
                                    c.align === 'right'
                                        ? 'text-right'
                                        : 'text-left',
                                )}
                            >
                                {c.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {report.data.map((row, i) => (
                        <tr
                            key={i}
                            className="border-t border-slate-100 hover:bg-slate-50/60"
                        >
                            {report.columns.map((c: ReportTableColumnDef) => (
                                <td
                                    key={c.key}
                                    className={cn(
                                        'px-4 py-2.5 text-slate-700',
                                        c.align === 'right'
                                            ? 'text-right tabular-nums'
                                            : 'text-left',
                                    )}
                                >
                                    {formatCell(row[c.key], c.format)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Save view dialog                                                    */
/* ------------------------------------------------------------------ */

function SaveViewDialog({
    open,
    value,
    onChange,
    onCancel,
    onSave,
}: {
    open: boolean;
    value: string;
    onChange: (v: string) => void;
    onCancel: () => void;
    onSave: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Save view</DialogTitle>
                    <DialogDescription>
                        Stores the current filter combination locally so you
                        can revisit it from the reports hub.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody>
                    <label className="text-xs font-semibold uppercase text-slate-500">
                        View name
                    </label>
                    <Input
                        autoFocus
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="e.g., Q4 GST shipments"
                        className="mt-1"
                    />
                </DialogBody>
                <DialogFooter>
                    <Button variant="ghost" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        disabled={value.trim().length < 2}
                        onClick={onSave}
                    >
                        <Save className="size-4" aria-hidden="true" />
                        Save view
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
