import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    ChevronDown,
    Copy,
    Download,
    History,
    Loader2,
    Mail,
    MailCheck,
    MessageSquare,
    Pencil,
    Phone,
    Plus,
    Printer,
    Send,
    ShieldCheck,
    Trash2,
    XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
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
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/Sheet';
import {
    FormField,
    Input,
    Textarea,
} from '@/components/ui/FormField';
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
    requiresVersionBump,
    statusLabel,
} from '@/lib/quotationStatus';
import {
    currentVersion,
    lineTotals,
    quotationById,
    versionTotals,
    type Quotation,
    type QuotationApprovalStep,
    type QuotationCommunication,
    type QuotationLineItem,
    type QuotationVersion,
} from '@/mocks/quotations';
import { products } from '@/mocks/products';
import { termsTemplateById, termsTemplates } from '@/mocks/termsTemplates';
import { userById } from '@/mocks/users';

type TabKey =
    | 'line-items'
    | 'commercials'
    | 'terms'
    | 'approvals'
    | 'communications'
    | 'versions';

const TABS: Array<{ key: TabKey; label: string }> = [
    { key: 'line-items', label: 'Line Items' },
    { key: 'commercials', label: 'Commercials' },
    { key: 'terms', label: 'Terms & Conditions' },
    { key: 'approvals', label: 'Approvals' },
    { key: 'communications', label: 'Communications' },
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

    const quotation = quotationById(id ?? '');

    const [tab, setTab] = useState<TabKey>('line-items');
    const [versionNumber, setVersionNumber] = useState<number | null>(null);
    const [lineItems, setLineItems] = useState<QuotationLineItem[] | null>(null);
    const [productPickerOpen, setProductPickerOpen] = useState(false);
    const [sendOpen, setSendOpen] = useState(false);
    const [pdfOpen, setPdfOpen] = useState(false);
    const [versionBumpOpen, setVersionBumpOpen] = useState(false);

    if (!quotation) {
        return <Navigate to="/quotations" replace />;
    }

    const selectedVersion: QuotationVersion =
        quotation.versions.find((v) => v.version === versionNumber) ??
        currentVersion(quotation);
    const isLatest = selectedVersion.version === quotation.currentVersion;
    const isReadOnly = !isLatest || isTerminal(selectedVersion.status);
    const editableItems =
        lineItems && isLatest && !isTerminal(selectedVersion.status)
            ? lineItems
            : selectedVersion.lineItems;

    const totals = versionTotals({
        ...selectedVersion,
        lineItems: editableItems,
    });

    const owner = userById(quotation.ownerId);

    function handleEditAttempt() {
        if (requiresVersionBump(selectedVersion.status)) {
            setVersionBumpOpen(true);
            return;
        }
        push({
            variant: 'info',
            title: 'Editing enabled',
            description: 'You can now modify line items below.',
        });
    }

    function updateItem(itemId: string, patch: Partial<QuotationLineItem>) {
        const base = editableItems.map((li) =>
            li.id === itemId ? { ...li, ...patch } : li,
        );
        setLineItems(base);
    }

    function removeItem(itemId: string) {
        setLineItems(editableItems.filter((li) => li.id !== itemId));
    }

    function addProduct(productId: string) {
        const p = products.find((x) => x.id === productId);
        if (!p) return;
        const newItem: QuotationLineItem = {
            id: `li-new-${Math.random().toString(36).slice(2, 8)}`,
            productId: p.id,
            description: p.name,
            specNotes: '',
            quantity: 1,
            uom: p.uom,
            listPrice: p.listPrice,
            discountPercent: 0,
            taxRate: p.taxRate,
        };
        setLineItems([...editableItems, newItem]);
        setProductPickerOpen(false);
        push({
            variant: 'success',
            title: 'Product added',
            description: p.name,
        });
    }

    return (
        <div className="p-6 md:p-8">
            <button
                type="button"
                onClick={() => navigate('/quotations')}
                className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
            >
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                Back to quotations
            </button>

            {/* Header */}
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-xl font-semibold text-slate-800 md:text-2xl">
                            {quotation.quotationNumber}
                        </h1>
                        <VersionSwitcher
                            quotation={quotation}
                            selected={selectedVersion.version}
                            onChange={(v) => {
                                setVersionNumber(v);
                                setLineItems(null);
                            }}
                        />
                        <StatusBadge status={statusLabel(selectedVersion.status)} />
                        {!isLatest && (
                            <Badge tone="neutral">Historical version</Badge>
                        )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                        {quotation.customerName} · {quotation.companyName} ·{' '}
                        {quotation.projectName} · Owner {owner?.name ?? '—'}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setPdfOpen(true)}
                    >
                        <Printer className="size-4" aria-hidden="true" />
                        PDF preview
                    </Button>
                    {canSend(selectedVersion.status) && isLatest && (
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
                            <DropdownMenuItem onSelect={handleEditAttempt}>
                                <Pencil className="size-4" aria-hidden="true" />
                                Edit line items
                            </DropdownMenuItem>
                            {canApprove(selectedVersion.status) && (
                                <DropdownMenuItem
                                    onSelect={() =>
                                        push({
                                            variant: 'success',
                                            title: 'Quotation approved',
                                            description: quotation.quotationNumber,
                                        })
                                    }
                                >
                                    <ShieldCheck className="size-4" aria-hidden="true" />
                                    Approve
                                </DropdownMenuItem>
                            )}
                            {canReject(selectedVersion.status) && (
                                <DropdownMenuItem
                                    destructive
                                    onSelect={() =>
                                        push({
                                            variant: 'warning',
                                            title: 'Quotation rejected',
                                            description: quotation.quotationNumber,
                                        })
                                    }
                                >
                                    <XCircle className="size-4" aria-hidden="true" />
                                    Reject
                                </DropdownMenuItem>
                            )}
                            {canConvertToOrder(selectedVersion.status) && isLatest && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onSelect={() => {
                                            const orderId = `SO-2026-${String(
                                                Math.floor(Math.random() * 900) + 100,
                                            )}`;
                                            push({
                                                variant: 'success',
                                                title: 'Sales order created',
                                                description: `${orderId} draft generated from ${quotation.quotationNumber}.`,
                                            });
                                            navigate('/orders');
                                        }}
                                    >
                                        <ArrowRight className="size-4" aria-hidden="true" />
                                        Convert to Order
                                    </DropdownMenuItem>
                                </>
                            )}
                            {canClone() && (
                                <DropdownMenuItem
                                    onSelect={() =>
                                        push({
                                            variant: 'info',
                                            title: 'Quotation cloned',
                                            description: `A new draft was created from ${quotation.quotationNumber}.`,
                                        })
                                    }
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
                <Stat label="Subtotal" value={formatINR(totals.subtotal)} />
                <Stat
                    label="Discount"
                    value={`− ${formatINR(totals.discount)}`}
                    valueClassName="text-amber-700"
                />
                <Stat label="Tax" value={formatINR(totals.tax)} />
                <Stat
                    label="Grand total"
                    value={formatINR(totals.grandTotal)}
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
                            ? editableItems.length
                            : t.key === 'approvals'
                                ? selectedVersion.approvals.length
                                : t.key === 'communications'
                                    ? selectedVersion.communications.length
                                    : t.key === 'versions'
                                        ? quotation.versions.length
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
                    items={editableItems}
                    readOnly={isReadOnly}
                    onUpdate={updateItem}
                    onRemove={removeItem}
                    onAdd={() => {
                        if (requiresVersionBump(selectedVersion.status) && isLatest) {
                            setVersionBumpOpen(true);
                            return;
                        }
                        setProductPickerOpen(true);
                    }}
                    totals={totals}
                    freight={selectedVersion.freight}
                    installation={selectedVersion.installationCharge}
                />
            )}

            {tab === 'commercials' && (
                <CommercialsTab version={selectedVersion} readOnly={isReadOnly} />
            )}

            {tab === 'terms' && (
                <TermsTab version={selectedVersion} readOnly={isReadOnly} />
            )}

            {tab === 'approvals' && (
                <ApprovalsTab approvals={selectedVersion.approvals} />
            )}

            {tab === 'communications' && (
                <CommunicationsTab
                    items={selectedVersion.communications}
                    onCompose={() => setSendOpen(true)}
                />
            )}

            {tab === 'versions' && (
                <VersionsTab
                    quotation={quotation}
                    selected={selectedVersion.version}
                    onSelect={(v) => {
                        setVersionNumber(v);
                        setLineItems(null);
                        setTab('line-items');
                    }}
                />
            )}

            {/* Dialogs / drawers */}
            <ProductPickerDialog
                open={productPickerOpen}
                onOpenChange={setProductPickerOpen}
                onPick={addProduct}
            />
            <SendEmailDialog
                open={sendOpen}
                onOpenChange={setSendOpen}
                quotation={quotation}
                version={selectedVersion}
            />
            <VersionBumpDialog
                open={versionBumpOpen}
                onOpenChange={setVersionBumpOpen}
                quotation={quotation}
                version={selectedVersion}
            />
            <PdfPreviewSheet
                open={pdfOpen}
                onOpenChange={setPdfOpen}
                quotation={quotation}
                version={selectedVersion}
                totals={totals}
            />
        </div>
    );
}

/* --------------------------- Version switcher --------------------------- */

function VersionSwitcher({
    quotation,
    selected,
    onChange,
}: {
    quotation: Quotation;
    selected: number;
    onChange: (v: number) => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                    <History className="size-3" aria-hidden="true" />v{selected} of{' '}
                    {quotation.versions.length}
                    <ChevronDown className="size-3" aria-hidden="true" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                <DropdownMenuLabel>Versions</DropdownMenuLabel>
                {[...quotation.versions]
                    .sort((a, b) => b.version - a.version)
                    .map((v) => (
                        <DropdownMenuItem
                            key={v.version}
                            onSelect={() => onChange(v.version)}
                        >
                            <span className="font-semibold">v{v.version}</span>
                            <span className="text-xs text-slate-500">
                                {fmtDate(v.createdAt)}
                            </span>
                            <StatusBadge status={statusLabel(v.status)} />
                        </DropdownMenuItem>
                    ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/* ----------------------------- Line Items ----------------------------- */

function LineItemsTab({
    items,
    readOnly,
    onUpdate,
    onRemove,
    onAdd,
    totals,
    freight,
    installation,
}: {
    items: QuotationLineItem[];
    readOnly: boolean;
    onUpdate: (id: string, patch: Partial<QuotationLineItem>) => void;
    onRemove: (id: string) => void;
    onAdd: () => void;
    totals: ReturnType<typeof versionTotals>;
    freight: number;
    installation: number;
}) {
    return (
        <Card
            title={`Line items (${items.length})`}
            actions={
                !readOnly && (
                    <Button size="sm" onClick={onAdd}>
                        <Plus className="size-4" aria-hidden="true" />
                        Add product
                    </Button>
                )
            }
        >
            {items.length === 0 ? (
                <EmptyState
                    title="No line items"
                    description="Add products from the catalogue to build this quotation."
                />
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-3 py-2 text-left font-semibold">Product</th>
                                <th className="px-3 py-2 text-right font-semibold">Qty</th>
                                <th className="px-3 py-2 text-left font-semibold">UoM</th>
                                <th className="px-3 py-2 text-right font-semibold">List ₹</th>
                                <th className="px-3 py-2 text-right font-semibold">Disc %</th>
                                <th className="px-3 py-2 text-right font-semibold">Net ₹</th>
                                <th className="px-3 py-2 text-right font-semibold">Tax %</th>
                                <th className="px-3 py-2 text-right font-semibold">Total ₹</th>
                                {!readOnly && <th className="px-3 py-2" />}
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((li) => {
                                const t = lineTotals(li);
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
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <CellNumber
                                                value={li.quantity}
                                                readOnly={readOnly}
                                                onChange={(n) =>
                                                    onUpdate(li.id, { quantity: Math.max(1, n) })
                                                }
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-slate-600">{li.uom}</td>
                                        <td className="px-3 py-2 text-right text-slate-600">
                                            {formatINR(li.listPrice)}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <CellNumber
                                                value={li.discountPercent}
                                                readOnly={readOnly}
                                                step={0.5}
                                                onChange={(n) =>
                                                    onUpdate(li.id, {
                                                        discountPercent: Math.min(
                                                            100,
                                                            Math.max(0, n),
                                                        ),
                                                    })
                                                }
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-right text-slate-600">
                                            {formatINR(t.netPrice)}
                                        </td>
                                        <td className="px-3 py-2 text-right text-slate-600">
                                            {li.taxRate}
                                        </td>
                                        <td className="px-3 py-2 text-right font-semibold text-slate-800">
                                            {formatINR(t.total)}
                                        </td>
                                        {!readOnly && (
                                            <td className="px-3 py-2 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => onRemove(li.id)}
                                                    className="text-slate-400 hover:text-red-600"
                                                    aria-label="Remove line"
                                                >
                                                    <Trash2
                                                        className="size-4"
                                                        aria-hidden="true"
                                                    />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="text-sm">
                            <FooterRow label="Subtotal" value={totals.subtotal} />
                            <FooterRow
                                label="Discount"
                                value={-totals.discount}
                                tone="amber"
                            />
                            <FooterRow label="Tax" value={totals.tax} />
                            <FooterRow label="Freight" value={freight} />
                            <FooterRow label="Installation" value={installation} />
                            <FooterRow
                                label="Grand total"
                                value={totals.grandTotal}
                                bold
                            />
                        </tfoot>
                    </table>
                </div>
            )}
        </Card>
    );
}

function CellNumber({
    value,
    readOnly,
    onChange,
    step = 1,
}: {
    value: number;
    readOnly: boolean;
    onChange: (n: number) => void;
    step?: number;
}) {
    if (readOnly) {
        return <span className="text-slate-600">{value}</span>;
    }
    return (
        <input
            type="number"
            inputMode="decimal"
            step={step}
            min={0}
            value={value}
            onChange={(e) => {
                const n = Number(e.target.value);
                if (!Number.isNaN(n)) onChange(n);
            }}
            className="w-20 rounded-md border border-slate-200 px-2 py-1 text-right text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
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
                colSpan={7}
                className={cn(
                    'px-3 py-1.5 text-right text-xs uppercase tracking-wide',
                    bold
                        ? 'text-slate-700 font-semibold'
                        : 'text-slate-500',
                )}
            >
                {label}
            </td>
            <td
                colSpan={2}
                className={cn(
                    'px-3 py-1.5 text-right',
                    tone === 'amber' && 'text-amber-700',
                    bold
                        ? 'text-base font-semibold text-slate-900'
                        : 'text-slate-700',
                )}
            >
                {formatINR(value)}
            </td>
        </tr>
    );
}

/* ---------------------------- Commercials ---------------------------- */

function CommercialsTab({
    version,
    readOnly,
}: {
    version: QuotationVersion;
    readOnly: boolean;
}) {
    return (
        <Card title="Commercial details">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <FormField label="Payment terms">
                    <Textarea
                        defaultValue={version.paymentTerms}
                        rows={2}
                        readOnly={readOnly}
                    />
                </FormField>
                <FormField label="Delivery period">
                    <Input defaultValue={version.deliveryPeriod} readOnly={readOnly} />
                </FormField>
                <FormField label="Warranty">
                    <Input defaultValue={version.warranty} readOnly={readOnly} />
                </FormField>
                <FormField label="Valid until">
                    <Input
                        type="date"
                        defaultValue={version.validUntil.slice(0, 10)}
                        readOnly={readOnly}
                    />
                </FormField>
                <FormField label="Freight (₹)">
                    <Input
                        type="number"
                        defaultValue={version.freight}
                        readOnly={readOnly}
                    />
                </FormField>
                <FormField label="Installation (₹)">
                    <Input
                        type="number"
                        defaultValue={version.installationCharge}
                        readOnly={readOnly}
                    />
                </FormField>
            </div>
            {readOnly && (
                <p className="mt-3 text-xs text-slate-500">
                    Fields are read-only on historical or terminal versions.
                </p>
            )}
        </Card>
    );
}

/* ------------------------------- Terms ------------------------------- */

function TermsTab({
    version,
    readOnly,
}: {
    version: QuotationVersion;
    readOnly: boolean;
}) {
    const [templateId, setTemplateId] = useState(version.termsTemplateId);
    const [body, setBody] = useState(version.termsBody);

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
            <Card title="Template">
                <ul className="space-y-1">
                    {termsTemplates.map((t) => (
                        <li key={t.id}>
                            <button
                                type="button"
                                disabled={readOnly}
                                onClick={() => {
                                    setTemplateId(t.id);
                                    setBody(t.body);
                                }}
                                className={cn(
                                    'w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                                    templateId === t.id
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-slate-600 hover:bg-slate-50',
                                    readOnly && 'cursor-not-allowed opacity-60',
                                )}
                            >
                                {t.name}
                            </button>
                        </li>
                    ))}
                </ul>
                <p className="mt-3 text-xs text-slate-400">
                    Current: {termsTemplateById(templateId)?.name ?? '—'}
                </p>
            </Card>
            <Card title="Terms body">
                <Textarea
                    value={body}
                    rows={16}
                    readOnly={readOnly}
                    onChange={(e) => setBody(e.target.value)}
                    className="font-mono text-xs"
                />
            </Card>
        </div>
    );
}

/* ----------------------------- Approvals ----------------------------- */

function ApprovalsTab({ approvals }: { approvals: QuotationApprovalStep[] }) {
    if (approvals.length === 0) {
        return (
            <EmptyState
                title="No approval chain configured"
                description="Draft quotations can be sent directly without approval."
            />
        );
    }
    const sorted = [...approvals].sort((a, b) => a.order - b.order);
    return (
        <Card title={`Approval chain (${approvals.length})`}>
            <ol className="space-y-3">
                {sorted.map((s, idx) => {
                    const user = userById(s.approverId);
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
                                    s.status === 'approved' && 'bg-emerald-100 text-emerald-700',
                                    s.status === 'pending' && 'bg-amber-100 text-amber-700',
                                    s.status === 'waiting' && 'bg-slate-100 text-slate-500',
                                    s.status === 'rejected' && 'bg-red-100 text-red-700',
                                )}
                            >
                                {s.order}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-slate-800">
                                    {user?.name ?? '—'}{' '}
                                    <span className="text-xs font-normal text-slate-500">
                                        ({s.role})
                                    </span>
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {s.actedAt ? fmtDateTime(s.actedAt) : 'Awaiting action'}
                                </p>
                                {s.remark && (
                                    <p className="mt-1 text-sm text-slate-600">{s.remark}</p>
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

const COMM_ICON = {
    email_sent: Mail,
    email_received: MailCheck,
    acknowledgement: CheckCircle2,
    revision_request: MessageSquare,
    call_note: Phone,
} as const;

function CommunicationsTab({
    items,
    onCompose,
}: {
    items: QuotationCommunication[];
    onCompose: () => void;
}) {
    const sorted = [...items].sort(
        (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
    return (
        <Card
            title={`Communications (${items.length})`}
            actions={
                <Button size="sm" onClick={onCompose}>
                    <Send className="size-4" aria-hidden="true" />
                    Send email
                </Button>
            }
        >
            {items.length === 0 ? (
                <EmptyState
                    title="No communications yet"
                    description="Emails, acknowledgements and revision requests will appear here."
                />
            ) : (
                <ul className="divide-y divide-slate-100">
                    {sorted.map((c) => {
                        const Icon = COMM_ICON[c.type];
                        return (
                            <li key={c.id} className="flex items-start gap-3 py-3">
                                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
                                    <Icon className="size-4" aria-hidden="true" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-slate-800">{c.subject}</p>
                                    <p className="text-xs text-slate-500">
                                        {c.fromName} → {c.toName} · {formatRelative(c.at)}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-600">{c.body}</p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </Card>
    );
}

/* ------------------------------ Versions ----------------------------- */

function VersionsTab({
    quotation,
    selected,
    onSelect,
}: {
    quotation: Quotation;
    selected: number;
    onSelect: (v: number) => void;
}) {
    const sorted = [...quotation.versions].sort((a, b) => b.version - a.version);
    return (
        <Card title={`Versions (${quotation.versions.length})`}>
            <ol className="divide-y divide-slate-100">
                {sorted.map((v) => {
                    const total = versionTotals(v).grandTotal;
                    const isSelected = v.version === selected;
                    const isCurrent = v.version === quotation.currentVersion;
                    return (
                        <li
                            key={v.version}
                            className={cn(
                                'flex items-start gap-3 py-3',
                                isSelected && 'bg-primary/5 -mx-3 px-3 rounded-lg',
                            )}
                        >
                            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                                v{v.version}
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-medium text-slate-800">
                                        v{v.version}
                                    </p>
                                    <StatusBadge status={statusLabel(v.status)} />
                                    {isCurrent && (
                                        <Badge tone="blue">Current</Badge>
                                    )}
                                </div>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Created {fmtDateTime(v.createdAt)} ·{' '}
                                    {userById(v.createdBy)?.name ?? '—'} ·{' '}
                                    {formatINR(total)} · {v.lineItems.length} line items
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                    {v.changesSummary}
                                </p>
                            </div>
                            {!isSelected && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onSelect(v.version)}
                                >
                                    View
                                </Button>
                            )}
                        </li>
                    );
                })}
            </ol>
        </Card>
    );
}

/* --------------------------- Product Picker --------------------------- */

function ProductPickerDialog({
    open,
    onOpenChange,
    onPick,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPick: (productId: string) => void;
}) {
    const [query, setQuery] = useState('');
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return products.slice(0, 10);
        return products
            .filter((p) =>
                `${p.sku} ${p.name} ${p.category}`.toLowerCase().includes(q),
            )
            .slice(0, 20);
    }, [query]);

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                onOpenChange(o);
                if (!o) setQuery('');
            }}
        >
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add product</DialogTitle>
                    <DialogDescription>
                        Search by name, SKU or category.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody>
                    <Input
                        autoFocus
                        placeholder="Search products…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <ul className="mt-3 max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-md border border-slate-200">
                        {filtered.length === 0 ? (
                            <li className="p-4 text-center text-sm text-slate-500">
                                No products match.
                            </li>
                        ) : (
                            filtered.map((p) => (
                                <li key={p.id}>
                                    <button
                                        type="button"
                                        onClick={() => onPick(p.id)}
                                        className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-slate-800">
                                                {p.name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {p.sku} · {p.category}
                                            </p>
                                        </div>
                                        <span className="text-xs font-semibold text-slate-600">
                                            {formatINR(p.listPrice)}
                                        </span>
                                    </button>
                                </li>
                            ))
                        )}
                    </ul>
                </DialogBody>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ---------------------------- Send email ---------------------------- */

function SendEmailDialog({
    open,
    onOpenChange,
    quotation,
    version,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    quotation: Quotation;
    version: QuotationVersion;
}) {
    const { push } = useToast();
    const [to, setTo] = useState('customer@example.com');
    const [cc, setCc] = useState('');
    const [bcc, setBcc] = useState('');
    const [subject, setSubject] = useState(
        `Quotation ${quotation.quotationNumber} v${version.version} — ${quotation.projectName}`,
    );
    const [body, setBody] = useState(
        `Dear ${quotation.customerName.split(' ')[0]},\n\nPlease find attached our quotation for ${quotation.projectName}. This quote is valid until ${fmtDate(version.validUntil)}.\n\nLet us know if you have any questions.\n\nRegards,\n${userById(quotation.ownerId)?.name ?? 'Sales Team'}`,
    );
    const [attachPdf, setAttachPdf] = useState(true);
    const [sending, setSending] = useState(false);

    async function handleSend() {
        setSending(true);
        await new Promise((r) => setTimeout(r, 600));
        setSending(false);
        push({
            variant: 'success',
            title: 'Email sent',
            description: `${quotation.quotationNumber} → ${to}`,
        });
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Send quotation via email</DialogTitle>
                    <DialogDescription>
                        Customer will receive a link to view the quotation online.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody className="space-y-3">
                    <FormField label="To" required>
                        <Input
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            type="email"
                        />
                    </FormField>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="CC">
                            <Input value={cc} onChange={(e) => setCc(e.target.value)} />
                        </FormField>
                        <FormField label="BCC">
                            <Input value={bcc} onChange={(e) => setBcc(e.target.value)} />
                        </FormField>
                    </div>
                    <FormField label="Subject">
                        <Input
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </FormField>
                    <FormField label="Body">
                        <Textarea
                            rows={8}
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                        />
                    </FormField>
                    <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                        <input
                            type="checkbox"
                            checked={attachPdf}
                            onChange={(e) => setAttachPdf(e.target.checked)}
                            className="size-4 rounded border-slate-300"
                        />
                        Attach PDF ({quotation.quotationNumber}_v{version.version}.pdf)
                    </label>
                </DialogBody>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={sending}
                    >
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleSend} disabled={sending || !to}>
                        {sending && (
                            <Loader2
                                className="size-4 animate-spin"
                                aria-hidden="true"
                            />
                        )}
                        <Send className="size-4" aria-hidden="true" />
                        Send
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* --------------------------- Version bump --------------------------- */

function VersionBumpDialog({
    open,
    onOpenChange,
    quotation,
    version,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    quotation: Quotation;
    version: QuotationVersion;
}) {
    const { push } = useToast();
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a new version?</DialogTitle>
                    <DialogDescription>
                        {quotation.quotationNumber} is currently{' '}
                        <strong>{statusLabel(version.status)}</strong> and cannot be
                        edited in place. We&rsquo;ll clone v{version.version} into a new
                        draft version that you can modify.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                        <li>v{version.version + 1} will be created as a Draft.</li>
                        <li>All previous versions remain read-only.</li>
                        <li>Approval chain will reset.</li>
                    </ul>
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
                                title: `v${version.version + 1} created`,
                                description: `${quotation.quotationNumber} new draft is ready to edit.`,
                            });
                            onOpenChange(false);
                        }}
                    >
                        Create v{version.version + 1}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ---------------------------- PDF Preview ---------------------------- */

function PdfPreviewSheet({
    open,
    onOpenChange,
    quotation,
    version,
    totals,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    quotation: Quotation;
    version: QuotationVersion;
    totals: ReturnType<typeof versionTotals>;
}) {
    const { push } = useToast();
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-[42rem]">
                <SheetHeader>
                    <SheetTitle>PDF Preview</SheetTitle>
                    <SheetDescription>
                        {quotation.quotationNumber} · v{version.version}
                    </SheetDescription>
                </SheetHeader>
                <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                            push({
                                variant: 'info',
                                title: 'Download queued',
                                description: `${quotation.quotationNumber}_v${version.version}.pdf`,
                            })
                        }
                    >
                        <Download className="size-4" aria-hidden="true" />
                        Download
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.print()}
                    >
                        <Printer className="size-4" aria-hidden="true" />
                        Print
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto bg-slate-100 p-4">
                    <div className="mx-auto max-w-[640px] rounded-lg bg-white p-6 shadow-sm">
                        {/* PDF content */}
                        <div className="mb-4 flex items-start justify-between border-b border-slate-200 pb-3">
                            <div>
                                <p className="text-lg font-semibold text-slate-800">
                                    Pump Traders Pvt. Ltd.
                                </p>
                                <p className="text-xs text-slate-500">
                                    GST: 24ABCDE1234F1Z5 · Surat, Gujarat
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold">Quotation</p>
                                <p className="text-xs text-slate-500">
                                    {quotation.quotationNumber} · v{version.version}
                                </p>
                                <p className="text-xs text-slate-500">
                                    Dated {fmtDate(version.createdAt)}
                                </p>
                            </div>
                        </div>
                        <div className="mb-4 grid grid-cols-2 gap-4 text-xs">
                            <div>
                                <p className="font-semibold text-slate-500 uppercase">To</p>
                                <p className="font-medium text-slate-800">
                                    {quotation.customerName}
                                </p>
                                <p className="text-slate-600">{quotation.companyName}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-slate-500 uppercase">
                                    Project
                                </p>
                                <p className="text-slate-800">{quotation.projectName}</p>
                                <p className="text-slate-600">
                                    Valid until {fmtDate(version.validUntil)}
                                </p>
                            </div>
                        </div>
                        <table className="mb-4 w-full text-xs">
                            <thead className="bg-slate-100 text-left">
                                <tr>
                                    <th className="px-2 py-1">#</th>
                                    <th className="px-2 py-1">Description</th>
                                    <th className="px-2 py-1 text-right">Qty</th>
                                    <th className="px-2 py-1 text-right">Rate</th>
                                    <th className="px-2 py-1 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {version.lineItems.map((li, idx) => {
                                    const t = lineTotals(li);
                                    return (
                                        <tr
                                            key={li.id}
                                            className="border-b border-slate-100"
                                        >
                                            <td className="px-2 py-1">{idx + 1}</td>
                                            <td className="px-2 py-1">
                                                {li.description}
                                                {li.specNotes && (
                                                    <p className="text-[10px] text-slate-500">
                                                        {li.specNotes}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-2 py-1 text-right">
                                                {li.quantity} {li.uom}
                                            </td>
                                            <td className="px-2 py-1 text-right">
                                                {formatINR(li.listPrice)}
                                            </td>
                                            <td className="px-2 py-1 text-right">
                                                {formatINR(t.total)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div className="ml-auto w-64 space-y-1 text-xs">
                            <Row label="Subtotal" value={formatINR(totals.subtotal)} />
                            <Row
                                label="Discount"
                                value={`− ${formatINR(totals.discount)}`}
                            />
                            <Row label="Tax" value={formatINR(totals.tax)} />
                            <Row label="Freight" value={formatINR(totals.freight)} />
                            <Row
                                label="Installation"
                                value={formatINR(totals.installation)}
                            />
                            <div className="border-t border-slate-200 pt-1">
                                <Row
                                    label="Grand Total"
                                    value={formatINR(totals.grandTotal)}
                                    bold
                                />
                            </div>
                        </div>
                        <div className="mt-6 border-t border-slate-200 pt-3">
                            <p className="text-xs font-semibold text-slate-500 uppercase">
                                Terms & Conditions
                            </p>
                            <pre className="mt-1 whitespace-pre-wrap font-sans text-[11px] text-slate-600">
                                {version.termsBody}
                            </pre>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function Row({
    label,
    value,
    bold,
}: {
    label: string;
    value: string;
    bold?: boolean;
}) {
    return (
        <div
            className={cn(
                'flex items-center justify-between',
                bold && 'text-sm font-semibold text-slate-900',
            )}
        >
            <span className="text-slate-500">{label}</span>
            <span>{value}</span>
        </div>
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
