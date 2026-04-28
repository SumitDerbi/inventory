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
import { grns, GRN_STAGE_LABEL, GRN_STAGE_TONE, type GRN, type GRNStage } from '@/mocks/grns';
import { vendorById } from '@/mocks/vendors';

export default function GRNListPage() {
    const navigate = useNavigate();
    const { push } = useToast();
    const [search, setSearch] = useState('');
    const [stage, setStage] = useState<'' | GRNStage>('');

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return grns.filter((g) => {
            if (stage && g.stage !== stage) return false;
            if (q) {
                const hay = `${g.number} ${g.poNumber} ${vendorById(g.vendorId)?.name ?? ''}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [search, stage]);

    const cols: DataTableColumn<GRN>[] = [
        { key: 'num', header: 'GRN #', cell: (g) => <span className="font-mono text-sm font-semibold">{g.number}</span> },
        { key: 'po', header: 'PO #', cell: (g) => <span className="font-mono text-xs text-slate-500">{g.isDirect ? '— direct —' : g.poNumber}</span> },
        {
            key: 'vendor',
            header: 'Vendor',
            cell: (g) => {
                const v = vendorById(g.vendorId);
                return <span className="text-sm text-slate-700">{v?.name ?? '—'}</span>;
            },
        },
        { key: 'recv', header: 'Received', cell: (g) => <span className="text-xs text-slate-500">{formatRelative(g.receivedAt)}</span> },
        { key: 'stage', header: 'Stage', cell: (g) => <Badge tone={GRN_STAGE_TONE[g.stage]}>{GRN_STAGE_LABEL[g.stage]}</Badge> },
        { key: 'items', header: 'Items', align: 'right', cell: (g) => <span className="text-sm">{g.items.length}</span> },
        { key: 'veh', header: 'Vehicle', cell: (g) => <span className="text-xs text-slate-500">{g.vehicleNumber ?? '—'}</span> },
    ];

    return (
        <>
            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search GRN, PO, vendor…"
                filters={
                    <Select aria-label="Stage" value={stage} onChange={(e) => setStage(e.target.value as GRNStage | '')} className="w-44">
                        <option value="">All stages</option>
                        {Object.keys(GRN_STAGE_LABEL).map((s) => (
                            <option key={s} value={s}>{GRN_STAGE_LABEL[s as GRNStage]}</option>
                        ))}
                    </Select>
                }
                actions={
                    <Button size="sm" onClick={() => push({ variant: 'info', title: 'New GRN', description: 'Static UI — wiring deferred.' })}>
                        <Plus className="size-4" aria-hidden="true" />
                        New GRN
                    </Button>
                }
            />

            <DataTable
                columns={cols}
                rows={rows}
                rowKey={(g) => g.id}
                onRowClick={(g) => navigate(`/purchase/grns/${g.id}`)}
                emptyState={<div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">No GRNs match the filters.</div>}
            />
            <p className="mt-3 text-xs text-slate-500">Showing {rows.length} of {grns.length} GRNs.</p>
        </>
    );
}
