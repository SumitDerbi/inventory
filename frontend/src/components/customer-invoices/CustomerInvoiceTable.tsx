import { Link } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatINR } from '@/lib/format';
import {
    INVOICE_STATUS_LABEL,
    INVOICE_STATUS_TONE,
    type CustomerInvoice,
} from '@/mocks/customer-invoices';

type HiddenColumn = 'customer' | 'order';

export interface CustomerInvoiceTableProps {
    rows: CustomerInvoice[];
    hideColumns?: HiddenColumn[];
    isLoading?: boolean;
    onRowClick?: (row: CustomerInvoice) => void;
}

const DATE_FMT = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
});

function fmtDate(iso: string): string {
    return DATE_FMT.format(new Date(iso));
}

export function CustomerInvoiceTable({
    rows,
    hideColumns = [],
    isLoading,
    onRowClick,
}: CustomerInvoiceTableProps) {
    const cols: DataTableColumn<CustomerInvoice>[] = [
        {
            key: 'number',
            header: 'Invoice',
            cell: (i) => (
                <Link to={`/sales/invoices/${i.id}`} className="font-medium text-blue-700 hover:underline">
                    {i.invoiceNumber}
                </Link>
            ),
        },
    ];

    if (!hideColumns.includes('customer')) {
        cols.push({
            key: 'customer',
            header: 'Customer',
            cell: (i) => <span className="text-sm text-slate-700">{i.customerName}</span>,
        });
    }

    if (!hideColumns.includes('order')) {
        cols.push({
            key: 'order',
            header: 'Sales order',
            cell: (i) =>
                i.salesOrderId ? (
                    <Link to={`/orders/${i.salesOrderId}`} className="text-xs text-blue-700 hover:underline">
                        {i.salesOrderNumber}
                    </Link>
                ) : (
                    <span className="text-xs italic text-slate-400">Direct</span>
                ),
        });
    }

    cols.push(
        { key: 'date', header: 'Date', cell: (i) => <span className="text-xs text-slate-600">{fmtDate(i.invoiceDate)}</span> },
        { key: 'due', header: 'Due', cell: (i) => <span className="text-xs text-slate-600">{fmtDate(i.dueDate)}</span> },
        {
            key: 'total',
            header: 'Grand total',
            align: 'right',
            cell: (i) => <span className="text-sm font-medium text-slate-900">{formatINR(i.grandTotal)}</span>,
        },
        {
            key: 'balance',
            header: 'Balance',
            align: 'right',
            cell: (i) => (
                <span className={i.balance > 0 ? 'text-sm font-medium text-amber-700' : 'text-sm text-slate-400'}>
                    {formatINR(i.balance)}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            cell: (i) => <Badge tone={INVOICE_STATUS_TONE[i.status]}>{INVOICE_STATUS_LABEL[i.status]}</Badge>,
        },
    );

    return (
        <DataTable
            columns={cols}
            rows={rows}
            rowKey={(r) => r.id}
            isLoading={isLoading}
            onRowClick={onRowClick}
            emptyState={
                <EmptyState
                    title="No invoices"
                    description="Raise an invoice from a sales order or create a direct invoice."
                />
            }
        />
    );
}

export interface CustomerInvoiceRowActionsProps {
    invoice: CustomerInvoice;
    onSend?: () => void;
    onMarkPaid?: () => void;
    onCancel?: () => void;
    onDownload?: () => void;
}

export function CustomerInvoiceRowActions({
    invoice,
    onSend,
    onMarkPaid,
    onCancel,
    onDownload,
}: CustomerInvoiceRowActionsProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {invoice.status === 'draft' && onSend && (
                <Button size="sm" variant="outline" onClick={onSend}>
                    Send
                </Button>
            )}
            {invoice.balance > 0 && invoice.status !== 'cancelled' && onMarkPaid && (
                <Button size="sm" variant="outline" onClick={onMarkPaid}>
                    Mark paid
                </Button>
            )}
            {onDownload && (
                <Button size="sm" variant="outline" onClick={onDownload}>
                    Download PDF
                </Button>
            )}
            {invoice.status !== 'cancelled' && invoice.status !== 'paid' && onCancel && (
                <Button size="sm" variant="ghost" onClick={onCancel}>
                    Cancel
                </Button>
            )}
        </div>
    );
}
