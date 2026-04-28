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
    purchaseOrders,
    PO_STAGES,
    PO_STAGE_LABEL,
    PO_STAGE_TONE,
    poTotals,
    type PurchaseOrder,
    type POStage,
} from '@/mocks/purchase-orders';
import { vendorById, vendors } from '@/mocks/vendors';

export default function POListPage() {
    const navigate = useNavigate();
    const { push } = useToast();
    const [search, setSearch] = useState('');
    const [stage, setStage] = useState<'' | POStage>('');
    const [vendorId, setVendorId] = useState('');
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return purchaseOrders.filter((p) => {
            if (stage && p.stage !== stage) return false;
            if (vendorId && p.vendorId !== vendorId) return false;
            if (q) {
                const hay = `${p.number} ${p.prNumber ?? ''} ${vendorById(p.vendorId)?.name ?? ''}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [search, stage, vendorId]);

    const toggleAll = () => {
        if (selected.size === rows.length) setSelected(new Set());
        else setSelected(new Set(rows.map((r) => r.id)));
    };
    const toggleOne = (id: string) => {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelected(next);
    };

    const cols: DataTableColumn<PurchaseOrder>[] = [
        {
            key: 'sel',
            header: (
                <input
                    type="checkbox"
                    aria-label="Select all"
                    className="size-4 cursor-pointer"
                    checked={rows.length > 0 && selected.size === rows.length}
                    onChange={toggleAll}
                />
            ),
            className: 'w-10',
            cell: (p) => (
                <input
                    type="checkbox"
                    aria-label={`Select ${p.number}`}
                    className="size-4 cursor-pointer"
                    checked={selected.has(p.id)}
                    onChange={() => toggleOne(p.id)}
                    onClick={(e) => e.stopPropagation()}
                />
            ),
        },
        { key: 'num', header: 'PO #', cell: (p) => <span className="font-mono text-sm font-semibold">{p.number}</span> },
        { key: 'date', header: 'Date', cell: (p) => <span className="text-xs text-slate-500">{formatRelative(p.poDate)}</span> },
        {
            key: 'vendor',
            header: 'Vendor',
            cell: (p) => {
                const v = vendorById(p.vendorId);
                return (
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">{v?.name ?? '—'}</p>
                        <p className="font-mono text-xs text-slate-500">{v?.code}</p>
                    </div>
                );
            },
        },
        { key: 'pr', header: 'Linked PR', cell: (p) => <span className="font-mono text-xs text-slate-500">{p.prNumber ?? '—'}</span> },
        { key: 'stage', header: 'Stage', cell: (p) => <Badge tone={PO_STAGE_TONE[p.stage]}>{PO_STAGE_LABEL[p.stage]}</Badge> },
        { key: 'eta', header: 'Expected', cell: (p) => <span className="text-xs text-slate-500">{formatRelative(p.expectedDeliveryDate)}</span> },
        {
            key: 'val',
            header: 'Value',
            align: 'right',
            cell: (p) => {
                const t = poTotals(p);
                return (
                    <div>
                        <p className="text-sm font-medium text-slate-800">{formatINR(t.grandTotalBaseCurrency)}</p>
                        {p.currency !== 'INR' && (
                            <p className="text-[10px] text-slate-400">
                                {p.currency} {t.grandTotal.toLocaleString('en-IN')} @ {p.exchangeRate}
                            </p>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <>
            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search PO, vendor, PR ref…"
                filters={
                    <>
                        <Select aria-label="Stage" value={stage} onChange={(e) => setStage(e.target.value as POStage | '')} className="w-44">
                            <option value="">All stages</option>
                            {PO_STAGES.map((s) => (
                                <option key={s} value={s}>{PO_STAGE_LABEL[s]}</option>
                            ))}
                        </Select>
                        <Select aria-label="Vendor" value={vendorId} onChange={(e) => setVendorId(e.target.value)} className="w-44">
                            <option value="">All vendors</option>
                            {vendors.map((v) => (
                                <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                        </Select>
                    </>
                }
                actions={
                    <>
                        {selected.size > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    push({ variant: 'success', title: `${selected.size} PO(s) approved (mock)` });
                                    setSelected(new Set());
                                }}
                            >
                                Approve ({selected.size})
                            </Button>
                        )}
                        <Button size="sm" onClick={() => push({ variant: 'info', title: 'New PO', description: 'Static UI — wiring deferred.' })}>
                            <Plus className="size-4" aria-hidden="true" />
                            New PO
                        </Button>
                    </>
                }
            />

            <DataTable
                columns={cols}
                rows={rows}
                rowKey={(p) => p.id}
                onRowClick={(p) => navigate(`/purchase/orders/${p.id}`)}
                emptyState={<div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">No purchase orders match the filters.</div>}
            />
            <p className="mt-3 text-xs text-slate-500">Showing {rows.length} of {purchaseOrders.length} POs.</p>
        </>
    );
}
