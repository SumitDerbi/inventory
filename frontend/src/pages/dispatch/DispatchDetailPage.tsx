import { useMemo, useState } from 'react';
import { Link, Navigate, useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    AlertTriangle,
    CheckCircle2,
    Download,
    FileText,
    MapPin,
    Package,
    Truck,
    Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { Input, Select, Textarea } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { formatINR, formatRelative } from '@/lib/format';
import {
    DISPATCH_STAGE_LABEL,
    DISPATCH_STAGES,
    DISPATCH_TONE,
    canAdvanceTo,
    dispatchById,
    freightTermsLabel,
    nextStages,
    type Dispatch,
    type DispatchException,
    type DispatchStage,
} from '@/mocks/dispatches';
import { transporterById } from '@/mocks/transporters';
import { vehicleById } from '@/mocks/vehicles';
import { warehouseById } from '@/mocks/warehouses';
import { userById } from '@/mocks/users';

type TabKey =
    | 'items'
    | 'transport'
    | 'documents'
    | 'pod'
    | 'exceptions'
    | 'activity';

const TABS: Array<{ key: TabKey; label: string }> = [
    { key: 'items', label: 'Items' },
    { key: 'transport', label: 'Transport' },
    { key: 'documents', label: 'Documents' },
    { key: 'pod', label: 'POD' },
    { key: 'exceptions', label: 'Exceptions' },
    { key: 'activity', label: 'Activity' },
];

const EXCEPTION_TONE: Record<DispatchException['type'], 'red' | 'amber' | 'orange'> = {
    damaged: 'red',
    short_dispatch: 'amber',
    failed_delivery: 'red',
    wrong_item: 'orange',
    delay: 'amber',
};

const EXCEPTION_LABEL: Record<DispatchException['type'], string> = {
    damaged: 'Damaged',
    short_dispatch: 'Short dispatch',
    failed_delivery: 'Failed delivery',
    wrong_item: 'Wrong item',
    delay: 'Delay',
};

export default function DispatchDetailPage() {
    const { id = '' } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { push } = useToast();
    const dispatch = dispatchById(id);

    const [tab, setTab] = useState<TabKey>('items');
    const [advanceOpen, setAdvanceOpen] = useState(false);
    const [advanceTarget, setAdvanceTarget] = useState<DispatchStage | null>(
        null,
    );
    const [exceptionOpen, setExceptionOpen] = useState(false);
    const [podOpen, setPodOpen] = useState(false);

    const activeStageIndex = useMemo(() => {
        if (!dispatch) return 0;
        return DISPATCH_STAGES.indexOf(dispatch.stage);
    }, [dispatch]);

    if (!dispatch) {
        return <Navigate to="/dispatch" replace />;
    }

    const warehouse = warehouseById(dispatch.sourceWarehouseId);
    const allowedNext = nextStages(dispatch.stage);
    const isCancelled = dispatch.stage === 'cancelled';

    return (
        <div className="space-y-4">
            <div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/dispatch')}
                    className="-ml-2"
                >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Back to dispatches
                </Button>
            </div>

            {/* Header card */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 md:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="font-mono text-xl font-semibold text-slate-800">
                                {dispatch.challanNumber}
                            </h2>
                            <Badge tone={DISPATCH_TONE[dispatch.stage]}>
                                {DISPATCH_STAGE_LABEL[dispatch.stage]}
                            </Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-700">
                            {dispatch.customerCompany} · {dispatch.customerName}
                        </p>
                        <p className="text-xs text-slate-500">
                            {dispatch.destinationAddress}
                        </p>
                        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span>
                                Orders:{' '}
                                {dispatch.orderIds.map((oid, idx) => (
                                    <Link
                                        key={oid}
                                        to={`/orders/${oid}`}
                                        className="font-mono text-primary hover:underline"
                                    >
                                        {dispatch.items.find((i) => i.orderId === oid)
                                            ?.orderNumber ?? oid}
                                        {idx < dispatch.orderIds.length - 1 ? ', ' : ''}
                                    </Link>
                                ))}
                            </span>
                            <span>·</span>
                            <span>From {warehouse?.code ?? '—'}</span>
                            <span>·</span>
                            <span>
                                Created {formatRelative(dispatch.createdAt)}
                            </span>
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm">
                            <Download className="size-4" aria-hidden="true" />
                            Export PDF
                        </Button>
                        {!isCancelled && allowedNext.length > 0 && (
                            <Button
                                size="sm"
                                onClick={() => {
                                    setAdvanceTarget(allowedNext[0]);
                                    setAdvanceOpen(true);
                                }}
                            >
                                <CheckCircle2 className="size-4" aria-hidden="true" />
                                Advance to {DISPATCH_STAGE_LABEL[allowedNext[0]]}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Stepper */}
                <ol className="mt-5 flex flex-wrap items-center gap-2 text-xs">
                    {DISPATCH_STAGES.map((stg, idx) => {
                        const active = idx === activeStageIndex;
                        const done = idx < activeStageIndex;
                        return (
                            <li key={stg} className="flex items-center gap-2">
                                <div
                                    className={cn(
                                        'flex size-6 items-center justify-center rounded-full border text-[11px] font-semibold',
                                        done
                                            ? 'border-emerald-500 bg-emerald-500 text-white'
                                            : active
                                                ? 'border-primary bg-primary text-white'
                                                : 'border-slate-200 bg-white text-slate-400',
                                    )}
                                >
                                    {idx + 1}
                                </div>
                                <span
                                    className={cn(
                                        'font-medium',
                                        active
                                            ? 'text-slate-800'
                                            : done
                                                ? 'text-slate-600'
                                                : 'text-slate-400',
                                    )}
                                >
                                    {DISPATCH_STAGE_LABEL[stg]}
                                </span>
                                {idx < DISPATCH_STAGES.length - 1 && (
                                    <span
                                        aria-hidden="true"
                                        className={cn(
                                            'h-px w-6 sm:w-10',
                                            done ? 'bg-emerald-300' : 'bg-slate-200',
                                        )}
                                    />
                                )}
                            </li>
                        );
                    })}
                </ol>

                {dispatch.exceptions.some((e) => e.status === 'open') && (
                    <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        <AlertTriangle
                            className="mt-0.5 size-4 shrink-0"
                            aria-hidden="true"
                        />
                        <p>
                            <strong>Open exception(s)</strong> — see Exceptions tab.
                        </p>
                    </div>
                )}
            </div>

            {/* KPI strip */}
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-4">
                <Stat label="Total weight" value={`${dispatch.totalWeightKg} kg`} />
                <Stat label="Packages" value={String(dispatch.totalPackages)} />
                <Stat
                    label="Freight"
                    value={`${freightTermsLabel(dispatch.freightTerms)} · ${formatINR(
                        dispatch.freightAmount,
                    )}`}
                />
                <Stat
                    label="Expected delivery"
                    value={formatRelative(dispatch.expectedDeliveryDate)}
                />
            </div>

            {/* Tabs */}
            <div
                role="tablist"
                aria-label="Dispatch sections"
                className="flex flex-wrap gap-1 border-b border-slate-200"
            >
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        role="tab"
                        aria-selected={tab === t.key}
                        onClick={() => setTab(t.key)}
                        className={cn(
                            'relative px-3 py-2 text-sm font-medium transition-colors',
                            tab === t.key
                                ? 'text-primary'
                                : 'text-slate-500 hover:text-slate-700',
                        )}
                    >
                        {t.label}
                        {tab === t.key && (
                            <span
                                aria-hidden="true"
                                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary"
                            />
                        )}
                    </button>
                ))}
            </div>

            {tab === 'items' && <ItemsTab dispatch={dispatch} />}
            {tab === 'transport' && (
                <TransportTab dispatch={dispatch} />
            )}
            {tab === 'documents' && <DocumentsTab dispatch={dispatch} />}
            {tab === 'pod' && (
                <PodTab dispatch={dispatch} onUpload={() => setPodOpen(true)} />
            )}
            {tab === 'exceptions' && (
                <ExceptionsTab
                    dispatch={dispatch}
                    onAdd={() => setExceptionOpen(true)}
                />
            )}
            {tab === 'activity' && <ActivityTab dispatch={dispatch} />}

            <AdvanceStageDialog
                open={advanceOpen}
                onOpenChange={setAdvanceOpen}
                dispatch={dispatch}
                target={advanceTarget}
                allowedNext={allowedNext}
                onTargetChange={setAdvanceTarget}
                onConfirm={() => {
                    setAdvanceOpen(false);
                    if (advanceTarget) {
                        push({
                            variant: 'success',
                            title: `Stage updated`,
                            description: `${dispatch.challanNumber} → ${DISPATCH_STAGE_LABEL[advanceTarget]}`,
                        });
                    }
                }}
            />

            <ExceptionDialog
                open={exceptionOpen}
                onOpenChange={setExceptionOpen}
                onSubmit={(payload) => {
                    setExceptionOpen(false);
                    push({
                        variant: 'success',
                        title: 'Exception logged',
                        description: `${EXCEPTION_LABEL[payload.type]} — ${payload.recommendedAction.slice(0, 40)}…`,
                    });
                }}
            />

            <PodUploadDialog
                open={podOpen}
                onOpenChange={setPodOpen}
                onSubmit={(payload) => {
                    setPodOpen(false);
                    push({
                        variant: 'success',
                        title: 'POD uploaded',
                        description: `Signed by ${payload.receivedBy}`,
                    });
                }}
            />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Tabs                                                                */
/* ------------------------------------------------------------------ */

function ItemsTab({ dispatch }: { dispatch: Dispatch }) {
    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                        <th className="px-3 py-2 text-left font-semibold">Order</th>
                        <th className="px-3 py-2 text-left font-semibold">Description</th>
                        <th className="px-3 py-2 text-right font-semibold">Ordered</th>
                        <th className="px-3 py-2 text-right font-semibold">Dispatched</th>
                        <th className="px-3 py-2 text-right font-semibold">Backorder</th>
                        <th className="px-3 py-2 text-right font-semibold">Pkgs</th>
                        <th className="px-3 py-2 text-right font-semibold">Weight</th>
                    </tr>
                </thead>
                <tbody>
                    {dispatch.items.map((it) => {
                        const partial = it.dispatchedQty < it.orderedQty;
                        return (
                            <tr key={it.id} className="border-t border-slate-100">
                                <td className="px-3 py-2">
                                    <Link
                                        to={`/orders/${it.orderId}`}
                                        className="font-mono text-xs text-primary hover:underline"
                                    >
                                        {it.orderNumber}
                                    </Link>
                                </td>
                                <td className="px-3 py-2 text-slate-800">
                                    {it.description}
                                    <p className="font-mono text-xs text-slate-500">
                                        {it.productId}
                                    </p>
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                                    {it.orderedQty} {it.uom}
                                </td>
                                <td
                                    className={cn(
                                        'px-3 py-2 text-right tabular-nums font-semibold',
                                        partial ? 'text-amber-700' : 'text-emerald-700',
                                    )}
                                >
                                    {it.dispatchedQty}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums text-red-600">
                                    {it.backorderQty || '—'}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                                    {it.packageCount}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                                    {it.weightKg} kg
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot className="bg-slate-50 text-xs">
                    <tr>
                        <td className="px-3 py-2 font-semibold text-slate-600" colSpan={5}>
                            Totals
                        </td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-800">
                            {dispatch.totalPackages}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-800">
                            {dispatch.totalWeightKg} kg
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

function TransportTab({ dispatch }: { dispatch: Dispatch }) {
    const transporter = transporterById(dispatch.transporterId);
    const vehicle = vehicleById(dispatch.vehicleId);

    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Transporter & vehicle">
                <dl className="grid grid-cols-2 gap-3 text-sm">
                    <Field label="Transporter" value={transporter?.name ?? '—'} />
                    <Field
                        label="Contact"
                        value={transporter ? `${transporter.contactPerson}` : '—'}
                    />
                    <Field
                        label="Phone"
                        value={transporter?.phone ?? '—'}
                        mono
                    />
                    <Field
                        label="Vehicle"
                        value={vehicle ? `${vehicle.typeLabel}` : '—'}
                    />
                    <Field
                        label="Registration"
                        value={vehicle?.registration ?? '—'}
                        mono
                    />
                    <Field
                        label="Capacity"
                        value={
                            vehicle
                                ? `${vehicle.capacityKg} kg / ${vehicle.capacityCft} cft`
                                : '—'
                        }
                    />
                </dl>
            </Card>

            <Card title="Driver & freight">
                <dl className="grid grid-cols-2 gap-3 text-sm">
                    <Field label="Driver" value={dispatch.driverName} />
                    <Field label="Driver phone" value={dispatch.driverPhone} mono />
                    <Field
                        label="Freight terms"
                        value={freightTermsLabel(dispatch.freightTerms)}
                    />
                    <Field
                        label="Freight amount"
                        value={formatINR(dispatch.freightAmount)}
                    />
                    <Field
                        label="E-way bill"
                        value={dispatch.eWayBill ?? '—'}
                        mono
                    />
                    <Field
                        label="Expected delivery"
                        value={formatRelative(dispatch.expectedDeliveryDate)}
                    />
                </dl>
            </Card>

            <Card className="lg:col-span-2" title="Route stops">
                {dispatch.routeStops.length === 0 ? (
                    <p className="text-sm text-slate-500">No route stops recorded.</p>
                ) : (
                    <ol className="space-y-3">
                        {dispatch.routeStops.map((s, idx) => (
                            <li key={s.id} className="flex gap-3">
                                <div className="relative flex flex-col items-center">
                                    <div
                                        className={cn(
                                            'flex size-7 items-center justify-center rounded-full border text-xs font-semibold',
                                            s.arrivedAt
                                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                                : 'border-slate-300 bg-white text-slate-400',
                                        )}
                                    >
                                        <MapPin className="size-3.5" aria-hidden="true" />
                                    </div>
                                    {idx < dispatch.routeStops.length - 1 && (
                                        <span
                                            aria-hidden="true"
                                            className="my-1 h-8 w-px bg-slate-200"
                                        />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">
                                        {s.label} · {s.city}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {s.arrivedAt
                                            ? `Arrived ${formatRelative(s.arrivedAt)}`
                                            : 'Pending'}
                                        {s.departedAt
                                            ? ` · Departed ${formatRelative(s.departedAt)}`
                                            : ''}
                                    </p>
                                    {s.notes && (
                                        <p className="text-xs text-slate-500">{s.notes}</p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ol>
                )}
            </Card>
        </div>
    );
}

function DocumentsTab({ dispatch }: { dispatch: Dispatch }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white">
            <ul className="divide-y divide-slate-100">
                {dispatch.documents.map((d) => (
                    <li
                        key={d.id}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                <FileText className="size-4" aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-medium text-slate-800">{d.label}</p>
                                <p className="font-mono text-xs text-slate-500">
                                    {d.refNumber} · generated{' '}
                                    {formatRelative(d.generatedAt)}
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm">
                            <Download className="size-4" aria-hidden="true" />
                            Download
                        </Button>
                    </li>
                ))}
                {dispatch.documents.length === 0 && (
                    <li className="px-4 py-8 text-center text-sm text-slate-500">
                        No documents generated yet.
                    </li>
                )}
            </ul>
        </div>
    );
}

function PodTab({
    dispatch,
    onUpload,
}: {
    dispatch: Dispatch;
    onUpload: () => void;
}) {
    if (!dispatch.pod) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
                {dispatch.stage === 'delivered' ? (
                    <div className="space-y-4">
                        <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                            <Upload
                                className="mx-auto size-8 text-slate-400"
                                aria-hidden="true"
                            />
                            <p className="mt-2 text-sm text-slate-600">
                                Drop the signed POD here, or click to browse
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                                Accepted: PDF, JPG, PNG · Max 10 MB
                            </p>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={onUpload}>
                                <Upload className="size-4" aria-hidden="true" />
                                Upload POD
                            </Button>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-slate-500">
                        POD upload becomes available once the dispatch is marked{' '}
                        <strong>Delivered</strong>.
                    </p>
                )}
            </div>
        );
    }
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="grid gap-4 md:grid-cols-[200px_1fr]">
                <div className="flex aspect-square items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                    <FileText className="size-12 text-slate-400" aria-hidden="true" />
                </div>
                <dl className="space-y-3 text-sm">
                    <Field label="Received by" value={dispatch.pod.receivedBy} />
                    <Field
                        label="Received at"
                        value={formatRelative(dispatch.pod.receivedAt)}
                    />
                    <Field label="File" value={dispatch.pod.signatureFile} mono />
                    {dispatch.pod.remarks && (
                        <div>
                            <dt className="text-xs font-semibold uppercase text-slate-400">
                                Remarks
                            </dt>
                            <dd className="text-slate-700">{dispatch.pod.remarks}</dd>
                        </div>
                    )}
                </dl>
            </div>
        </div>
    );
}

function ExceptionsTab({
    dispatch,
    onAdd,
}: {
    dispatch: Dispatch;
    onAdd: () => void;
}) {
    return (
        <div className="space-y-3">
            <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={onAdd}>
                    <AlertTriangle className="size-4" aria-hidden="true" />
                    Log exception
                </Button>
            </div>
            {dispatch.exceptions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
                    No exceptions logged for this dispatch.
                </div>
            ) : (
                <ul className="space-y-3">
                    {dispatch.exceptions.map((e) => (
                        <li
                            key={e.id}
                            className="rounded-xl border border-slate-200 bg-white p-4"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Badge tone={EXCEPTION_TONE[e.type]}>
                                        {EXCEPTION_LABEL[e.type]}
                                    </Badge>
                                    <Badge tone={e.status === 'open' ? 'amber' : 'emerald'}>
                                        {e.status}
                                    </Badge>
                                </div>
                                <p className="text-xs text-slate-500">
                                    {formatRelative(e.raisedAt)} ·{' '}
                                    {userById(e.raisedBy)?.name ?? e.raisedBy}
                                </p>
                            </div>
                            <dl className="mt-3 space-y-2 text-sm">
                                <div>
                                    <dt className="text-xs font-semibold uppercase text-slate-400">
                                        Root cause
                                    </dt>
                                    <dd className="text-slate-700">{e.rootCause}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-semibold uppercase text-slate-400">
                                        Recommended action
                                    </dt>
                                    <dd className="text-slate-700">
                                        {e.recommendedAction}
                                    </dd>
                                </div>
                            </dl>
                            {e.status === 'open' && (
                                <div className="mt-3 flex justify-end gap-2">
                                    <Button variant="outline" size="sm">
                                        <Truck className="size-4" aria-hidden="true" />
                                        Re-dispatch
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                        Mark resolved
                                    </Button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function ActivityTab({ dispatch }: { dispatch: Dispatch }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <ol className="space-y-3">
                {dispatch.activity.map((a) => (
                    <li key={a.id} className="flex gap-3">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                            <Package className="size-3.5" aria-hidden="true" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-800">{a.summary}</p>
                            <p className="text-xs text-slate-500">
                                {formatRelative(a.at)} ·{' '}
                                {userById(a.actorId)?.name ?? a.actorId}
                            </p>
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Dialogs                                                             */
/* ------------------------------------------------------------------ */

function AdvanceStageDialog({
    open,
    onOpenChange,
    dispatch,
    target,
    allowedNext,
    onTargetChange,
    onConfirm,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    dispatch: Dispatch;
    target: DispatchStage | null;
    allowedNext: DispatchStage[];
    onTargetChange: (s: DispatchStage) => void;
    onConfirm: () => void;
}) {
    const blocked =
        !target || !canAdvanceTo(dispatch.stage, target);
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Advance dispatch stage</DialogTitle>
                    <DialogDescription>
                        {dispatch.challanNumber} is currently{' '}
                        <strong>{DISPATCH_STAGE_LABEL[dispatch.stage]}</strong>. Pick
                        the next stage to transition to.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody className="space-y-3">
                    <div className="space-y-1">
                        <label
                            htmlFor="adv-stage"
                            className="text-xs font-semibold uppercase text-slate-500"
                        >
                            Next stage
                        </label>
                        <Select
                            id="adv-stage"
                            value={target ?? ''}
                            onChange={(e) =>
                                onTargetChange(e.target.value as DispatchStage)
                            }
                        >
                            {allowedNext.map((s) => (
                                <option key={s} value={s}>
                                    {DISPATCH_STAGE_LABEL[s]}
                                </option>
                            ))}
                        </Select>
                    </div>
                    {target === 'delivered' && dispatch.stage !== 'in_transit' && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                            <p className="flex items-center gap-2 font-medium">
                                <AlertTriangle className="size-4" aria-hidden="true" />
                                Delivery requires the dispatch to be In transit first.
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

function ExceptionDialog({
    open,
    onOpenChange,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    onSubmit: (payload: {
        type: DispatchException['type'];
        rootCause: string;
        recommendedAction: string;
    }) => void;
}) {
    const [type, setType] = useState<DispatchException['type']>('damaged');
    const [rootCause, setRootCause] = useState('');
    const [recommendedAction, setRecommendedAction] = useState('');
    const canSubmit =
        rootCause.trim().length >= 5 && recommendedAction.trim().length >= 5;

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                onOpenChange(o);
                if (!o) {
                    setType('damaged');
                    setRootCause('');
                    setRecommendedAction('');
                }
            }}
        >
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Log dispatch exception</DialogTitle>
                    <DialogDescription>
                        Capture the root cause and the action you’re recommending.
                        Both fields are required.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody className="space-y-3">
                    <div className="space-y-1">
                        <label
                            htmlFor="exc-type"
                            className="text-xs font-semibold uppercase text-slate-500"
                        >
                            Exception type
                        </label>
                        <Select
                            id="exc-type"
                            value={type}
                            onChange={(e) =>
                                setType(e.target.value as DispatchException['type'])
                            }
                        >
                            {(
                                Object.keys(EXCEPTION_LABEL) as Array<
                                    DispatchException['type']
                                >
                            ).map((k) => (
                                <option key={k} value={k}>
                                    {EXCEPTION_LABEL[k]}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <label
                            htmlFor="exc-cause"
                            className="text-xs font-semibold uppercase text-slate-500"
                        >
                            Root cause
                        </label>
                        <Textarea
                            id="exc-cause"
                            rows={3}
                            value={rootCause}
                            onChange={(e) => setRootCause(e.target.value)}
                            placeholder="What went wrong?"
                        />
                    </div>
                    <div className="space-y-1">
                        <label
                            htmlFor="exc-action"
                            className="text-xs font-semibold uppercase text-slate-500"
                        >
                            Recommended action
                        </label>
                        <Textarea
                            id="exc-action"
                            rows={3}
                            value={recommendedAction}
                            onChange={(e) => setRecommendedAction(e.target.value)}
                            placeholder="Replace, re-dispatch, file claim…"
                        />
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
                        disabled={!canSubmit}
                        onClick={() =>
                            onSubmit({ type, rootCause, recommendedAction })
                        }
                    >
                        Log exception
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function PodUploadDialog({
    open,
    onOpenChange,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    onSubmit: (payload: { receivedBy: string; remarks: string }) => void;
}) {
    const [receivedBy, setReceivedBy] = useState('');
    const [remarks, setRemarks] = useState('');
    const canSubmit = receivedBy.trim().length >= 2;

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                onOpenChange(o);
                if (!o) {
                    setReceivedBy('');
                    setRemarks('');
                }
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload POD</DialogTitle>
                    <DialogDescription>
                        Attach the signed POD and capture the receiver details.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody className="space-y-3">
                    <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
                        <Upload
                            className="mx-auto size-6 text-slate-400"
                            aria-hidden="true"
                        />
                        <p className="mt-1">Drop file here (mock)</p>
                    </div>
                    <div className="space-y-1">
                        <label
                            htmlFor="pod-rec"
                            className="text-xs font-semibold uppercase text-slate-500"
                        >
                            Received by
                        </label>
                        <Input
                            id="pod-rec"
                            value={receivedBy}
                            onChange={(e) => setReceivedBy(e.target.value)}
                            placeholder="Name of receiver"
                        />
                    </div>
                    <div className="space-y-1">
                        <label
                            htmlFor="pod-rem"
                            className="text-xs font-semibold uppercase text-slate-500"
                        >
                            Remarks (optional)
                        </label>
                        <Textarea
                            id="pod-rem"
                            rows={2}
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                        />
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
                        disabled={!canSubmit}
                        onClick={() => onSubmit({ receivedBy, remarks })}
                    >
                        Save POD
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function Card({
    title,
    children,
    className,
}: {
    title: string;
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
            <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3>
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

function Field({
    label,
    value,
    mono,
}: {
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div>
            <dt className="text-xs font-semibold uppercase text-slate-400">
                {label}
            </dt>
            <dd
                className={cn(
                    'text-slate-700',
                    mono && 'font-mono text-xs',
                )}
            >
                {value}
            </dd>
        </div>
    );
}
