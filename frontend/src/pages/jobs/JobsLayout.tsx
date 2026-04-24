import { NavLink, Outlet } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { cn } from '@/lib/cn';
import { jobsSummary } from '@/mocks/jobs';

const TABS: Array<{ to: string; label: string; end?: boolean }> = [
    { to: '/jobs', label: 'Jobs', end: true },
    { to: '/jobs/calendar', label: 'Scheduler' },
    { to: '/jobs/engineers', label: 'Engineers' },
];

export default function JobsLayout() {
    const s = jobsSummary();
    return (
        <div className="p-6 md:p-8">
            <PageHeader
                title="Jobs & engineers"
                description="Schedule installations, track field execution, and maintain engineer roster."
            />

            <section
                aria-label="Jobs summary"
                className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-4"
            >
                <Stat label="Total jobs" value={String(s.total)} />
                <Stat
                    label="Scheduled"
                    value={String(s.scheduled)}
                    valueClassName={s.scheduled > 0 ? 'text-sky-700' : undefined}
                />
                <Stat
                    label="In progress"
                    value={String(s.inProgress)}
                    valueClassName={s.inProgress > 0 ? 'text-blue-700' : undefined}
                />
                <Stat
                    label="Awaiting sign-off"
                    value={String(s.awaitingSignoff)}
                    valueClassName={s.awaitingSignoff > 0 ? 'text-amber-700' : undefined}
                />
            </section>

            <div
                role="tablist"
                aria-label="Jobs sections"
                className="mb-4 flex flex-wrap gap-1 border-b border-slate-200"
            >
                {TABS.map((t) => (
                    <NavLink
                        key={t.to}
                        to={t.to}
                        end={t.end}
                        className={({ isActive }) =>
                            cn(
                                'relative px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'text-primary'
                                    : 'text-slate-500 hover:text-slate-700',
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {t.label}
                                {isActive && (
                                    <span
                                        aria-hidden="true"
                                        className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary"
                                    />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </div>

            <Outlet />
        </div>
    );
}

function Stat({
    label,
    value,
    valueClassName,
}: {
    label: string;
    value: string;
    valueClassName?: string;
}) {
    return (
        <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {label}
            </p>
            <p
                className={cn(
                    'mt-1 text-base font-semibold text-slate-800',
                    valueClassName,
                )}
            >
                {value}
            </p>
        </div>
    );
}
