import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GitMerge, Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { formatINR } from '@/lib/format';
import {
    customers,
    type Customer,
    type CustomerSegment,
    type CustomerStatus,
} from '@/mocks/customers';
import { MergeWizardDialog } from './MergeWizardDialog';

const SEGMENT_LABEL: Record<CustomerSegment, string> = {
    enterprise: 'Enterprise',
    mid_market: 'Mid-market',
    sme: 'SME',
};

const STATUS_TONE: Record<CustomerStatus, 'green' | 'neutral' | 'amber'> = {
    active: 'green',
    inactive: 'neutral',
    merged: 'amber',
};

export default function CustomersListPage() {
    const navigate = useNavigate();
    const { push } = useToast();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<CustomerStatus | ''>('');
    const [segmentFilter, setSegmentFilter] = useState<CustomerSegment | ''>('');
    const [territoryFilter, setTerritoryFilter] = useState('');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [mergeOpen, setMergeOpen] = useState(false);
    // Tick to force re-render after a merge mutates the in-memory mock.
    const [, setVersion] = useState(0);

    const territories = useMemo(
        () =>
            Array.from(
                new Set(customers.map((c) => c.territory).filter(Boolean) as string[]),
            ).sort(),
        [],
    );

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return customers.filter((c) => {
            if (statusFilter && c.status !== statusFilter) return false;
            if (segmentFilter && c.segment !== segmentFilter) return false;
            if (territoryFilter && c.territory !== territoryFilter) return false;
            if (q) {
                const hay = [
                    c.name,
                    c.legalName ?? '',
                    c.gstNumber ?? '',
                    c.primaryContact.phone,
                    c.primaryContact.email,
                ]
                    .join(' ')
                    .toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [search, statusFilter, segmentFilter, territoryFilter]);

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

    function toggleOne(id: string) {
        setSelected((curr) => {
            const next = new Set(curr);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    const selectedCustomers = customers.filter((c) => selected.has(c.id));

    const columns: DataTableColumn<Customer>[] = [
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
                    aria-label={`Select ${row.name}`}
                    className="size-4 cursor-pointer rounded border-slate-300 text-primary focus:ring-primary/40"
                    checked={selected.has(row.id)}
                    onChange={() => toggleOne(row.id)}
                    onClick={(e) => e.stopPropagation()}
                />
            ),
            className: 'w-10',
        },
        {
            key: 'name',
            header: 'Customer',
            cell: (c) => (
                <div className="min-w-0">
                    <Link
                        to={`/customers/${c.id}`}
                        className="font-medium text-primary hover:underline"
                    >
                        {c.name}
                    </Link>
                    {c.legalName && (
                        <p className="truncate text-xs text-slate-500">
                            {c.legalName}
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: 'gst',
            header: 'GST / PAN',
            cell: (c) => (
                <div className="text-xs text-slate-600">
                    <p>{c.gstNumber ?? '—'}</p>
                    {c.pan && <p className="text-slate-400">{c.pan}</p>}
                </div>
            ),
        },
        {
            key: 'contact',
            header: 'Primary contact',
            cell: (c) => (
                <div className="text-xs text-slate-600">
                    <p>{c.primaryContact.phone}</p>
                    <p className="truncate text-slate-400">
                        {c.primaryContact.email}
                    </p>
                </div>
            ),
        },
        {
            key: 'segment',
            header: 'Segment',
            cell: (c) => (
                <span className="text-sm text-slate-600">
                    {c.segment ? SEGMENT_LABEL[c.segment] : '—'}
                </span>
            ),
        },
        {
            key: 'territory',
            header: 'Territory',
            cell: (c) => (
                <span className="text-sm text-slate-600">
                    {c.territory ?? '—'}
                </span>
            ),
        },
        {
            key: 'ltv',
            header: 'Lifetime value',
            cell: (c) => (
                <span className="font-medium text-slate-700">
                    {formatINR(c.lifetimeValue)}
                </span>
            ),
            className: 'text-right',
        },
        {
            key: 'status',
            header: 'Status',
            cell: (c) => (
                <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
            ),
        },
    ];

    const canMerge =
        selectedCustomers.length === 2 &&
        selectedCustomers.every((c) => c.status !== 'merged');

    return (
        <div>
            <PageHeader
                title="Customers"
                description="Customer master records, contacts, and merge tools."
                actions={
                    <>
                        <Button
                            variant="outline"
                            disabled={!canMerge}
                            title={
                                !canMerge
                                    ? 'Select exactly two active customers to merge'
                                    : undefined
                            }
                            onClick={() => setMergeOpen(true)}
                        >
                            <GitMerge className="size-4" aria-hidden="true" />
                            Merge ({selectedCustomers.length})
                        </Button>
                        <Button onClick={() => navigate('/customers/new')}>
                            <Plus className="size-4" aria-hidden="true" />
                            New customer
                        </Button>
                    </>
                }
            />

            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search by name, GST, phone, email…"
                filters={
                    <>
                        <Select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(
                                    e.target.value as CustomerStatus | '',
                                )
                            }
                        >
                            <option value="">All statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="merged">Merged</option>
                        </Select>
                        <Select
                            value={segmentFilter}
                            onChange={(e) =>
                                setSegmentFilter(
                                    e.target.value as CustomerSegment | '',
                                )
                            }
                        >
                            <option value="">All segments</option>
                            <option value="enterprise">Enterprise</option>
                            <option value="mid_market">Mid-market</option>
                            <option value="sme">SME</option>
                        </Select>
                        <Select
                            value={territoryFilter}
                            onChange={(e) => setTerritoryFilter(e.target.value)}
                        >
                            <option value="">All territories</option>
                            {territories.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </Select>
                    </>
                }
            />

            <DataTable<Customer>
                columns={columns}
                rows={rows}
                rowKey={(c) => c.id}
                onRowClick={(c) => navigate(`/customers/${c.id}`)}
            />

            <p className="mt-3 text-xs text-slate-500">
                Showing {rows.length} of {customers.length} customers.
            </p>

            <MergeWizardDialog
                open={mergeOpen}
                onOpenChange={setMergeOpen}
                customers={selectedCustomers}
                onMerged={(targetId) => {
                    push({
                        variant: 'success',
                        title: 'Customers merged',
                        description: 'Records consolidated successfully.',
                    });
                    setSelected(new Set());
                    setMergeOpen(false);
                    setVersion((v) => v + 1);
                    navigate(`/customers/${targetId}`);
                }}
            />
        </div>
    );
}
