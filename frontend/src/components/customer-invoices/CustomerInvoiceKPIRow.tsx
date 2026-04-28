import { StatCard } from '@/components/ui/StatCard';
import { formatINR } from '@/lib/format';
import { invoiceKPIs, type CustomerInvoice } from '@/mocks/customer-invoices';

export interface CustomerInvoiceKPIRowProps {
    rows?: CustomerInvoice[];
}

export function CustomerInvoiceKPIRow({ rows }: CustomerInvoiceKPIRowProps) {
    const k = invoiceKPIs(rows);
    return (
        <div className="grid gap-3 md:grid-cols-4">
            <StatCard label="Outstanding" value={formatINR(k.outstanding)} tone="amber" />
            <StatCard label="Overdue" value={formatINR(k.overdue)} tone="red" />
            <StatCard label="Paid this month" value={formatINR(k.paidThisMonth)} tone="emerald" />
            <StatCard label="Avg DSO (days)" value={k.avgDsoDays.toString()} tone="blue" />
        </div>
    );
}
