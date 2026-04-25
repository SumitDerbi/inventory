import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    CheckCircle2,
    Download,
    FileSpreadsheet,
    FileText,
    ShoppingCart,
    UserPlus,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
    const [bulkReadyOpen, setBulkReadyOpen] = useState(false);
    const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

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

    // Clear selection when filters change.
    useEffect(() => {
        setSelected(new Set());
    }, [search, stageFilter, ownerFilter, readinessFilter, fromDate, toDate]);

    const allSelected =
        rows.length > 0 && rows.every((r) => selected.has(r.id));
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

    const selectedOrders = rows.filter((r) => selected.has(r.id));
    const readyEligible = selectedOrders.filter(
        (o) => o.stage === 'processing' && o.readinessFlag === 'green',
    );
    const readyBlocked = selectedOrders.filter(
        (o) => !(o.stage === 'processing' && o.readinessFlag === 'green'),
    );

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

            {selected.size > 0 && (
                <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm">
                    <Badge tone="blue">{selected.size}</Badge>
                    <span className="text-slate-700">
                        {selected.size === 1 ? 'order' : 'orders'} selected
                    </span>
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setBulkAssignOpen(true)}
                        >
                            <UserPlus className="size-4" aria-hidden="true" />
                            Reassign
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={readyEligible.length === 0}
                            title={
                                readyBlocked.length > 0
                                    ? `Blocked: ${readyBlocked
                                        .map((o) => o.orderNumber)
                                        .join(', ')}`
                                    : undefined
                            }
                            onClick={() => setBulkReadyOpen(true)}
                        >
                            <CheckCircle2 className="size-4" aria-hidden="true" />
                            Mark ready ({readyEligible.length})
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportAs('csv')}
                        >
                            <Download className="size-4" aria-hidden="true" />
                            Export selected
                        </Button>
                        <Button variant="ghost" size="sm" onClick={clearSelection}>
                            Clear
                        </Button>
                    </div>
                </div>
            )}

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

            <BulkAssignOrdersDialog
                open={bulkAssignOpen}
                onOpenChange={setBulkAssignOpen}
                count={selected.size}
                onConfirm={(userId) => {
                    const u = SALES_USERS.find((x) => x.id === userId);
                    push({
                        variant: 'success',
                        title: 'Bulk reassigned',
                        description: `${selected.size} orders reassigned to ${u?.name ?? 'user'}.`,
                    });
                    clearSelection();
                    setBulkAssignOpen(false);
                }}
            />
            <BulkReadyDialog
                open={bulkReadyOpen}
                onOpenChange={setBulkReadyOpen}
                eligible={readyEligible.map((o) => o.orderNumber)}
                blocked={readyBlocked.map((o) => o.orderNumber)}
                onConfirm={() => {
                    push({
                        variant: 'success',
                        title: 'Marked ready',
                        description: `${readyEligible.length} orders advanced to Ready.`,
                    });
                    clearSelection();
                    setBulkReadyOpen(false);
                }}
            />
        </div>
    );
}

function BulkAssignOrdersDialog({
    open,
    onOpenChange,
    count,
    onConfirm,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    count: number;
    onConfirm: (userId: string) => void;
}) {
    const [userId, setUserId] = useState('');
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reassign orders</DialogTitle>
                    <DialogDescription>
                        Pick the new owner for {count} selected order
                        {count === 1 ? '' : 's'}.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody>
                    <FormField label="Assignee" required>
                        <Select
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                        >
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
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={() => onConfirm(userId)} disabled={!userId}>
                        Reassign
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function BulkReadyDialog({
    open,
    onOpenChange,
    eligible,
    blocked,
    onConfirm,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    eligible: string[];
    blocked: string[];
    onConfirm: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
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
                            <p className="text-xs font-semibold uppercase text-emerald-600">
                                Eligible
                            </p>
                            <p className="text-sm text-slate-600">
                                {eligible.join(', ')}
                            </p>
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
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={eligible.length === 0}
                    >
                        Mark ready
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
