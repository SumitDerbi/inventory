import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Select } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { formatRelative } from '@/lib/format';
import { rfqs, RFQ_STATUS_LABEL, RFQ_STATUS_TONE, type RFQ, type RFQStatus } from '@/mocks/rfqs';

export default function RFQListPage() {
    const navigate = useNavigate();
    const { push } = useToast();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<'' | RFQStatus>('');

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rfqs.filter((r) => {
            if (status && r.status !== status) return false;
            if (q) {
                const hay = `${r.number} ${r.prNumber} ${r.notes ?? ''}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [search, status]);

    const cols: DataTableColumn<RFQ>[] = [
        { key: 'num', header: 'RFQ #', cell: (r) => <span className="font-mono text-sm font-semibold">{r.number}</span> },
        { key: 'pr', header: 'Linked PR', cell: (r) => <span className="font-mono text-xs text-slate-500">{r.prNumber}</span> },
        { key: 'raised', header: 'Issued', cell: (r) => <span className="text-xs text-slate-500">{formatRelative(r.raisedAt)}</span> },
        { key: 'closing', header: 'Closing', cell: (r) => <span className="text-xs text-slate-500">{formatRelative(r.closingDate)}</span> },
        { key: 'vendors', header: 'Vendors', align: 'right', cell: (r) => <span className="text-sm">{r.invitedVendorIds.length}</span> },
        { key: 'quotes', header: 'Quotes', align: 'right', cell: (r) => <span className="text-sm">{r.quotes.length}</span> },
        { key: 'status', header: 'Status', cell: (r) => <Badge tone={RFQ_STATUS_TONE[r.status]}>{RFQ_STATUS_LABEL[r.status]}</Badge> },
    ];

    return (
        <>
            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search RFQ #, linked PR…"
                filters={
                    <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as RFQStatus | '')} className="w-40">
                        <option value="">All statuses</option>
                        {Object.keys(RFQ_STATUS_LABEL).map((s) => (
                            <option key={s} value={s}>{RFQ_STATUS_LABEL[s as RFQStatus]}</option>
                        ))}
                    </Select>
                }
                actions={
                    <Button size="sm" onClick={() => push({ variant: 'info', title: 'New RFQ', description: 'Static UI — wiring deferred.' })}>
                        <Plus className="size-4" aria-hidden="true" />
                        New RFQ
                    </Button>
                }
            />
            <DataTable
                columns={cols}
                rows={rows}
                rowKey={(r) => r.id}
                onRowClick={(r) => navigate(`/purchase/rfqs/${r.id}`)}
                emptyState={<div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">No RFQs match the filters.</div>}
            />
            <p className="mt-3 text-xs text-slate-500">Showing {rows.length} of {rfqs.length} RFQs.</p>
        </>
    );
}
