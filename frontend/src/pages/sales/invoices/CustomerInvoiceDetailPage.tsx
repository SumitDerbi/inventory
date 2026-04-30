import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Ban,
    CheckCircle2,
    Loader2,
    Pencil,
    Plus,
    Trash2,
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
import { formatINR } from '@/lib/format';
import { extractErrorMessage } from '@/services/apiClient';
import {
    useAddInvoiceItem,
    useCancelInvoice,
    useDeleteInvoiceItem,
    useFinaliseInvoice,
    useInvoiceQuery,
    useUpdateInvoiceItem,
} from '@/hooks/useCustomerInvoices';
import type {
    InvoiceApiStatus,
    InvoiceItem,
    InvoiceItemWritePayload,
} from '@/services/customer-invoices';

const STATUS_LABEL: Record<InvoiceApiStatus, string> = {
    draft: 'Draft',
    issued: 'Issued',
    cancelled: 'Cancelled',
};

const DATE_FMT = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
});

function fmtDate(iso: string | null) {
    if (!iso) return '—';
    return DATE_FMT.format(new Date(iso));
}

function fmtNum(v: number | string): string {
    const n = Number(v);
    return Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/\.?0+$/, '');
}

export default function CustomerInvoiceDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { push } = useToast();

    const invoiceQuery = useInvoiceQuery(id);
    const invoice = invoiceQuery.data;

    const [itemDialog, setItemDialog] = useState<
        { mode: 'add' } | { mode: 'edit'; item: InvoiceItem } | null
    >(null);
    const [deleteTarget, setDeleteTarget] = useState<InvoiceItem | null>(null);
    const [cancelOpen, setCancelOpen] = useState(false);

    const finaliseMut = useFinaliseInvoice(invoice?.orderId ?? null);
    const cancelMut = useCancelInvoice(invoice?.orderId ?? null);

    if (!id) return null;

    if (invoiceQuery.isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center text-sm text-slate-500">
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                Loading invoice…
            </div>
        );
    }

    if (invoiceQuery.isError || !invoice) {
        return (
            <div className="p-6 md:p-8">
                <Button variant="ghost" size="sm" onClick={() => navigate('/sales/invoices')}>
                    <ArrowLeft className="size-4" aria-hidden="true" /> Back to invoices
                </Button>
                <ErrorAlert
                    variant="danger"
                    title="Failed to load invoice"
                    description={
                        invoiceQuery.error
                            ? extractErrorMessage(invoiceQuery.error)
                            : 'Invoice not found.'
                    }
                    className="mt-4"
                />
            </div>
        );
    }

    const isDraft = invoice.status === 'draft';

    async function handleFinalise() {
        try {
            await finaliseMut.mutateAsync(invoice.id);
            push({ variant: 'success', title: `${invoice.invoiceNumber} issued` });
        } catch (e) {
            push({
                variant: 'danger',
                title: 'Could not issue invoice',
                description: extractErrorMessage(e),
            });
        }
    }

    return (
        <div className="p-6 md:p-8">
            <Button variant="ghost" size="sm" onClick={() => navigate('/sales/invoices')}>
                <ArrowLeft className="size-4" aria-hidden="true" /> Back to invoices
            </Button>

            <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-semibold text-slate-900">
                            {invoice.invoiceNumber}
                        </h1>
                        <StatusBadge status={STATUS_LABEL[invoice.status]} />
                        <Badge tone="slate">{invoice.invoiceType.replace('_', ' ')}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                        Dated {fmtDate(invoice.invoiceDate)}
                        {invoice.orderId && (
                            <>
                                {' · '}
                                <Link
                                    to={`/orders/${invoice.orderId}`}
                                    className="text-primary hover:underline"
                                >
                                    Sales order #{invoice.orderId}
                                </Link>
                            </>
                        )}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {isDraft && (
                        <Button
                            variant="primary"
                            onClick={handleFinalise}
                            disabled={finaliseMut.isPending || invoice.items.length === 0}
                        >
                            <CheckCircle2 className="size-4" aria-hidden="true" />
                            Issue invoice
                        </Button>
                    )}
                    {invoice.status !== 'cancelled' && (
                        <Button variant="outline" onClick={() => setCancelOpen(true)}>
                            <Ban className="size-4" aria-hidden="true" />
                            Cancel
                        </Button>
                    )}
                </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <div className="mb-2 flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                            Items
                        </h2>
                        {isDraft && (
                            <Button size="sm" onClick={() => setItemDialog({ mode: 'add' })}>
                                <Plus className="size-4" aria-hidden="true" />
                                Add item
                            </Button>
                        )}
                    </div>
                    {invoice.items.length === 0 ? (
                        <EmptyState
                            title="No items yet"
                            description={
                                isDraft
                                    ? 'Add at least one item before issuing the invoice.'
                                    : 'This invoice has no line items.'
                            }
                        />
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">Description</th>
                                        <th className="px-4 py-3 text-right">Qty</th>
                                        <th className="px-4 py-3 text-right">Rate</th>
                                        <th className="px-4 py-3 text-right">Discount</th>
                                        <th className="px-4 py-3 text-right">Tax %</th>
                                        <th className="px-4 py-3 text-right">Total</th>
                                        {isDraft && <th className="px-4 py-3" />}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {invoice.items.map((it) => (
                                        <tr key={it.id}>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-slate-800">
                                                    {it.description}
                                                </p>
                                                {it.hsnCode && (
                                                    <p className="text-xs text-slate-500">
                                                        HSN {it.hsnCode}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {fmtNum(it.quantity)} {it.unit}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {formatINR(it.unitPrice)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {formatINR(it.discountAmount)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {fmtNum(it.taxPercent)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold">
                                                {formatINR(it.lineTotal)}
                                            </td>
                                            {isDraft && (
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            aria-label={`Edit ${it.description}`}
                                                            onClick={() =>
                                                                setItemDialog({
                                                                    mode: 'edit',
                                                                    item: it,
                                                                })
                                                            }
                                                        >
                                                            <Pencil
                                                                className="size-4"
                                                                aria-hidden="true"
                                                            />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            aria-label={`Delete ${it.description}`}
                                                            onClick={() => setDeleteTarget(it)}
                                                        >
                                                            <Trash2
                                                                className="size-4"
                                                                aria-hidden="true"
                                                            />
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

                <aside className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                            Totals
                        </h3>
                        <dl className="mt-3 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-slate-500">Subtotal</dt>
                                <dd className="font-medium">{formatINR(invoice.subtotal)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-slate-500">Tax</dt>
                                <dd className="font-medium">{formatINR(invoice.taxAmount)}</dd>
                            </div>
                            <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
                                <dt className="font-semibold">Grand total</dt>
                                <dd className="font-semibold">{formatINR(invoice.grandTotal)}</dd>
                            </div>
                        </dl>
                    </div>
                    {invoice.notes && (
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                                Notes
                            </h3>
                            <p className="mt-2 whitespace-pre-line text-sm text-slate-700">
                                {invoice.notes}
                            </p>
                        </div>
                    )}
                </aside>
            </div>

            {itemDialog && (
                <ItemDialog
                    mode={itemDialog.mode}
                    item={itemDialog.mode === 'edit' ? itemDialog.item : undefined}
                    invoiceId={invoice.id}
                    orderId={invoice.orderId}
                    onClose={() => setItemDialog(null)}
                />
            )}

            {deleteTarget && (
                <DeleteItemDialog
                    item={deleteTarget}
                    invoiceId={invoice.id}
                    orderId={invoice.orderId}
                    onClose={() => setDeleteTarget(null)}
                />
            )}

            {cancelOpen && (
                <CancelDialog
                    invoiceNumber={invoice.invoiceNumber}
                    submitting={cancelMut.isPending}
                    onClose={() => setCancelOpen(false)}
                    onConfirm={async (reason) => {
                        try {
                            await cancelMut.mutateAsync({ id: invoice.id, reason });
                            push({
                                variant: 'success',
                                title: `${invoice.invoiceNumber} cancelled`,
                            });
                            setCancelOpen(false);
                        } catch (e) {
                            push({
                                variant: 'danger',
                                title: 'Cancel failed',
                                description: extractErrorMessage(e),
                            });
                        }
                    }}
                />
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Sub-dialogs
// ---------------------------------------------------------------------------

interface ItemDialogProps {
    mode: 'add' | 'edit';
    item?: InvoiceItem;
    invoiceId: string;
    orderId: string | null;
    onClose: () => void;
}

function ItemDialog({ mode, item, invoiceId, orderId, onClose }: ItemDialogProps) {
    const { push } = useToast();
    const addMut = useAddInvoiceItem(invoiceId, orderId);
    const updateMut = useUpdateInvoiceItem(invoiceId, orderId);

    const [description, setDescription] = useState(item?.description ?? '');
    const [hsnCode, setHsnCode] = useState(item?.hsnCode ?? '');
    const [quantity, setQuantity] = useState(item ? String(item.quantity) : '1');
    const [unit, setUnit] = useState(item?.unit ?? 'nos');
    const [unitPrice, setUnitPrice] = useState(item ? String(item.unitPrice) : '');
    const [discountAmount, setDiscountAmount] = useState(
        item ? String(item.discountAmount) : '0',
    );
    const [taxPercent, setTaxPercent] = useState(item ? String(item.taxPercent) : '0');

    const submitting = addMut.isPending || updateMut.isPending;

    async function submit() {
        const payload: InvoiceItemWritePayload = {
            description,
            hsnCode,
            quantity,
            unit,
            unitPrice,
            discountAmount,
            taxPercent,
        };
        try {
            if (mode === 'add') {
                await addMut.mutateAsync(payload);
                push({ variant: 'success', title: 'Item added' });
            } else if (item) {
                await updateMut.mutateAsync({ id: item.id, payload });
                push({ variant: 'success', title: 'Item updated' });
            }
            onClose();
        } catch (e) {
            push({
                variant: 'danger',
                title: 'Save failed',
                description: extractErrorMessage(e),
            });
        }
    }

    return (
        <Dialog open onOpenChange={(o) => (!o ? onClose() : null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{mode === 'add' ? 'Add item' : 'Edit item'}</DialogTitle>
                </DialogHeader>
                <DialogBody className="space-y-3">
                    <FormField label="Description" htmlFor="inv-desc">
                        <Input
                            id="inv-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </FormField>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="HSN code" htmlFor="inv-hsn">
                            <Input
                                id="inv-hsn"
                                value={hsnCode}
                                onChange={(e) => setHsnCode(e.target.value)}
                            />
                        </FormField>
                        <FormField label="Unit" htmlFor="inv-unit">
                            <Input
                                id="inv-unit"
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                            />
                        </FormField>
                        <FormField label="Quantity" htmlFor="inv-qty">
                            <Input
                                id="inv-qty"
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                        </FormField>
                        <FormField label="Unit price" htmlFor="inv-price">
                            <Input
                                id="inv-price"
                                type="number"
                                value={unitPrice}
                                onChange={(e) => setUnitPrice(e.target.value)}
                            />
                        </FormField>
                        <FormField label="Discount amount" htmlFor="inv-disc">
                            <Input
                                id="inv-disc"
                                type="number"
                                value={discountAmount}
                                onChange={(e) => setDiscountAmount(e.target.value)}
                            />
                        </FormField>
                        <FormField label="Tax %" htmlFor="inv-tax">
                            <Input
                                id="inv-tax"
                                type="number"
                                value={taxPercent}
                                onChange={(e) => setTaxPercent(e.target.value)}
                            />
                        </FormField>
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={submit}
                        disabled={submitting || !description || !unitPrice}
                    >
                        {submitting ? 'Saving…' : mode === 'add' ? 'Add' : 'Save'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface DeleteItemDialogProps {
    item: InvoiceItem;
    invoiceId: string;
    orderId: string | null;
    onClose: () => void;
}

function DeleteItemDialog({ item, invoiceId, orderId, onClose }: DeleteItemDialogProps) {
    const { push } = useToast();
    const delMut = useDeleteInvoiceItem(invoiceId, orderId);

    async function confirm() {
        try {
            await delMut.mutateAsync(item.id);
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
        <Dialog open onOpenChange={(o) => (!o ? onClose() : null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Remove item</DialogTitle>
                    <DialogDescription>
                        “{item.description}” will be removed from this invoice.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={delMut.isPending}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={confirm} disabled={delMut.isPending}>
                        {delMut.isPending ? 'Removing…' : 'Remove'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface CancelDialogProps {
    invoiceNumber: string;
    submitting: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
}

function CancelDialog({ invoiceNumber, submitting, onClose, onConfirm }: CancelDialogProps) {
    const [reason, setReason] = useState('');

    return (
        <Dialog open onOpenChange={(o) => (!o ? onClose() : null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cancel {invoiceNumber}?</DialogTitle>
                    <DialogDescription>
                        Provide a reason. This will be appended to the invoice notes.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody>
                    <FormField label="Reason" htmlFor="cancel-reason">
                        <Textarea
                            id="cancel-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                        />
                    </FormField>
                </DialogBody>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={submitting}>
                        Back
                    </Button>
                    <Button
                        variant="danger"
                        disabled={submitting || !reason.trim()}
                        onClick={() => onConfirm(reason.trim())}
                    >
                        {submitting ? 'Cancelling…' : 'Cancel invoice'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
