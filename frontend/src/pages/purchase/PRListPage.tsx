import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Select } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { formatINR, formatRelative } from '@/lib/format';
import {
    purchaseRequisitions,
    PR_STATUSES,
    PR_STATUS_LABEL,
    PR_STATUS_TONE,
    prTotal,
    type PurchaseRequisition,
    type PRStatus,
} from '@/mocks/purchase-requisitions';

const PRIORITY_TONE: Record<PurchaseRequisition['priority'], 'neutral' | 'blue' | 'amber' | 'red'> = {
    low: 'neutral',
    normal: 'blue',
    high: 'amber',
    urgent: 'red',
};

export default function PRListPage() {
    const navigate = useNavigate();
    const { push } = useToast();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<'' | PRStatus>('');
    const [source, setSource] = useState<'' | PurchaseRequisition['source']>('');

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return purchaseRequisitions.filter((p) => {
            if (status && p.status !== status) return false;
            if (source && p.source !== source) return false;
            if (q) {
                const hay = `${p.number} ${p.department} ${p.sourceRef ?? ''} ${p.notes ?? ''}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [search, status, source]);

    const cols: DataTableColumn<PurchaseRequisition>[] = [
        { key: 'num', header: 'PR #', cell: (p) => <span className="font-mono text-sm font-semibold text-slate-800">{p.number}</span> },
        { key: 'date', header: 'Raised', cell: (p) => <span className="text-xs text-slate-500">{formatRelative(p.raisedAt)}</span> },
        { key: 'dept', header: 'Department', cell: (p) => <span className="text-sm text-slate-700">{p.department}</span> },
        {
            key: 'source',
            header: 'Source',
            cell: (p) => (
                <div className="text-xs">
                    <p className="font-medium capitalize text-slate-700">{p.source.replace('_', ' ')}</p>
                    {p.sourceRef && <p className="text-slate-500">{p.sourceRef}</p>}
                </div>
            ),
        },
        { key: 'pri', header: 'Priority', cell: (p) => <Badge tone={PRIORITY_TONE[p.priority]} className="capitalize">{p.priority}</Badge> },
        { key: 'status', header: 'Status', cell: (p) => <Badge tone={PR_STATUS_TONE[p.status]}>{PR_STATUS_LABEL[p.status]}</Badge> },
        { key: 'reqby', header: 'Required by', cell: (p) => <span className="text-xs text-slate-500">{formatRelative(p.requiredBy)}</span> },
        { key: 'val', header: 'Estimated', align: 'right', cell: (p) => <span className="text-sm font-medium">{formatINR(prTotal(p))}</span> },
    ];

    return (
        <>
            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search PR #, department, source ref…"
                filters={
                    <>
                        <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as PRStatus | '')} className="w-40">
                            <option value="">All statuses</option>
                            {PR_STATUSES.map((s) => (
                                <option key={s} value={s}>{PR_STATUS_LABEL[s]}</option>
                            ))}
                        </Select>
                        <Select aria-label="Source" value={source} onChange={(e) => setSource(e.target.value as PurchaseRequisition['source'] | '')} className="w-36">
                            <option value="">All sources</option>
                            <option value="manual">Manual</option>
                            <option value="reorder">Reorder</option>
                            <option value="sales_order">Sales order</option>
                            <option value="project">Project</option>
                        </Select>
                    </>
                }
                actions={
                    <Button size="sm" onClick={() => push({ variant: 'info', title: 'Create PR', description: 'Static UI — wiring deferred to API phase.' })}>
                        <Plus className="size-4" aria-hidden="true" />
                        New PR
                    </Button>
                }
            />

            <DataTable
                columns={cols}
                rows={rows}
                rowKey={(p) => p.id}
                onRowClick={(p) => navigate(`/purchase/requisitions/${p.id}`)}
                emptyState={<div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">No purchase requisitions match the filters.</div>}
            />

            <p className="mt-3 text-xs text-slate-500">Showing {rows.length} of {purchaseRequisitions.length} requisitions.</p>
        </>
    );
}
