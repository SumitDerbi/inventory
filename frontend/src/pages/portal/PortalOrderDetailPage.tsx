import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Package } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import {
    portalOrderById,
    portalOrderTimeline,
    type PortalOrderItem,
    type PortalTimelineEvent,
} from '@/mocks/portal/portal-orders';
import {
    STEPPER_STAGES,
    stageLabel,
    stageIndex,
    type OrderStage,
} from '@/lib/orderStatus';
import { formatINR, formatRelative } from '@/lib/format';
import { cn } from '@/lib/cn';

function PortalStageStepper({ stage }: { stage: OrderStage }) {
    const idx = stageIndex(stage);
    const isCancelled = stage === 'cancelled' || stage === 'on_hold';
    return (
        <ol className="flex items-center overflow-x-auto pb-2">
            {STEPPER_STAGES.map((s, i) => {
                const reached = !isCancelled && idx >= i;
                const active = !isCancelled && idx === i;
                return (
                    <li key={s} className="flex flex-1 items-center">
                        <div className="flex flex-col items-center">
                            <div
                                className={cn(
                                    'flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition',
                                    reached
                                        ? 'border-blue-600 bg-blue-600 text-white'
                                        : 'border-slate-300 bg-white text-slate-400',
                                    active && 'ring-4 ring-blue-100',
                                )}
                            >
                                {i + 1}
                            </div>
                            <span className={cn('mt-1 text-[11px]', reached ? 'text-slate-700' : 'text-slate-400')}>
                                {stageLabel(s)}
                            </span>
                        </div>
                        {i < STEPPER_STAGES.length - 1 && (
                            <div
                                className={cn(
                                    'mx-1 h-0.5 flex-1',
                                    reached && idx > i ? 'bg-blue-600' : 'bg-slate-200',
                                )}
                            />
                        )}
                    </li>
                );
            })}
        </ol>
    );
}

export default function PortalOrderDetailPage() {
    const { id = '' } = useParams<{ id: string }>();
    const order = portalOrderById(id);

    if (!order) {
        return (
            <EmptyState
                title="Order not found"
                description="It may have been removed or is not accessible from your account."
                action={
                    <Button asChild variant="primary" size="sm">
                        <Link to="/portal/orders"><ArrowLeft className="size-4" /> Back to orders</Link>
                    </Button>
                }
            />
        );
    }

    const timeline = portalOrderTimeline(order.id);

    const itemCols: DataTableColumn<PortalOrderItem>[] = [
        { key: 'desc', header: 'Item', cell: (i) => (
            <div>
                <div className="font-medium text-slate-900">{i.description}</div>
                {i.specNotes && <div className="text-xs text-slate-500">{i.specNotes}</div>}
            </div>
        ) },
        { key: 'qty', header: 'Qty', align: 'right', cell: (i) => `${i.quantity} ${i.uom}` },
    ];

    return (
        <div className="space-y-6">
            <Button asChild variant="ghost" size="sm" className="-ml-2">
                <Link to="/portal/orders"><ArrowLeft className="size-4" /> All orders</Link>
            </Button>

            <PageHeader
                title={order.orderNumber}
                description={order.projectName}
                actions={
                    <div className="flex items-center gap-2">
                        <StatusBadge status={stageLabel(order.stage)} />
                        <Badge
                            tone={
                                order.readinessFlag === 'green'
                                    ? 'emerald'
                                    : order.readinessFlag === 'amber'
                                        ? 'amber'
                                        : 'red'
                            }
                        >
                            {order.readinessFlag === 'green' ? 'On track' : order.readinessFlag === 'amber' ? 'At risk' : 'Delayed'}
                        </Badge>
                    </div>
                }
            />

            <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="mb-3 text-sm font-semibold text-slate-800">Stage</h2>
                <PortalStageStepper stage={order.stage} />
            </section>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                        <Calendar className="size-3.5" /> Expected delivery
                    </div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                        {new Date(order.expectedDeliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                        <Package className="size-3.5" /> Order value
                    </div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">{formatINR(order.totalValue)}</div>
                    <div className="text-xs text-slate-500">From quotation {order.quotationNumber}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                        <MapPin className="size-3.5" /> Site
                    </div>
                    <div className="mt-1 text-sm text-slate-900">{order.siteAddress}</div>
                </div>
            </div>

            <section>
                <h2 className="mb-3 text-sm font-semibold text-slate-800">Items</h2>
                <DataTable columns={itemCols} rows={order.items} rowKey={(i) => i.id} />
            </section>

            <section>
                <h2 className="mb-3 text-sm font-semibold text-slate-800">Timeline</h2>
                {timeline.length === 0 ? (
                    <p className="rounded-md bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">No events yet.</p>
                ) : (
                    <ol className="relative space-y-4 border-l-2 border-slate-200 pl-4">
                        {timeline.map((e: PortalTimelineEvent) => (
                            <li key={e.id} className="relative">
                                <span className="absolute -left-[22px] top-1 flex size-4 items-center justify-center rounded-full border-2 border-blue-500 bg-white">
                                    <span className="size-1.5 rounded-full bg-blue-500" />
                                </span>
                                <div className="text-sm font-medium text-slate-900">{e.label}</div>
                                {e.detail && <div className="text-xs text-slate-500">{e.detail}</div>}
                                <div className="text-xs text-slate-400">{formatRelative(e.at)}</div>
                            </li>
                        ))}
                    </ol>
                )}
            </section>
        </div>
    );
}
