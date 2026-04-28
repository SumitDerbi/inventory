import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { FormField, Input, Select } from '@/components/ui/FormField';
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/Dialog';
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
import { vendorById, vendors } from '@/mocks/vendors';
import { purchaseOrders } from '@/mocks/purchase-orders';

export default function VendorInvoiceListPage() {
    const navigate = useNavigate();
    const { push } = useToast();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<'' | InvoiceStatus>('');
    const [newOpen, setNewOpen] = useState(false);
    const [form, setForm] = useState({ vendorId: '', poId: '', number: '', invoiceDate: '', amount: '' });

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
                    <Button size="sm" onClick={() => setNewOpen(true)}>
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

            <Dialog open={newOpen} onOpenChange={setNewOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Book vendor invoice</DialogTitle>
                        <DialogDescription>Vendor, linked PO, vendor invoice number, date, total.</DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        <div className="space-y-3">
                            <FormField label="Vendor" required>
                                <Select value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })}>
                                    <option value="">— Select —</option>
                                    {vendors.filter((v) => v.status !== 'blocked').map((v) => (
                                        <option key={v.id} value={v.id}>{v.name}</option>
                                    ))}
                                </Select>
                            </FormField>
                            <FormField label="Linked PO">
                                <Select value={form.poId} onChange={(e) => setForm({ ...form, poId: e.target.value })}>
                                    <option value="">— None —</option>
                                    {purchaseOrders
                                        .filter((p) => !form.vendorId || p.vendorId === form.vendorId)
                                        .slice(0, 20)
                                        .map((p) => (
                                            <option key={p.id} value={p.id}>{p.number}</option>
                                        ))}
                                </Select>
                            </FormField>
                            <div className="grid grid-cols-2 gap-3">
                                <FormField label="Invoice #" required>
                                    <Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="INV-..." />
                                </FormField>
                                <FormField label="Invoice date" required>
                                    <Input type="date" value={form.invoiceDate} onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })} />
                                </FormField>
                            </div>
                            <FormField label="Total amount" required>
                                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                            </FormField>
                        </div>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="ghost" size="sm" onClick={() => setNewOpen(false)}>Cancel</Button>
                        <Button
                            size="sm"
                            disabled={!form.vendorId || !form.number || !form.invoiceDate || !form.amount}
                            onClick={() => {
                                setNewOpen(false);
                                push({ variant: 'success', title: 'Invoice booked (mock)', description: form.number });
                            }}
                        >
                            Book
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
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
