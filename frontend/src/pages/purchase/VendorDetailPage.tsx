import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { useToast } from '@/components/ui/Toast';
import { AuditDrawer, AuditTriggerButton } from '@/components/ui/AuditDrawer';
import { mockActivity } from '@/mocks/activity';
import { cn } from '@/lib/cn';
import { formatINR, formatRelative, formatCompactINR } from '@/lib/format';
import {
    vendorById,
    vendorPerformanceTone,
    VENDOR_STATUS_LABEL,
    VENDOR_STATUS_TONE,
    VENDOR_TIER_TONE,
} from '@/mocks/vendors';
import { purchaseOrders, PO_STAGE_LABEL, PO_STAGE_TONE } from '@/mocks/purchase-orders';
import { vendorInvoices, INVOICE_STATUS_LABEL, INVOICE_STATUS_TONE } from '@/mocks/vendor-invoices';
import { vendorPayments, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_TONE, PAYMENT_MODE_LABEL } from '@/mocks/vendor-payments';
import { purchaseReturns, RETURN_STATUS_LABEL, RETURN_STATUS_TONE } from '@/mocks/purchase-returns';

type Tab = 'overview' | 'performance' | 'pos' | 'invoices' | 'payments' | 'returns' | 'contacts' | 'bank' | 'attachments';

const TABS: Array<{ id: Tab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'performance', label: 'Performance' },
    { id: 'pos', label: 'POs' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'payments', label: 'Payments' },
    { id: 'returns', label: 'Returns' },
    { id: 'contacts', label: 'Contacts' },
    { id: 'bank', label: 'Bank' },
    { id: 'attachments', label: 'Attachments' },
];

export default function VendorDetailPage() {
    const { id = '' } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const v = vendorById(id);
    const [tab, setTab] = useState<Tab>('overview');
    const [auditOpen, setAuditOpen] = useState(false);
    const { push } = useToast();

    const vendorPOs = useMemo(
        () => purchaseOrders.filter((p) => p.vendorId === id),
        [id],
    );
    const vendorInvoicesList = useMemo(
        () => vendorInvoices.filter((i) => i.vendorId === id),
        [id],
    );
    const vendorPays = useMemo(
        () => vendorPayments.filter((p) => p.vendorId === id),
        [id],
    );
    const vendorReturns = useMemo(
        () => purchaseReturns.filter((r) => r.vendorId === id),
        [id],
    );

    if (!v) {
        return (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
                Vendor not found.
                <div className="mt-3">
                    <Button variant="outline" onClick={() => navigate('/purchase/vendors')}>
                        Back to vendors
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title={v.name}
                description={v.legalName}
                breadcrumb={[
                    { label: 'Procurement', href: '/purchase' },
                    { label: 'Vendors', href: '/purchase/vendors' },
                    { label: v.code },
                ]}
                actions={
                    <>
                        <Button variant="outline" size="sm" onClick={() => navigate('/purchase/vendors')}>
                            <ArrowLeft className="size-4" aria-hidden="true" />
                            Back
                        </Button>
                        <AuditTriggerButton onClick={() => setAuditOpen(true)} />
                    </>
                }
            />

            <section className="mb-4 flex flex-wrap items-center gap-2">
                <Badge tone={VENDOR_STATUS_TONE[v.status]}>{VENDOR_STATUS_LABEL[v.status]}</Badge>
                <Badge tone={VENDOR_TIER_TONE[v.tier]}>Tier {v.tier}</Badge>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs text-slate-500">{v.category}</span>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs text-slate-500">GSTIN {v.gstin}</span>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs text-slate-500">PAN {v.pan}</span>
            </section>

            <div role="tablist" aria-label="Vendor sections" className="mb-4 flex flex-wrap gap-1 border-b border-slate-200">
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

            {tab === 'overview' && <Overview v={v} />}
            {tab === 'performance' && <Performance v={v} />}
            {tab === 'pos' && <POsTab pos={vendorPOs} navigate={navigate} />}
            {tab === 'invoices' && <InvoicesTab invoices={vendorInvoicesList} navigate={navigate} />}
            {tab === 'payments' && <PaymentsTab payments={vendorPays} />}
            {tab === 'returns' && <ReturnsTab returns={vendorReturns} navigate={navigate} />}
            {tab === 'contacts' && <ContactsTab v={v} />}
            {tab === 'bank' && <BankTab v={v} />}
            {tab === 'attachments' && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                    <Paperclip className="mx-auto mb-2 size-6 text-slate-400" aria-hidden="true" />
                    <p className="font-medium text-slate-700">Vendor agreements, MSME cert, GST cert, NDA</p>
                    <p className="mt-1 text-xs">Drag & drop or click to upload (mock).</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => push({ variant: 'info', title: 'Upload mock', description: 'Wiring deferred to API phase.' })}>
                        Add attachment
                    </Button>
                </div>
            )}

            <AuditDrawer
                open={auditOpen}
                onOpenChange={setAuditOpen}
                title={`${v.code} · activity`}
                entries={mockActivity(v.id, 'Vendor')}
            />
        </>
    );
}

function Overview({ v }: { v: NonNullable<ReturnType<typeof vendorById>> }) {
    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Address & contact">
                <dl className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 size-4 text-slate-400" aria-hidden="true" />
                        <span className="text-slate-700">{v.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Phone className="size-4 text-slate-400" aria-hidden="true" />
                        <span className="text-slate-700">
                            {v.contacts[0]?.phone ?? '—'} · {v.contacts[0]?.name ?? '—'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Mail className="size-4 text-slate-400" aria-hidden="true" />
                        <span className="text-slate-700">{v.contacts[0]?.email ?? '—'}</span>
                    </div>
                </dl>
            </Card>
            <Card title="Commercial terms">
                <dl className="grid grid-cols-2 gap-3 text-sm">
                    <KV label="Payment terms" value={`${v.paymentTermsDays} days`} />
                    <KV label="Credit limit" value={formatINR(v.creditLimit)} />
                    <KV label="Currency" value={v.currency} />
                    <KV label="Place of supply" value={v.placeOfSupply} />
                    <KV label="MSME" value={v.msmeNumber ?? '—'} />
                    <KV label="Vendor since" value={formatRelative(v.createdAt)} />
                </dl>
            </Card>
            {v.notes && (
                <Card title="Notes" className="lg:col-span-2">
                    <p className="text-sm text-slate-600">{v.notes}</p>
                </Card>
            )}
        </div>
    );
}

function Performance({ v }: { v: NonNullable<ReturnType<typeof vendorById>> }) {
    const p = v.performance;
    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <PerfStat label="On-time delivery" value={`${p.onTimePct}%`} tone={vendorPerformanceTone(p.onTimePct)} />
            <PerfStat label="Quality (acceptance)" value={`${p.qualityPct}%`} tone={vendorPerformanceTone(p.qualityPct)} />
            <PerfStat
                label="Rejection %"
                value={`${p.rejectionPct.toFixed(1)}%`}
                tone={vendorPerformanceTone(p.rejectionPct, 'lower')}
            />
            <PerfStat label="Avg lead time" value={`${p.avgLeadDays} days`} tone="emerald" />
            <PerfStat label="Spend YTD" value={formatCompactINR(p.spendYTD)} tone="emerald" className="sm:col-span-2" />
            <PerfStat label="POs raised" value={String(p.poCount)} tone="emerald" />
            <PerfStat label="Last PO" value={p.lastPoAt ? formatRelative(p.lastPoAt) : '—'} tone="emerald" />
        </div>
    );
}

function POsTab({ pos, navigate }: { pos: typeof purchaseOrders; navigate: ReturnType<typeof useNavigate> }) {
    const cols: DataTableColumn<typeof purchaseOrders[number]>[] = [
        { key: 'num', header: 'PO #', cell: (p) => <span className="font-mono text-sm font-semibold">{p.number}</span> },
        { key: 'date', header: 'Date', cell: (p) => <span className="text-xs text-slate-500">{formatRelative(p.poDate)}</span> },
        { key: 'stage', header: 'Stage', cell: (p) => <Badge tone={PO_STAGE_TONE[p.stage]}>{PO_STAGE_LABEL[p.stage]}</Badge> },
        { key: 'eta', header: 'Expected', cell: (p) => <span className="text-xs text-slate-500">{formatRelative(p.expectedDeliveryDate)}</span> },
        {
            key: 'val',
            header: 'Value',
            align: 'right',
            cell: (p) => {
                const total = p.items.reduce((s, i) => s + i.qty * i.unitPrice, 0) + p.freight + p.otherCharges;
                return <span className="text-sm font-medium">{formatINR(total)}</span>;
            },
        },
    ];
    return (
        <DataTable
            columns={cols}
            rows={pos}
            rowKey={(p) => p.id}
            onRowClick={(p) => navigate(`/purchase/orders/${p.id}`)}
            emptyState={<EmptyMsg msg="No POs raised on this vendor yet." />}
        />
    );
}

function InvoicesTab({ invoices, navigate }: { invoices: typeof vendorInvoices; navigate: ReturnType<typeof useNavigate> }) {
    const cols: DataTableColumn<typeof vendorInvoices[number]>[] = [
        { key: 'ref', header: 'Internal ref', cell: (i) => <span className="font-mono text-sm">{i.internalRef}</span> },
        { key: 'num', header: 'Vendor invoice', cell: (i) => <span className="text-sm text-slate-700">{i.number}</span> },
        { key: 'date', header: 'Date', cell: (i) => <span className="text-xs text-slate-500">{formatRelative(i.invoiceDate)}</span> },
        { key: 'status', header: 'Status', cell: (i) => <Badge tone={INVOICE_STATUS_TONE[i.status]}>{INVOICE_STATUS_LABEL[i.status]}</Badge> },
    ];
    return (
        <DataTable
            columns={cols}
            rows={invoices}
            rowKey={(i) => i.id}
            onRowClick={(i) => navigate(`/purchase/invoices/${i.id}`)}
            emptyState={<EmptyMsg msg="No invoices for this vendor yet." />}
        />
    );
}

function PaymentsTab({ payments }: { payments: typeof vendorPayments }) {
    const cols: DataTableColumn<typeof vendorPayments[number]>[] = [
        { key: 'num', header: 'Payment #', cell: (p) => <span className="font-mono text-sm">{p.number}</span> },
        { key: 'date', header: 'Date', cell: (p) => <span className="text-xs text-slate-500">{formatRelative(p.paymentDate)}</span> },
        { key: 'mode', header: 'Mode', cell: (p) => <span className="text-sm">{PAYMENT_MODE_LABEL[p.mode]}</span> },
        { key: 'amt', header: 'Amount', align: 'right', cell: (p) => <span className="text-sm font-medium">{formatINR(p.amount)}</span> },
        { key: 'status', header: 'Status', cell: (p) => <Badge tone={PAYMENT_STATUS_TONE[p.status]}>{PAYMENT_STATUS_LABEL[p.status]}</Badge> },
    ];
    return (
        <DataTable
            columns={cols}
            rows={payments}
            rowKey={(p) => p.id}
            emptyState={<EmptyMsg msg="No payments recorded for this vendor." />}
        />
    );
}

function ReturnsTab({ returns, navigate }: { returns: typeof purchaseReturns; navigate: ReturnType<typeof useNavigate> }) {
    const cols: DataTableColumn<typeof purchaseReturns[number]>[] = [
        { key: 'num', header: 'Return #', cell: (r) => <span className="font-mono text-sm">{r.number}</span> },
        { key: 'date', header: 'Raised', cell: (r) => <span className="text-xs text-slate-500">{formatRelative(r.raisedAt)}</span> },
        { key: 'status', header: 'Status', cell: (r) => <Badge tone={RETURN_STATUS_TONE[r.status]}>{RETURN_STATUS_LABEL[r.status]}</Badge> },
        { key: 'qty', header: 'Items', align: 'right', cell: (r) => <span className="text-sm">{r.items.length}</span> },
    ];
    return (
        <DataTable
            columns={cols}
            rows={returns}
            rowKey={(r) => r.id}
            onRowClick={() => navigate(`/purchase/returns`)}
            emptyState={<EmptyMsg msg="No purchase returns for this vendor." />}
        />
    );
}

function ContactsTab({ v }: { v: NonNullable<ReturnType<typeof vendorById>> }) {
    if (!v.contacts.length) return <EmptyMsg msg="No contacts on file." />;
    return (
        <div className="grid gap-3 md:grid-cols-2">
            {v.contacts.map((c) => (
                <article key={c.id} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                            <p className="text-xs text-slate-500">{c.designation}</p>
                        </div>
                        {c.isPrimary && <Badge tone="blue">Primary</Badge>}
                    </div>
                    <dl className="mt-3 space-y-1.5 text-xs">
                        <div className="flex items-center gap-2 text-slate-600">
                            <Phone className="size-3.5 text-slate-400" aria-hidden="true" />
                            {c.phone}
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                            <Mail className="size-3.5 text-slate-400" aria-hidden="true" />
                            {c.email}
                        </div>
                    </dl>
                </article>
            ))}
        </div>
    );
}

function BankTab({ v }: { v: NonNullable<ReturnType<typeof vendorById>> }) {
    if (!v.bankDetails.length) return <EmptyMsg msg="No bank details on file." />;
    return (
        <div className="grid gap-3 md:grid-cols-2">
            {v.bankDetails.map((b) => (
                <article key={b.id} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800">{b.bankName}</p>
                        {b.isPrimary && <Badge tone="blue">Primary</Badge>}
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <KV label="Account #" value={<span className="font-mono">{b.accountNumber}</span>} />
                        <KV label="IFSC" value={<span className="font-mono">{b.ifsc}</span>} />
                        <KV label="Branch" value={b.branch} />
                    </dl>
                </article>
            ))}
        </div>
    );
}

function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
    return (
        <section className={cn('rounded-xl border border-slate-200 bg-white p-4', className)}>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3>
            {children}
        </section>
    );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <dt className="text-xs text-slate-400">{label}</dt>
            <dd className="text-sm text-slate-700">{value}</dd>
        </div>
    );
}

function PerfStat({
    label,
    value,
    tone,
    className,
}: {
    label: string;
    value: string;
    tone: 'emerald' | 'amber' | 'red';
    className?: string;
}) {
    return (
        <div className={cn('rounded-xl border border-slate-200 bg-white p-4', className)}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
            <p
                className={cn(
                    'mt-1 text-2xl font-semibold',
                    tone === 'emerald' && 'text-emerald-700',
                    tone === 'amber' && 'text-amber-700',
                    tone === 'red' && 'text-red-600',
                )}
            >
                {value}
            </p>
        </div>
    );
}

function EmptyMsg({ msg }: { msg: string }) {
    return (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            {msg}
        </div>
    );
}
