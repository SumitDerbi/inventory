import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import {
    JOB_PRIORITY_TONE,
    JOB_STATUS_TONE,
    JOB_STATUS_LABEL,
    JOB_PRIORITY_LABEL,
    jobs,
} from '@/mocks/jobs';
import { engineers } from '@/mocks/engineers';

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
// Module-level anchor to keep render pure (React Compiler)
const TODAY = Date.now();

function startOfWeekUTC(ms: number): number {
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0 = Sun … 6 = Sat
    const offset = day === 0 ? -6 : 1 - day; // shift to Monday
    return d.getTime() + offset * DAY_MS;
}

function sameDay(a: number | string, b: number | string): boolean {
    const d1 = new Date(a);
    const d2 = new Date(b);
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
}

export default function SchedulerPage() {
    const navigate = useNavigate();
    const [weekStart, setWeekStart] = useState<number>(() =>
        startOfWeekUTC(TODAY),
    );

    const days = useMemo(
        () =>
            Array.from({ length: 7 }, (_, i) => weekStart + i * DAY_MS),
        [weekStart],
    );

    const rangeLabel = useMemo(() => {
        const start = new Date(days[0]);
        const end = new Date(days[6]);
        const fmt = (d: Date) =>
            d.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
            });
        return `${fmt(start)} – ${fmt(end)} ${end.getFullYear()}`;
    }, [days]);

    return (
        <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <div>
                    <p className="text-sm font-semibold text-slate-800">
                        Week of {rangeLabel}
                    </p>
                    <p className="text-xs text-slate-500">
                        Field deployment across {engineers.length} engineers
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            setWeekStart((w) => w - 7 * DAY_MS)
                        }
                    >
                        <ChevronLeft className="size-4" aria-hidden="true" />
                        Prev
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setWeekStart(startOfWeekUTC(TODAY))}
                    >
                        Today
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            setWeekStart((w) => w + 7 * DAY_MS)
                        }
                    >
                        Next
                        <ChevronRight className="size-4" aria-hidden="true" />
                    </Button>
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="min-w-full border-separate border-spacing-0">
                    <thead>
                        <tr>
                            <th className="sticky left-0 z-10 border-b border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                                Engineer
                            </th>
                            {days.map((d, i) => {
                                const isToday = sameDay(d, TODAY);
                                const date = new Date(d);
                                return (
                                    <th
                                        key={d}
                                        className={cn(
                                            'border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase',
                                            isToday
                                                ? 'bg-primary/5 text-primary'
                                                : 'bg-slate-50 text-slate-500',
                                        )}
                                    >
                                        <span>{DAY_LABELS[i]}</span>
                                        <span className="ml-2 text-slate-400">
                                            {date.getDate().toString().padStart(2, '0')}
                                        </span>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {engineers.map((eng) => (
                            <tr key={eng.id}>
                                <th
                                    scope="row"
                                    className="sticky left-0 z-10 border-b border-slate-100 bg-white px-3 py-2 text-left align-top"
                                >
                                    <p className="text-sm font-semibold text-slate-800">
                                        {eng.fullName}
                                    </p>
                                    <p className="font-mono text-[10px] text-slate-500">
                                        {eng.code} · {eng.baseCity}
                                    </p>
                                </th>
                                {days.map((d) => {
                                    const cell = jobs.filter(
                                        (j) =>
                                            j.engineerId === eng.id &&
                                            sameDay(j.scheduledStart, d),
                                    );
                                    const conflict = cell.length > 1;
                                    return (
                                        <td
                                            key={d}
                                            className={cn(
                                                'min-w-[160px] border-b border-slate-100 p-2 align-top',
                                                conflict &&
                                                'bg-red-50',
                                            )}
                                        >
                                            <div className="space-y-1.5">
                                                {cell.map((j) => (
                                                    <button
                                                        key={j.id}
                                                        type="button"
                                                        onClick={() =>
                                                            navigate(`/jobs/${j.id}`)
                                                        }
                                                        className="w-full rounded-md border border-slate-200 bg-white p-2 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
                                                    >
                                                        <p className="font-mono text-[11px] font-semibold text-slate-800">
                                                            {j.jobNumber}
                                                        </p>
                                                        <p className="truncate text-[11px] text-slate-600">
                                                            {j.customerCompany}
                                                        </p>
                                                        <p className="mt-0.5 text-[10px] text-slate-400">
                                                            {new Date(
                                                                j.scheduledStart,
                                                            ).toLocaleTimeString('en-IN', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                            {' · '}
                                                            {j.siteCity}
                                                        </p>
                                                        <div className="mt-1 flex flex-wrap gap-1">
                                                            <Badge
                                                                tone={
                                                                    JOB_STATUS_TONE[j.status]
                                                                }
                                                            >
                                                                {JOB_STATUS_LABEL[j.status]}
                                                            </Badge>
                                                            {(j.priority === 'high' ||
                                                                j.priority === 'urgent') && (
                                                                    <Badge
                                                                        tone={
                                                                            JOB_PRIORITY_TONE[
                                                                            j.priority
                                                                            ]
                                                                        }
                                                                    >
                                                                        {
                                                                            JOB_PRIORITY_LABEL[
                                                                            j.priority
                                                                            ]
                                                                        }
                                                                    </Badge>
                                                                )}
                                                        </div>
                                                    </button>
                                                ))}
                                                {conflict && (
                                                    <p className="text-[10px] font-semibold text-red-600">
                                                        Overlap — review schedule
                                                    </p>
                                                )}
                                                {cell.length === 0 && (
                                                    <p className="py-2 text-center text-[11px] text-slate-300">
                                                        —
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p className="text-xs text-slate-500">
                Tip: Click any job card to open the detail view. Red-tinted cells
                indicate scheduling overlaps that need rebalancing.
            </p>
        </section>
    );
}
