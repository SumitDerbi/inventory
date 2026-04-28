import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, FileText, Receipt } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { formatINR } from '@/lib/format';
import {
    INVOICE_STATUS_LABEL,
    INVOICE_STATUS_TONE,
    type CustomerInvoice,
    type CustomerInvoiceLine,
    type CustomerInvoicePayment,
} from '@/mocks/customer-invoices';
import { CustomerInvoiceRowActions } from './CustomerInvoiceTable';

export interface CustomerInvoiceDetailProps {
    invoice: CustomerInvoice;
    onSend?: () => void;
    onMarkPaid?: () => void;
    onCancel?: () => void;
    onDownload?: () => void;
}

const DATE_FMT = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
});

function fmtDate(iso: string): string {
    return DATE_FMT.format(new Date(iso));
}

export function CustomerInvoiceDetail({
    invoice,
    onSend,
    onMarkPaid,
    onCancel,
    onDownload,
}: CustomerInvoiceDetailProps) {
    const [auditOpen, setAuditOpen] = useState(false);

    const lineCols: DataTableColumn<CustomerInvoiceLine>[] = [
        { key: 'desc', header: 'Description', cell: (l) => <span className="text-sm text-slate-800">{l.description}</span> },
        { key: 'hsn', header: 'HSN', cell: (l) => <span className="text-xs text-slate-500">{l.hsn ?? '—'}</span> },
        { key: 'qty', header: 'Qty', align: 'right', cell: (l) => `${l.quantity} ${l.uom}` },
        { key: 'rate', header: 'Rate', align: 'right', cell: (l) => formatINR(l.unitPrice) },
        { key: 'disc', header: 'Disc %', align: 'right', cell: (l) => `${l.discountPct}%` },
        { key: 'tax', header: 'GST %', align: 'right', cell: (l) => `${l.taxRate}%` },
        {
            key: 'amount',
            header: 'Amount',
            align: 'right',
            cell: (l) => {
                const taxable = l.quantity * l.unitPrice * (1 - l.discountPct / 100);
                return formatINR(Math.round(taxable * (1 + l.taxRate / 100)));
            },
        },
    ];

    const paymentCols: DataTableColumn<CustomerInvoicePayment>[] = [
        { key: 'date', header: 'Received on', cell: (p) => fmtDate(p.receivedAt) },
        { key: 'mode', header: 'Mode', cell: (p) => p.mode },
        { key: 'ref', header: 'Reference', cell: (p) => <span className="font-mono text-xs">{p.reference}</span> },
        { key: 'amt', header: 'Amount', align: 'right', cell: (p) => formatINR(p.amount) },
    ];

    return (
        <div className="space-y-6">
            {/* Header card */}
            <section className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <Receipt className="size-5 text-slate-400" />
                            <h2 className="text-lg font-semibold text-slate-900">{invoice.invoiceNumber}</h2>
                            <Badge tone={INVOICE_STATUS_TONE[invoice.status]}>
                                {INVOICE_STATUS_LABEL[invoice.status]}
                            </Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{invoice.customerName}</p>
                        {invoice.salesOrderId && (
                            <Link
                                to={`/orders/${invoice.salesOrderId}`}
                                className="mt-1 inline-flex items-center gap-1 text-xs text-blue-700 hover:underline"
                            >
                                <ExternalLink className="size-3" /> View Sales Order {invoice.salesOrderNumber}
                            </Link>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-1 text-right">
                        <div className="text-xs text-slate-400">Grand total</div>
                        <div className="text-2xl font-semibold text-slate-900">{formatINR(invoice.grandTotal)}</div>
                        <div className="text-xs">
                            <span className="text-slate-400">Balance: </span>
                            <span className={invoice.balance > 0 ? 'font-medium text-amber-700' : 'text-slate-500'}>
                                {formatINR(invoice.balance)}
                            </span>
                        </div>
                    </div>
                </div>

                <dl className="mt-4 grid gap-3 text-sm md:grid-cols-4">
                    <div>
                        <dt className="text-xs text-slate-400">Invoice date</dt>
                        <dd className="text-slate-900">{fmtDate(invoice.invoiceDate)}</dd>
                    </div>
                    <div>
                        <dt className="text-xs text-slate-400">Due date</dt>
                        <dd className="text-slate-900">{fmtDate(invoice.dueDate)}</dd>
                    </div>
                    <div>
                        <dt className="text-xs text-slate-400">Place of supply</dt>
                        <dd className="text-slate-900">{invoice.placeOfSupply}</dd>
                    </div>
                    <div>
                        <dt className="text-xs text-slate-400">Payment terms</dt>
                        <dd className="text-slate-900">{invoice.paymentTerms}</dd>
                    </div>
                    {invoice.eInvoiceIrn && (
                        <div>
                            <dt className="text-xs text-slate-400">e-Invoice IRN</dt>
                            <dd className="font-mono text-xs text-slate-700">{invoice.eInvoiceIrn}</dd>
                        </div>
                    )}
                    {invoice.eWayBill && (
                        <div>
                            <dt className="text-xs text-slate-400">e-Way Bill</dt>
                            <dd className="font-mono text-xs text-slate-700">{invoice.eWayBill}</dd>
                        </div>
                    )}
                </dl>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <CustomerInvoiceRowActions
                        invoice={invoice}
                        onSend={onSend}
                        onMarkPaid={onMarkPaid}
                        onCancel={onCancel}
                        onDownload={onDownload}
                    />
                    <Button variant="ghost" size="sm" onClick={() => setAuditOpen(true)}>
                        <FileText className="size-3.5" /> Audit log
                    </Button>
                </div>
            </section>

            {/* Line items */}
            <section className="rounded-xl border border-slate-200 bg-white">
                <h3 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-800">Line items</h3>
                <DataTable columns={lineCols} rows={invoice.lineItems} rowKey={(l) => l.id} />
            </section>

            {/* Tax break-up */}
            <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-800">Tax break-up</h3>
                <dl className="grid gap-2 text-sm md:grid-cols-2">
                    <Row label="Subtotal" value={formatINR(invoice.subtotal)} />
                    <Row label="Discount" value={`− ${formatINR(invoice.discount)}`} />
                    <Row label="Taxable value" value={formatINR(invoice.taxableValue)} />
                    {invoice.cgst > 0 && <Row label="CGST" value={formatINR(invoice.cgst)} />}
                    {invoice.sgst > 0 && <Row label="SGST" value={formatINR(invoice.sgst)} />}
                    {invoice.igst > 0 && <Row label="IGST" value={formatINR(invoice.igst)} />}
                    {invoice.freight > 0 && <Row label="Freight" value={formatINR(invoice.freight)} />}
                    <Row label="Round-off" value={formatINR(invoice.roundOff)} />
                    <Row label="Grand total" value={formatINR(invoice.grandTotal)} bold />
                </dl>
            </section>

            {/* Payment history */}
            <section className="rounded-xl border border-slate-200 bg-white">
                <h3 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-800">Payment history</h3>
                {invoice.payments.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-slate-500">No payments recorded yet.</p>
                ) : (
                    <DataTable columns={paymentCols} rows={invoice.payments} rowKey={(p) => p.id} />
                )}
            </section>

            {invoice.notes && (
                <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    <span className="font-medium text-slate-900">Notes: </span>
                    {invoice.notes}
                </section>
            )}

            <Sheet open={auditOpen} onOpenChange={setAuditOpen}>
                <SheetContent side="right">
                    <h3 className="text-lg font-semibold text-slate-900">Audit log</h3>
                    <ol className="mt-4 space-y-3 text-sm">
                        <li>
                            <div className="text-xs text-slate-400">{fmtDate(invoice.createdAt)}</div>
                            <div className="text-slate-900">Invoice created</div>
                        </li>
                        {invoice.payments.map((p) => (
                            <li key={p.id}>
                                <div className="text-xs text-slate-400">{fmtDate(p.receivedAt)}</div>
                                <div className="text-slate-900">
                                    Payment of {formatINR(p.amount)} received via {p.mode}
                                </div>
                            </li>
                        ))}
                    </ol>
                </SheetContent>
            </Sheet>
        </div>
    );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
    return (
        <div className={`flex items-center justify-between border-b border-slate-100 pb-1 last:border-0 ${bold ? 'pt-2' : ''}`}>
            <dt className={bold ? 'text-sm font-semibold text-slate-900' : 'text-xs text-slate-500'}>{label}</dt>
            <dd className={bold ? 'text-base font-semibold text-slate-900' : 'text-sm text-slate-700'}>{value}</dd>
        </div>
    );
}
