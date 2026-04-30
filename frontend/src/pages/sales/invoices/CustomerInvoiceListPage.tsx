import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, Loader2, Send } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { Select, Input } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { formatINR } from '@/lib/format';
import { extractErrorMessage } from '@/services/apiClient';
import {
    useBulkExportInvoices,
    useBulkSendInvoices,
    useInvoiceAgingQuery,
    useInvoicesQuery,
} from '@/hooks/useCustomerInvoices';
import type {
    InvoiceApiStatus,
    InvoiceListItem,
} from '@/services/customer-invoices';

const DATE_FMT = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
});

function fmtDate(iso: string) {
    if (!iso) return '—';
    return DATE_FMT.format(new Date(iso));
}

const STATUS_LABEL: Record<InvoiceApiStatus, string> = {
    draft: 'Draft',
    issued: 'Issued',
    cancelled: 'Cancelled',
};

const STATUS_OPTIONS: InvoiceApiStatus[] = ['draft', 'issued', 'cancelled'];

export default function CustomerInvoiceListPage() {
    const navigate = useNavigate();
    const { push } = useToast();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<InvoiceApiStatus | ''>('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const invoicesQuery = useInvoicesQuery({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        pageSize: 100,
        ordering: '-invoice_date',
    });

    const agingQuery = useInvoiceAgingQuery();
    const bulkExportMut = useBulkExportInvoices();
    const bulkSendMut = useBulkSendInvoices();

    const allRows: InvoiceListItem[] = useMemo(
        () => invoicesQuery.data?.results ?? [],
        [invoicesQuery.data],
    );

    const rows = useMemo(() => {
        return allRows.filter((i) => {
            if (fromDate && new Date(i.invoiceDate) < new Date(fromDate)) return false;
            if (toDate && new Date(i.invoiceDate) > new Date(toDate)) return false;
            return true;
        });
    }, [allRows, fromDate, toDate]);

    useEffect(() => {
        setSelected(new Set());
    }, [search, statusFilter, fromDate, toDate]);

    const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
    const someSelected = !allSelected && rows.some((r) => selected.has(r.id));

    function toggleAll() {
        setSelected((curr) => {
            if (allSelected) {
                const next = new Set(curr);
                rows.forEach((r) => next.delete(r.id));
                return next;
            }
            const next = new Set(curr);
            rows.forEach((r) => next.add(r.id));
            return next;
        });
    }

    function toggleOne(id: string) {
        setSelected((curr) => {
            const next = new Set(curr);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function reset() {
        setSearch('');
        setStatusFilter('');
        setFromDate('');
        setToDate('');
    }

    async function handleBulkExport() {
        const ids = selected.size > 0 ? Array.from(selected) : rows.map((r) => r.id);
        if (ids.length === 0) {
            push({ variant: 'warning', title: 'Nothing to export' });
            return;
        }
        try {
            const results = await bulkExportMut.mutateAsync(ids);
            const ok = results.filter((r) => r.status === 'ok').length;
            push({
                variant: 'success',
                title: `Exported ${ok} invoice${ok === 1 ? '' : 's'}`,
            });
        } catch (e) {
            push({ variant: 'danger', title: 'Export failed', description: extractErrorMessage(e) });
        }
    }

    async function handleBulkSend() {
        const ids = Array.from(selected);
        if (ids.length === 0) {
            push({ variant: 'warning', title: 'Select invoices to send' });
            return;
        }
        try {
            const results = await bulkSendMut.mutateAsync(ids);
            const ok = results.filter((r) => r.status === 'ok').length;
            const err = results.length - ok;
            push({
                variant: err === 0 ? 'success' : 'warning',
                title: `Sent ${ok} of ${results.length}`,
                description: err > 0 ? `${err} could not be sent.` : undefined,
            });
            setSelected(new Set());
        } catch (e) {
            push({ variant: 'danger', title: 'Bulk send failed', description: extractErrorMessage(e) });
        }
    }

    const columns: DataTableColumn<InvoiceListItem>[] = [
        {
            key: 'select',
            header: (
                <input
                    type="checkbox"
                    aria-label="Select all rows"
                    className="size-4 cursor-pointer rounded border-slate-300 text-primary focus:ring-primary/40"
                    checked={allSelected}
                    ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggleAll}
                    onClick={(e) => e.stopPropagation()}
                />
            ),
            cell: (row) => (
                <input
                    type="checkbox"
                    aria-label={`Select ${row.invoiceNumber}`}
                    className="size-4 cursor-pointer rounded border-slate-300 text-primary focus:ring-primary/40"
                    checked={selected.has(row.id)}
                    onChange={() => { }}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleOne(row.id);
                    }}
                />
            ),
            className: 'w-10',
        },
        {
            key: 'number',
            header: 'Invoice #',
            cell: (i) => (
                <Link
                    to={`/sales/invoices/${i.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-primary hover:underline"
                >
                    {i.invoiceNumber}
                </Link>
            ),
        },
        {
            key: 'date',
            header: 'Date',
            cell: (i) => <span className="text-slate-600">{fmtDate(i.invoiceDate)}</span>,
        },
        {
            key: 'customer',
            header: 'Customer',
            cell: (i) => <span className="font-medium text-slate-800">{i.customerName || '—'}</span>,
        },
        {
            key: 'order',
            header: 'Order',
            cell: (i) =>
                i.orderId ? (
                    <Link
                        to={`/orders/${i.orderId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary hover:underline"
                    >
                        {i.orderNumber || `#${i.orderId}`}
                    </Link>
                ) : (
                    <span className="text-slate-400">—</span>
                ),
        },
        {
            key: 'value',
            header: 'Value',
            align: 'right',
            cell: (i) => (
                <span className="font-semibold text-slate-800">{formatINR(i.grandTotal)}</span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            cell: (i) => <StatusBadge status={STATUS_LABEL[i.status]} />,
        },
    ];

    const aging = agingQuery.data;

    return (
        <div className="p-6 md:p-8">
            <PageHeader
                title="Customer Invoices"
                description="Tax invoices raised against confirmed sales orders."
                breadcrumb={[
                    { label: 'Sales', href: '/orders' },
                    { label: 'Invoices' },
                ]}
            />

            <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label={`0–30 days${aging ? ` · ${aging['0-30'].count}` : ''}`}
                    value={aging ? formatINR(aging['0-30'].total) : '—'}
                    tone="emerald"
                />
                <StatCard
                    label={`31–60 days${aging ? ` · ${aging['31-60'].count}` : ''}`}
                    value={aging ? formatINR(aging['31-60'].total) : '—'}
                    tone="amber"
                />
                <StatCard
                    label={`61–90 days${aging ? ` · ${aging['61-90'].count}` : ''}`}
                    value={aging ? formatINR(aging['61-90'].total) : '—'}
                    tone="red"
                />
                <StatCard
                    label={`90+ days${aging ? ` · ${aging['90+'].count}` : ''}`}
                    value={aging ? formatINR(aging['90+'].total) : '—'}
                    tone="red"
                />
            </div>

            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search by invoice #, customer…"
                filters={
                    <>
                        <Select
                            aria-label="Status"
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value as InvoiceApiStatus | '')
                            }
                            className="w-44"
                        >
                            <option value="">All statuses</option>
                            {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                    {STATUS_LABEL[s]}
                                </option>
                            ))}
                        </Select>
                        <Input
                            type="date"
                            aria-label="From date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="w-40"
                        />
                        <Input
                            type="date"
                            aria-label="To date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-40"
                        />
                        <Button variant="ghost" size="sm" onClick={reset}>
                            Reset
                        </Button>
                    </>
                }
                actions={
                    <Button variant="outline" onClick={handleBulkExport}>
                        <Download className="size-4" aria-hidden="true" />
                        Export
                    </Button>
                }
            />

            {invoicesQuery.isError && (
                <ErrorAlert
                    variant="danger"
                    title="Failed to load invoices"
                    description={extractErrorMessage(invoicesQuery.error)}
                    className="mb-3"
                />
            )}

            {selected.size > 0 && (
                <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm">
                    <Badge tone="blue">{selected.size}</Badge>
                    <span className="text-slate-700">
                        {selected.size === 1 ? 'invoice' : 'invoices'} selected
                    </span>
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBulkSend}
                            disabled={bulkSendMut.isPending}
                        >
                            <Send className="size-4" aria-hidden="true" />
                            Send drafts
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleBulkExport}>
                            <Download className="size-4" aria-hidden="true" />
                            Export selected
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                            Clear
                        </Button>
                    </div>
                </div>
            )}

            <DataTable<InvoiceListItem>
                columns={columns}
                rows={rows}
                rowKey={(i) => i.id}
                onRowClick={(i) => navigate(`/sales/invoices/${i.id}`)}
                caption="Customer invoices"
                emptyState={
                    invoicesQuery.isLoading ? (
                        <div className="flex items-center justify-center px-6 py-16 text-sm text-slate-500">
                            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                            Loading invoices…
                        </div>
                    ) : (
                        <div className="px-6 py-16 text-center text-sm text-slate-500">
                            No invoices match the current filters.
                        </div>
                    )
                }
            />

            <p className="mt-3 text-xs text-slate-500">
                Showing {rows.length} of {invoicesQuery.data?.count ?? 0} invoices.
            </p>
        </div>
    );
}
