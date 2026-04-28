import { Link } from 'react-router-dom';
import {
    PackageOpen,
    FileText,
    Truck,
    Wrench,
    LifeBuoy,
    ArrowRight,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePortalAuth } from '@/app/portal-context';
import { portalOrders } from '@/mocks/portal/portal-orders';
import { portalQuotations, canApprovePortalQuote } from '@/mocks/portal/portal-quotations';
import { portalDispatches } from '@/mocks/portal/portal-dispatches';
import { portalJobs } from '@/mocks/portal/portal-jobs';
import { portalNotifications } from '@/mocks/portal/portal-notifications';
import { stageLabel } from '@/lib/orderStatus';
import { formatINR, formatRelative } from '@/lib/format';

export default function PortalHomePage() {
    const { user } = usePortalAuth();
    const orders = portalOrders();
    const quotes = portalQuotations();
    const dispatches = portalDispatches();
    const jobs = portalJobs();
    const notifications = portalNotifications().slice(0, 5);

    const openOrders = orders.filter((o) => o.stage !== 'installed' && o.stage !== 'cancelled');
    const pendingApproval = quotes.filter(canApprovePortalQuote);
    const inTransit = dispatches.filter((d) => d.stage !== 'delivered' && d.stage !== 'cancelled');
    const upcomingJobs = jobs.filter((j) => j.status === 'scheduled' || j.status === 'in_progress');

    return (
        <div className="space-y-6">
            <PageHeader
                title={`Hi, ${user?.name?.split(' ')[0] ?? 'there'} 👋`}
                description="Here's a snapshot of your account."
            />

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard label="Open orders" value={openOrders.length} icon={PackageOpen} tone="blue" />
                <StatCard label="Pending approval" value={pendingApproval.length} icon={FileText} tone="amber" />
                <StatCard label="In transit" value={inTransit.length} icon={Truck} tone="violet" />
                <StatCard label="Upcoming jobs" value={upcomingJobs.length} icon={Wrench} tone="emerald" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-800">Quotations awaiting your decision</h2>
                        <Button asChild size="sm" variant="ghost">
                            <Link to="/portal/quotations">All quotes <ArrowRight className="size-3.5" /></Link>
                        </Button>
                    </div>
                    {pendingApproval.length === 0 ? (
                        <p className="rounded-md bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
                            Nothing pending. We&apos;ll notify you when a new quotation arrives.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {pendingApproval.slice(0, 4).map((q) => (
                                <li key={q.id}>
                                    <Link
                                        to={`/portal/quotations/${q.id}`}
                                        className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 hover:bg-slate-50"
                                    >
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-medium text-slate-900">{q.quotationNumber}</div>
                                            <div className="truncate text-xs text-slate-500">{q.projectName}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-slate-700">{formatINR(q.grandTotal)}</span>
                                            <Badge tone="amber">Action needed</Badge>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-800">Recent orders</h2>
                        <Button asChild size="sm" variant="ghost">
                            <Link to="/portal/orders">All orders <ArrowRight className="size-3.5" /></Link>
                        </Button>
                    </div>
                    {orders.length === 0 ? (
                        <EmptyState title="No orders yet" description="Confirmed orders will show here." />
                    ) : (
                        <ul className="space-y-2">
                            {orders.slice(0, 4).map((o) => (
                                <li key={o.id}>
                                    <Link
                                        to={`/portal/orders/${o.id}`}
                                        className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 hover:bg-slate-50"
                                    >
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-medium text-slate-900">{o.orderNumber}</div>
                                            <div className="truncate text-xs text-slate-500">{o.projectName}</div>
                                        </div>
                                        <StatusBadge status={stageLabel(o.stage)} />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-800">Latest notifications</h2>
                        <Button asChild size="sm" variant="ghost">
                            <Link to="/portal/notifications">View all <ArrowRight className="size-3.5" /></Link>
                        </Button>
                    </div>
                    {notifications.length === 0 ? (
                        <EmptyState title="All caught up" />
                    ) : (
                        <ul className="space-y-2">
                            {notifications.map((n) => (
                                <li key={n.id} className="flex items-start gap-2 rounded-md border border-slate-100 px-3 py-2">
                                    {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-blue-500" />}
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-medium text-slate-900">{n.title}</div>
                                        <div className="truncate text-xs text-slate-500">{n.body}</div>
                                    </div>
                                    <span className="shrink-0 text-xs text-slate-400">{formatRelative(n.createdAt)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-slate-800">Need a hand?</h2>
                        <Button asChild size="sm" variant="ghost">
                            <Link to="/portal/tickets"><LifeBuoy className="size-3.5" /> Support</Link>
                        </Button>
                    </div>
                    <p className="text-sm text-slate-600">
                        Raise a support ticket for technical questions, document requests or schedule changes.
                        Most replies arrive within one business day.
                    </p>
                    <div className="mt-3">
                        <Button asChild variant="primary" size="sm">
                            <Link to="/portal/tickets/new">Raise a ticket</Link>
                        </Button>
                    </div>
                </section>
            </div>
        </div>
    );
}
