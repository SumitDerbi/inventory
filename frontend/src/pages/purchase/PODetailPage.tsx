import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Mail, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { useToast } from '@/components/ui/Toast';
import { AuditDrawer, AuditTriggerButton } from '@/components/ui/AuditDrawer';
import { mockActivity } from '@/mocks/activity';
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/Sheet';
import { FormField, Input, Textarea } from '@/components/ui/FormField';
import { cn } from '@/lib/cn';
import { formatINR, formatMoney, formatRelative } from '@/lib/format';
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
    const [auditOpen, setAuditOpen] = useState(false);
    const [amendOpen, setAmendOpen] = useState(false);
    const [amendSummary, setAmendSummary] = useState('');
    const [pdfOpen, setPdfOpen] = useState(false);
    const [sendOpen, setSendOpen] = useState(false);
    const [sendSubject, setSendSubject] = useState('');
    const [sendRecipients, setSendRecipients] = useState('');
    const [sendCc, setSendCc] = useState('');
    const [sendBody, setSendBody] = useState('');

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
                        <AuditTriggerButton onClick={() => setAuditOpen(true)} />
                        <Button variant="outline" size="sm" onClick={() => setPdfOpen(true)}>
                            <FileText className="size-4" aria-hidden="true" />
                            PDF preview
                        </Button>
                        {po.stage === 'pending_approval' && (
                            <Button size="sm" onClick={() => push({ variant: 'success', title: 'PO approved (mock)' })}>
                                Approve
                            </Button>
                        )}
                        {po.stage === 'approved' && (
                            <Button
                                size="sm"
                                onClick={() => {
                                    setSendSubject(`${po.number} — purchase order`);
                                    setSendRecipients(v?.contacts.find((c) => c.isPrimary)?.email ?? '');
                                    setSendCc('');
                                    setSendBody(`Dear ${v?.name ?? 'vendor'},\n\nPlease find attached purchase order ${po.number} for delivery by ${po.expectedDeliveryDate}.\n\nRegards,\nProcurement team`);
                                    setSendOpen(true);
                                }}
                            >
                                <Mail className="size-4" aria-hidden="true" />
                                Send to vendor
                            </Button>
                        )}
                        {(po.stage === 'sent' || po.stage === 'partially_received' || po.stage === 'received') && (
                            <Button variant="outline" size="sm" onClick={() => { setAmendSummary(''); setAmendOpen(true); }}>
                                <Pencil className="size-4" aria-hidden="true" />
                                Amend
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

            {/* Amendment dialog */}
            <Dialog open={amendOpen} onOpenChange={setAmendOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Amend purchase order</DialogTitle>
                        <DialogDescription>
                            Submitting an amendment freezes this PO and routes it for re-approval. Vendor will be notified.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        <FormField label="Summary of changes">
                            <Textarea rows={4} value={amendSummary} onChange={(e) => setAmendSummary(e.target.value)} placeholder="e.g. Updated qty on line 2 from 10 to 12 EA" />
                        </FormField>
                        <p className="text-xs text-slate-500">In a fully-wired flow a side-by-side diff editor of items / qty / price would render here.</p>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAmendOpen(false)}>Cancel</Button>
                        <Button
                            disabled={!amendSummary.trim()}
                            onClick={() => {
                                setAmendOpen(false);
                                push({ variant: 'warning', title: 'Amendment submitted (mock)', description: 'PO frozen until re-approval.' });
                            }}
                        >
                            Submit amendment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* PDF preview drawer */}
            <Sheet open={pdfOpen} onOpenChange={setPdfOpen}>
                <SheetContent className="w-[640px] max-w-[95vw]" side="right">
                    <SheetHeader>
                        <SheetTitle>{po.number} — PDF preview</SheetTitle>
                        <SheetDescription>Mock preview. The real PDF is generated server-side from the po_send template.</SheetDescription>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto p-6 print:p-0">
                        <div className="rounded-xl border border-slate-300 bg-white p-6 text-sm shadow">
                            <h2 className="text-lg font-semibold">PURCHASE ORDER</h2>
                            <p className="mt-1 font-mono text-xs text-slate-500">{po.number}</p>
                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs uppercase text-slate-400">Vendor</p>
                                    <p className="font-medium">{v?.name}</p>
                                    <p className="text-xs text-slate-500">{v?.gstin}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase text-slate-400">Ship to</p>
                                    <p className="font-medium">{wh?.name}</p>
                                </div>
                            </div>
                            <table className="mt-4 w-full text-xs">
                                <thead className="border-b border-slate-300 text-left text-slate-500">
                                    <tr><th className="py-1">Item</th><th className="py-1 text-right">Qty</th><th className="py-1 text-right">Rate</th><th className="py-1 text-right">Value</th></tr>
                                </thead>
                                <tbody>
                                    {po.items.map((it) => (
                                        <tr key={it.id} className="border-b border-slate-100">
                                            <td className="py-1">{it.sku} — {it.description}</td>
                                            <td className="py-1 text-right">{it.qty} {it.uom}</td>
                                            <td className="py-1 text-right">{formatMoney(it.unitPrice, po.currency)}</td>
                                            <td className="py-1 text-right">{formatMoney(it.qty * it.unitPrice * (1 - it.discountPct / 100), po.currency)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <p className="mt-4 text-right font-semibold">Grand total: {formatMoney(totals.grandTotal, po.currency)}</p>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Send-to-vendor dialog */}
            <Dialog open={sendOpen} onOpenChange={setSendOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send PO to vendor</DialogTitle>
                        <DialogDescription>Uses the po_send email template. PDF auto-attached.</DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        <FormField label="Recipients">
                            <Input value={sendRecipients} onChange={(e) => setSendRecipients(e.target.value)} placeholder="vendor@example.com" />
                        </FormField>
                        <FormField label="CC">
                            <Input value={sendCc} onChange={(e) => setSendCc(e.target.value)} placeholder="finance@yourco.com" />
                        </FormField>
                        <FormField label="Subject">
                            <Input value={sendSubject} onChange={(e) => setSendSubject(e.target.value)} />
                        </FormField>
                        <FormField label="Body">
                            <Textarea rows={6} value={sendBody} onChange={(e) => setSendBody(e.target.value)} />
                        </FormField>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSendOpen(false)}>Cancel</Button>
                        <Button
                            onClick={() => {
                                setSendOpen(false);
                                push({ variant: 'success', title: 'PO sent (mock)', description: sendRecipients || '—' });
                            }}
                        >
                            Send
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AuditDrawer
                open={auditOpen}
                onOpenChange={setAuditOpen}
                title={`${po.number} · activity`}
                entries={mockActivity(po.id, 'PO')}
            />
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
        {
            key: 'recv',
            header: 'Received',
            align: 'right',
            cell: (i) => {
                const pending = i.qty - i.receivedQty;
                return (
                    <div className="flex flex-col items-end">
                        <span className="text-sm">{i.receivedQty} / {i.qty}</span>
                        {pending > 0 ? (
                            <Badge tone="amber" className="mt-0.5 text-[10px]">Pending {pending}</Badge>
                        ) : (
                            <Badge tone="emerald" className="mt-0.5 text-[10px]">Complete</Badge>
                        )}
                    </div>
                );
            },
        },
        { key: 'rate', header: 'Rate', align: 'right', cell: (i) => <span className="text-sm">{formatMoney(i.unitPrice, currency)}</span> },
        { key: 'gst', header: 'GST', align: 'right', cell: (i) => <span className="text-xs text-slate-500">{i.gstPct}%</span> },
        {
            key: 'val',
            header: 'Line value',
            align: 'right',
            cell: (i) => {
                const line = i.qty * i.unitPrice * (1 - i.discountPct / 100);
                return <span className="text-sm font-medium">{formatMoney(line, currency)}</span>;
            },
        },
    ];
    return (
        <>
            <DataTable columns={cols} rows={items} rowKey={(i) => i.id} className="mb-4" />
            <div className="ml-auto w-full max-w-sm space-y-1.5 rounded-xl border border-slate-200 bg-white p-4 text-sm">
                <Row label="Subtotal" value={formatMoney(totals.subtotal, currency)} />
                {discount > 0 && <Row label="Discount" value={`− ${formatMoney(discount, currency)}`} />}
                {freight > 0 && <Row label="Freight" value={formatMoney(freight, currency)} />}
                {other > 0 && <Row label="Other charges" value={formatMoney(other, currency)} />}
                {isInterstate ? (
                    <Row label="IGST" value={formatMoney(totals.igst, currency)} />
                ) : (
                    <>
                        <Row label="CGST" value={formatMoney(totals.cgst, currency)} />
                        <Row label="SGST" value={formatMoney(totals.sgst, currency)} />
                    </>
                )}
                <div className="my-1 border-t border-slate-200" />
                <Row label="Grand total" value={<span className="font-semibold">{formatMoney(totals.grandTotal, currency)}</span>} bold />
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
