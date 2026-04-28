import { NavLink, Outlet } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { cn } from '@/lib/cn';
import { formatCompactINR } from '@/lib/format';
import { purchaseSummary } from '@/mocks/purchase-summary';

const TABS: Array<{ to: string; label: string; end?: boolean }> = [
    { to: '/purchase/dashboard', label: 'Dashboard' },
    { to: '/purchase', label: 'Orders', end: true },
    { to: '/purchase/requisitions', label: 'Requisitions' },
    { to: '/purchase/rfqs', label: 'RFQs' },
    { to: '/purchase/grns', label: 'GRNs' },
    { to: '/purchase/invoices', label: 'Invoices' },
    { to: '/purchase/payments', label: 'Payments' },
    { to: '/purchase/returns', label: 'Returns' },
    { to: '/purchase/vendors', label: 'Vendors' },
    { to: '/purchase/admin', label: 'Admin' },
];

export default function PurchaseLayout() {
    const s = purchaseSummary();
    return (
        <div className="p-6 md:p-8">
            <PageHeader
                title="Procurement & purchase"
                description="Manage vendors, requisitions, RFQs, POs, GRNs, invoices, payments and returns."
            />

            <section
                aria-label="Purchase summary"
                className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-3 lg:grid-cols-5"
            >
                <Stat label="Open PRs" value={String(s.openPRs)} />
                <Stat
                    label="Open PO value"
                    value={formatCompactINR(s.openPOValue)}
                    valueClassName="text-blue-700"
                />
                <Stat
                    label="GRN pending"
                    value={String(s.grnPending)}
                    valueClassName={s.grnPending > 0 ? 'text-amber-700' : undefined}
                />
                <Stat
                    label="Invoice mismatch"
                    value={String(s.invoiceMismatch)}
                    valueClassName={s.invoiceMismatch > 0 ? 'text-red-600' : undefined}
                />
                <Stat
                    label="Outstanding payable"
                    value={formatCompactINR(s.outstandingPayable)}
                    valueClassName="text-orange-700"
                />
            </section>

            <div
                role="tablist"
                aria-label="Purchase sections"
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
                                isActive ? 'text-primary' : 'text-slate-500 hover:text-slate-700',
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
