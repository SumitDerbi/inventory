import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Download,
    FileSpreadsheet,
    FileText,
    Loader2,
    Plus,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Select, Input } from '@/components/ui/FormField';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useToast } from '@/components/ui/Toast';
import { formatINR } from '@/lib/format';
import {
    QUOTATION_STATUSES,
    statusLabel,
    type QuotationStatus,
} from '@/lib/quotationStatus';
import { extractErrorMessage } from '@/services/apiClient';
import { useQuotationsQuery } from '@/hooks/useQuotations';
import type { QuotationListItem } from '@/services/quotations';
import { NewQuotationDialog } from './NewQuotationDialog';

const DATE_FMT = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
});

function fmtDate(iso: string) {
    return DATE_FMT.format(new Date(iso));
}

export default function QuotationsPage() {
    const navigate = useNavigate();
    const { push } = useToast();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<QuotationStatus | ''>('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [createOpen, setCreateOpen] = useState(false);

    const quotationsQuery = useQuotationsQuery({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        pageSize: 100,
        ordering: '-quotation_date',
    });

    const allRows: QuotationListItem[] = useMemo(
        () => quotationsQuery.data?.results ?? [],
        [quotationsQuery.data],
    );

    // Date and amount range filtering on the client (backend filterset
    // does not yet expose these).
    const rows = useMemo(() => {
        return allRows.filter((q) => {
            if (fromDate && new Date(q.quotationDate) < new Date(fromDate)) return false;
            if (toDate && new Date(q.quotationDate) > new Date(toDate)) return false;
            if (minAmount && q.grandTotal < Number(minAmount)) return false;
            if (maxAmount && q.grandTotal > Number(maxAmount)) return false;
            return true;
        });
    }, [allRows, fromDate, toDate, minAmount, maxAmount]);

    function reset() {
        setSearch('');
        setStatusFilter('');
        setFromDate('');
        setToDate('');
        setMinAmount('');
        setMaxAmount('');
    }

    function exportAs(format: 'csv' | 'excel' | 'pdf') {
        push({
            variant: 'info',
            title: 'Export queued',
            description: `${rows.length} quotations will be exported as ${format.toUpperCase()}.`,
        });
    }

    const columns: DataTableColumn<QuotationListItem>[] = [
        {
            key: 'number',
            header: 'Quote #',
            cell: (q) => (
                <Link
                    to={`/quotations/${q.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-primary hover:underline"
                >
                    {q.quotationNumber}
                </Link>
            ),
        },
        {
            key: 'date',
            header: 'Date',
            cell: (q) => <span className="text-slate-600">{fmtDate(q.quotationDate)}</span>,
        },
        {
            key: 'customer',
            header: 'Customer',
            cell: (q) => (
                <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">
                        {q.customerName || '—'}
                    </p>
                    <p className="truncate text-xs text-slate-500">{q.companyName}</p>
                </div>
            ),
        },
        {
            key: 'project',
            header: 'Project',
            cell: (q) => <span className="text-slate-600">{q.projectName || '—'}</span>,
        },
        {
            key: 'version',
            header: 'Ver.',
            align: 'center',
            cell: (q) => (
                <span className="inline-flex min-w-[2rem] justify-center rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600">
                    v{q.versionNumber}
                </span>
            ),
        },
        {
            key: 'total',
            header: 'Total',
            align: 'right',
            cell: (q) => (
                <span className="font-semibold text-slate-800">{formatINR(q.grandTotal)}</span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            cell: (q) => <StatusBadge status={statusLabel(q.status)} />,
        },
        {
            key: 'validity',
            header: 'Valid until',
            cell: (q) => {
                const expired = new Date(q.validUntil).getTime() < Date.now();
                return (
                    <span className={expired ? 'text-red-600' : 'text-slate-600'}>
                        {fmtDate(q.validUntil)}
                    </span>
                );
            },
        },
    ];

    return (
        <div className="p-6 md:p-8">
            <PageHeader
                title="Quotations"
                description="Track proposals, revisions, approvals and customer communications."
                actions={
                    <Button
                        onClick={() => setCreateOpen(true)}
                    >
                        <Plus className="size-4" aria-hidden="true" />
                        New quotation
                    </Button>
                }
            />

            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search by quote #, customer, project…"
                filters={
                    <>
                        <Select
                            aria-label="Status"
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value as QuotationStatus | '')
                            }
                            className="w-44"
                        >
                            <option value="">All statuses</option>
                            {QUOTATION_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {statusLabel(s)}
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
                        <Input
                            type="number"
                            aria-label="Min amount"
                            value={minAmount}
                            onChange={(e) => setMinAmount(e.target.value)}
                            placeholder="Min ₹"
                            className="w-28"
                        />
                        <Input
                            type="number"
                            aria-label="Max amount"
                            value={maxAmount}
                            onChange={(e) => setMaxAmount(e.target.value)}
                            placeholder="Max ₹"
                            className="w-28"
                        />
                        <Button variant="ghost" size="sm" onClick={reset}>
                            Reset
                        </Button>
                    </>
                }
                actions={
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Download className="size-4" aria-hidden="true" />
                                Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Download as</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => exportAs('csv')}>
                                <FileText className="size-4" aria-hidden="true" />
                                CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => exportAs('excel')}>
                                <FileSpreadsheet className="size-4" aria-hidden="true" />
                                Excel
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => exportAs('pdf')}>
                                <FileText className="size-4" aria-hidden="true" />
                                PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                }
            />

            {quotationsQuery.isError ? (
                <ErrorAlert
                    title="Could not load quotations"
                    description={extractErrorMessage(
                        quotationsQuery.error,
                        'Please try again.',
                    )}
                />
            ) : (
                <DataTable<QuotationListItem>
                    columns={columns}
                    rows={rows}
                    rowKey={(q) => q.id}
                    onRowClick={(q) => navigate(`/quotations/${q.id}`)}
                    caption="Quotations"
                    emptyState={
                        quotationsQuery.isLoading ? (
                            <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-slate-500">
                                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                                Loading quotations…
                            </div>
                        ) : (
                            <div className="px-6 py-16 text-center text-sm text-slate-500">
                                No quotations match the current filters.
                            </div>
                        )
                    }
                />
            )}

            <p className="mt-3 text-xs text-slate-500">
                Showing {rows.length} of {quotationsQuery.data?.count ?? 0} quotations.
            </p>

            {createOpen && <NewQuotationDialog onClose={() => setCreateOpen(false)} />}
        </div>
    );
}
