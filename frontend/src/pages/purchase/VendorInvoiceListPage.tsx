import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Select } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { formatINR, formatRelative } from '@/lib/format';
import {
    vendorInvoices,
    INVOICE_STATUS_LABEL,
    INVOICE_STATUS_TONE,
    invoiceTotal,
    invoiceOutstanding,
    payableAging,
    type VendorInvoice,
    type InvoiceStatus,
} from '@/mocks/vendor-invoices';
import { vendorById } from '@/mocks/vendors';

export default function VendorInvoiceListPage() {
    const navigate = useNavigate();
    const { push } = useToast();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<'' | InvoiceStatus>('');

    const aging = useMemo(() => payableAging(new Date()), []);

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return vendorInvoices.filter((i) => {
            if (status && i.status !== status) return false;
            if (q) {
                const hay = `${i.number} ${i.internalRef} ${vendorById(i.vendorId)?.name ?? ''}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [search, status]);

    const cols: DataTableColumn<VendorInvoice>[] = [
        { key: 'ref', header: 'Internal ref', cell: (i) => <span className="font-mono text-sm font-semibold">{i.internalRef}</span> },
        { key: 'num', header: 'Vendor invoice', cell: (i) => <span className="text-sm text-slate-700">{i.number}</span> },
        { key: 'vendor', header: 'Vendor', cell: (i) => <span className="text-sm">{vendorById(i.vendorId)?.name ?? '—'}</span> },
        { key: 'date', header: 'Date', cell: (i) => <span className="text-xs text-slate-500">{formatRelative(i.invoiceDate)}</span> },
        { key: 'due', header: 'Due', cell: (i) => <span className="text-xs text-slate-500">{formatRelative(i.dueDate)}</span> },
        { key: 'status', header: 'Status', cell: (i) => <Badge tone={INVOICE_STATUS_TONE[i.status]}>{INVOICE_STATUS_LABEL[i.status]}</Badge> },
        { key: 'amt', header: 'Amount', align: 'right', cell: (i) => <span className="text-sm font-medium">{formatINR(invoiceTotal(i))}</span> },
        { key: 'out', header: 'Outstanding', align: 'right', cell: (i) => <span className="text-sm font-medium text-amber-700">{formatINR(invoiceOutstanding(i))}</span> },
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
                searchPlaceholder="Search invoice #, ref, vendor…"
                filters={
                    <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as InvoiceStatus | '')} className="w-44">
                        <option value="">All statuses</option>
                        {Object.keys(INVOICE_STATUS_LABEL).map((s) => (
                            <option key={s} value={s}>{INVOICE_STATUS_LABEL[s as InvoiceStatus]}</option>
                        ))}
                    </Select>
                }
                actions={
                    <Button size="sm" onClick={() => push({ variant: 'info', title: 'Book invoice', description: 'Static UI — wiring deferred.' })}>
                        <Plus className="size-4" aria-hidden="true" />
                        Book invoice
                    </Button>
                }
            />

            <DataTable
                columns={cols}
                rows={rows}
                rowKey={(i) => i.id}
                onRowClick={(i) => navigate(`/purchase/invoices/${i.id}`)}
                emptyState={<div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">No invoices match the filters.</div>}
            />
            <p className="mt-3 text-xs text-slate-500">Showing {rows.length} of {vendorInvoices.length} invoices.</p>
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
