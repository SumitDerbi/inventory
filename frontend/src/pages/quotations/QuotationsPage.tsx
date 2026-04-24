import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Download,
    FileSpreadsheet,
    FileText,
    Plus,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
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
import {
    currentVersion,
    quotations,
    versionTotals,
} from '@/mocks/quotations';
import { users, userById } from '@/mocks/users';

const DATE_FMT = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
});

function fmtDate(iso: string) {
    return DATE_FMT.format(new Date(iso));
}

const SALES_USERS = users.filter((u) =>
    ['sales_executive', 'sales_manager'].includes(u.role),
);

export default function QuotationsPage() {
    const navigate = useNavigate();
    const { push } = useToast();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<QuotationStatus | ''>('');
    const [ownerFilter, setOwnerFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return quotations
            .map((qt) => {
                const v = currentVersion(qt);
                const total = versionTotals(v).grandTotal;
                return { qt, v, total };
            })
            .filter(({ qt, v, total }) => {
                if (statusFilter && v.status !== statusFilter) return false;
                if (ownerFilter && qt.ownerId !== ownerFilter) return false;
                if (fromDate && new Date(qt.createdAt) < new Date(fromDate)) return false;
                if (toDate && new Date(qt.createdAt) > new Date(toDate)) return false;
                if (minAmount && total < Number(minAmount)) return false;
                if (maxAmount && total > Number(maxAmount)) return false;
                if (q) {
                    const hay =
                        `${qt.quotationNumber} ${qt.customerName} ${qt.companyName} ${qt.projectName}`.toLowerCase();
                    if (!hay.includes(q)) return false;
                }
                return true;
            });
    }, [
        search,
        statusFilter,
        ownerFilter,
        fromDate,
        toDate,
        minAmount,
        maxAmount,
    ]);

    function reset() {
        setSearch('');
        setStatusFilter('');
        setOwnerFilter('');
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

    type Row = (typeof rows)[number];

    const columns: DataTableColumn<Row>[] = [
        {
            key: 'number',
            header: 'Quote #',
            cell: ({ qt }) => (
                <Link
                    to={`/quotations/${qt.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-primary hover:underline"
                >
                    {qt.quotationNumber}
                </Link>
            ),
        },
        {
            key: 'date',
            header: 'Date',
            cell: ({ qt }) => (
                <span className="text-slate-600">{fmtDate(qt.createdAt)}</span>
            ),
        },
        {
            key: 'customer',
            header: 'Customer',
            cell: ({ qt }) => (
                <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">
                        {qt.customerName}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                        {qt.companyName}
                    </p>
                </div>
            ),
        },
        {
            key: 'project',
            header: 'Project',
            cell: ({ qt }) => (
                <span className="text-slate-600">{qt.projectName}</span>
            ),
        },
        {
            key: 'version',
            header: 'Ver.',
            align: 'center',
            cell: ({ qt }) => (
                <span className="inline-flex min-w-[2rem] justify-center rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600">
                    v{qt.currentVersion}
                </span>
            ),
        },
        {
            key: 'total',
            header: 'Total',
            align: 'right',
            cell: ({ total }) => (
                <span className="font-semibold text-slate-800">
                    {formatINR(total)}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            cell: ({ v }) => <StatusBadge status={statusLabel(v.status)} />,
        },
        {
            key: 'validity',
            header: 'Valid until',
            cell: ({ v }) => {
                const expired = new Date(v.validUntil).getTime() < Date.now();
                return (
                    <span className={expired ? 'text-red-600' : 'text-slate-600'}>
                        {fmtDate(v.validUntil)}
                    </span>
                );
            },
        },
        {
            key: 'owner',
            header: 'Owner',
            cell: ({ qt }) => (
                <span className="text-slate-600">
                    {userById(qt.ownerId)?.name ?? '—'}
                </span>
            ),
        },
    ];

    return (
        <div className="p-6 md:p-8">
            <PageHeader
                title="Quotations"
                description="Track proposals, revisions, approvals and customer communications."
                actions={
                    <Button
                        onClick={() =>
                            push({
                                variant: 'info',
                                title: 'Create flow',
                                description:
                                    'Quotations are created from an inquiry — open an inquiry and use "Convert to Quotation".',
                            })
                        }
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
                        <Select
                            aria-label="Owner"
                            value={ownerFilter}
                            onChange={(e) => setOwnerFilter(e.target.value)}
                            className="w-44"
                        >
                            <option value="">All owners</option>
                            {SALES_USERS.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name}
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

            <DataTable<Row>
                columns={columns}
                rows={rows}
                rowKey={(r) => r.qt.id}
                onRowClick={(r: Row) => navigate(`/quotations/${r.qt.id}`)}
                caption="Quotations"
                emptyState={
                    <div className="px-6 py-16 text-center text-sm text-slate-500">
                        No quotations match the current filters.
                    </div>
                }
            />

            <p className="mt-3 text-xs text-slate-500">
                Showing {rows.length} of {quotations.length} quotations.
            </p>
        </div>
    );
}
