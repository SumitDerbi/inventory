import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowRight,
    Ban,
    CheckCircle2,
    Loader2,
    Package,
    Pencil,
    Plus,
    RefreshCcw,
    Trash2,
    Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { EmptyState } from '@/components/ui/EmptyState';
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { FormField, Input, Textarea } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { formatINR } from '@/lib/format';
import { extractErrorMessage } from '@/services/apiClient';
import {
    useAddOrderItem,
    useDeleteOrderItem,
    useDispatchItems,
    useOrderMrp,
    useOrderQuery,
    useReleaseStock,
    useReserveStock,
    useTransitionStage,
    useUpdateOrderItem,
} from '@/hooks/useOrders';
import type {
    OrderApiStatus,
    OrderItem,
    OrderItemWritePayload,
} from '@/services/orders';

// ---------------------------------------------------------------------------
// Stage helpers (API-aligned)
// ---------------------------------------------------------------------------

const STATUS_LABEL: Record<OrderApiStatus, string> = {
    draft: 'Draft',
    confirmed: 'Confirmed',
    processing: 'Processing',
    ready_to_dispatch: 'Ready',
    partially_dispatched: 'Partially dispatched',
    fully_dispatched: 'Dispatched',
    installed: 'Installed',
    closed: 'Closed',
    cancelled: 'Cancelled',
};

const STEPPER: OrderApiStatus[] = [
    'draft',
    'confirmed',
    'processing',
    'ready_to_dispatch',
    'fully_dispatched',
    'installed',
    'closed',
];

// Mirrors backend STAGE_FLOW.
const NEXT_STAGE: Partial<Record<OrderApiStatus, OrderApiStatus>> = {
    draft: 'confirmed',
    confirmed: 'processing',
    processing: 'ready_to_dispatch',
    ready_to_dispatch: 'partially_dispatched',
    partially_dispatched: 'fully_dispatched',
    fully_dispatched: 'installed',
    installed: 'closed',
};

function isTerminal(s: OrderApiStatus): boolean {
    return s === 'closed' || s === 'cancelled';
}

function canCancel(s: OrderApiStatus): boolean {
    // Backend allows cancel pre-dispatch.
    return ['draft', 'confirmed', 'processing', 'ready_to_dispatch'].includes(s);
}

function stepperIndex(s: OrderApiStatus): number {
    if (s === 'partially_dispatched') return STEPPER.indexOf('ready_to_dispatch');
    if (s === 'cancelled') return -1;
    return STEPPER.indexOf(s);
}

function fmtNum(v: number | string): string {
    const n = Number(v);
    return Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/\.?0+$/, '');
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type TabKey = 'items' | 'mrp';

export default function OrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { push } = useToast();

    const orderQuery = useOrderQuery(id);
    const order = orderQuery.data;

    const [tab, setTab] = useState<TabKey>('items');
    const [itemDialog, setItemDialog] = useState<
        { mode: 'add' } | { mode: 'edit'; item: OrderItem } | null
    >(null);
    const [deleteItem, setDeleteItem] = useState<OrderItem | null>(null);
    const [reserveOpen, setReserveOpen] = useState(false);
    const [dispatchOpen, setDispatchOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);

    const transitionMut = useTransitionStage(id!);
    const releaseMut = useReleaseStock(id!);

    if (!id) return null;

    if (orderQuery.isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center text-sm text-slate-500">
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                Loading order…
            </div>
        );
    }

    if (orderQuery.isError || !order) {
        return (
            <div className="p-6 md:p-8">
                <Button variant="ghost" size="sm" onClick={() => navigate('/orders')}>
                    <ArrowLeft className="size-4" aria-hidden="true" /> Back to orders
                </Button>
                <ErrorAlert
                    variant="danger"
                    title="Failed to load order"
                    description={
                        orderQuery.error ? extractErrorMessage(orderQuery.error) : 'Order not found.'
                    }
                    className="mt-4"
                />
            </div>
        );
    }

    const next = NEXT_STAGE[order.status];

    async function advance() {
        if (!next) return;
        try {
            await transitionMut.mutateAsync({ nextStage: next });
            push({ variant: 'success', title: `Moved to ${STATUS_LABEL[next]}` });
        } catch (e) {
            push({
                variant: 'danger',
                title: 'Stage transition failed',
                description: extractErrorMessage(e),
            });
        }
    }

    async function release() {
        try {
            const r = await releaseMut.mutateAsync();
            push({
                variant: 'success',
                title: `Released ${r.released} reservation${r.released === 1 ? '' : 's'}`,
            });
        } catch (e) {
            push({
                variant: 'danger',
                title: 'Release failed',
                description: extractErrorMessage(e),
            });
        }
    }

    return (
        <div className="p-6 md:p-8">
            <Button variant="ghost" size="sm" onClick={() => navigate('/orders')}>
                <ArrowLeft className="size-4" aria-hidden="true" /> Back to orders
            </Button>

            {/* Header */}
            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-semibold text-slate-900">
                            {order.orderNumber}
                        </h1>
                        <StatusBadge status={STATUS_LABEL[order.status]} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                        {order.projectName || '—'}
                        {order.quotationId && (
                            <>
                                {' · '}
                                <Link
                                    to={`/quotations/${order.quotationId}`}
                                    className="text-primary hover:underline"
                                >
                                    Source quotation
                                </Link>
                            </>
                        )}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setReserveOpen(true)}
                        disabled={isTerminal(order.status)}
                    >
                        <Package className="size-4" aria-hidden="true" /> Reserve stock
                    </Button>
                    <Button
                        variant="outline"
                        onClick={release}
                        disabled={isTerminal(order.status) || releaseMut.isPending}
                    >
                        <RefreshCcw className="size-4" aria-hidden="true" /> Release
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setDispatchOpen(true)}
                        disabled={
                            !['ready_to_dispatch', 'partially_dispatched'].includes(order.status)
                        }
                    >
                        <Truck className="size-4" aria-hidden="true" /> Dispatch
                    </Button>
                    {next && (
                        <Button onClick={advance} disabled={transitionMut.isPending}>
                            <ArrowRight className="size-4" aria-hidden="true" />
                            Advance to {STATUS_LABEL[next]}
                        </Button>
                    )}
                    {canCancel(order.status) && (
                        <Button variant="outline" onClick={() => setCancelOpen(true)}>
                            <Ban className="size-4" aria-hidden="true" /> Cancel
                        </Button>
                    )}
                </div>
            </div>

            {/* Stepper */}
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
                <Stepper status={order.status} />
            </div>

            {/* Summary tiles */}
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                <Tile label="Order date" value={order.orderDate || '—'} />
                <Tile label="Subtotal" value={formatINR(order.subtotal)} />
                <Tile label="Tax" value={formatINR(order.totalTax)} />
                <Tile label="Grand total" value={formatINR(order.grandTotal)} bold />
            </div>

            {/* Tabs */}
            <div className="mt-6 border-b border-slate-200">
                <nav className="-mb-px flex gap-6 text-sm">
                    {(['items', 'mrp'] as TabKey[]).map((k) => (
                        <button
                            key={k}
                            type="button"
                            onClick={() => setTab(k)}
                            className={cn(
                                'border-b-2 px-1 pb-3 pt-2 font-medium transition-colors',
                                tab === k
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-slate-500 hover:text-slate-700',
                            )}
                        >
                            {k === 'items' ? 'Items' : 'Material Readiness'}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-4">
                {tab === 'items' && (
                    <ItemsTab
                        order={order}
                        onAdd={() => setItemDialog({ mode: 'add' })}
                        onEdit={(it) => setItemDialog({ mode: 'edit', item: it })}
                        onDelete={(it) => setDeleteItem(it)}
                    />
                )}
                {tab === 'mrp' && <MrpTab orderId={order.id} />}
            </div>

            {/* Dialogs */}
            {itemDialog && (
                <ItemDialog
                    orderId={order.id}
                    initial={itemDialog.mode === 'edit' ? itemDialog.item : null}
                    onClose={() => setItemDialog(null)}
                />
            )}
            {deleteItem && (
                <DeleteItemDialog
                    orderId={order.id}
                    item={deleteItem}
                    onClose={() => setDeleteItem(null)}
                />
            )}
            {reserveOpen && (
                <ReserveDialog
                    orderId={order.id}
                    onClose={() => setReserveOpen(false)}
                />
            )}
            {dispatchOpen && (
                <DispatchDialog
                    orderId={order.id}
                    items={order.items}
                    onClose={() => setDispatchOpen(false)}
                />
            )}
            {cancelOpen && (
                <CancelDialog
                    orderId={order.id}
                    onClose={() => setCancelOpen(false)}
                />
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Stepper
// ---------------------------------------------------------------------------

function Stepper({ status }: { status: OrderApiStatus }) {
    if (status === 'cancelled') {
        return (
            <div className="flex items-center gap-2 text-sm text-rose-600">
                <Ban className="size-4" aria-hidden="true" />
                <span className="font-semibold">Cancelled</span>
            </div>
        );
    }
    const idx = stepperIndex(status);
    return (
        <ol className="flex flex-wrap items-center gap-2 text-xs">
            {STEPPER.map((s, i) => {
                const done = i < idx;
                const active = i === idx;
                return (
                    <li key={s} className="flex items-center gap-2">
                        <span
                            className={cn(
                                'flex size-6 items-center justify-center rounded-full border text-[11px] font-semibold',
                                done && 'border-emerald-500 bg-emerald-500 text-white',
                                active && 'border-primary bg-primary text-white',
                                !done && !active && 'border-slate-300 bg-white text-slate-400',
                            )}
                        >
                            {done ? <CheckCircle2 className="size-3.5" aria-hidden="true" /> : i + 1}
                        </span>
                        <span
                            className={cn(
                                'font-medium',
                                active ? 'text-slate-900' : 'text-slate-500',
                            )}
                        >
                            {STATUS_LABEL[s]}
                        </span>
                        {i < STEPPER.length - 1 && (
                            <span className="mx-1 h-px w-6 bg-slate-200" aria-hidden="true" />
                        )}
                    </li>
                );
            })}
            {status === 'partially_dispatched' && (
                <Badge tone="amber" className="ml-2">
                    Partially dispatched
                </Badge>
            )}
        </ol>
    );
}

function Tile({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {label}
            </p>
            <p className={cn('mt-1 text-slate-800', bold ? 'text-lg font-semibold' : 'text-sm')}>
                {value}
            </p>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Items tab
// ---------------------------------------------------------------------------

function ItemsTab({
    order,
    onAdd,
    onEdit,
    onDelete,
}: {
    order: { id: string; status: OrderApiStatus; items: OrderItem[] };
    onAdd: () => void;
    onEdit: (it: OrderItem) => void;
    onDelete: (it: OrderItem) => void;
}) {
    const editable = !isTerminal(order.status) && order.status !== 'fully_dispatched';

    return (
        <div>
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700">
                    {order.items.length} line item{order.items.length === 1 ? '' : 's'}
                </h2>
                {editable && (
                    <Button size="sm" onClick={onAdd}>
                        <Plus className="size-4" aria-hidden="true" /> Add item
                    </Button>
                )}
            </div>

            {order.items.length === 0 ? (
                <EmptyState
                    title="No items"
                    description="Add line items to this order."
                />
            ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-3 py-2 text-left">Description</th>
                                <th className="px-3 py-2 text-right">Ordered</th>
                                <th className="px-3 py-2 text-right">Dispatched</th>
                                <th className="px-3 py-2 text-right">Pending</th>
                                <th className="px-3 py-2 text-right">Unit price</th>
                                <th className="px-3 py-2 text-right">Disc %</th>
                                <th className="px-3 py-2 text-right">Line total</th>
                                {editable && <th className="px-3 py-2"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {order.items.map((it) => (
                                <tr key={it.id}>
                                    <td className="px-3 py-2">
                                        <p className="font-medium text-slate-800">
                                            {it.productDescription || '—'}
                                        </p>
                                        {it.notes && (
                                            <p className="text-xs text-slate-500">{it.notes}</p>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-right text-slate-700">
                                        {fmtNum(it.quantityOrdered)} {it.unit}
                                    </td>
                                    <td className="px-3 py-2 text-right text-slate-700">
                                        {fmtNum(it.quantityDispatched)}
                                    </td>
                                    <td className="px-3 py-2 text-right text-slate-700">
                                        {fmtNum(it.quantityPending)}
                                    </td>
                                    <td className="px-3 py-2 text-right text-slate-700">
                                        {formatINR(it.unitPrice)}
                                    </td>
                                    <td className="px-3 py-2 text-right text-slate-700">
                                        {fmtNum(it.discountPercent)}
                                    </td>
                                    <td className="px-3 py-2 text-right font-semibold text-slate-800">
                                        {formatINR(it.lineTotal)}
                                    </td>
                                    {editable && (
                                        <td className="px-3 py-2 text-right">
                                            <div className="inline-flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onEdit(it)}
                                                    aria-label={`Edit ${it.productDescription}`}
                                                >
                                                    <Pencil className="size-4" aria-hidden="true" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onDelete(it)}
                                                    aria-label={`Delete ${it.productDescription}`}
                                                >
                                                    <Trash2 className="size-4" aria-hidden="true" />
                                                </Button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// MRP tab
// ---------------------------------------------------------------------------

function MrpTab({ orderId }: { orderId: string }) {
    const mrp = useOrderMrp(orderId);
    if (mrp.isLoading) {
        return (
            <div className="flex items-center justify-center px-6 py-12 text-sm text-slate-500">
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                Loading availability…
            </div>
        );
    }
    if (mrp.isError) {
        return (
            <ErrorAlert
                variant="danger"
                title="Failed to load MRP"
                description={extractErrorMessage(mrp.error)}
            />
        );
    }
    if (!mrp.data || mrp.data.items.length === 0) {
        return <EmptyState title="No items" description="Add items to view material readiness." />;
    }
    return (
        <div>
            <div className="mb-3 flex items-center gap-2">
                {mrp.data.allReady ? (
                    <Badge tone="emerald">All ready</Badge>
                ) : (
                    <Badge tone="amber">Shortage</Badge>
                )}
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <tr>
                            <th className="px-3 py-2 text-left">Item</th>
                            <th className="px-3 py-2 text-right">Required</th>
                            <th className="px-3 py-2 text-right">On hand</th>
                            <th className="px-3 py-2 text-right">Reserved</th>
                            <th className="px-3 py-2 text-right">Available</th>
                            <th className="px-3 py-2 text-right">Shortfall</th>
                            <th className="px-3 py-2">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {mrp.data.items.map((r) => (
                            <tr key={r.itemId}>
                                <td className="px-3 py-2 font-medium text-slate-800">
                                    {r.productDescription || `#${r.itemId}`}
                                </td>
                                <td className="px-3 py-2 text-right text-slate-700">{fmtNum(r.requiredQty)}</td>
                                <td className="px-3 py-2 text-right text-slate-700">{fmtNum(r.onHand)}</td>
                                <td className="px-3 py-2 text-right text-slate-700">{fmtNum(r.reserved)}</td>
                                <td className="px-3 py-2 text-right text-slate-700">{fmtNum(r.available)}</td>
                                <td className="px-3 py-2 text-right">
                                    {Number(r.shortfall) > 0 ? (
                                        <span className="font-semibold text-rose-600">{fmtNum(r.shortfall)}</span>
                                    ) : (
                                        <span className="text-slate-400">—</span>
                                    )}
                                </td>
                                <td className="px-3 py-2">
                                    {r.ready ? (
                                        <Badge tone="emerald">Ready</Badge>
                                    ) : (
                                        <Badge tone="amber">Short</Badge>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Item add/edit dialog
// ---------------------------------------------------------------------------

function ItemDialog({
    orderId,
    initial,
    onClose,
}: {
    orderId: string;
    initial: OrderItem | null;
    onClose: () => void;
}) {
    const isEdit = !!initial;
    const addMut = useAddOrderItem(orderId);
    const updateMut = useUpdateOrderItem(orderId);
    const { push } = useToast();

    const [description, setDescription] = useState(initial?.productDescription ?? '');
    const [quantity, setQuantity] = useState(String(initial?.quantityOrdered ?? '1'));
    const [unit, setUnit] = useState(initial?.unit ?? 'nos');
    const [unitPrice, setUnitPrice] = useState(String(initial?.unitPrice ?? '0'));
    const [discount, setDiscount] = useState(String(initial?.discountPercent ?? '0'));
    const [notes, setNotes] = useState(initial?.notes ?? '');

    const submitting = addMut.isPending || updateMut.isPending;
    const valid =
        description.trim().length > 0 &&
        Number(quantity) > 0 &&
        Number(unitPrice) >= 0 &&
        unit.trim().length > 0;

    async function submit() {
        const payload: OrderItemWritePayload = {
            productDescription: description.trim(),
            quantityOrdered: Number(quantity),
            unit: unit.trim(),
            unitPrice: Number(unitPrice),
            discountPercent: Number(discount) || 0,
            notes: notes.trim(),
        };
        try {
            if (isEdit && initial) {
                await updateMut.mutateAsync({ id: initial.id, payload });
                push({ variant: 'success', title: 'Item updated' });
            } else {
                await addMut.mutateAsync(payload);
                push({ variant: 'success', title: 'Item added' });
            }
            onClose();
        } catch (e) {
            push({
                variant: 'danger',
                title: isEdit ? 'Update failed' : 'Add failed',
                description: extractErrorMessage(e),
            });
        }
    }

    return (
        <Dialog open onOpenChange={(v) => !v && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit item' : 'Add item'}</DialogTitle>
                </DialogHeader>
                <DialogBody className="space-y-3">
                    <FormField label="Description" required>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Product description"
                        />
                    </FormField>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Quantity" required>
                            <Input
                                type="number"
                                step="0.001"
                                min="0"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                        </FormField>
                        <FormField label="Unit" required>
                            <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
                        </FormField>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Unit price" required>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={unitPrice}
                                onChange={(e) => setUnitPrice(e.target.value)}
                            />
                        </FormField>
                        <FormField label="Discount %">
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={discount}
                                onChange={(e) => setDiscount(e.target.value)}
                            />
                        </FormField>
                    </div>
                    <FormField label="Notes">
                        <Textarea
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </FormField>
                </DialogBody>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button onClick={submit} disabled={!valid || submitting}>
                        {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add item'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function DeleteItemDialog({
    orderId,
    item,
    onClose,
}: {
    orderId: string;
    item: OrderItem;
    onClose: () => void;
}) {
    const mut = useDeleteOrderItem(orderId);
    const { push } = useToast();
    async function confirm() {
        try {
            await mut.mutateAsync(item.id);
            push({ variant: 'success', title: 'Item removed' });
            onClose();
        } catch (e) {
            push({
                variant: 'danger',
                title: 'Delete failed',
                description: extractErrorMessage(e),
            });
        }
    }
    return (
        <Dialog open onOpenChange={(v) => !v && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete item?</DialogTitle>
                    <DialogDescription>
                        Remove “{item.productDescription || 'this item'}” from the order. This
                        cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={mut.isPending}>
                        Cancel
                    </Button>
                    <Button onClick={confirm} disabled={mut.isPending}>
                        {mut.isPending ? 'Deleting…' : 'Delete'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ---------------------------------------------------------------------------
// Reserve / Dispatch / Cancel
// ---------------------------------------------------------------------------

function ReserveDialog({ orderId, onClose }: { orderId: string; onClose: () => void }) {
    const [warehouseId, setWarehouseId] = useState('');
    const mut = useReserveStock(orderId);
    const { push } = useToast();
    async function submit() {
        try {
            const r = await mut.mutateAsync(warehouseId);
            const reserved = r.reservations.filter((x) => !x.skipped).length;
            const skipped = r.reservations.length - reserved;
            push({
                variant: 'success',
                title: `Reserved ${reserved}${skipped ? ` (${skipped} skipped)` : ''}`,
            });
            onClose();
        } catch (e) {
            push({
                variant: 'danger',
                title: 'Reserve failed',
                description: extractErrorMessage(e),
            });
        }
    }
    return (
        <Dialog open onOpenChange={(v) => !v && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reserve stock</DialogTitle>
                    <DialogDescription>
                        Soft-reserve required stock from a warehouse for this order.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody>
                    <FormField label="Warehouse ID" required>
                        <Input
                            type="number"
                            min="1"
                            value={warehouseId}
                            onChange={(e) => setWarehouseId(e.target.value)}
                            placeholder="e.g. 1"
                        />
                    </FormField>
                </DialogBody>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={mut.isPending}>
                        Cancel
                    </Button>
                    <Button onClick={submit} disabled={!warehouseId || mut.isPending}>
                        {mut.isPending ? 'Reserving…' : 'Reserve'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function DispatchDialog({
    orderId,
    items,
    onClose,
}: {
    orderId: string;
    items: OrderItem[];
    onClose: () => void;
}) {
    const pending = items.filter((it) => Number(it.quantityPending) > 0);
    const [qty, setQty] = useState<Record<string, string>>(() =>
        Object.fromEntries(pending.map((it) => [it.id, String(it.quantityPending)])),
    );
    const mut = useDispatchItems(orderId);
    const { push } = useToast();

    const lines = pending
        .map((it) => ({ itemId: it.id, quantity: Number(qty[it.id] || 0) }))
        .filter((l) => l.quantity > 0);

    async function submit() {
        try {
            const updated = await mut.mutateAsync(lines);
            push({
                variant: 'success',
                title: 'Dispatch recorded',
                description: `Stage is now ${STATUS_LABEL[updated.status]}.`,
            });
            onClose();
        } catch (e) {
            push({
                variant: 'danger',
                title: 'Dispatch failed',
                description: extractErrorMessage(e),
            });
        }
    }

    return (
        <Dialog open onOpenChange={(v) => !v && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Dispatch items</DialogTitle>
                    <DialogDescription>
                        Record dispatched quantities. Pending values default to full pending qty.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody>
                    {pending.length === 0 ? (
                        <p className="text-sm text-slate-500">Nothing pending to dispatch.</p>
                    ) : (
                        <div className="space-y-2">
                            {pending.map((it) => (
                                <div key={it.id} className="flex items-center gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-slate-800">
                                            {it.productDescription || `Item #${it.id}`}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Pending: {fmtNum(it.quantityPending)} {it.unit}
                                        </p>
                                    </div>
                                    <Input
                                        type="number"
                                        step="0.001"
                                        min="0"
                                        max={String(it.quantityPending)}
                                        value={qty[it.id] ?? ''}
                                        onChange={(e) =>
                                            setQty((q) => ({ ...q, [it.id]: e.target.value }))
                                        }
                                        className="w-28"
                                        aria-label={`Dispatch qty for ${it.productDescription}`}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </DialogBody>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={mut.isPending}>
                        Cancel
                    </Button>
                    <Button onClick={submit} disabled={lines.length === 0 || mut.isPending}>
                        {mut.isPending ? 'Recording…' : 'Record dispatch'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function CancelDialog({ orderId, onClose }: { orderId: string; onClose: () => void }) {
    const [reason, setReason] = useState('');
    const mut = useTransitionStage(orderId);
    const { push } = useToast();
    async function submit() {
        try {
            await mut.mutateAsync({ nextStage: 'cancelled', cancellationReason: reason.trim() });
            push({ variant: 'success', title: 'Order cancelled' });
            onClose();
        } catch (e) {
            push({
                variant: 'danger',
                title: 'Cancel failed',
                description: extractErrorMessage(e),
            });
        }
    }
    return (
        <Dialog open onOpenChange={(v) => !v && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cancel order</DialogTitle>
                    <DialogDescription>
                        Cancellation is final. Provide a reason for audit history.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody>
                    <FormField label="Reason" required>
                        <Textarea
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </FormField>
                </DialogBody>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={mut.isPending}>
                        Keep order
                    </Button>
                    <Button onClick={submit} disabled={!reason.trim() || mut.isPending}>
                        {mut.isPending ? 'Cancelling…' : 'Cancel order'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
