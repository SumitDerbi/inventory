import { NavLink, Outlet } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { cn } from '@/lib/cn';
import { dispatchSummary } from '@/mocks/dispatches';

const TABS: Array<{ to: string; label: string; end?: boolean }> = [
    { to: '/dispatch', label: 'Challans', end: true },
    { to: '/dispatch/plan', label: 'Plan dispatch' },
    { to: '/dispatch/transporters', label: 'Transporters' },
    { to: '/dispatch/vehicles', label: 'Vehicles' },
];

export default function DispatchLayout() {
    const s = dispatchSummary();
    return (
        <div className="p-6 md:p-8">
            <PageHeader
                title="Dispatch & logistics"
                description="Plan, track and close out dispatches; manage transporters and fleet."
            />

            <section
                aria-label="Dispatch summary"
                className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-4"
            >
                <Stat label="Total challans" value={String(s.total)} />
                <Stat
                    label="In transit"
                    value={String(s.inTransit)}
                    valueClassName={s.inTransit > 0 ? 'text-blue-700' : undefined}
                />
                <Stat
                    label="Awaiting POD"
                    value={String(s.awaitingPod)}
                    valueClassName={s.awaitingPod > 0 ? 'text-amber-700' : undefined}
                />
                <Stat
                    label="Open exceptions"
                    value={String(s.exceptions)}
                    valueClassName={s.exceptions > 0 ? 'text-red-600' : undefined}
                />
            </section>

            <div
                role="tablist"
                aria-label="Dispatch sections"
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
                    'mt-1 text-xl font-semibold text-slate-800',
                    valueClassName,
                )}
            >
                {value}
            </p>
        </div>
    );
}
