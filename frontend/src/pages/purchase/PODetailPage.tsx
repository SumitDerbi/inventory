import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { formatINR, formatRelative } from '@/lib/format';
import {
    poById,
    PO_STAGES,
    PO_STAGE_LABEL,
    PO_STAGE_TONE,
    poTotals,
    type POItem,
    type POAmendment,
} from '@/mocks/purchase-orders';
import { vendorById } from '@/mocks/vendors';
import { warehouseById } from '@/mocks/warehouses';
import { grnsByPo, GRN_STAGE_LABEL, GRN_STAGE_TONE } from '@/mocks/grns';
import { vendorInvoices, INVOICE_STATUS_LABEL, INVOICE_STATUS_TONE } from '@/mocks/vendor-invoices';

type Tab = 'items' | 'schedule' | 'amendments' | 'grns' | 'invoices' | 'activity' | 'notes';
const TABS: Array<{ id: Tab; label: string }> = [
    { id: 'items', label: 'Items' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'amendments', label: 'Amendments' },
    { id: 'grns', label: 'GRNs' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'activity', label: 'Activity' },
    { id: 'notes', label: 'Notes' },
];

export default function PODetailPage() {
    const { id = '' } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { push } = useToast();
    const po = poById(id);
    const [tab, setTab] = useState<Tab>('items');

    const totals = useMemo(() => (po ? poTotals(po) : null), [po]);
    const linkedGrns = useMemo(() => (po ? grnsByPo(po.id) : []), [po]);
    const linkedInvoices = useMemo(
        () => (po ? vendorInvoices.filter((i) => i.poId === po.id) : []),
        [po],
    );

    if (!po || !totals) {
        return (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
                Purchase order not found.
                <div className="mt-3">
                    <Button variant="outline" onClick={() => navigate('/purchase')}>Back</Button>
                </div>
            </div>
        );
    }

    const v = vendorById(po.vendorId);
    const wh = warehouseById(po.warehouseId);
    const stageIdx = PO_STAGES.indexOf(po.stage);

    return (
        <>
            <PageHeader
                title={po.number}
                description={`${v?.name ?? '—'} · ${po.currency} ${po.currency !== 'INR' ? `@ ₹${po.exchangeRate}` : ''}`}
                breadcrumb={[
                    { label: 'Procurement', href: '/purchase' },
                    { label: 'Purchase orders', href: '/purchase' },
                    { label: po.number },
                ]}
                actions={
                    <>
                        <Button variant="outline" size="sm" onClick={() => navigate('/purchase')}>
                            <ArrowLeft className="size-4" aria-hidden="true" />
                            Back
                        </Button>
                        {po.stage === 'pending_approval' && (
                            <Button size="sm" onClick={() => push({ variant: 'success', title: 'PO approved (mock)' })}>
                                Approve
                            </Button>
                        )}
                        {po.stage === 'approved' && (
                            <Button size="sm" onClick={() => push({ variant: 'success', title: 'Sent to vendor (mock)' })}>
                                Send to vendor
                            </Button>
                        )}
                    </>
                }
            />

            {/* Stage stepper */}
            <ol aria-label="PO stage" className="mb-4 flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-3 text-xs">
                {PO_STAGES.map((s, i) => {
                    const done = i < stageIdx;
                    const current = i === stageIdx;
                    return (
                        <li key={s} className="flex items-center gap-1">
                            <span
                                className={cn(
                                    'rounded-full px-2 py-1 font-medium',
                                    done && 'bg-emerald-100 text-emerald-700',
                                    current && 'bg-primary text-white',
                                    !done && !current && 'bg-slate-100 text-slate-500',
                                )}
                            >
                                {PO_STAGE_LABEL[s]}
                            </span>
                            {i < PO_STAGES.length - 1 && <span className="text-slate-300">→</span>}
                        </li>
                    );
                })}
            </ol>

            <section className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-4">
                <KV label="Stage" value={<Badge tone={PO_STAGE_TONE[po.stage]}>{PO_STAGE_LABEL[po.stage]}</Badge>} />
                <KV label="PO date" value={<span className="text-sm">{formatRelative(po.poDate)}</span>} />
                <KV label="Expected" value={<span className="text-sm">{formatRelative(po.expectedDeliveryDate)}</span>} />
                <KV label="Warehouse" value={<span className="text-sm">{wh?.name ?? '—'}</span>} />
                <KV label="Payment terms" value={<span className="text-sm">{po.paymentTermsDays} days</span>} />
                <KV label="Incoterm" value={<span className="text-sm">{po.incoterm}</span>} />
                <KV label="Place of supply" value={<span className="text-sm">{po.placeOfSupply}</span>} />
                <KV label="Tax" value={<span className="text-sm">{po.isInterstate ? 'IGST (interstate)' : 'CGST + SGST'}</span>} />
            </section>

            <div role="tablist" aria-label="PO sections" className="mb-4 flex flex-wrap gap-1 border-b border-slate-200">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        role="tab"
                        aria-selected={tab === t.id}
                        onClick={() => setTab(t.id)}
                        className={cn(
                            'relative px-3 py-2 text-sm font-medium transition-colors',
                            tab === t.id ? 'text-primary' : 'text-slate-500 hover:text-slate-700',
                        )}
                    >
                        {t.label}
                        {tab === t.id && (
                            <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
                        )}
                    </button>
                ))}
            </div>

            {tab === 'items' && <ItemsTable items={po.items} currency={po.currency} totals={totals} freight={po.freight} other={po.otherCharges} discount={po.discount} isInterstate={po.isInterstate} />}
            {tab === 'schedule' && <ScheduleTable po={po} />}
            {tab === 'amendments' && <AmendmentsList items={po.amendments} />}
            {tab === 'grns' && (
                <DataTable
                    columns={[
                        { key: 'num', header: 'GRN #', cell: (g) => <span className="font-mono text-sm">{g.number}</span> },
                        { key: 'date', header: 'Received', cell: (g) => <span className="text-xs text-slate-500">{formatRelative(g.receivedAt)}</span> },
                        { key: 'stage', header: 'Stage', cell: (g) => <Badge tone={GRN_STAGE_TONE[g.stage]}>{GRN_STAGE_LABEL[g.stage]}</Badge> },
                    ]}
                    rows={linkedGrns}
                    rowKey={(g) => g.id}
                    onRowClick={(g) => navigate(`/purchase/grns/${g.id}`)}
                    emptyState={<EmptyMsg msg="No GRNs against this PO yet." />}
                />
            )}
            {tab === 'invoices' && (
                <DataTable
                    columns={[
                        { key: 'ref', header: 'Internal ref', cell: (i) => <span className="font-mono text-sm">{i.internalRef}</span> },
                        { key: 'num', header: 'Vendor invoice', cell: (i) => <span className="text-sm">{i.number}</span> },
                        { key: 'date', header: 'Invoice date', cell: (i) => <span className="text-xs text-slate-500">{formatRelative(i.invoiceDate)}</span> },
                        { key: 'status', header: 'Status', cell: (i) => <Badge tone={INVOICE_STATUS_TONE[i.status]}>{INVOICE_STATUS_LABEL[i.status]}</Badge> },
                    ]}
                    rows={linkedInvoices}
                    rowKey={(i) => i.id}
                    onRowClick={(i) => navigate(`/purchase/invoices/${i.id}`)}
                    emptyState={<EmptyMsg msg="No invoices booked against this PO." />}
                />
            )}
            {tab === 'activity' && (
                po.amendments.length === 0 ? (
                    <EmptyMsg msg="No activity recorded." />
                ) : (
                    <ol className="space-y-2">
                        {po.amendments.map((a) => (
                            <li key={a.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
                                <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                                <div className="flex-1">
                                    <p className="text-slate-700">{a.summary}</p>
                                    <p className="text-xs text-slate-500">{a.by} · {formatRelative(a.at)}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                )
            )}
            {tab === 'notes' && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                    {po.notes || <span className="italic text-slate-400">No notes.</span>}
                </div>
            )}
        </>
    );
}

function ItemsTable({
    items,
    currency,
    totals,
    freight,
    other,
    discount,
    isInterstate,
}: {
    items: POItem[];
    currency: string;
    totals: ReturnType<typeof poTotals>;
    freight: number;
    other: number;
    discount: number;
    isInterstate: boolean;
}) {
    const cols: DataTableColumn<POItem>[] = [
        { key: 'sku', header: 'SKU', cell: (i) => <span className="font-mono text-xs">{i.sku}</span> },
        { key: 'desc', header: 'Description', cell: (i) => <span className="text-sm text-slate-700">{i.description}</span> },
        { key: 'qty', header: 'Qty', align: 'right', cell: (i) => <span className="text-sm">{i.qty} {i.uom}</span> },
        { key: 'recv', header: 'Received', align: 'right', cell: (i) => <span className="text-sm">{i.receivedQty}</span> },
        { key: 'rate', header: 'Rate', align: 'right', cell: (i) => <span className="text-sm">{currency} {i.unitPrice.toLocaleString('en-IN')}</span> },
        { key: 'gst', header: 'GST', align: 'right', cell: (i) => <span className="text-xs text-slate-500">{i.gstPct}%</span> },
        {
            key: 'val',
            header: 'Line value',
            align: 'right',
            cell: (i) => {
                const line = i.qty * i.unitPrice * (1 - i.discountPct / 100);
                return <span className="text-sm font-medium">{currency} {line.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>;
            },
        },
    ];
    return (
        <>
            <DataTable columns={cols} rows={items} rowKey={(i) => i.id} className="mb-4" />
            <div className="ml-auto w-full max-w-sm space-y-1.5 rounded-xl border border-slate-200 bg-white p-4 text-sm">
                <Row label="Subtotal" value={`${currency} ${totals.subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
                {discount > 0 && <Row label="Discount" value={`− ${currency} ${discount.toLocaleString('en-IN')}`} />}
                {freight > 0 && <Row label="Freight" value={`${currency} ${freight.toLocaleString('en-IN')}`} />}
                {other > 0 && <Row label="Other charges" value={`${currency} ${other.toLocaleString('en-IN')}`} />}
                {isInterstate ? (
                    <Row label="IGST" value={`${currency} ${totals.igst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
                ) : (
                    <>
                        <Row label="CGST" value={`${currency} ${totals.cgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
                        <Row label="SGST" value={`${currency} ${totals.sgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
                    </>
                )}
                <div className="my-1 border-t border-slate-200" />
                <Row label="Grand total" value={<span className="font-semibold">{currency} {totals.grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>} bold />
                {currency !== 'INR' && (
                    <Row label="In INR" value={<span className="text-xs text-slate-500">{formatINR(totals.grandTotalBaseCurrency)}</span>} />
                )}
            </div>
        </>
    );
}

function ScheduleTable({ po }: { po: NonNullable<ReturnType<typeof poById>> }) {
    const cols: DataTableColumn<typeof po.schedule[number]>[] = [
        { key: 'item', header: 'PO item', cell: (s) => <span className="font-mono text-xs">{po.items.find((i) => i.id === s.poItemId)?.sku ?? s.poItemId}</span> },
        { key: 'qty', header: 'Qty', align: 'right', cell: (s) => <span className="text-sm">{s.qty}</span> },
        { key: 'date', header: 'Expected', cell: (s) => <span className="text-xs text-slate-500">{formatRelative(s.expectedDate)}</span> },
        {
            key: 'status',
            header: 'Status',
            cell: (s) => {
                const tone = s.status === 'completed' ? 'emerald' : s.status === 'partial' ? 'amber' : s.status === 'late' ? 'red' : 'neutral';
                return <Badge tone={tone} className="capitalize">{s.status}</Badge>;
            },
        },
    ];
    return <DataTable columns={cols} rows={po.schedule} rowKey={(s) => s.id} emptyState={<EmptyMsg msg="No delivery schedule entries." />} />;
}

function AmendmentsList({ items }: { items: POAmendment[] }) {
    if (!items.length) return <EmptyMsg msg="No amendments." />;
    return (
        <ol className="space-y-2">
            {items.map((a) => (
                <li key={a.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                    <p className="text-slate-700">{a.summary}</p>
                    <p className="text-xs text-slate-500">{a.by} · {formatRelative(a.at)}</p>
                </li>
            ))}
        </ol>
    );
}

function Row({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <span className={cn('text-slate-500', bold && 'font-semibold text-slate-700')}>{label}</span>
            <span className={cn('text-slate-700', bold && 'font-semibold')}>{value}</span>
        </div>
    );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
            <dd className="mt-1">{value}</dd>
        </div>
    );
}

function EmptyMsg({ msg }: { msg: string }) {
    return (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">{msg}</div>
    );
}
