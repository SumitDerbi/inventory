import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    ChevronDown,
    Copy,
    GitBranch,
    Loader2,
    Mail,
    MessageSquare,
    Phone,
    Plus,
    Send,
    ShieldCheck,
    Trash2,
    XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
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
import { FormField, Input, Textarea } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { formatINR, formatRelative } from '@/lib/format';
import {
    canApprove,
    canClone,
    canConvertToOrder,
    canReject,
    canSend,
    isTerminal,
    statusLabel,
} from '@/lib/quotationStatus';
import { extractErrorMessage } from '@/services/apiClient';
import {
    useApproveQuotation,
    useCloneQuotation,
    useConvertQuotationToOrder,
    useCreateQuotationItem,
    useDeleteQuotationItem,
    useNewQuotationVersion,
    useQuotationActivity,
    useQuotationApprovalSteps,
    useQuotationCommunications,
    useQuotationItems,
    useQuotationQuery,
    useQuotationVersions,
    useRejectQuotation,
    useSendQuotation,
    useSubmitQuotationApproval,
    useUpdateQuotation,
    useUpdateQuotationItem,
} from '@/hooks/useQuotations';
import type {
    Quotation,
    QuotationApprovalStep,
    QuotationCommunication,
    QuotationItem,
    QuotationItemWritePayload,
    QuotationListItem,
} from '@/services/quotations';

type TabKey =
    | 'line-items'
    | 'commercials'
    | 'terms'
    | 'approvals'
    | 'communications'
    | 'activity'
    | 'versions';

const TABS: Array<{ key: TabKey; label: string }> = [
    { key: 'line-items', label: 'Line Items' },
    { key: 'commercials', label: 'Commercials' },
    { key: 'terms', label: 'Terms & Conditions' },
    { key: 'approvals', label: 'Approvals' },
    { key: 'communications', label: 'Communications' },
    { key: 'activity', label: 'Activity' },
    { key: 'versions', label: 'Versions' },
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

function fmtDateTime(iso: string | null | undefined): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function QuotationDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { push } = useToast();

    const quotationQuery = useQuotationQuery(id);
    const itemsQuery = useQuotationItems(id);
    const approvalsQuery = useQuotationApprovalSteps(id);
    const commsQuery = useQuotationCommunications(id);
    const activityQuery = useQuotationActivity(id);
    const versionsQuery = useQuotationVersions(id);

    const updateQuotation = useUpdateQuotation(id ?? '');
    const submitApproval = useSubmitQuotationApproval(id ?? '');
    const approveMut = useApproveQuotation(id ?? '');
    const rejectMut = useRejectQuotation(id ?? '');
    const sendMut = useSendQuotation(id ?? '');
    const cloneMut = useCloneQuotation();
    const newVersionMut = useNewQuotationVersion(id ?? '');
    const convertMut = useConvertQuotationToOrder(id ?? '');

    const [tab, setTab] = useState<TabKey>('line-items');
    const [sendOpen, setSendOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [itemDialog, setItemDialog] = useState<{
        mode: 'add' | 'edit';
        item: QuotationItem | null;
    } | null>(null);

    if (!id) {
        return <Navigate to="/quotations" replace />;
    }

    if (quotationQuery.isError) {
        return (
            <div className="p-6 md:p-8">
                <BackLink onBack={() => navigate('/quotations')} />
                <ErrorAlert
                    title="Could not load quotation"
                    description={extractErrorMessage(
                        quotationQuery.error,
                        'Please try again.',
                    )}
                />
            </div>
        );
    }

    if (quotationQuery.isLoading || !quotationQuery.data) {
        return (
            <div className="p-6 md:p-8">
                <BackLink onBack={() => navigate('/quotations')} />
                <div className="flex items-center gap-2 px-2 py-16 text-sm text-slate-500">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Loading quotation…
                </div>
            </div>
        );
    }

    const quotation = quotationQuery.data;
    const items = itemsQuery.data ?? quotation.items;
    const readOnly = isTerminal(quotation.status);

    return (
        <div className="p-6 md:p-8">
            <BackLink onBack={() => navigate('/quotations')} />

            {/* Header */}
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-xl font-semibold text-slate-800 md:text-2xl">
                            {quotation.quotationNumber}
                        </h1>
                        <Badge tone="neutral">v{quotation.versionNumber}</Badge>
                        <StatusBadge status={statusLabel(quotation.status)} />
                        {quotation.parentQuotationId && (
                            <Badge tone="blue">Revision</Badge>
                        )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                        Customer #{quotation.customerId} · {quotation.projectName || '—'} ·
                        Owner #{quotation.preparedBy ?? '—'}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {quotation.status === 'draft' && (
                        <Button
                            variant="outline"
                            disabled={submitApproval.isPending}
                            onClick={async () => {
                                try {
                                    await submitApproval.mutateAsync();
                                    push({
                                        variant: 'success',
                                        title: 'Submitted for approval',
                                        description: quotation.quotationNumber,
                                    });
                                } catch (e) {
                                    push({
                                        variant: 'error',
                                        title: 'Submit failed',
                                        description: extractErrorMessage(e),
                                    });
                                }
                            }}
                        >
                            <ShieldCheck className="size-4" aria-hidden="true" />
                            Submit approval
                        </Button>
                    )}
                    {canSend(quotation.status) && (
                        <Button onClick={() => setSendOpen(true)}>
                            <Send className="size-4" aria-hidden="true" />
                            Send
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
                            {canApprove(quotation.status) && (
                                <DropdownMenuItem
                                    onSelect={async () => {
                                        try {
                                            await approveMut.mutateAsync(undefined);
                                            push({
                                                variant: 'success',
                                                title: 'Approved',
                                                description: quotation.quotationNumber,
                                            });
                                        } catch (e) {
                                            push({
                                                variant: 'error',
                                                title: 'Approve failed',
                                                description: extractErrorMessage(e),
                                            });
                                        }
                                    }}
                                >
                                    <ShieldCheck className="size-4" aria-hidden="true" />
                                    Approve
                                </DropdownMenuItem>
                            )}
                            {canReject(quotation.status) && (
                                <DropdownMenuItem
                                    destructive
                                    onSelect={() => setRejectOpen(true)}
                                >
                                    <XCircle className="size-4" aria-hidden="true" />
                                    Reject
                                </DropdownMenuItem>
                            )}
                            {canConvertToOrder(quotation.status) && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onSelect={async () => {
                                            try {
                                                const result =
                                                    await convertMut.mutateAsync();
                                                push({
                                                    variant: 'success',
                                                    title: 'Sales order created',
                                                    description: result.orderNumber,
                                                });
                                                navigate('/orders');
                                            } catch (e) {
                                                push({
                                                    variant: 'error',
                                                    title: 'Convert failed',
                                                    description: extractErrorMessage(e),
                                                });
                                            }
                                        }}
                                    >
                                        <ArrowRight className="size-4" aria-hidden="true" />
                                        Convert to Order
                                    </DropdownMenuItem>
                                </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={async () => {
                                    try {
                                        await newVersionMut.mutateAsync();
                                        push({
                                            variant: 'success',
                                            title: 'New version created',
                                            description: 'Reload the quotations list to see the latest draft.',
                                        });
                                        navigate('/quotations');
                                    } catch (e) {
                                        push({
                                            variant: 'error',
                                            title: 'New version failed',
                                            description: extractErrorMessage(e),
                                        });
                                    }
                                }}
                            >
                                <GitBranch className="size-4" aria-hidden="true" />
                                New version
                            </DropdownMenuItem>
                            {canClone() && (
                                <DropdownMenuItem
                                    onSelect={async () => {
                                        try {
                                            const cloned = await cloneMut.mutateAsync(quotation.id);
                                            push({
                                                variant: 'success',
                                                title: 'Cloned',
                                                description: cloned.quotationNumber,
                                            });
                                            navigate(`/quotations/${cloned.id}`);
                                        } catch (e) {
                                            push({
                                                variant: 'error',
                                                title: 'Clone failed',
                                                description: extractErrorMessage(e),
                                            });
                                        }
                                    }}
                                >
                                    <Copy className="size-4" aria-hidden="true" />
                                    Clone
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Totals strip */}
            <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-4">
                <Stat label="Subtotal" value={formatINR(quotation.subtotal)} />
                <Stat
                    label="Discount"
                    value={`− ${formatINR(quotation.totalDiscount)}`}
                    valueClassName="text-amber-700"
                />
                <Stat label="Tax" value={formatINR(quotation.totalTax)} />
                <Stat
                    label="Grand total"
                    value={formatINR(quotation.grandTotal)}
                    valueClassName="text-slate-900 text-lg"
                />
            </div>

            {/* Tabs */}
            <div
                role="tablist"
                aria-label="Quotation sections"
                className="mb-4 flex flex-wrap gap-1 border-b border-slate-200"
            >
                {TABS.map((t) => {
                    const count =
                        t.key === 'line-items'
                            ? items.length
                            : t.key === 'approvals'
                                ? approvalsQuery.data?.length ?? null
                                : t.key === 'communications'
                                    ? commsQuery.data?.length ?? null
                                    : t.key === 'activity'
                                        ? activityQuery.data?.length ?? null
                                        : t.key === 'versions'
                                            ? versionsQuery.data?.length ?? null
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

            {tab === 'line-items' && (
                <LineItemsTab
                    quotationId={quotation.id}
                    items={items}
                    readOnly={readOnly}
                    loading={itemsQuery.isLoading}
                    quotation={quotation}
                    onAdd={() => setItemDialog({ mode: 'add', item: null })}
                    onEdit={(item) => setItemDialog({ mode: 'edit', item })}
                />
            )}

            {tab === 'commercials' && (
                <CommercialsTab quotation={quotation} update={updateQuotation} readOnly={readOnly} />
            )}

            {tab === 'terms' && (
                <TermsTab quotation={quotation} update={updateQuotation} readOnly={readOnly} />
            )}

            {tab === 'approvals' && (
                <ApprovalsTab
                    steps={approvalsQuery.data ?? []}
                    loading={approvalsQuery.isLoading}
                />
            )}

            {tab === 'communications' && (
                <CommunicationsTab
                    items={commsQuery.data ?? []}
                    loading={commsQuery.isLoading}
                    onCompose={() => setSendOpen(true)}
                    canSend={canSend(quotation.status)}
                />
            )}

            {tab === 'activity' && (
                <ActivityTab
                    items={activityQuery.data ?? []}
                    loading={activityQuery.isLoading}
                />
            )}

            {tab === 'versions' && (
                <VersionsTab
                    versions={versionsQuery.data ?? []}
                    currentId={quotation.id}
                    loading={versionsQuery.isLoading}
                    onOpen={(vid) => navigate(`/quotations/${vid}`)}
                />
            )}

            {/* Dialogs */}
            {sendOpen && (
                <SendDialog
                    onClose={() => setSendOpen(false)}
                    quotation={quotation}
                    send={sendMut}
                />
            )}
            {rejectOpen && (
                <RejectDialog
                    onClose={() => setRejectOpen(false)}
                    quotationNumber={quotation.quotationNumber}
                    reject={rejectMut}
                />
            )}
            {itemDialog && (
                <ItemDialog
                    quotationId={quotation.id}
                    mode={itemDialog.mode}
                    initial={itemDialog.item}
                    onClose={() => setItemDialog(null)}
                />
            )}
        </div>
    );
}

/* ============================== Sub-components ============================== */

function BackLink({ onBack }: { onBack: () => void }) {
    return (
        <button
            type="button"
            onClick={onBack}
            className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
        >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Back to quotations
        </button>
    );
}

/* ----------------------------- Line Items ----------------------------- */

function LineItemsTab({
    items,
    readOnly,
    loading,
    quotation,
    onAdd,
    onEdit,
    quotationId,
}: {
    items: QuotationItem[];
    readOnly: boolean;
    loading: boolean;
    quotation: Quotation;
    onAdd: () => void;
    onEdit: (item: QuotationItem) => void;
    quotationId: string;
}) {
    const { push } = useToast();
    const deleteItemMut = useDeleteQuotationItem(quotationId);

    return (
        <Card
            title={`Line items (${items.length})`}
            actions={
                !readOnly && (
                    <Button size="sm" onClick={onAdd}>
                        <Plus className="size-4" aria-hidden="true" />
                        Add line
                    </Button>
                )
            }
        >
            {loading ? (
                <div className="flex items-center gap-2 px-2 py-8 text-sm text-slate-500">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Loading…
                </div>
            ) : items.length === 0 ? (
                <EmptyState
                    title="No line items"
                    description="Add the products and services that make up this quotation."
                />
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-3 py-2 text-left font-semibold">Description</th>
                                <th className="px-3 py-2 text-right font-semibold">Qty</th>
                                <th className="px-3 py-2 text-left font-semibold">Unit</th>
                                <th className="px-3 py-2 text-right font-semibold">Price</th>
                                <th className="px-3 py-2 text-right font-semibold">Disc %</th>
                                <th className="px-3 py-2 text-right font-semibold">Tax</th>
                                <th className="px-3 py-2 text-right font-semibold">Total</th>
                                {!readOnly && <th className="px-3 py-2" />}
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((it) => (
                                <tr
                                    key={it.id}
                                    className="border-t border-slate-100 align-top"
                                >
                                    <td className="px-3 py-2">
                                        <p className="font-medium text-slate-800">
                                            {it.productDescription}
                                        </p>
                                        {(it.productCode || it.brand || it.modelNumber) && (
                                            <p className="text-xs text-slate-500">
                                                {[it.productCode, it.brand, it.modelNumber]
                                                    .filter(Boolean)
                                                    .join(' · ')}
                                            </p>
                                        )}
                                        {it.specifications && (
                                            <p className="text-xs text-slate-500">
                                                {it.specifications}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-right text-slate-700">
                                        {it.quantity}
                                    </td>
                                    <td className="px-3 py-2 text-slate-600">{it.unit}</td>
                                    <td className="px-3 py-2 text-right text-slate-700">
                                        {formatINR(it.unitPrice)}
                                    </td>
                                    <td className="px-3 py-2 text-right text-slate-700">
                                        {it.discountPercent}%
                                    </td>
                                    <td className="px-3 py-2 text-right text-slate-700">
                                        {formatINR(it.taxAmount)}
                                    </td>
                                    <td className="px-3 py-2 text-right font-semibold text-slate-800">
                                        {formatINR(it.lineTotal)}
                                    </td>
                                    {!readOnly && (
                                        <td className="px-3 py-2 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => onEdit(it)}
                                                    className="text-xs text-slate-500 hover:text-primary"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label="Remove line"
                                                    disabled={deleteItemMut.isPending}
                                                    onClick={async () => {
                                                        if (
                                                            !window.confirm(
                                                                'Remove this line item?',
                                                            )
                                                        ) {
                                                            return;
                                                        }
                                                        try {
                                                            await deleteItemMut.mutateAsync(
                                                                it.id,
                                                            );
                                                            push({
                                                                variant: 'success',
                                                                title: 'Line removed',
                                                            });
                                                        } catch (e) {
                                                            push({
                                                                variant: 'error',
                                                                title: 'Remove failed',
                                                                description:
                                                                    extractErrorMessage(e),
                                                            });
                                                        }
                                                    }}
                                                    className="text-slate-400 hover:text-red-600"
                                                >
                                                    <Trash2
                                                        className="size-4"
                                                        aria-hidden="true"
                                                    />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="text-sm">
                            <FooterRow label="Subtotal" value={quotation.subtotal} />
                            <FooterRow
                                label="Discount"
                                value={-quotation.totalDiscount}
                                tone="amber"
                            />
                            <FooterRow label="Tax" value={quotation.totalTax} />
                            <FooterRow label="Freight" value={quotation.freightAmount} />
                            <FooterRow
                                label="Other charges"
                                value={quotation.otherCharges}
                            />
                            <FooterRow
                                label="Grand total"
                                value={quotation.grandTotal}
                                bold
                            />
                        </tfoot>
                    </table>
                </div>
            )}
        </Card>
    );
}

function FooterRow({
    label,
    value,
    tone,
    bold,
}: {
    label: string;
    value: number;
    tone?: 'amber';
    bold?: boolean;
}) {
    return (
        <tr className="border-t border-slate-100 bg-slate-50/40">
            <td
                colSpan={6}
                className={cn(
                    'px-3 py-1.5 text-right text-xs uppercase tracking-wide',
                    bold ? 'text-slate-700 font-semibold' : 'text-slate-500',
                )}
            >
                {label}
            </td>
            <td
                colSpan={2}
                className={cn(
                    'px-3 py-1.5 text-right',
                    tone === 'amber' && 'text-amber-700',
                    bold ? 'text-base font-semibold text-slate-900' : 'text-slate-700',
                )}
            >
                {formatINR(value)}
            </td>
        </tr>
    );
}

/* ---------------------------- Commercials ---------------------------- */

function CommercialsTab({
    quotation,
    update,
    readOnly,
}: {
    quotation: Quotation;
    update: ReturnType<typeof useUpdateQuotation>;
    readOnly: boolean;
}) {
    const { push } = useToast();
    const [form, setForm] = useState({
        quotationDate: quotation.quotationDate,
        validUntil: quotation.validUntil,
        freightAmount: quotation.freightAmount,
        otherCharges: quotation.otherCharges,
        currency: quotation.currency,
        siteAddress: quotation.siteAddress,
        projectName: quotation.projectName,
    });

    async function save() {
        try {
            await update.mutateAsync({
                quotationDate: form.quotationDate,
                validUntil: form.validUntil,
                freightAmount: Number(form.freightAmount) || 0,
                otherCharges: Number(form.otherCharges) || 0,
                currency: form.currency,
                siteAddress: form.siteAddress,
                projectName: form.projectName,
            });
            push({ variant: 'success', title: 'Saved' });
        } catch (e) {
            push({
                variant: 'error',
                title: 'Save failed',
                description: extractErrorMessage(e),
            });
        }
    }

    return (
        <Card
            title="Commercial details"
            actions={
                !readOnly && (
                    <Button size="sm" onClick={save} disabled={update.isPending}>
                        Save
                    </Button>
                )
            }
        >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <FormField label="Project name">
                    <Input
                        value={form.projectName}
                        readOnly={readOnly}
                        onChange={(e) =>
                            setForm((p) => ({ ...p, projectName: e.target.value }))
                        }
                    />
                </FormField>
                <FormField label="Currency">
                    <Input
                        value={form.currency}
                        readOnly={readOnly}
                        onChange={(e) =>
                            setForm((p) => ({ ...p, currency: e.target.value }))
                        }
                    />
                </FormField>
                <FormField label="Quotation date">
                    <Input
                        type="date"
                        value={form.quotationDate.slice(0, 10)}
                        readOnly={readOnly}
                        onChange={(e) =>
                            setForm((p) => ({ ...p, quotationDate: e.target.value }))
                        }
                    />
                </FormField>
                <FormField label="Valid until">
                    <Input
                        type="date"
                        value={form.validUntil.slice(0, 10)}
                        readOnly={readOnly}
                        onChange={(e) =>
                            setForm((p) => ({ ...p, validUntil: e.target.value }))
                        }
                    />
                </FormField>
                <FormField label="Freight (₹)">
                    <Input
                        type="number"
                        value={form.freightAmount}
                        readOnly={readOnly}
                        onChange={(e) =>
                            setForm((p) => ({
                                ...p,
                                freightAmount: Number(e.target.value),
                            }))
                        }
                    />
                </FormField>
                <FormField label="Other charges (₹)">
                    <Input
                        type="number"
                        value={form.otherCharges}
                        readOnly={readOnly}
                        onChange={(e) =>
                            setForm((p) => ({
                                ...p,
                                otherCharges: Number(e.target.value),
                            }))
                        }
                    />
                </FormField>
                <FormField label="Site address" className="md:col-span-2">
                    <Textarea
                        value={form.siteAddress}
                        rows={2}
                        readOnly={readOnly}
                        onChange={(e) =>
                            setForm((p) => ({ ...p, siteAddress: e.target.value }))
                        }
                    />
                </FormField>
            </div>
            {readOnly && (
                <p className="mt-3 text-xs text-slate-500">
                    Quotation is in a terminal state and cannot be edited.
                </p>
            )}
        </Card>
    );
}

/* ------------------------------- Terms ------------------------------- */

function TermsTab({
    quotation,
    update,
    readOnly,
}: {
    quotation: Quotation;
    update: ReturnType<typeof useUpdateQuotation>;
    readOnly: boolean;
}) {
    const { push } = useToast();
    const [form, setForm] = useState({
        paymentTerms: quotation.paymentTerms,
        deliveryTerms: quotation.deliveryTerms,
        warrantyTerms: quotation.warrantyTerms,
        scopeOfSupply: quotation.scopeOfSupply,
        exclusions: quotation.exclusions,
        notes: quotation.notes,
    });

    async function save() {
        try {
            await update.mutateAsync(form);
            push({ variant: 'success', title: 'Saved' });
        } catch (e) {
            push({
                variant: 'error',
                title: 'Save failed',
                description: extractErrorMessage(e),
            });
        }
    }

    return (
        <Card
            title="Terms & conditions"
            actions={
                !readOnly && (
                    <Button size="sm" onClick={save} disabled={update.isPending}>
                        Save
                    </Button>
                )
            }
        >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <FormField label="Payment terms">
                    <Textarea
                        rows={3}
                        value={form.paymentTerms}
                        readOnly={readOnly}
                        onChange={(e) =>
                            setForm((p) => ({ ...p, paymentTerms: e.target.value }))
                        }
                    />
                </FormField>
                <FormField label="Delivery terms">
                    <Textarea
                        rows={3}
                        value={form.deliveryTerms}
                        readOnly={readOnly}
                        onChange={(e) =>
                            setForm((p) => ({ ...p, deliveryTerms: e.target.value }))
                        }
                    />
                </FormField>
                <FormField label="Warranty">
                    <Textarea
                        rows={3}
                        value={form.warrantyTerms}
                        readOnly={readOnly}
                        onChange={(e) =>
                            setForm((p) => ({ ...p, warrantyTerms: e.target.value }))
                        }
                    />
                </FormField>
                <FormField label="Scope of supply">
                    <Textarea
                        rows={3}
                        value={form.scopeOfSupply}
                        readOnly={readOnly}
                        onChange={(e) =>
                            setForm((p) => ({ ...p, scopeOfSupply: e.target.value }))
                        }
                    />
                </FormField>
                <FormField label="Exclusions">
                    <Textarea
                        rows={3}
                        value={form.exclusions}
                        readOnly={readOnly}
                        onChange={(e) =>
                            setForm((p) => ({ ...p, exclusions: e.target.value }))
                        }
                    />
                </FormField>
                <FormField label="Notes">
                    <Textarea
                        rows={3}
                        value={form.notes}
                        readOnly={readOnly}
                        onChange={(e) =>
                            setForm((p) => ({ ...p, notes: e.target.value }))
                        }
                    />
                </FormField>
            </div>
        </Card>
    );
}

/* ----------------------------- Approvals ----------------------------- */

function ApprovalsTab({
    steps,
    loading,
}: {
    steps: QuotationApprovalStep[];
    loading: boolean;
}) {
    if (loading) {
        return (
            <Card>
                <div className="flex items-center gap-2 px-2 py-8 text-sm text-slate-500">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Loading…
                </div>
            </Card>
        );
    }
    if (steps.length === 0) {
        return (
            <EmptyState
                title="No approval chain configured"
                description="Once a quotation is submitted for approval, the approval chain appears here."
            />
        );
    }
    const sorted = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);
    return (
        <Card title={`Approval chain (${steps.length})`}>
            <ol className="space-y-3">
                {sorted.map((s, idx) => {
                    const active =
                        s.status === 'pending' &&
                        sorted.slice(0, idx).every((x) => x.status === 'approved');
                    return (
                        <li
                            key={s.id}
                            className={cn(
                                'flex items-start gap-3 rounded-lg border p-3',
                                active
                                    ? 'border-amber-200 bg-amber-50'
                                    : 'border-slate-200 bg-white',
                            )}
                        >
                            <span
                                className={cn(
                                    'grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold',
                                    s.status === 'approved' &&
                                        'bg-emerald-100 text-emerald-700',
                                    s.status === 'pending' && 'bg-amber-100 text-amber-700',
                                    s.status === 'rejected' && 'bg-red-100 text-red-700',
                                )}
                            >
                                {s.stepOrder}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-slate-800">
                                    Approver #{s.approverId ?? '—'}
                                    {s.conditionType && (
                                        <span className="ml-2 text-xs font-normal text-slate-500">
                                            ({s.conditionType})
                                        </span>
                                    )}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {s.actionAt ? fmtDateTime(s.actionAt) : 'Awaiting action'}
                                </p>
                                {s.comments && (
                                    <p className="mt-1 text-sm text-slate-600">{s.comments}</p>
                                )}
                            </div>
                            <Badge tone={approvalTone(s.status)}>{s.status}</Badge>
                        </li>
                    );
                })}
            </ol>
        </Card>
    );
}

function approvalTone(s: QuotationApprovalStep['status']) {
    if (s === 'approved') return 'emerald' as const;
    if (s === 'pending') return 'amber' as const;
    if (s === 'rejected') return 'red' as const;
    return 'neutral' as const;
}

/* --------------------------- Communications --------------------------- */

const COMM_ICON: Record<QuotationCommunication['channel'], typeof Mail> = {
    email: Mail,
    whatsapp: MessageSquare,
    sms: Phone,
};

function CommunicationsTab({
    items,
    loading,
    onCompose,
    canSend: canCompose,
}: {
    items: QuotationCommunication[];
    loading: boolean;
    onCompose: () => void;
    canSend: boolean;
}) {
    const sorted = useMemo(
        () =>
            [...items].sort(
                (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
            ),
        [items],
    );
    return (
        <Card
            title={`Communications (${items.length})`}
            actions={
                canCompose && (
                    <Button size="sm" onClick={onCompose}>
                        <Send className="size-4" aria-hidden="true" />
                        Send email
                    </Button>
                )
            }
        >
            {loading ? (
                <div className="flex items-center gap-2 px-2 py-8 text-sm text-slate-500">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Loading…
                </div>
            ) : items.length === 0 ? (
                <EmptyState
                    title="No communications yet"
                    description="Emails and customer interactions will appear here."
                />
            ) : (
                <ul className="divide-y divide-slate-100">
                    {sorted.map((c) => {
                        const Icon = COMM_ICON[c.channel] ?? Mail;
                        return (
                            <li key={c.id} className="flex items-start gap-3 py-3">
                                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
                                    <Icon className="size-4" aria-hidden="true" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-slate-800">
                                        {c.subject || `(${c.channel})`}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        To {c.toAddress} · {formatRelative(c.sentAt)}
                                    </p>
                                    {c.body && (
                                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                                            {c.body}
                                        </p>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </Card>
    );
}

/* ----------------------------- Activity ----------------------------- */

function ActivityTab({
    items,
    loading,
}: {
    items: ReturnType<typeof useQuotationActivity>['data'] extends infer T
        ? T extends Array<infer U>
            ? U[]
            : never
        : never;
    loading: boolean;
}) {
    if (loading) {
        return (
            <Card>
                <div className="flex items-center gap-2 px-2 py-8 text-sm text-slate-500">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Loading…
                </div>
            </Card>
        );
    }
    if (items.length === 0) {
        return (
            <EmptyState
                title="No activity yet"
                description="Edits and workflow events appear here."
            />
        );
    }
    return (
        <Card title={`Activity (${items.length})`}>
            <ol className="space-y-2">
                {items.map((a) => (
                    <li
                        key={a.id}
                        className="flex items-start gap-3 rounded-md border border-slate-200 p-2"
                    >
                        <CheckCircle2
                            className="mt-0.5 size-4 shrink-0 text-slate-400"
                            aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-800">
                                {a.actionType}
                            </p>
                            {a.remarks && (
                                <p className="text-xs text-slate-600">{a.remarks}</p>
                            )}
                            {(a.oldValue || a.newValue) && (
                                <p className="text-xs text-slate-500">
                                    {a.oldValue && <span>from “{a.oldValue}”</span>}
                                    {a.oldValue && a.newValue && <span> → </span>}
                                    {a.newValue && <span>to “{a.newValue}”</span>}
                                </p>
                            )}
                            <p className="text-xs text-slate-400">
                                {fmtDateTime(a.performedAt)}
                            </p>
                        </div>
                    </li>
                ))}
            </ol>
        </Card>
    );
}

/* ------------------------------ Versions ----------------------------- */

function VersionsTab({
    versions,
    currentId,
    loading,
    onOpen,
}: {
    versions: QuotationListItem[];
    currentId: string;
    loading: boolean;
    onOpen: (id: string) => void;
}) {
    if (loading) {
        return (
            <Card>
                <div className="flex items-center gap-2 px-2 py-8 text-sm text-slate-500">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Loading…
                </div>
            </Card>
        );
    }
    if (versions.length === 0) {
        return (
            <EmptyState
                title="No version history"
                description="Use the “New version” action to create a revision."
            />
        );
    }
    const sorted = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);
    return (
        <Card title={`Versions (${versions.length})`}>
            <ol className="divide-y divide-slate-100">
                {sorted.map((v) => {
                    const isCurrent = v.id === currentId;
                    return (
                        <li key={v.id} className="flex items-start gap-3 py-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                                v{v.versionNumber}
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-medium text-slate-800">
                                        v{v.versionNumber}
                                    </p>
                                    <StatusBadge status={statusLabel(v.status)} />
                                    {isCurrent && <Badge tone="blue">Current</Badge>}
                                </div>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Created {fmtDateTime(v.createdAt)} ·{' '}
                                    {formatINR(v.grandTotal)}
                                </p>
                            </div>
                            {!isCurrent && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onOpen(v.id)}
                                >
                                    Open
                                </Button>
                            )}
                        </li>
                    );
                })}
            </ol>
        </Card>
    );
}

/* ----------------------------- Send dialog ----------------------------- */

function SendDialog({
    onClose,
    quotation,
    send,
}: {
    onClose: () => void;
    quotation: Quotation;
    send: ReturnType<typeof useSendQuotation>;
}) {
    const { push } = useToast();
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState(
        `Quotation ${quotation.quotationNumber} v${quotation.versionNumber} — ${quotation.projectName || ''}`,
    );
    const [body, setBody] = useState(
        `Please find our quotation valid until ${fmtDate(quotation.validUntil)}.`,
    );

    async function submit() {
        try {
            await send.mutateAsync({ toAddress: to, subject, body });
            push({
                variant: 'success',
                title: 'Quotation sent',
                description: `${quotation.quotationNumber} → ${to}`,
            });
            onClose();
        } catch (e) {
            push({
                variant: 'error',
                title: 'Send failed',
                description: extractErrorMessage(e),
            });
        }
    }

    return (
        <Dialog open onOpenChange={(o) => (!o ? onClose() : undefined)}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Send quotation</DialogTitle>
                    <DialogDescription>
                        Logs a communication and marks the quotation as sent.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody className="space-y-3">
                    <FormField label="To" required>
                        <Input
                            type="email"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            placeholder="customer@example.com"
                        />
                    </FormField>
                    <FormField label="Subject">
                        <Input
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </FormField>
                    <FormField label="Body">
                        <Textarea
                            rows={6}
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                        />
                    </FormField>
                </DialogBody>
                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={send.isPending}
                    >
                        Cancel
                    </Button>
                    <Button onClick={submit} disabled={send.isPending || !to}>
                        {send.isPending && (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        )}
                        <Send className="size-4" aria-hidden="true" />
                        Send
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ----------------------------- Reject dialog ---------------------------- */

function RejectDialog({
    onClose,
    quotationNumber,
    reject,
}: {
    onClose: () => void;
    quotationNumber: string;
    reject: ReturnType<typeof useRejectQuotation>;
}) {
    const { push } = useToast();
    const [comments, setComments] = useState('');

    async function submit() {
        try {
            await reject.mutateAsync(comments);
            push({
                variant: 'warning',
                title: 'Quotation rejected',
                description: quotationNumber,
            });
            onClose();
        } catch (e) {
            push({
                variant: 'error',
                title: 'Reject failed',
                description: extractErrorMessage(e),
            });
        }
    }

    return (
        <Dialog open onOpenChange={(o) => (!o ? onClose() : undefined)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reject quotation</DialogTitle>
                    <DialogDescription>
                        Provide a reason for rejecting {quotationNumber}.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody>
                    <FormField label="Reason" required>
                        <Textarea
                            rows={4}
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                        />
                    </FormField>
                </DialogBody>
                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={reject.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={submit}
                        disabled={reject.isPending || !comments.trim()}
                    >
                        {reject.isPending && (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        )}
                        Reject
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ------------------------------ Item dialog ----------------------------- */

function ItemDialog({
    quotationId,
    mode,
    initial,
    onClose,
}: {
    quotationId: string;
    mode: 'add' | 'edit';
    initial: QuotationItem | null;
    onClose: () => void;
}) {
    const { push } = useToast();
    const createMut = useCreateQuotationItem(quotationId);
    const updateMut = useUpdateQuotationItem(quotationId);

    const [form, setForm] = useState<QuotationItemWritePayload>({
        productDescription: initial?.productDescription ?? '',
        productCode: initial?.productCode ?? '',
        brand: initial?.brand ?? '',
        modelNumber: initial?.modelNumber ?? '',
        specifications: initial?.specifications ?? '',
        quantity: initial?.quantity ?? 1,
        unit: initial?.unit ?? 'nos',
        unitCost: initial?.unitCost ?? 0,
        unitPrice: initial?.unitPrice ?? 0,
        discountPercent: initial?.discountPercent ?? 0,
        notes: initial?.notes ?? '',
    });

    async function submit() {
        try {
            if (mode === 'add') {
                await createMut.mutateAsync(form);
                push({ variant: 'success', title: 'Line added' });
            } else if (initial) {
                await updateMut.mutateAsync({
                    itemId: initial.id,
                    payload: form,
                });
                push({ variant: 'success', title: 'Line updated' });
            }
            onClose();
        } catch (e) {
            push({
                variant: 'error',
                title: mode === 'add' ? 'Add failed' : 'Update failed',
                description: extractErrorMessage(e),
            });
        }
    }

    const pending = createMut.isPending || updateMut.isPending;

    return (
        <Dialog open onOpenChange={(o) => (!o ? onClose() : undefined)}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'add' ? 'Add line item' : 'Edit line item'}
                    </DialogTitle>
                    <DialogDescription>
                        Totals are recalculated by the backend after saving.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody className="space-y-3">
                    <FormField label="Description" required>
                        <Textarea
                            rows={2}
                            value={form.productDescription}
                            onChange={(e) =>
                                setForm((p) => ({
                                    ...p,
                                    productDescription: e.target.value,
                                }))
                            }
                        />
                    </FormField>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Product code">
                            <Input
                                value={form.productCode ?? ''}
                                onChange={(e) =>
                                    setForm((p) => ({ ...p, productCode: e.target.value }))
                                }
                            />
                        </FormField>
                        <FormField label="Brand">
                            <Input
                                value={form.brand ?? ''}
                                onChange={(e) =>
                                    setForm((p) => ({ ...p, brand: e.target.value }))
                                }
                            />
                        </FormField>
                        <FormField label="Model number">
                            <Input
                                value={form.modelNumber ?? ''}
                                onChange={(e) =>
                                    setForm((p) => ({ ...p, modelNumber: e.target.value }))
                                }
                            />
                        </FormField>
                        <FormField label="Unit" required>
                            <Input
                                value={form.unit}
                                onChange={(e) =>
                                    setForm((p) => ({ ...p, unit: e.target.value }))
                                }
                            />
                        </FormField>
                        <FormField label="Quantity" required>
                            <Input
                                type="number"
                                min={0}
                                value={form.quantity}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        quantity: Number(e.target.value),
                                    }))
                                }
                            />
                        </FormField>
                        <FormField label="Unit price (₹)" required>
                            <Input
                                type="number"
                                min={0}
                                value={form.unitPrice}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        unitPrice: Number(e.target.value),
                                    }))
                                }
                            />
                        </FormField>
                        <FormField label="Unit cost (₹)">
                            <Input
                                type="number"
                                min={0}
                                value={form.unitCost ?? 0}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        unitCost: Number(e.target.value),
                                    }))
                                }
                            />
                        </FormField>
                        <FormField label="Discount %">
                            <Input
                                type="number"
                                min={0}
                                max={100}
                                step={0.5}
                                value={form.discountPercent ?? 0}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        discountPercent: Number(e.target.value),
                                    }))
                                }
                            />
                        </FormField>
                    </div>
                    <FormField label="Specifications">
                        <Textarea
                            rows={2}
                            value={form.specifications ?? ''}
                            onChange={(e) =>
                                setForm((p) => ({
                                    ...p,
                                    specifications: e.target.value,
                                }))
                            }
                        />
                    </FormField>
                </DialogBody>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={pending}>
                        Cancel
                    </Button>
                    <Button
                        onClick={submit}
                        disabled={pending || !form.productDescription.trim()}
                    >
                        {pending && (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        )}
                        {mode === 'add' ? 'Add line' : 'Save'}
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
    children?: React.ReactNode;
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
