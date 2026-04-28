import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Select } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { formatINR, formatRelative } from '@/lib/format';
import {
    vendorPayments,
    PAYMENT_STATUS_LABEL,
    PAYMENT_STATUS_TONE,
    PAYMENT_MODE_LABEL,
    type VendorPayment,
    type PaymentStatus,
    type PaymentMode,
} from '@/mocks/vendor-payments';
import { vendorById } from '@/mocks/vendors';
import { invoiceById, payableAging } from '@/mocks/vendor-invoices';

export default function PaymentListPage() {
    const { push } = useToast();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<'' | PaymentStatus>('');
    const [mode, setMode] = useState<'' | PaymentMode>('');

    const aging = useMemo(() => payableAging(new Date()), []);

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return vendorPayments.filter((p) => {
            if (status && p.status !== status) return false;
            if (mode && p.mode !== mode) return false;
            if (q) {
                const hay = `${p.number} ${vendorById(p.vendorId)?.name ?? ''} ${p.invoiceIds.map((id) => invoiceById(id)?.number ?? '').join(' ')}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [search, status, mode]);

    const cols: DataTableColumn<VendorPayment>[] = [
        { key: 'num', header: 'Payment #', cell: (p) => <span className="font-mono text-sm font-semibold">{p.number}</span> },
        { key: 'vendor', header: 'Vendor', cell: (p) => <span className="text-sm">{vendorById(p.vendorId)?.name ?? '—'}</span> },
        { key: 'inv', header: 'Invoice', cell: (p) => <span className="font-mono text-xs text-slate-500">{p.invoiceIds.map((id) => invoiceById(id)?.number ?? id).join(', ') || '—'}</span> },
        { key: 'date', header: 'Date', cell: (p) => <span className="text-xs text-slate-500">{formatRelative(p.paymentDate)}</span> },
        { key: 'mode', header: 'Mode', cell: (p) => <span className="text-sm">{PAYMENT_MODE_LABEL[p.mode]}</span> },
        { key: 'amt', header: 'Amount', align: 'right', cell: (p) => <span className="text-sm font-medium">{formatINR(p.amount)}</span> },
        { key: 'tds', header: 'TDS', align: 'right', cell: (p) => <span className="text-xs text-slate-500">{formatINR(p.tdsAmount)}</span> },
        { key: 'status', header: 'Status', cell: (p) => <Badge tone={PAYMENT_STATUS_TONE[p.status]}>{PAYMENT_STATUS_LABEL[p.status]}</Badge> },
    ];

    return (
        <>
            <section className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                <KPI label="Current" value={formatINR(aging.current)} tone="emerald" />
                <KPI label="0–30 days" value={formatINR(aging.d0_30)} tone="sky" />
                <KPI label="31–60 days" value={formatINR(aging.d31_60)} tone="amber" />
                <KPI label="61–90 days" value={formatINR(aging.d61_90)} tone="orange" />
                <KPI label="90+ days" value={formatINR(aging.d90_plus)} tone="red" />
            </section>

            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search payment, vendor, invoice…"
                filters={
                    <>
                        <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as PaymentStatus | '')} className="w-36">
                            <option value="">All statuses</option>
                            {Object.keys(PAYMENT_STATUS_LABEL).map((s) => (
                                <option key={s} value={s}>{PAYMENT_STATUS_LABEL[s as PaymentStatus]}</option>
                            ))}
                        </Select>
                        <Select aria-label="Mode" value={mode} onChange={(e) => setMode(e.target.value as PaymentMode | '')} className="w-36">
                            <option value="">All modes</option>
                            {Object.keys(PAYMENT_MODE_LABEL).map((m) => (
                                <option key={m} value={m}>{PAYMENT_MODE_LABEL[m as PaymentMode]}</option>
                            ))}
                        </Select>
                    </>
                }
                actions={
                    <>
                        <Button variant="outline" size="sm" onClick={() => push({ variant: 'info', title: 'Payment advice generated (mock)' })}>
                            Payment advice
                        </Button>
                        <Button size="sm" onClick={() => push({ variant: 'info', title: 'New payment', description: 'Static UI — wiring deferred.' })}>
                            <Plus className="size-4" aria-hidden="true" />
                            New payment
                        </Button>
                    </>
                }
            />

            <DataTable
                columns={cols}
                rows={rows}
                rowKey={(p) => p.id}
                emptyState={<div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">No payments match the filters.</div>}
            />
            <p className="mt-3 text-xs text-slate-500">Showing {rows.length} of {vendorPayments.length} payments.</p>
        </>
    );
}

function KPI({ label, value, tone }: { label: string; value: string; tone: 'emerald' | 'sky' | 'amber' | 'orange' | 'red' }) {
    const toneCls = {
        emerald: 'text-emerald-700',
        sky: 'text-sky-700',
        amber: 'text-amber-700',
        orange: 'text-orange-700',
        red: 'text-red-700',
    }[tone];
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
            <p className={`mt-1 text-lg font-semibold ${toneCls}`}>{value}</p>
        </div>
    );
}
