import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Download,
    FileSpreadsheet,
    FileText,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
    UserPlus,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { Select } from '@/components/ui/FormField';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useToast } from '@/components/ui/Toast';
import {
    INQUIRY_PRIORITIES,
    INQUIRY_STATUSES,
    inquiryTypeLabel,
    priorityLabel,
    statusLabel,
} from '@/lib/inquiryStatus';
import type { InquiryPriority, InquiryStatus } from '@/lib/inquiryStatus';
import { inquiries, type Inquiry } from '@/mocks/inquiries';
import { inquirySources, sourceById } from '@/mocks/inquirySources';
import { users, userById } from '@/mocks/users';
import { InquiryFormDrawer } from './InquiryFormDrawer';

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

export default function InquiriesPage() {
    const navigate = useNavigate();
    const { push } = useToast();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<InquiryStatus | ''>('');
    const [priorityFilter, setPriorityFilter] = useState<InquiryPriority | ''>('');
    const [sourceFilter, setSourceFilter] = useState('');
    const [assignedFilter, setAssignedFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingInquiry, setEditingInquiry] = useState<Inquiry | null>(null);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return inquiries.filter((i) => {
            if (statusFilter && i.status !== statusFilter) return false;
            if (priorityFilter && i.priority !== priorityFilter) return false;
            if (sourceFilter && i.sourceId !== sourceFilter) return false;
            if (assignedFilter && i.assignedTo !== assignedFilter) return false;
            if (fromDate && new Date(i.createdAt) < new Date(fromDate)) return false;
            if (toDate) {
                const end = new Date(toDate);
                end.setHours(23, 59, 59, 999);
                if (new Date(i.createdAt) > end) return false;
            }
            if (q) {
                const hay = [
                    i.inquiryNumber,
                    i.customerName,
                    i.companyName,
                    i.mobile,
                    i.email,
                    i.projectName,
                    i.city,
                ]
                    .join(' ')
                    .toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [
        search,
        statusFilter,
        priorityFilter,
        sourceFilter,
        assignedFilter,
        fromDate,
        toDate,
    ]);

    const allSelected =
        filtered.length > 0 && filtered.every((r) => selected.has(r.id));
    const someSelected = !allSelected && filtered.some((r) => selected.has(r.id));

    function toggleAll() {
        setSelected((curr) => {
            if (allSelected) {
                const next = new Set(curr);
                filtered.forEach((r) => next.delete(r.id));
                return next;
            }
            const next = new Set(curr);
            filtered.forEach((r) => next.add(r.id));
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

    function clearSelection() {
        setSelected(new Set());
    }

    function clearFilters() {
        setSearch('');
        setStatusFilter('');
        setPriorityFilter('');
        setSourceFilter('');
        setAssignedFilter('');
        setFromDate('');
        setToDate('');
    }

    function exportAs(format: 'CSV' | 'Excel' | 'PDF') {
        push({
            variant: 'info',
            title: 'Export queued',
            description: `${filtered.length} inquiries → ${format}. We'll email you when ready.`,
        });
    }

    const columns: DataTableColumn<Inquiry>[] = [
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
                    aria-label={`Select ${row.inquiryNumber}`}
                    className="size-4 cursor-pointer rounded border-slate-300 text-primary focus:ring-primary/40"
                    checked={selected.has(row.id)}
                    onChange={() => toggleOne(row.id)}
                    onClick={(e) => e.stopPropagation()}
                />
            ),
            className: 'w-10',
        },
        {
            key: 'inquiryNumber',
            header: 'Inquiry #',
            cell: (row) => (
                <Link
                    to={`/inquiries/${row.id}`}
                    className="font-medium text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                >
                    {row.inquiryNumber}
                </Link>
            ),
            className: 'whitespace-nowrap',
        },
        {
            key: 'createdAt',
            header: 'Date',
            cell: (row) => (
                <span className="whitespace-nowrap text-slate-500">
                    {fmtDate(row.createdAt)}
                </span>
            ),
            className: 'w-32',
        },
        {
            key: 'customer',
            header: 'Customer',
            cell: (row) => (
                <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">
                        {row.customerName}
                    </p>
                    {row.companyName && (
                        <p className="truncate text-xs text-slate-400">
                            {row.companyName}
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: 'mobile',
            header: 'Mobile',
            cell: (row) => (
                <span className="whitespace-nowrap text-slate-600">{row.mobile}</span>
            ),
            className: 'w-36',
        },
        {
            key: 'project',
            header: 'Project',
            cell: (row) => (
                <span className="line-clamp-1 text-slate-700">
                    {row.projectName || '—'}
                </span>
            ),
        },
        {
            key: 'source',
            header: 'Source',
            cell: (row) => (
                <span className="text-slate-600">
                    {sourceById(row.sourceId)?.name ?? '—'}
                </span>
            ),
            className: 'w-32',
        },
        {
            key: 'type',
            header: 'Type',
            cell: (row) => (
                <span className="text-slate-600">{inquiryTypeLabel(row.inquiryType)}</span>
            ),
            className: 'w-32',
        },
        {
            key: 'priority',
            header: 'Priority',
            cell: (row) => (
                <PriorityBadge priority={priorityLabel(row.priority)} />
            ),
            className: 'w-28',
        },
        {
            key: 'status',
            header: 'Status',
            cell: (row) => <StatusBadge status={statusLabel(row.status)} />,
            className: 'w-32',
        },
        {
            key: 'assigned',
            header: 'Assigned',
            cell: (row) => (
                <span className="whitespace-nowrap text-slate-600">
                    {userById(row.assignedTo)?.name ?? '—'}
                </span>
            ),
            className: 'w-36',
        },
        {
            key: 'actions',
            header: '',
            cell: (row) => (
                <RowActions
                    row={row}
                    onEdit={() => {
                        setEditingInquiry(row);
                        setDrawerOpen(true);
                    }}
                />
            ),
            className: 'w-10',
            align: 'right',
        },
    ];

    return (
        <div className="p-6 md:p-8">
            <PageHeader
                title="Inquiries"
                description={`${filtered.length} of ${inquiries.length} inquiries`}
                actions={
                    <Button
                        onClick={() => {
                            setEditingInquiry(null);
                            setDrawerOpen(true);
                        }}
                    >
                        <Plus className="size-4" aria-hidden="true" />
                        New inquiry
                    </Button>
                }
            />

            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search by #, customer, mobile, project…"
                filters={
                    <>
                        <Select
                            aria-label="Status"
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value as InquiryStatus | '')
                            }
                            className="h-9 w-36"
                        >
                            <option value="">All statuses</option>
                            {INQUIRY_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {statusLabel(s)}
                                </option>
                            ))}
                        </Select>
                        <Select
                            aria-label="Priority"
                            value={priorityFilter}
                            onChange={(e) =>
                                setPriorityFilter(e.target.value as InquiryPriority | '')
                            }
                            className="h-9 w-32"
                        >
                            <option value="">All priorities</option>
                            {INQUIRY_PRIORITIES.map((p) => (
                                <option key={p} value={p}>
                                    {priorityLabel(p)}
                                </option>
                            ))}
                        </Select>
                        <Select
                            aria-label="Source"
                            value={sourceFilter}
                            onChange={(e) => setSourceFilter(e.target.value)}
                            className="h-9 w-36"
                        >
                            <option value="">All sources</option>
                            {inquirySources.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </Select>
                        <Select
                            aria-label="Assigned to"
                            value={assignedFilter}
                            onChange={(e) => setAssignedFilter(e.target.value)}
                            className="h-9 w-40"
                        >
                            <option value="">All assignees</option>
                            {SALES_USERS.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name}
                                </option>
                            ))}
                        </Select>
                        <input
                            type="date"
                            aria-label="From date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
                        />
                        <input
                            type="date"
                            aria-label="To date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
                        />
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
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
                            <DropdownMenuLabel>Export current view</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => exportAs('CSV')}>
                                <FileText className="size-4" aria-hidden="true" />
                                CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => exportAs('Excel')}>
                                <FileSpreadsheet className="size-4" aria-hidden="true" />
                                Excel
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => exportAs('PDF')}>
                                <FileText className="size-4" aria-hidden="true" />
                                PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                }
            />

            {selected.size > 0 && (
                <div className="mb-3 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm">
                    <Badge tone="blue">{selected.size}</Badge>
                    <span className="text-slate-700">
                        {selected.size === 1 ? 'inquiry' : 'inquiries'} selected
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                push({
                                    variant: 'success',
                                    title: 'Bulk assign',
                                    description: `${selected.size} inquiries reassigned.`,
                                })
                            }
                        >
                            <UserPlus className="size-4" aria-hidden="true" />
                            Assign
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                push({
                                    variant: 'success',
                                    title: 'Bulk status update',
                                    description: `${selected.size} inquiries updated.`,
                                })
                            }
                        >
                            Change status
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportAs('CSV')}
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

            <DataTable
                columns={columns}
                rows={filtered}
                rowKey={(row) => row.id}
                onRowClick={(row) => navigate(`/inquiries/${row.id}`)}
            />

            <InquiryFormDrawer
                open={drawerOpen}
                onOpenChange={(open) => {
                    setDrawerOpen(open);
                    if (!open) setEditingInquiry(null);
                }}
                initial={editingInquiry}
            />
        </div>
    );
}

function RowActions({
    row,
    onEdit,
}: {
    row: Inquiry;
    onEdit: () => void;
}) {
    const { push } = useToast();
    return (
        <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Actions for ${row.inquiryNumber}`}
                    >
                        <MoreHorizontal className="size-4" aria-hidden="true" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={onEdit}>
                        <Pencil className="size-4" aria-hidden="true" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onSelect={() =>
                            push({
                                variant: 'success',
                                title: 'Reassigned',
                                description: `${row.inquiryNumber} reassigned.`,
                            })
                        }
                    >
                        <UserPlus className="size-4" aria-hidden="true" />
                        Reassign
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        destructive
                        onSelect={() =>
                            push({
                                variant: 'success',
                                title: 'Inquiry archived',
                                description: row.inquiryNumber,
                            })
                        }
                    >
                        <Trash2 className="size-4" aria-hidden="true" />
                        Archive
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
