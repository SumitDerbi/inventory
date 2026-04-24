import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    Ban,
    Calendar,
    CheckCircle2,
    ChevronDown,
    Clock,
    FileText,
    Loader2,
    MapPin,
    Package,
    Pencil,
    Phone,
    Plus,
    ShieldAlert,
    Truck,
    Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { FormField, Input, Select, Textarea } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { formatINR, formatRelative } from '@/lib/format';
import {
    canAdvanceTo,
    canCancel,
    canCreateDispatch,
    canRaiseInvoice,
    isTerminal,
    STEPPER_STAGES,
    stageIndex,
    stageLabel,
    type OrderStage,
} from '@/lib/orderStatus';
import {
    orderById,
    itemPending,
    type DeliveryPlan,
    type MrpRow,
    type OrderActivity,
    type OrderDocument,
    type OrderLineItem,
    type SalesOrder,
} from '@/mocks/orders';
import { userById } from '@/mocks/users';

type TabKey =
    | 'items'
    | 'delivery'
    | 'mrp'
    | 'installation'
    | 'documents'
    | 'activity';

const TABS: Array<{ key: TabKey; label: string }> = [
    { key: 'items', label: 'Items' },
    { key: 'delivery', label: 'Delivery Plan' },
    { key: 'mrp', label: 'Material Readiness' },
    { key: 'installation', label: 'Installation Readiness' },
    { key: 'documents', label: 'Documents' },
    { key: 'activity', label: 'Activity' },
];

const DATE_FMT = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
});

function fmtDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    return DATE_FMT.format(new Date(iso));
}

function fmtDateTime(iso: string): string {
    return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function OrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { push } = useToast();

    const order = orderById(id ?? '');

    const [tab, setTab] = useState<TabKey>('items');
    const [advanceTarget, setAdvanceTarget] = useState<OrderStage | null>(null);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [amendOpen, setAmendOpen] = useState(false);
    const [dispatchOpen, setDispatchOpen] = useState(false);
    const [invoiceOpen, setInvoiceOpen] = useState(false);
    const [addDeliveryOpen, setAddDeliveryOpen] = useState(false);

    if (!order) {
        return <Navigate to="/orders" replace />;
    }

    const owner = userById(order.ownerId);
    const terminal = isTerminal(order.stage);
    const nextStage =
        stageIndex(order.stage) >= 0 &&
            stageIndex(order.stage) < STEPPER_STAGES.length - 1
            ? STEPPER_STAGES[stageIndex(order.stage) + 1]
            : null;
    const hasShortage = order.mrp.some((m) => m.shortage > 0);
    const installationReady =
        order.installation.civilReady &&
        order.installation.electricalReady &&
        order.installation.approvalsReceived;

    return (
        <div className="p-6 md:p-8">
            <button
                type="button"
                onClick={() => navigate('/orders')}
                className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
            >
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                Back to orders
            </button>

            {/* Header */}
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-xl font-semibold text-slate-800 md:text-2xl">
                            {order.orderNumber}
                        </h1>
                        <StatusBadge status={stageLabel(order.stage)} />
                        {order.pendingApproval && (
                            <Badge tone="amber">
                                {order.pendingApproval.type === 'cancellation'
                                    ? 'Cancellation pending'
                                    : 'Amendment pending'}
                            </Badge>
                        )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                        <Link
                            to={`/quotations/${order.quotationId}`}
                            className="text-primary hover:underline"
                        >
                            {order.quotationNumber}
                        </Link>
                        {' · '}
                        {order.customerName} · {order.companyName} · {order.projectName} ·
                        Owner {owner?.name ?? '—'}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {canCreateDispatch(order.stage) && (
                        <Button onClick={() => setDispatchOpen(true)}>
                            <Truck className="size-4" aria-hidden="true" />
                            Create Dispatch
                        </Button>
                    )}
                    {canRaiseInvoice(order.stage) && (
                        <Button variant="outline" onClick={() => setInvoiceOpen(true)}>
                            <FileText className="size-4" aria-hidden="true" />
                            Raise Invoice
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                Actions
                                <ChevronDown className="size-4" aria-hidden="true" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onSelect={() => setAmendOpen(true)}
                                disabled={terminal}
                            >
                                <Pencil className="size-4" aria-hidden="true" />
                                Request Amendment
                            </DropdownMenuItem>
                            {nextStage && (
                                <DropdownMenuItem
                                    onSelect={() => setAdvanceTarget(nextStage)}
                                >
                                    <ArrowRight className="size-4" aria-hidden="true" />
                                    Advance to {stageLabel(nextStage)}
                                </DropdownMenuItem>
                            )}
                            {canCancel(order.stage) && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        destructive
                                        onSelect={() => setCancelOpen(true)}
                                    >
                                        <Ban className="size-4" aria-hidden="true" />
                                        Cancel order
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {order.pendingApproval && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                    <ShieldAlert
                        className="mt-0.5 size-4 shrink-0 text-amber-600"
                        aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                        <p className="font-medium text-amber-800">
                            {order.pendingApproval.type === 'cancellation'
                                ? 'Cancellation awaiting approval'
                                : 'Amendment awaiting approval'}
                        </p>
                        <p className="text-xs text-amber-700">
                            {order.pendingApproval.reason} · Requested by{' '}
                            {userById(order.pendingApproval.requestedBy)?.name ?? '—'} ·{' '}
                            {formatRelative(order.pendingApproval.requestedAt)}
                        </p>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                            push({
                                variant: 'success',
                                title: 'Request approved',
                                description: order.orderNumber,
                            })
                        }
                    >
                        Approve
                    </Button>
                </div>
            )}

            {/* Stepper */}
            <StageStepper
                current={order.stage}
                onSelect={(s) => {
                    if (canAdvanceTo(order.stage, s)) {
                        setAdvanceTarget(s);
                    }
                }}
            />

            {/* Summary strip */}
            <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-4">
                <Stat label="Total value" value={formatINR(order.totalValue)} />
                <Stat label="Expected delivery" value={fmtDate(order.expectedDeliveryDate)} />
                <Stat
                    label="Material readiness"
                    value={hasShortage ? 'Shortage' : 'In stock'}
                    valueClassName={hasShortage ? 'text-red-600' : 'text-emerald-700'}
                />
                <Stat
                    label="Install readiness"
                    value={installationReady ? 'Ready' : 'Pending'}
                    valueClassName={
                        installationReady ? 'text-emerald-700' : 'text-amber-700'
                    }
                />
            </div>

            {/* Tabs */}
            <div
                role="tablist"
                aria-label="Order sections"
                className="mb-4 flex flex-wrap gap-1 border-b border-slate-200"
            >
                {TABS.map((t) => {
                    const count =
                        t.key === 'items'
                            ? order.items.length
                            : t.key === 'delivery'
                                ? order.deliveryPlans.length
                                : t.key === 'mrp'
                                    ? order.mrp.length
                                    : t.key === 'documents'
                                        ? order.documents.length
                                        : t.key === 'activity'
                                            ? order.activity.length
                                            : null;
                    return (
                        <button
                            key={t.key}
                            type="button"
                            role="tab"
                            aria-selected={tab === t.key}
                            tabIndex={tab === t.key ? 0 : -1}
                            onClick={() => setTab(t.key)}
                            className={cn(
                                'relative flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors',
                                tab === t.key
                                    ? 'text-primary'
                                    : 'text-slate-500 hover:text-slate-700',
                            )}
                        >
                            {t.label}
                            {count !== null && count > 0 && (
                                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                                    {count}
                                </span>
                            )}
                            {tab === t.key && (
                                <span
                                    aria-hidden="true"
                                    className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary"
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {tab === 'items' && <ItemsTab items={order.items} />}
            {tab === 'delivery' && (
                <DeliveryTab
                    plans={order.deliveryPlans}
                    onAdd={() => setAddDeliveryOpen(true)}
                />
            )}
            {tab === 'mrp' && <MrpTab rows={order.mrp} />}
            {tab === 'installation' && <InstallationTab order={order} />}
            {tab === 'documents' && <DocumentsTab documents={order.documents} />}
            {tab === 'activity' && <ActivityTab activity={order.activity} />}

            {/* Dialogs */}
            <StageAdvanceDialog
                open={advanceTarget !== null}
                onOpenChange={(o) => !o && setAdvanceTarget(null)}
                order={order}
                target={advanceTarget}
                hasShortage={hasShortage}
                installationReady={installationReady}
                onConfirm={() => {
                    push({
                        variant: 'success',
                        title: `Moved to ${stageLabel(advanceTarget!)}`,
                        description: order.orderNumber,
                    });
                    setAdvanceTarget(null);
                }}
            />
            <CancelOrderDialog
                open={cancelOpen}
                onOpenChange={setCancelOpen}
                order={order}
            />
            <AmendmentDialog
                open={amendOpen}
                onOpenChange={setAmendOpen}
                order={order}
            />
            <CreateDispatchDialog
                open={dispatchOpen}
                onOpenChange={setDispatchOpen}
                order={order}
            />
            <RaiseInvoiceDialog
                open={invoiceOpen}
                onOpenChange={setInvoiceOpen}
                order={order}
            />
            <AddDeliveryDialog
                open={addDeliveryOpen}
                onOpenChange={setAddDeliveryOpen}
                order={order}
            />
        </div>
    );
}

/* ------------------------------ Stepper ------------------------------ */

function StageStepper({
    current,
    onSelect,
}: {
    current: OrderStage;
    onSelect: (s: OrderStage) => void;
}) {
    const isCancelled = current === 'cancelled';
    const isOnHold = current === 'on_hold';
    const currentIdx = stageIndex(current);

    return (
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
            {(isCancelled || isOnHold) && (
                <div className="mb-3 flex items-center gap-2 text-sm">
                    <AlertTriangle
                        className="size-4 text-amber-600"
                        aria-hidden="true"
                    />
                    <span className="text-slate-700">
                        Order is{' '}
                        <strong>{stageLabel(current)}</strong>; stepper shows the last
                        reached linear stage.
                    </span>
                </div>
            )}
            <ol className="flex flex-wrap items-center gap-2">
                {STEPPER_STAGES.map((s, idx) => {
                    const reached = currentIdx >= idx && !isCancelled;
                    const active = currentIdx === idx && !isCancelled;
                    const canClick = idx === currentIdx + 1 && !isCancelled && !isOnHold;
                    return (
                        <li key={s} className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={!canClick}
                                onClick={() => onSelect(s)}
                                className={cn(
                                    'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                                    reached
                                        ? 'border-primary bg-primary text-white'
                                        : 'border-slate-200 bg-white text-slate-500',
                                    active && 'ring-2 ring-primary/30',
                                    canClick &&
                                    'cursor-pointer hover:bg-primary/10 hover:text-primary',
                                    !canClick && 'cursor-default',
                                )}
                            >
                                <span
                                    className={cn(
                                        'grid size-5 place-items-center rounded-full text-[10px]',
                                        reached
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-100 text-slate-500',
                                    )}
                                >
                                    {reached ? (
                                        <CheckCircle2
                                            className="size-3"
                                            aria-hidden="true"
                                        />
                                    ) : (
                                        idx + 1
                                    )}
                                </span>
                                {stageLabel(s)}
                            </button>
                            {idx < STEPPER_STAGES.length - 1 && (
                                <ArrowRight
                                    className="size-3 text-slate-300"
                                    aria-hidden="true"
                                />
                            )}
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

/* ------------------------------ Items Tab ------------------------------ */

function ItemsTab({ items }: { items: OrderLineItem[] }) {
    return (
        <Card title={`Order items (${items.length})`}>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                            <th className="px-3 py-2 text-left font-semibold">Product</th>
                            <th className="px-3 py-2 text-right font-semibold">Ordered</th>
                            <th className="px-3 py-2 text-right font-semibold">Reserved</th>
                            <th className="px-3 py-2 text-right font-semibold">Dispatched</th>
                            <th className="px-3 py-2 text-right font-semibold">Pending</th>
                            <th className="px-3 py-2 text-right font-semibold">Backorder</th>
                            <th className="px-3 py-2 text-right font-semibold">Rate</th>
                            <th className="px-3 py-2 text-right font-semibold">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((li) => {
                            const pending = itemPending(li);
                            const pct =
                                li.orderedQty > 0
                                    ? Math.round((li.dispatchedQty / li.orderedQty) * 100)
                                    : 0;
                            return (
                                <tr
                                    key={li.id}
                                    className="border-t border-slate-100 align-top"
                                >
                                    <td className="px-3 py-2">
                                        <p className="font-medium text-slate-800">
                                            {li.description}
                                        </p>
                                        {li.specNotes && (
                                            <p className="text-xs text-slate-500">
                                                {li.specNotes}
                                            </p>
                                        )}
                                        <div className="mt-1 h-1 w-40 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full bg-primary"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <p className="mt-0.5 text-[10px] text-slate-400">
                                            {pct}% dispatched
                                        </p>
                                    </td>
                                    <td className="px-3 py-2 text-right text-slate-700">
                                        {li.orderedQty} {li.uom}
                                    </td>
                                    <td className="px-3 py-2 text-right text-slate-600">
                                        {li.reservedQty}
                                    </td>
                                    <td className="px-3 py-2 text-right text-slate-600">
                                        {li.dispatchedQty}
                                    </td>
                                    <td className="px-3 py-2 text-right text-slate-700">
                                        {pending}
                                    </td>
                                    <td
                                        className={cn(
                                            'px-3 py-2 text-right',
                                            li.backorderQty > 0
                                                ? 'font-semibold text-red-600'
                                                : 'text-slate-600',
                                        )}
                                    >
                                        {li.backorderQty}
                                    </td>
                                    <td className="px-3 py-2 text-right text-slate-600">
                                        {formatINR(li.netPrice)}
                                    </td>
                                    <td className="px-3 py-2 text-right font-semibold text-slate-800">
                                        {formatINR(li.netPrice * li.orderedQty)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

/* ------------------------------ Delivery ------------------------------ */

function DeliveryTab({
    plans,
    onAdd,
}: {
    plans: DeliveryPlan[];
    onAdd: () => void;
}) {
    return (
        <Card
            title={`Delivery schedule (${plans.length})`}
            actions={
                <Button size="sm" onClick={onAdd}>
                    <Plus className="size-4" aria-hidden="true" />
                    Add delivery
                </Button>
            }
        >
            {plans.length === 0 ? (
                <EmptyState
                    title="No delivery plans"
                    description="Split the order into one or more scheduled deliveries."
                />
            ) : (
                <ul className="divide-y divide-slate-100">
                    {plans.map((p) => (
                        <li key={p.id} className="flex items-start gap-3 py-3">
                            <span
                                className={cn(
                                    'grid size-9 shrink-0 place-items-center rounded-lg',
                                    p.status === 'delivered' && 'bg-emerald-100 text-emerald-700',
                                    p.status === 'dispatched' && 'bg-indigo-100 text-indigo-700',
                                    p.status === 'scheduled' && 'bg-slate-100 text-slate-500',
                                )}
                            >
                                <Truck className="size-4" aria-hidden="true" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-medium text-slate-800">
                                        {fmtDate(p.scheduledDate)}
                                    </p>
                                    <Badge
                                        tone={
                                            p.status === 'delivered'
                                                ? 'emerald'
                                                : p.status === 'dispatched'
                                                    ? 'indigo'
                                                    : 'neutral'
                                        }
                                    >
                                        {p.status}
                                    </Badge>
                                </div>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {p.quantity} units · {p.address}
                                </p>
                                {p.notes && (
                                    <p className="mt-1 text-sm text-slate-600">{p.notes}</p>
                                )}
                            </div>
                            <Button size="sm" variant="ghost">
                                <Pencil className="size-4" aria-hidden="true" />
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
}

/* --------------------------------- MRP --------------------------------- */

function MrpTab({ rows }: { rows: MrpRow[] }) {
    return (
        <Card title={`Material Readiness (${rows.length})`}>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                            <th className="px-3 py-2 text-left font-semibold">Item</th>
                            <th className="px-3 py-2 text-right font-semibold">Required</th>
                            <th className="px-3 py-2 text-right font-semibold">Available</th>
                            <th className="px-3 py-2 text-right font-semibold">Reserved</th>
                            <th className="px-3 py-2 text-right font-semibold">Shortage</th>
                            <th className="px-3 py-2 text-left font-semibold">Depends on</th>
                            <th className="px-3 py-2 text-left font-semibold">ETA</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => {
                            const short = r.shortage > 0;
                            return (
                                <tr
                                    key={r.productId}
                                    className={cn(
                                        'border-t border-slate-100',
                                        short && 'bg-red-50/50',
                                    )}
                                    title={
                                        short
                                            ? `Short by ${r.shortage}; dependency: ${r.depends}`
                                            : 'Fully available'
                                    }
                                >
                                    <td className="px-3 py-2 font-medium text-slate-800">
                                        {r.description}
                                    </td>
                                    <td className="px-3 py-2 text-right">{r.required}</td>
                                    <td className="px-3 py-2 text-right">{r.available}</td>
                                    <td className="px-3 py-2 text-right">{r.reserved}</td>
                                    <td
                                        className={cn(
                                            'px-3 py-2 text-right',
                                            short
                                                ? 'font-semibold text-red-600'
                                                : 'text-slate-500',
                                        )}
                                    >
                                        {r.shortage || '—'}
                                    </td>
                                    <td className="px-3 py-2 text-xs text-slate-600">
                                        {r.depends}
                                    </td>
                                    <td className="px-3 py-2 text-xs text-slate-600">
                                        {r.procurementEta ? fmtDate(r.procurementEta) : '—'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {rows.some((r) => r.shortage > 0) && (
                <p className="mt-3 flex items-center gap-2 text-xs text-red-600">
                    <AlertTriangle className="size-3.5" aria-hidden="true" />
                    Order has shortages — must be acknowledged before moving to Ready.
                </p>
            )}
        </Card>
    );
}

/* ---------------------------- Installation ---------------------------- */

function InstallationTab({ order }: { order: SalesOrder }) {
    const i = order.installation;
    const items: Array<{
        label: string;
        done: boolean;
    }> = [
            { label: 'Civil works ready', done: i.civilReady },
            { label: 'Electrical ready', done: i.electricalReady },
            { label: 'Customer approvals received', done: i.approvalsReceived },
        ];
    const allDone = items.every((x) => x.done);
    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
            <Card title="Readiness checklist">
                <ul className="space-y-2">
                    {items.map((it) => (
                        <li
                            key={it.label}
                            className={cn(
                                'flex items-center justify-between rounded-lg border p-3',
                                it.done
                                    ? 'border-emerald-200 bg-emerald-50'
                                    : 'border-amber-200 bg-amber-50',
                            )}
                        >
                            <span className="text-sm font-medium text-slate-800">
                                {it.label}
                            </span>
                            <Badge tone={it.done ? 'emerald' : 'amber'}>
                                {it.done ? 'Done' : 'Pending'}
                            </Badge>
                        </li>
                    ))}
                </ul>
                {!allDone && (
                    <p className="mt-3 flex items-center gap-2 text-xs text-amber-700">
                        <AlertTriangle className="size-3.5" aria-hidden="true" />
                        All items must be done before moving to Installed.
                    </p>
                )}
                {i.notes && (
                    <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                        <p className="text-xs font-semibold uppercase text-slate-400">
                            Site notes
                        </p>
                        <p className="mt-1">{i.notes}</p>
                    </div>
                )}
            </Card>
            <Card title="Site details">
                <dl className="space-y-3 text-sm">
                    <div>
                        <dt className="text-xs font-semibold uppercase text-slate-400">
                            Site address
                        </dt>
                        <dd className="mt-0.5 flex items-start gap-1.5 text-slate-700">
                            <MapPin
                                className="mt-0.5 size-3.5 shrink-0 text-slate-400"
                                aria-hidden="true"
                            />
                            <span>{order.siteAddress}</span>
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs font-semibold uppercase text-slate-400">
                            Site contact
                        </dt>
                        <dd className="mt-0.5 text-slate-700">{i.siteContactName}</dd>
                        <dd className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Phone className="size-3" aria-hidden="true" />
                            {i.siteContactMobile}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs font-semibold uppercase text-slate-400">
                            Expected installation
                        </dt>
                        <dd className="mt-0.5 flex items-center gap-1.5 text-slate-700">
                            <Calendar className="size-3.5 text-slate-400" aria-hidden="true" />
                            {fmtDate(i.expectedInstallationDate)}
                        </dd>
                    </div>
                </dl>
            </Card>
        </div>
    );
}

/* ---------------------------- Documents ---------------------------- */

const DOC_ICON: Record<OrderDocument['type'], typeof FileText> = {
    quotation: FileText,
    customer_po: FileText,
    delivery_note: Truck,
    invoice: FileText,
    installation_report: Wrench,
};

const DOC_TONE: Record<OrderDocument['type'], 'blue' | 'emerald' | 'indigo' | 'violet' | 'amber'> = {
    quotation: 'blue',
    customer_po: 'emerald',
    delivery_note: 'indigo',
    invoice: 'violet',
    installation_report: 'amber',
};

function DocumentsTab({ documents }: { documents: OrderDocument[] }) {
    return (
        <Card title={`Documents (${documents.length})`}>
            {documents.length === 0 ? (
                <EmptyState
                    title="No documents linked yet"
                    description="Quotations, POs, delivery notes and invoices will appear here."
                />
            ) : (
                <ul className="divide-y divide-slate-100">
                    {documents.map((d) => {
                        const Icon = DOC_ICON[d.type];
                        return (
                            <li key={d.id} className="flex items-start gap-3 py-3">
                                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
                                    <Icon className="size-4" aria-hidden="true" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-medium text-slate-800">
                                            {d.label}
                                        </p>
                                        <Badge tone={DOC_TONE[d.type]}>
                                            {d.type.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {d.refNumber} · uploaded {formatRelative(d.uploadedAt)}
                                    </p>
                                </div>
                                <Button size="sm" variant="ghost">
                                    View
                                </Button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </Card>
    );
}

/* ----------------------------- Activity ----------------------------- */

const ACT_ICON: Record<OrderActivity['type'], typeof Package> = {
    stage_change: Package,
    note: FileText,
    dispatch: Truck,
    cancel: Ban,
    amendment: Pencil,
    invoice: FileText,
    readiness: CheckCircle2,
};

function ActivityTab({ activity }: { activity: OrderActivity[] }) {
    const sorted = useMemo(
        () =>
            [...activity].sort(
                (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
            ),
        [activity],
    );
    return (
        <Card title={`Activity (${activity.length})`}>
            <ol className="relative space-y-4 border-l border-slate-200 pl-6">
                {sorted.map((a) => {
                    const Icon = ACT_ICON[a.type];
                    return (
                        <li key={a.id} className="relative">
                            <span className="absolute -left-[34px] grid size-7 place-items-center rounded-full border border-slate-200 bg-white text-slate-500">
                                <Icon className="size-3.5" aria-hidden="true" />
                            </span>
                            <p className="text-sm text-slate-800">{a.summary}</p>
                            <p className="mt-0.5 text-xs text-slate-500">
                                {userById(a.actorId)?.name ?? '—'} ·{' '}
                                <span title={fmtDateTime(a.at)}>
                                    {formatRelative(a.at)}
                                </span>
                            </p>
                        </li>
                    );
                })}
            </ol>
        </Card>
    );
}

/* --------------------------- Stage advance --------------------------- */

function StageAdvanceDialog({
    open,
    onOpenChange,
    order,
    target,
    hasShortage,
    installationReady,
    onConfirm,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: SalesOrder;
    target: OrderStage | null;
    hasShortage: boolean;
    installationReady: boolean;
    onConfirm: () => void;
}) {
    const [ackShortage, setAckShortage] = useState(false);
    if (!target) return null;
    const blockedByShortage = target === 'ready' && hasShortage && !ackShortage;
    const blockedByInstallation = target === 'installed' && !installationReady;
    const blocked = blockedByShortage || blockedByInstallation;

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                onOpenChange(o);
                if (!o) setAckShortage(false);
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Advance to {stageLabel(target)}</DialogTitle>
                    <DialogDescription>
                        {order.orderNumber} is currently{' '}
                        <strong>{stageLabel(order.stage)}</strong>. Confirm the
                        transition to <strong>{stageLabel(target)}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody className="space-y-3">
                    {target === 'ready' && hasShortage && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
                            <p className="flex items-center gap-2 font-medium text-red-700">
                                <AlertTriangle className="size-4" aria-hidden="true" />
                                Shortages detected
                            </p>
                            <p className="mt-1 text-xs text-red-600">
                                One or more items are not fully reserved. Acknowledge to
                                proceed — partial fulfilment will be recorded.
                            </p>
                            <label className="mt-2 inline-flex items-center gap-2 text-xs text-red-700">
                                <input
                                    type="checkbox"
                                    checked={ackShortage}
                                    onChange={(e) => setAckShortage(e.target.checked)}
                                    className="size-3.5 rounded border-red-300"
                                />
                                I acknowledge the shortage and confirm partial fulfilment.
                            </label>
                        </div>
                    )}
                    {target === 'installed' && !installationReady && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                            <p className="flex items-center gap-2 font-medium">
                                <AlertTriangle className="size-4" aria-hidden="true" />
                                Installation checklist incomplete
                            </p>
                            <p className="mt-1 text-xs">
                                Complete all checklist items (civil, electrical, approvals)
                                before marking as Installed.
                            </p>
                        </div>
                    )}
                </DialogBody>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={blocked}
                        onClick={onConfirm}
                    >
                        Confirm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ----------------------------- Cancel ----------------------------- */

function CancelOrderDialog({
    open,
    onOpenChange,
    order,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: SalesOrder;
}) {
    const { push } = useToast();
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit() {
        setSubmitting(true);
        await new Promise((r) => setTimeout(r, 500));
        setSubmitting(false);
        push({
            variant: 'warning',
            title: 'Cancellation requested',
            description: `${order.orderNumber} awaiting approval.`,
        });
        onOpenChange(false);
        setReason('');
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cancel order</DialogTitle>
                    <DialogDescription>
                        Cancellations require sales manager approval.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody>
                    <FormField label="Reason" required>
                        <Textarea
                            rows={4}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Why is this order being cancelled?"
                        />
                    </FormField>
                </DialogBody>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                    >
                        Back
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!reason.trim() || submitting}
                    >
                        {submitting && (
                            <Loader2
                                className="size-4 animate-spin"
                                aria-hidden="true"
                            />
                        )}
                        Request cancellation
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ---------------------------- Amendment ---------------------------- */

function AmendmentDialog({
    open,
    onOpenChange,
    order,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: SalesOrder;
}) {
    const { push } = useToast();
    const [reason, setReason] = useState('');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Request amendment</DialogTitle>
                    <DialogDescription>
                        Amendments freeze the order until approved; procurement may be
                        paused.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody>
                    <FormField label="Change requested" required>
                        <Textarea
                            rows={4}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Describe the change (qty / price / delivery date)…"
                        />
                    </FormField>
                </DialogBody>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={!reason.trim()}
                        onClick={() => {
                            push({
                                variant: 'info',
                                title: 'Amendment requested',
                                description: `${order.orderNumber} pending approval.`,
                            });
                            onOpenChange(false);
                            setReason('');
                        }}
                    >
                        Request
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ------------------------- Create dispatch ------------------------- */

function CreateDispatchDialog({
    open,
    onOpenChange,
    order,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: SalesOrder;
}) {
    const { push } = useToast();
    const navigate = useNavigate();
    const [scheduledDate, setScheduledDate] = useState(
        order.expectedDeliveryDate.slice(0, 10),
    );
    const [vehicle, setVehicle] = useState('');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create dispatch</DialogTitle>
                    <DialogDescription>
                        A delivery note draft will be created from this order.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody className="space-y-3">
                    <FormField label="Scheduled dispatch date" required>
                        <Input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                        />
                    </FormField>
                    <FormField label="Vehicle / transporter">
                        <Input
                            value={vehicle}
                            onChange={(e) => setVehicle(e.target.value)}
                            placeholder="e.g. GJ-05-AB-1234 / Gati"
                        />
                    </FormField>
                    <div className="flex items-center gap-2 rounded-md bg-slate-50 p-2 text-xs text-slate-600">
                        <Clock className="size-3.5" aria-hidden="true" />
                        Items not fully reserved will remain on backorder.
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={() => {
                            push({
                                variant: 'success',
                                title: 'Dispatch draft created',
                                description: `DN for ${order.orderNumber} — opening dispatch module.`,
                            });
                            onOpenChange(false);
                            navigate('/dispatch');
                        }}
                    >
                        Create dispatch
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* -------------------------- Raise invoice -------------------------- */

function RaiseInvoiceDialog({
    open,
    onOpenChange,
    order,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: SalesOrder;
}) {
    const { push } = useToast();
    const [invoiceType, setInvoiceType] = useState<'full' | 'partial' | 'proforma'>(
        'full',
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Raise invoice</DialogTitle>
                    <DialogDescription>
                        Generates an invoice draft against {order.orderNumber}.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody className="space-y-3">
                    <FormField label="Invoice type">
                        <Select
                            value={invoiceType}
                            onChange={(e) =>
                                setInvoiceType(
                                    e.target.value as 'full' | 'partial' | 'proforma',
                                )
                            }
                        >
                            <option value="full">Full — {formatINR(order.totalValue)}</option>
                            <option value="partial">Partial (dispatched so far)</option>
                            <option value="proforma">Proforma (advance)</option>
                        </Select>
                    </FormField>
                </DialogBody>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={() => {
                            push({
                                variant: 'success',
                                title: 'Invoice draft created',
                                description: `${invoiceType.toUpperCase()} invoice for ${order.orderNumber}.`,
                            });
                            onOpenChange(false);
                        }}
                    >
                        Create draft
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ------------------------- Add delivery plan ------------------------- */

function AddDeliveryDialog({
    open,
    onOpenChange,
    order,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: SalesOrder;
}) {
    const { push } = useToast();
    const [scheduledDate, setScheduledDate] = useState('');
    const [quantity, setQuantity] = useState('');
    const [address, setAddress] = useState(order.siteAddress);
    const [notes, setNotes] = useState('');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add delivery plan</DialogTitle>
                    <DialogDescription>
                        Split the order into an additional scheduled delivery.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody className="space-y-3">
                    <FormField label="Scheduled date" required>
                        <Input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                        />
                    </FormField>
                    <FormField label="Quantity" required>
                        <Input
                            type="number"
                            min={1}
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                        />
                    </FormField>
                    <FormField label="Delivery address" required>
                        <Textarea
                            rows={2}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    </FormField>
                    <FormField label="Notes">
                        <Input
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </FormField>
                </DialogBody>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={!scheduledDate || !quantity}
                        onClick={() => {
                            push({
                                variant: 'success',
                                title: 'Delivery added',
                                description: `${quantity} units on ${fmtDate(scheduledDate)}.`,
                            });
                            onOpenChange(false);
                        }}
                    >
                        Add delivery
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ----------------------------- Helpers ----------------------------- */

function Card({
    title,
    actions,
    children,
    className,
}: {
    title?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn(
                'rounded-xl border border-slate-200 bg-white p-4',
                className,
            )}
        >
            {(title || actions) && (
                <header className="mb-3 flex items-center justify-between gap-3">
                    {title && (
                        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
                    )}
                    {actions}
                </header>
            )}
            {children}
        </section>
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
