import { NavLink, Outlet } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { cn } from '@/lib/cn';
import { formatINR } from '@/lib/format';
import { inventorySummary } from '@/mocks/inventory';

const TABS: Array<{ to: string; label: string; end?: boolean }> = [
    { to: '/inventory/products', label: 'Products' },
    { to: '/inventory/reorder', label: 'Reorder alerts' },
    { to: '/inventory/reservations', label: 'Reservations' },
    { to: '/inventory/adjustments', label: 'Adjustments' },
    { to: '/inventory/warehouses', label: 'Warehouses' },
];

export default function InventoryLayout() {
    const s = inventorySummary();
    return (
        <div className="p-6 md:p-8">
            <PageHeader
                title="Inventory"
                description="Product master, stock positions, reservations and adjustments."
            />

            {/* Summary strip */}
            <section
                aria-label="Stock summary"
                className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-4"
            >
                <Stat label="Total SKUs" value={String(s.totalSkus)} />
                <Stat
                    label="Low stock"
                    value={String(s.lowCount)}
                    valueClassName={s.lowCount > 0 ? 'text-amber-700' : undefined}
                />
                <Stat
                    label="Out of stock"
                    value={String(s.outCount)}
                    valueClassName={s.outCount > 0 ? 'text-red-600' : undefined}
                />
                <Stat label="Stock value" value={formatINR(s.stockValue)} />
            </section>

            {/* Sub-nav tabs */}
            <div
                role="tablist"
                aria-label="Inventory sections"
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
            <p className={cn('text-sm font-semibold text-slate-700', valueClassName)}>
                {value}
            </p>
        </div>
    );
}
