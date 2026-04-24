import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    BarChart3,
    Boxes,
    ClipboardList,
    FileBarChart,
    PieChart as PieChartIcon,
    Search,
    ShoppingCart,
    Truck,
    Users,
    Wrench,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/FormField';
import { Badge } from '@/components/ui/Badge';
import {
    REPORTS,
    REPORT_MODULE_LABEL,
    type ReportDef,
    type ReportModule,
} from '@/mocks/reports';

const MODULE_ICON: Record<ReportModule, typeof BarChart3> = {
    inquiries: ClipboardList,
    quotations: FileBarChart,
    orders: ShoppingCart,
    inventory: Boxes,
    dispatch: Truck,
    jobs: Wrench,
    sales: Users,
};

const MODULE_ACCENT: Record<ReportModule, string> = {
    inquiries: 'bg-sky-50 text-sky-700 ring-sky-200',
    quotations: 'bg-violet-50 text-violet-700 ring-violet-200',
    orders: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    inventory: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dispatch: 'bg-amber-50 text-amber-700 ring-amber-200',
    jobs: 'bg-pink-50 text-pink-700 ring-pink-200',
    sales: 'bg-blue-50 text-blue-700 ring-blue-200',
};

const MODULE_ORDER: ReportModule[] = [
    'sales',
    'inquiries',
    'quotations',
    'orders',
    'inventory',
    'dispatch',
    'jobs',
];

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

export default function ReportsPage() {
    const [search, setSearch] = useState('');
    const [savedViews] = useState<SavedView[]>(() => loadSavedViews());

    const grouped = useMemo(() => {
        const q = search.trim().toLowerCase();
        const map = new Map<ReportModule, ReportDef[]>();
        REPORTS.forEach((r) => {
            if (
                q &&
                !`${r.name} ${r.description}`.toLowerCase().includes(q)
            ) {
                return;
            }
            if (!map.has(r.module)) map.set(r.module, []);
            map.get(r.module)!.push(r);
        });
        return map;
    }, [search]);

    const totalShown = useMemo(
        () =>
            Array.from(grouped.values()).reduce(
                (sum, list) => sum + list.length,
                0,
            ),
        [grouped],
    );

    return (
        <div className="p-6 md:p-8">
            <PageHeader
                title="Reports & Analytics"
                description="Explore filterable reports across every module. Save your favourite filter combos as views."
            />

            <div className="mb-5 flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-64 max-w-md">
                    <Search
                        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                    />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search reports…"
                        className="pl-9"
                    />
                </div>
                <span className="text-xs text-slate-500">
                    {totalShown} of {REPORTS.length} reports
                </span>
            </div>

            {savedViews.length > 0 && (
                <section className="mb-6">
                    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Saved views
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {savedViews.map((v) => (
                            <Link
                                key={v.id}
                                to={`/reports/${v.slug}?view=${encodeURIComponent(v.id)}`}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 transition hover:border-primary hover:bg-primary/5 hover:text-primary"
                            >
                                <PieChartIcon
                                    className="size-3"
                                    aria-hidden="true"
                                />
                                {v.name}
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            <div className="space-y-8">
                {MODULE_ORDER.map((module) => {
                    const list = grouped.get(module);
                    if (!list || list.length === 0) return null;
                    const Icon = MODULE_ICON[module];
                    return (
                        <section key={module}>
                            <header className="mb-3 flex items-center gap-2">
                                <span
                                    className={`inline-flex size-7 items-center justify-center rounded-md ring-1 ${MODULE_ACCENT[module]}`}
                                >
                                    <Icon
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                </span>
                                <h2 className="text-sm font-semibold text-slate-800">
                                    {REPORT_MODULE_LABEL[module]}
                                </h2>
                                <Badge tone="neutral">{list.length}</Badge>
                            </header>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {list.map((r) => (
                                    <Link
                                        key={r.slug}
                                        to={`/reports/${r.slug}`}
                                        className="group rounded-xl border border-slate-200 bg-white p-4 transition hover:border-primary/40 hover:shadow-sm"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="text-sm font-semibold text-slate-800 group-hover:text-primary">
                                                {r.name}
                                            </h3>
                                            <BarChart3
                                                className="size-4 shrink-0 text-slate-300 group-hover:text-primary"
                                                aria-hidden="true"
                                            />
                                        </div>
                                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                                            {r.description}
                                        </p>
                                        <p className="mt-3 flex items-baseline gap-2">
                                            <span className="text-base font-semibold text-slate-800">
                                                {r.headline.value}
                                            </span>
                                            <span className="text-[11px] uppercase tracking-wide text-slate-400">
                                                {r.headline.label}
                                            </span>
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    );
                })}

                {totalShown === 0 && (
                    <p className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                        No reports match “{search}”.
                    </p>
                )}
            </div>
        </div>
    );
}
