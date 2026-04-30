import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    CheckCircle2,
    Download,
    FileSpreadsheet,
    FileText,
    Loader2,
    UserPlus,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FormField, Select, Input } from '@/components/ui/FormField';
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useToast } from '@/components/ui/Toast';
import { formatINR } from '@/lib/format';
import { extractErrorMessage } from '@/services/apiClient';
import {
    useBulkAssignOrders,
    useBulkExportOrders,
    useBulkReadyOrders,
    useOrdersQuery,
} from '@/hooks/useOrders';
import type {
    OrderApiStatus,
    SalesOrderListItem,
} from '@/services/orders';
import { users } from '@/mocks/users';

const DATE_FMT = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
});

function fmtDate(iso: string) {
    if (!iso) return '—';
    return DATE_FMT.format(new Date(iso));
}

const STATUS_LABEL: Record<OrderApiStatus, string> = {
    draft: 'Draft',
    confirmed: 'Confirmed',
    processing: 'Processing',
    ready_to_dispatch: 'Ready',
    partially_dispatched: 'Partially dispatched',
    fully_dispatched: 'Dispatched',
    installed: 'Installed',
    closed: 'Closed',
    cancelled: 'Cancelled',
};

const STATUS_OPTIONS: OrderApiStatus[] = [
    'draft',
    'confirmed',
    'processing',
    'ready_to_dispatch',
    'partially_dispatched',
    'fully_dispatched',
    'installed',
    'closed',
    'cancelled',
];

const SALES_USERS = users.filter((u) =>
    ['sales_executive', 'sales_manager'].includes(u.role),
);

export default function OrdersPage() {
    const navigate = useNavigate();
    const { push } = useToast();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderApiStatus | ''>('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
    const [bulkReadyOpen, setBulkReadyOpen] = useState(false);
    const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

    const ordersQuery = useOrdersQuery({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        pageSize: 100,
        ordering: '-order_date',
    });

    const bulkAssignMut = useBulkAssignOrders();
    const bulkReadyMut = useBulkReadyOrders();
    const bulkExportMut = useBulkExportOrders();

    const allRows: SalesOrderListItem[] = useMemo(
        () => ordersQuery.data?.results ?? [],
        [ordersQuery.data],
    );

    const rows = useMemo(() => {
        return allRows.filter((o) => {
            if (fromDate && new Date(o.orderDate) < new Date(fromDate)) return false;
            if (toDate && new Date(o.orderDate) > new Date(toDate)) return false;
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

    function toggleOne(id: string, shift = false) {
        setSelected((curr) => {
            const next = new Set(curr);
            if (shift && lastSelectedId) {
                const ids = rows.map((r) => r.id);
                const a = ids.indexOf(lastSelectedId);
                const b = ids.indexOf(id);
                if (a >= 0 && b >= 0) {
                    const [lo, hi] = a < b ? [a, b] : [b, a];
                    const targetState = !curr.has(id);
                    for (let i = lo; i <= hi; i++) {
                        if (targetState) next.add(ids[i]);
                        else next.delete(ids[i]);
                    }
                    return next;
                }
            }
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
        setLastSelectedId(id);
    }

    function clearSelection() {
        setSelected(new Set());
    }

    const selectedRows = rows.filter((r) => selected.has(r.id));
    const readyEligible = selectedRows.filter((o) => o.status === 'processing');
    const readyBlocked = selectedRows.filter((o) => o.status !== 'processing');

    function reset() {
        setSearch('');
        setStatusFilter('');
        setFromDate('');
        setToDate('');
    }

    async function handleBulkExport(format: 'csv' | 'excel' | 'pdf') {
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
                title: `Exported ${ok} order${ok === 1 ? '' : 's'} (${format.toUpperCase()})`,
            });
        } catch (e) {
            push({ variant: 'danger', title: 'Export failed', description: extractErrorMessage(e) });
        }
    }

    const columns: DataTableColumn<SalesOrderListItem>[] = [
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
                    aria-label={`Select ${row.orderNumber}`}
                    className="size-4 cursor-pointer rounded border-slate-300 text-primary focus:ring-primary/40"
                    checked={selected.has(row.id)}
                    onChange={() => { }}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleOne(row.id, e.shiftKey);
                    }}
                />
            ),
            className: 'w-10',
        },
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
            cell: (o) => <span className="text-slate-600">{fmtDate(o.orderDate)}</span>,
        },
        {
            key: 'customer',
            header: 'Customer',
            cell: (o) => (
                <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">{o.customerName || '—'}</p>
                    <p className="truncate text-xs text-slate-500">{o.companyName}</p>
                </div>
            ),
        },
        {
            key: 'project',
            header: 'Project',
            cell: (o) => <span className="text-slate-600">{o.projectName || '—'}</span>,
        },
        {
            key: 'value',
            header: 'Value',
            align: 'right',
            cell: (o) => (
                <span className="font-semibold text-slate-800">{formatINR(o.grandTotal)}</span>
            ),
        },
        {
            key: 'status',
            header: 'Stage',
            cell: (o) => <StatusBadge status={STATUS_LABEL[o.status]} />,
        },
    ];

    return (
        <div className="p-6 md:p-8">
            <PageHeader
                title="Sales Orders"
                description="Confirmed orders, readiness, dispatch and stage transitions."
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
                        New order
                    </Button>
                }
            />

            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search by SO #, customer, project…"
                filters={
                    <>
                        <Select
                            aria-label="Status"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as OrderApiStatus | '')}
                            className="w-44"
                        >
                            <option value="">All stages</option>
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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <Download className="size-4" aria-hidden="true" />
                                Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Format</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => handleBulkExport('csv')}>
                                <FileText className="size-4" aria-hidden="true" />
                                CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleBulkExport('excel')}>
                                <FileSpreadsheet className="size-4" aria-hidden="true" />
                                Excel
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleBulkExport('pdf')}>
                                <FileText className="size-4" aria-hidden="true" />
                                PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                }
            />

            {ordersQuery.isError && (
                <ErrorAlert
                    variant="danger"
                    title="Failed to load orders"
                    description={extractErrorMessage(ordersQuery.error)}
                    className="mb-3"
                />
            )}

            {selected.size > 0 && (
                <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm">
                    <Badge tone="blue">{selected.size}</Badge>
                    <span className="text-slate-700">
                        {selected.size === 1 ? 'order' : 'orders'} selected
                    </span>
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setBulkAssignOpen(true)}>
                            <UserPlus className="size-4" aria-hidden="true" />
                            Reassign
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={readyEligible.length === 0}
                            title={
                                readyBlocked.length > 0
                                    ? `Blocked: ${readyBlocked.map((o) => o.orderNumber).join(', ')}`
                                    : undefined
                            }
                            onClick={() => setBulkReadyOpen(true)}
                        >
                            <CheckCircle2 className="size-4" aria-hidden="true" />
                            Mark ready ({readyEligible.length})
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleBulkExport('csv')}>
                            <Download className="size-4" aria-hidden="true" />
                            Export selected
                        </Button>
                        <Button variant="ghost" size="sm" onClick={clearSelection}>
                            Clear
                        </Button>
                    </div>
                </div>
            )}

            <DataTable<SalesOrderListItem>
                columns={columns}
                rows={rows}
                rowKey={(o) => o.id}
                onRowClick={(o) => navigate(`/orders/${o.id}`)}
                caption="Sales orders"
                emptyState={
                    ordersQuery.isLoading ? (
                        <div className="flex items-center justify-center px-6 py-16 text-sm text-slate-500">
                            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                            Loading orders…
                        </div>
                    ) : (
                        <div className="px-6 py-16 text-center text-sm text-slate-500">
                            No orders match the current filters.
                        </div>
                    )
                }
            />

            <p className="mt-3 text-xs text-slate-500">
                Showing {rows.length} of {ordersQuery.data?.count ?? 0} orders.
            </p>

            {bulkAssignOpen && (
                <BulkAssignOrdersDialog
                    count={selected.size}
                    submitting={bulkAssignMut.isPending}
                    onClose={() => setBulkAssignOpen(false)}
                    onConfirm={async (userId) => {
                        try {
                            const results = await bulkAssignMut.mutateAsync({
                                ids: Array.from(selected),
                                assignedSalesExecId: userId,
                            });
                            const ok = results.filter((r) => r.status === 'ok').length;
                            const err = results.length - ok;
                            push({
                                variant: err > 0 ? 'warning' : 'success',
                                title: 'Bulk reassigned',
                                description:
                                    err > 0
                                        ? `${ok} succeeded, ${err} failed.`
                                        : `${ok} order${ok === 1 ? '' : 's'} reassigned.`,
                            });
                            clearSelection();
                            setBulkAssignOpen(false);
                        } catch (e) {
                            push({
                                variant: 'danger',
                                title: 'Reassign failed',
                                description: extractErrorMessage(e),
                            });
                        }
                    }}
                />
            )}

            {bulkReadyOpen && (
                <BulkReadyDialog
                    eligible={readyEligible.map((o) => o.orderNumber)}
                    blocked={readyBlocked.map((o) => o.orderNumber)}
                    submitting={bulkReadyMut.isPending}
                    onClose={() => setBulkReadyOpen(false)}
                    onConfirm={async () => {
                        try {
                            const ids = readyEligible.map((o) => o.id);
                            const results = await bulkReadyMut.mutateAsync(ids);
                            const ok = results.filter((r) => r.status === 'ok').length;
                            const err = results.length - ok;
                            push({
                                variant: err > 0 ? 'warning' : 'success',
                                title: 'Marked ready',
                                description:
                                    err > 0
                                        ? `${ok} advanced, ${err} blocked by gates.`
                                        : `${ok} order${ok === 1 ? '' : 's'} advanced to Ready.`,
                            });
                            clearSelection();
                            setBulkReadyOpen(false);
                        } catch (e) {
                            push({
                                variant: 'danger',
                                title: 'Bulk advance failed',
                                description: extractErrorMessage(e),
                            });
                        }
                    }}
                />
            )}
        </div>
    );
}

function BulkAssignOrdersDialog({
    count,
    submitting,
    onClose,
    onConfirm,
}: {
    count: number;
    submitting: boolean;
    onClose: () => void;
    onConfirm: (userId: string) => void;
}) {
    const [userId, setUserId] = useState('');
    return (
        <Dialog open onOpenChange={(v) => !v && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reassign orders</DialogTitle>
                    <DialogDescription>
                        Pick the new owner for {count} selected order{count === 1 ? '' : 's'}.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody>
                    <FormField label="Assignee" required>
                        <Select value={userId} onChange={(e) => setUserId(e.target.value)}>
                            <option value="">Select a user…</option>
                            {SALES_USERS.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name}
                                </option>
                            ))}
                        </Select>
                    </FormField>
                </DialogBody>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button onClick={() => onConfirm(userId)} disabled={!userId || submitting}>
                        {submitting ? 'Reassigning…' : 'Reassign'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function BulkReadyDialog({
    eligible,
    blocked,
    submitting,
    onClose,
    onConfirm,
}: {
    eligible: string[];
    blocked: string[];
    submitting: boolean;
    onClose: () => void;
    onConfirm: () => void;
}) {
    return (
        <Dialog open onOpenChange={(v) => !v && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Advance to Ready</DialogTitle>
                    <DialogDescription>
                        {eligible.length} order(s) will move to the Ready stage.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody>
                    {eligible.length > 0 && (
                        <div className="mb-3">
                            <p className="text-xs font-semibold uppercase text-emerald-600">Eligible</p>
                            <p className="text-sm text-slate-600">{eligible.join(', ')}</p>
                        </div>
                    )}
                    {blocked.length > 0 && (
                        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                            <p className="font-semibold">Skipped (gates not met)</p>
                            <p>{blocked.join(', ')}</p>
                        </div>
                    )}
                </DialogBody>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button onClick={onConfirm} disabled={eligible.length === 0 || submitting}>
                        {submitting ? 'Working…' : 'Mark ready'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
