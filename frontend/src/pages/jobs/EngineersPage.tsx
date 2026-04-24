import { useMemo, useState } from 'react';
import { MapPin, Plus, Search, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/FormField';
import { cn } from '@/lib/cn';
import { formatRelative } from '@/lib/format';
import {
    engineers,
    type Engineer,
    type EngineerProficiency,
} from '@/mocks/engineers';

const STATUS_TONE: Record<
    Engineer['status'],
    'emerald' | 'blue' | 'amber'
> = {
    available: 'emerald',
    on_job: 'blue',
    on_leave: 'amber',
};

const STATUS_LABEL: Record<Engineer['status'], string> = {
    available: 'Available',
    on_job: 'On job',
    on_leave: 'On leave',
};

const PROFICIENCY_STYLES: Record<EngineerProficiency, string> = {
    expert: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    proficient: 'bg-sky-50 text-sky-700 border-sky-200',
    trainee: 'bg-amber-50 text-amber-700 border-amber-200',
};

const PROFICIENCY_LABEL: Record<EngineerProficiency, string> = {
    expert: 'Expert',
    proficient: 'Proficient',
    trainee: 'Trainee',
};

export default function EngineersPage() {
    const [q, setQ] = useState('');
    const [status, setStatus] = useState<'' | Engineer['status']>('');

    const rows = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return engineers.filter((e) => {
            if (status && e.status !== status) return false;
            if (!needle) return true;
            const hay = `${e.fullName} ${e.code} ${e.baseCity} ${e.serviceCities.join(' ')} ${e.skills
                .map((s) => s.category)
                .join(' ')}`.toLowerCase();
            return hay.includes(needle);
        });
    }, [q, status]);

    return (
        <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <Search
                            aria-hidden="true"
                            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                        />
                        <Input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search engineer, city, skill…"
                            className="w-64 pl-9"
                        />
                    </div>
                    <div
                        role="tablist"
                        aria-label="Filter by status"
                        className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1"
                    >
                        {[
                            { k: '', label: 'All' },
                            { k: 'available', label: 'Available' },
                            { k: 'on_job', label: 'On job' },
                            { k: 'on_leave', label: 'On leave' },
                        ].map((t) => (
                            <button
                                key={t.k || 'all'}
                                type="button"
                                role="tab"
                                aria-selected={status === t.k}
                                onClick={() => setStatus(t.k as typeof status)}
                                className={cn(
                                    'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                                    status === t.k
                                        ? 'bg-primary text-white'
                                        : 'text-slate-500 hover:text-slate-700',
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
                <Button size="sm">
                    <Plus className="size-4" aria-hidden="true" />
                    Add engineer
                </Button>
            </div>

            {rows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
                    No engineers match the current filters.
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {rows.map((e) => (
                        <EngineerCard key={e.id} eng={e} />
                    ))}
                </div>
            )}

            <p className="text-xs text-slate-500">
                Showing {rows.length} of {engineers.length} engineers.
            </p>
        </section>
    );
}

function EngineerCard({ eng }: { eng: Engineer }) {
    return (
        <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-4">
            <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-800">
                        {eng.fullName}
                    </h3>
                    <p className="font-mono text-[11px] text-slate-500">
                        {eng.code} · {eng.yearsOfExperience} yrs
                    </p>
                </div>
                <Badge tone={STATUS_TONE[eng.status]}>
                    {STATUS_LABEL[eng.status]}
                </Badge>
            </header>

            <p className="mt-2 flex items-center gap-1 text-xs text-slate-600">
                <MapPin className="size-3 text-slate-400" aria-hidden="true" />
                {eng.baseCity}
                {eng.serviceCities.length > 0 && (
                    <span className="text-slate-400">
                        · also {eng.serviceCities.join(', ')}
                    </span>
                )}
            </p>

            <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-2 text-center">
                <Metric
                    label="Rating"
                    value={
                        <span className="inline-flex items-center gap-0.5">
                            <Star
                                className="size-3 text-amber-500"
                                aria-hidden="true"
                            />
                            {eng.avgRating.toFixed(1)}
                        </span>
                    }
                />
                <Metric label="Active" value={eng.activeJobs} />
                <Metric label="This mo." value={eng.completedThisMonth} />
            </div>

            {eng.skills.length > 0 && (
                <div className="mt-3">
                    <p className="text-[10px] font-semibold uppercase text-slate-400">
                        Skills
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                        {eng.skills.map((s) => (
                            <span
                                key={s.category}
                                className={cn(
                                    'rounded-full border px-2 py-0.5 text-[10px] font-medium',
                                    PROFICIENCY_STYLES[s.proficiency],
                                )}
                                title={PROFICIENCY_LABEL[s.proficiency]}
                            >
                                {s.category}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {eng.certifications.length > 0 && (
                <div className="mt-3">
                    <p className="text-[10px] font-semibold uppercase text-slate-400">
                        Certifications
                    </p>
                    <ul className="mt-1 list-disc pl-5 text-xs text-slate-600">
                        {eng.certifications.map((c) => (
                            <li key={c}>{c}</li>
                        ))}
                    </ul>
                </div>
            )}

            <footer className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span>Next slot: {formatRelative(eng.nextSlotAt)}</span>
                <a
                    href={`tel:${eng.phone}`}
                    className="font-mono text-primary hover:underline"
                >
                    {eng.phone}
                </a>
            </footer>
        </article>
    );
}

function Metric({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div>
            <p className="text-[9px] font-semibold uppercase text-slate-400">
                {label}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-700">{value}</p>
        </div>
    );
}
