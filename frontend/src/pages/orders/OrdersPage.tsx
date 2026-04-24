import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Download,
    FileSpreadsheet,
    FileText,
    ShoppingCart,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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
import { ORDER_STAGES, stageLabel, type OrderStage } from '@/lib/orderStatus';
import { orders } from '@/mocks/orders';
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

const READINESS_LABEL: Record<'green' | 'amber' | 'red', string> = {
    green: 'Ready',
    amber: 'Partial',
    red: 'Blocked',
};

const READINESS_TONE: Record<'green' | 'amber' | 'red', 'emerald' | 'amber' | 'red'> = {
    green: 'emerald',
    amber: 'amber',
    red: 'red',
};

export default function OrdersPage() {
    const navigate = useNavigate();
    const { push } = useToast();

    const [search, setSearch] = useState('');
    const [stageFilter, setStageFilter] = useState<OrderStage | ''>('');
    const [ownerFilter, setOwnerFilter] = useState('');
    const [readinessFilter, setReadinessFilter] = useState<'' | 'green' | 'amber' | 'red'>('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return orders.filter((o) => {
            if (stageFilter && o.stage !== stageFilter) return false;
            if (ownerFilter && o.ownerId !== ownerFilter) return false;
            if (readinessFilter && o.readinessFlag !== readinessFilter) return false;
            if (fromDate && new Date(o.confirmedAt) < new Date(fromDate)) return false;
            if (toDate && new Date(o.confirmedAt) > new Date(toDate)) return false;
            if (q) {
                const hay = `${o.orderNumber} ${o.quotationNumber} ${o.customerName} ${o.companyName} ${o.projectName}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [search, stageFilter, ownerFilter, readinessFilter, fromDate, toDate]);

    function reset() {
        setSearch('');
        setStageFilter('');
        setOwnerFilter('');
        setReadinessFilter('');
        setFromDate('');
        setToDate('');
    }

    function exportAs(format: 'csv' | 'excel' | 'pdf') {
        push({
            variant: 'info',
            title: 'Export queued',
            description: `${rows.length} orders will be exported as ${format.toUpperCase()}.`,
        });
    }

    type Row = (typeof orders)[number];

    const columns: DataTableColumn<Row>[] = [
        {
            key: 'number',
            header: 'SO #',
            cell: (o) => (
                <Link
                    to={`/orders/${o.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-primary hover:underline"
                >
                    {o.orderNumber}
                </Link>
            ),
        },
        {
            key: 'date',
            header: 'Date',
            cell: (o) => <span className="text-slate-600">{fmtDate(o.confirmedAt)}</span>,
        },
        {
            key: 'customer',
            header: 'Customer',
            cell: (o) => (
                <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">{o.customerName}</p>
                    <p className="truncate text-xs text-slate-500">{o.companyName}</p>
                </div>
            ),
        },
        {
            key: 'quote',
            header: 'Quote #',
            cell: (o) => (
                <Link
                    to={`/quotations/${o.quotationId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-primary hover:underline"
                >
                    {o.quotationNumber}
                </Link>
            ),
        },
        {
            key: 'value',
            header: 'Value',
            align: 'right',
            cell: (o) => (
                <span className="font-semibold text-slate-800">
                    {formatINR(o.totalValue)}
                </span>
            ),
        },
        {
            key: 'stage',
            header: 'Stage',
            cell: (o) => <StatusBadge status={stageLabel(o.stage)} />,
        },
        {
            key: 'delivery',
            header: 'Delivery',
            cell: (o) => <span className="text-slate-600">{fmtDate(o.expectedDeliveryDate)}</span>,
        },
        {
            key: 'readiness',
            header: 'Readiness',
            cell: (o) => (
                <Badge tone={READINESS_TONE[o.readinessFlag]}>
                    {READINESS_LABEL[o.readinessFlag]}
                </Badge>
            ),
        },
        {
            key: 'owner',
            header: 'Owner',
            cell: (o) => (
                <span className="text-slate-600">{userById(o.ownerId)?.name ?? '—'}</span>
            ),
        },
    ];

    return (
        <div className="p-6 md:p-8">
            <PageHeader
                title="Sales Orders"
                description="Confirmed orders, readiness, delivery plans and stage transitions."
                actions={
                    <Button
                        onClick={() =>
                            push({
                                variant: 'info',
                                title: 'Create flow',
                                description:
                                    'Orders are created by converting an approved quotation. Open a quotation and use "Convert to Order".',
                            })
                        }
                    >
                        <ShoppingCart className="size-4" aria-hidden="true" />
                        New order
                    </Button>
                }
            />

            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search by SO #, quote, customer, project…"
                filters={
                    <>
                        <Select
                            aria-label="Stage"
                            value={stageFilter}
                            onChange={(e) => setStageFilter(e.target.value as OrderStage | '')}
                            className="w-40"
                        >
                            <option value="">All stages</option>
                            {ORDER_STAGES.map((s) => (
                                <option key={s} value={s}>
                                    {stageLabel(s)}
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
                        <Select
                            aria-label="Readiness"
                            value={readinessFilter}
                            onChange={(e) =>
                                setReadinessFilter(
                                    e.target.value as '' | 'green' | 'amber' | 'red',
                                )
                            }
                            className="w-36"
                        >
                            <option value="">All readiness</option>
                            <option value="green">Ready</option>
                            <option value="amber">Partial</option>
                            <option value="red">Blocked</option>
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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <Download className="size-4" aria-hidden="true" />
                                Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Format</DropdownMenuLabel>
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
                rowKey={(o) => o.id}
                onRowClick={(o) => navigate(`/orders/${o.id}`)}
                caption="Sales orders"
                emptyState={
                    <div className="px-6 py-16 text-center text-sm text-slate-500">
                        No orders match the current filters.
                    </div>
                }
            />

            <p className="mt-3 text-xs text-slate-500">
                Showing {rows.length} of {orders.length} orders.
            </p>
        </div>
    );
}
