import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Activity,
    AlertTriangle,
    ArrowUpRight,
    CalendarClock,
    ClipboardList,
    PackageCheck,
    Receipt,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { formatCompactINR, formatINR } from '@/lib/format';
import { cn } from '@/lib/cn';
import { purchaseSummary } from '@/mocks/purchase-summary';
import { purchaseOrders, poTotals } from '@/mocks/purchase-orders';
import { vendorInvoices, invoiceOutstanding } from '@/mocks/vendor-invoices';
import { vendorPayments } from '@/mocks/vendor-payments';
import { rfqs } from '@/mocks/rfqs';
import { grns } from '@/mocks/grns';
import { vendors } from '@/mocks/vendors';
import { purchaseRequisitions } from '@/mocks/purchase-requisitions';

interface KpiCardProps {
    label: string;
    value: string;
    hint?: string;
    icon: typeof TrendingUp;
    accent?: string;
}

function KpiCard({ label, value, hint, icon: Icon, accent }: KpiCardProps) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Icon className={cn('size-4', accent ?? 'text-slate-400')} aria-hidden="true" />
                {label}
            </div>
            <div className={cn('mt-2 text-xl font-semibold text-slate-800', accent)}>{value}</div>
            {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
        </div>
    );
}

function SimpleBar({ label, value, max, hint }: { label: string; value: number; max: number; hint?: string }) {
    const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
    return (
        <div>
            <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="truncate">{label}</span>
                <span className="font-medium text-slate-700">{hint ?? formatCompactINR(value)}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

export default function PurchaseDashboardPage() {
    const s = purchaseSummary();

    const [today] = useState(() => Date.now());
    const overdueDeliveries = purchaseOrders
        .filter(
            (po) =>
                ['sent', 'partially_received'].includes(po.stage) &&
                new Date(po.expectedDeliveryDate).getTime() < today,
        )
        .slice(0, 5);

    const pendingApprovals = purchaseRequisitions
        .filter((p) => p.status === 'submitted')
        .slice(0, 5);

    const upcomingPayments = vendorInvoices
        .filter((v) => invoiceOutstanding(v) > 0)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5);

    const openRFQs = rfqs
        .filter((r) => ['sent', 'quotes_received'].includes(r.status))
        .slice(0, 5);

    const vendorSpendMap = new Map<string, number>();
    for (const po of purchaseOrders) {
        vendorSpendMap.set(po.vendorId, (vendorSpendMap.get(po.vendorId) ?? 0) + poTotals(po).grandTotalBaseCurrency);
    }
    const topVendors = [...vendorSpendMap.entries()]
        .map(([vendorId, total]) => ({
            vendor: vendors.find((v) => v.id === vendorId),
            total,
        }))
        .filter((x) => x.vendor)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

    const maxVendorSpend = topVendors[0]?.total ?? 1;

    const grnPending = grns.filter((g) =>
        ['received', 'qc_pending', 'qc_complete'].includes(g.stage),
    ).length;

    const onTimeDelivery = (() => {
        const completed = purchaseOrders.filter((p) => p.stage === 'received' || p.stage === 'closed');
        if (completed.length === 0) return 100;
        const onTime = completed.filter(
            (p) => new Date(p.expectedDeliveryDate).getTime() >= new Date(p.expectedDeliveryDate).getTime(),
        ).length;
        return Math.round((onTime / completed.length) * 100);
    })();

    return (
        <div>
            <PageHeader
                title="Purchase dashboard"
                description="Live KPIs for procurement: PRs, POs, GRNs, invoices, payments and vendors."
                actions={
                    <Link
                        to="/purchase"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                        Go to purchase orders
                        <ArrowUpRight className="size-3.5" aria-hidden="true" />
                    </Link>
                }
            />

            {/* KPI cards */}
            <section className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <KpiCard label="Open PRs" value={String(s.openPRs)} icon={ClipboardList} />
                <KpiCard
                    label="Open PO value"
                    value={formatCompactINR(s.openPOValue)}
                    icon={TrendingUp}
                    accent="text-blue-700"
                />
                <KpiCard
                    label="GRN pending"
                    value={String(grnPending)}
                    icon={PackageCheck}
                    accent={grnPending > 0 ? 'text-amber-700' : undefined}
                />
                <KpiCard
                    label="Invoice mismatch"
                    value={String(s.invoiceMismatch)}
                    icon={Receipt}
                    accent={s.invoiceMismatch > 0 ? 'text-red-600' : undefined}
                />
                <KpiCard
                    label="Outstanding payable"
                    value={formatCompactINR(s.outstandingPayable)}
                    icon={Wallet}
                    accent="text-orange-700"
                />
                <KpiCard
                    label="On-time delivery"
                    value={`${onTimeDelivery}%`}
                    icon={Activity}
                    accent="text-emerald-700"
                />
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
                {/* Top vendors */}
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <h3 className="mb-3 text-sm font-semibold text-slate-800">Top vendors by spend</h3>
                    <div className="space-y-3">
                        {topVendors.map((tv) => (
                            <SimpleBar
                                key={tv.vendor!.id}
                                label={tv.vendor!.name}
                                value={tv.total}
                                max={maxVendorSpend}
                            />
                        ))}
                    </div>
                </div>

                {/* Overdue deliveries */}
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <AlertTriangle className="size-4 text-red-500" aria-hidden="true" />
                        Overdue deliveries
                    </h3>
                    {overdueDeliveries.length === 0 ? (
                        <p className="text-xs text-slate-500">No overdue deliveries.</p>
                    ) : (
                        <ul className="space-y-2 text-sm">
                            {overdueDeliveries.map((po) => (
                                <li key={po.id} className="flex items-center justify-between gap-2">
                                    <Link to={`/purchase/orders/${po.id}`} className="font-medium text-slate-800 hover:underline">
                                        {po.number}
                                    </Link>
                                    <span className="text-xs text-slate-500">
                                        Due {new Date(po.expectedDeliveryDate).toLocaleDateString('en-IN')}
                                    </span>
                                    <Badge tone="red">{po.stage}</Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Pending approvals */}
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <h3 className="mb-3 text-sm font-semibold text-slate-800">Pending PR approvals</h3>
                    {pendingApprovals.length === 0 ? (
                        <p className="text-xs text-slate-500">Nothing awaiting approval.</p>
                    ) : (
                        <ul className="space-y-2 text-sm">
                            {pendingApprovals.map((p) => (
                                <li key={p.id} className="flex items-center justify-between gap-2">
                                    <Link to={`/purchase/requisitions/${p.id}`} className="font-medium text-slate-800 hover:underline">
                                        {p.number}
                                    </Link>
                                    <span className="text-xs text-slate-500">{p.department}</span>
                                    <Badge tone={p.priority === 'urgent' ? 'urgent' : 'amber'}>{p.priority}</Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Upcoming payments */}
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <CalendarClock className="size-4 text-orange-500" aria-hidden="true" />
                        Upcoming payments
                    </h3>
                    {upcomingPayments.length === 0 ? (
                        <p className="text-xs text-slate-500">No outstanding invoices.</p>
                    ) : (
                        <ul className="space-y-2 text-sm">
                            {upcomingPayments.map((v) => (
                                <li key={v.id} className="flex items-center justify-between gap-2">
                                    <Link to={`/purchase/invoices/${v.id}`} className="font-medium text-slate-800 hover:underline">
                                        {v.internalRef}
                                    </Link>
                                    <span className="text-xs text-slate-500">
                                        Due {new Date(v.dueDate).toLocaleDateString('en-IN')}
                                    </span>
                                    <span className="text-xs font-medium text-orange-700">
                                        {formatINR(invoiceOutstanding(v))}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Open RFQs */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
                    <h3 className="mb-3 text-sm font-semibold text-slate-800">Open RFQs</h3>
                    {openRFQs.length === 0 ? (
                        <p className="text-xs text-slate-500">No open RFQs.</p>
                    ) : (
                        <ul className="grid gap-2 text-sm sm:grid-cols-2">
                            {openRFQs.map((r) => (
                                <li
                                    key={r.id}
                                    className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 p-2"
                                >
                                    <Link to={`/purchase/rfqs/${r.id}`} className="font-medium text-slate-800 hover:underline">
                                        {r.number}
                                    </Link>
                                    <span className="text-xs text-slate-500">PR {r.prNumber}</span>
                                    <Badge tone="blue">{r.status}</Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Recent payments cleared */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
                    <h3 className="mb-3 text-sm font-semibold text-slate-800">Payments cleared (last 7 days)</h3>
                    <p className="text-2xl font-semibold text-emerald-700">
                        {formatCompactINR(s.paymentsThisWeek)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        Across {vendorPayments.filter((p) => p.status === 'cleared').length} cleared payment(s).
                    </p>
                </div>
            </div>
        </div>
    );
}
