import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { FormField, Textarea } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { formatINR, formatRelative } from '@/lib/format';
import {
    invoiceById,
    INVOICE_STATUS_LABEL,
    INVOICE_STATUS_TONE,
    invoiceTotal,
    invoiceOutstanding,
    invoiceTds,
    invoiceLineTotal,
    type VendorInvoiceItem,
} from '@/mocks/vendor-invoices';
import { vendorById } from '@/mocks/vendors';
import { poById } from '@/mocks/purchase-orders';
import { vendorPayments, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_TONE, PAYMENT_MODE_LABEL } from '@/mocks/vendor-payments';

type Tab = 'lines' | 'match' | 'tax' | 'payments';
const TABS: Array<{ id: Tab; label: string }> = [
    { id: 'lines', label: 'Lines' },
    { id: 'match', label: '3-way match' },
    { id: 'tax', label: 'Tax & TDS' },
    { id: 'payments', label: 'Payments' },
];

export default function VendorInvoiceDetailPage() {
    const { id = '' } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { push } = useToast();
    const inv = invoiceById(id);
    const [tab, setTab] = useState<Tab>('lines');
    const [overrideOpen, setOverrideOpen] = useState(false);
    const [overrideReason, setOverrideReason] = useState('');

    const linkedPayments = useMemo(
        () => (inv ? vendorPayments.filter((p) => p.invoiceIds.includes(inv.id)) : []),
        [inv],
    );

    if (!inv) {
        return (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
                Invoice not found.
                <div className="mt-3">
                    <Button variant="outline" onClick={() => navigate('/purchase/invoices')}>Back</Button>
                </div>
            </div>
        );
    }

    const v = vendorById(inv.vendorId);
    const po = inv.poId ? poById(inv.poId) : undefined;
    const total = invoiceTotal(inv);
    const tds = invoiceTds(inv);
    const outstanding = invoiceOutstanding(inv);
    const hasMismatch = inv.status === 'mismatch' || (inv.variances ?? []).length > 0;

    return (
        <>
            <PageHeader
                title={inv.internalRef}
                description={`${v?.name ?? '—'} · vendor invoice ${inv.number}`}
                breadcrumb={[
                    { label: 'Procurement', href: '/purchase' },
                    { label: 'Invoices', href: '/purchase/invoices' },
                    { label: inv.internalRef },
                ]}
                actions={
                    <>
                        <Button variant="outline" size="sm" onClick={() => navigate('/purchase/invoices')}>
                            <ArrowLeft className="size-4" aria-hidden="true" />
                            Back
                        </Button>
                        {hasMismatch && inv.status !== 'paid' && (
                            <Button variant="outline" size="sm" onClick={() => setOverrideOpen(true)}>
                                Override match
                            </Button>
                        )}
                        {inv.status === 'matched' && (
                            <Button size="sm" onClick={() => push({ variant: 'success', title: 'Approved for payment (mock)' })}>
                                Approve
                            </Button>
                        )}
                    </>
                }
            />

            <section className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-4">
                <KV label="Status" value={<Badge tone={INVOICE_STATUS_TONE[inv.status]}>{INVOICE_STATUS_LABEL[inv.status]}</Badge>} />
                <KV label="Invoice date" value={<span className="text-sm">{formatRelative(inv.invoiceDate)}</span>} />
                <KV label="Due date" value={<span className="text-sm">{formatRelative(inv.dueDate)}</span>} />
                <KV label="Linked PO" value={<span className="text-sm">{po?.number ?? '—'}</span>} />
                <KV label="Total" value={<span className="text-sm font-semibold">{formatINR(total)}</span>} />
                <KV label="TDS" value={<span className="text-sm">{formatINR(tds)}</span>} />
                <KV label="Paid" value={<span className="text-sm">{formatINR(total - outstanding)}</span>} />
                <KV label="Outstanding" value={<span className="text-sm font-semibold text-amber-700">{formatINR(outstanding)}</span>} />
            </section>

            {inv.matchOverride && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <div>
                        <p className="font-semibold">Match overridden</p>
                        <p>{inv.matchOverride.reason} — by {inv.matchOverride.by} on {formatRelative(inv.matchOverride.at)}</p>
                    </div>
                </div>
            )}

            <div role="tablist" aria-label="Invoice sections" className="mb-4 flex flex-wrap gap-1 border-b border-slate-200">
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

            {tab === 'lines' && <LinesTable items={inv.items} />}
            {tab === 'match' && <MatchPanel items={inv.items} variances={inv.variances ?? []} />}
            {tab === 'tax' && <TaxPanel inv={inv} />}
            {tab === 'payments' && (
                linkedPayments.length === 0 ? (
                    <EmptyMsg msg="No payments recorded against this invoice." />
                ) : (
                    <ul className="space-y-2">
                        {linkedPayments.map((p) => (
                            <li key={p.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-sm">
                                <div>
                                    <p className="font-mono font-semibold text-slate-800">{p.number}</p>
                                    <p className="text-xs text-slate-500">{PAYMENT_MODE_LABEL[p.mode]} · {formatRelative(p.paymentDate)}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-semibold">{formatINR(p.amount)}</span>
                                    <Badge tone={PAYMENT_STATUS_TONE[p.status]}>{PAYMENT_STATUS_LABEL[p.status]}</Badge>
                                </div>
                            </li>
                        ))}
                    </ul>
                )
            )}

            <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Override match</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <FormField label="Reason" required>
                            <Textarea
                                rows={3}
                                value={overrideReason}
                                onChange={(e) => setOverrideReason(e.target.value)}
                                placeholder="Explain why this mismatch is acceptable…"
                            />
                        </FormField>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setOverrideOpen(false)}>Cancel</Button>
                        <Button
                            disabled={!overrideReason.trim()}
                            onClick={() => {
                                setOverrideOpen(false);
                                setOverrideReason('');
                                push({ variant: 'success', title: 'Match overridden (mock)' });
                            }}
                        >
                            Submit override
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function LinesTable({ items }: { items: VendorInvoiceItem[] }) {
    return (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                        <th scope="col" className="px-4 py-3 text-left font-semibold">SKU</th>
                        <th scope="col" className="px-4 py-3 text-left font-semibold">Description</th>
                        <th scope="col" className="px-4 py-3 text-right font-semibold">Qty</th>
                        <th scope="col" className="px-4 py-3 text-right font-semibold">Rate</th>
                        <th scope="col" className="px-4 py-3 text-right font-semibold">GST</th>
                        <th scope="col" className="px-4 py-3 text-right font-semibold">Line value</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((it) => (
                        <tr key={it.id} className="border-t border-slate-100">
                            <td className="px-4 py-3 font-mono text-xs">{it.sku}</td>
                            <td className="px-4 py-3 text-slate-700">{it.description}</td>
                            <td className="px-4 py-3 text-right">{it.qty} {it.uom}</td>
                            <td className="px-4 py-3 text-right">{formatINR(it.unitPrice)}</td>
                            <td className="px-4 py-3 text-right text-xs text-slate-500">{it.gstPct}%</td>
                            <td className="px-4 py-3 text-right font-medium">{formatINR(invoiceLineTotal(it))}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function MatchPanel({
    items,
    variances,
}: {
    items: VendorInvoiceItem[];
    variances: NonNullable<NonNullable<ReturnType<typeof invoiceById>>['variances']>;
}) {
    return (
        <>
            <div className="mb-3 grid gap-3 lg:grid-cols-3">
                <PaneHeader label="PO line" />
                <PaneHeader label="GRN line" />
                <PaneHeader label="Invoice line" />
            </div>
            <div className="space-y-3">
                {items.map((it) => {
                    const poRate = it.poUnitPrice ?? null;
                    const grnQty = it.grnAcceptedQty ?? null;
                    const rateDelta = poRate != null && Math.abs(poRate - it.unitPrice) > 0.001;
                    const qtyDelta = grnQty != null && Math.abs(grnQty - it.qty) > 0.001;
                    return (
                        <article key={it.id} className="rounded-xl border border-slate-200 bg-white p-3">
                            <div className="mb-2 flex items-center justify-between">
                                <p className="font-mono text-xs text-slate-500">{it.sku}</p>
                                <p className="text-sm font-medium text-slate-700">{it.description}</p>
                            </div>
                            <div className="grid gap-3 lg:grid-cols-3">
                                <Cell label="PO" qty="—" rate={poRate != null ? formatINR(poRate) : '—'} />
                                <Cell label="GRN" qty={grnQty != null ? `${grnQty} ${it.uom}` : '—'} rate="—" />
                                <Cell
                                    label="Invoice"
                                    qty={
                                        <span className={cn(qtyDelta && 'font-semibold text-red-600')}>
                                            {it.qty} {it.uom}
                                        </span>
                                    }
                                    rate={
                                        <span className={cn(rateDelta && 'font-semibold text-red-600')}>
                                            {formatINR(it.unitPrice)}
                                        </span>
                                    }
                                />
                            </div>
                        </article>
                    );
                })}
            </div>

            <h4 className="mt-6 mb-2 text-sm font-semibold text-slate-700">Variance summary</h4>
            {variances.length === 0 ? (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    No variances detected — ready to approve.
                </div>
            ) : (
                <ul className="space-y-2">
                    {variances.map((v, idx) => (
                        <li
                            key={idx}
                            className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
                        >
                            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            <div>
                                <p className="font-semibold capitalize">{v.field} variance</p>
                                <p>
                                    Invoice {v.invoiceValue.toLocaleString('en-IN')} vs expected {v.expectedValue.toLocaleString('en-IN')}{' '}
                                    (Δ {v.variance > 0 ? '+' : ''}{v.variance.toLocaleString('en-IN')})
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}

function TaxPanel({ inv }: { inv: NonNullable<ReturnType<typeof invoiceById>> }) {
    const t = invoiceTotal(inv);
    const tds = invoiceTds(inv);
    const taxableSubtotal = inv.items.reduce((s, it) => s + it.qty * it.unitPrice * (1 - it.discountPct / 100), 0);
    const gstTotal = inv.items.reduce((s, it) => {
        const net = it.qty * it.unitPrice * (1 - it.discountPct / 100);
        return s + net * (it.gstPct / 100);
    }, 0);
    return (
        <div className="grid gap-3 lg:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Tax breakdown</h4>
                <dl className="space-y-1.5">
                    <Row label="Taxable subtotal" value={formatINR(taxableSubtotal)} />
                    <Row label="GST (sum)" value={formatINR(gstTotal)} />
                    {inv.freight > 0 && <Row label="Freight" value={formatINR(inv.freight)} />}
                    {inv.otherCharges > 0 && <Row label="Other charges" value={formatINR(inv.otherCharges)} />}
                    <div className="my-1 border-t border-slate-200" />
                    <Row label="Grand total" value={<span className="font-semibold">{formatINR(t)}</span>} bold />
                </dl>
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">TDS & ITC</h4>
                <dl className="space-y-1.5">
                    <Row label="TDS rate" value={`${inv.tdsPct}%`} />
                    <Row label="TDS amount" value={formatINR(tds)} />
                    <div className="my-1 border-t border-slate-200" />
                    <Row label="GST input credit" value={formatINR(gstTotal)} />
                    <Row label="Net payable" value={<span className="font-semibold">{formatINR(t - tds)}</span>} bold />
                </dl>
            </section>
        </div>
    );
}

function PaneHeader({ label }: { label: string }) {
    return (
        <div className="rounded-md bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            {label}
        </div>
    );
}

function Cell({ label, qty, rate }: { label: string; qty: React.ReactNode; rate: React.ReactNode }) {
    return (
        <div className="rounded-md border border-slate-100 bg-slate-50/50 p-2 text-xs">
            <p className="font-semibold text-slate-500">{label}</p>
            <p className="mt-1">Qty: {qty}</p>
            <p>Rate: {rate}</p>
        </div>
    );
}

function Row({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <dt className={cn('text-slate-500', bold && 'font-semibold text-slate-700')}>{label}</dt>
            <dd className={cn('text-slate-700', bold && 'font-semibold')}>{value}</dd>
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
