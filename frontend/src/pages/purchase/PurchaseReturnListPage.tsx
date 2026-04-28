import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Select } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { formatINR, formatRelative } from '@/lib/format';
import {
    purchaseReturns,
    RETURN_STATUS_LABEL,
    RETURN_STATUS_TONE,
    RETURN_REASON_LABEL,
    returnTotal,
    type PurchaseReturn,
    type ReturnStatus,
    type ReturnReason,
} from '@/mocks/purchase-returns';
import { vendorById } from '@/mocks/vendors';

export default function PurchaseReturnListPage() {
    const { push } = useToast();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<'' | ReturnStatus>('');
    const [reason, setReason] = useState<'' | ReturnReason>('');

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return purchaseReturns.filter((r) => {
            if (status && r.status !== status) return false;
            if (reason && r.reason !== reason) return false;
            if (q) {
                const hay = `${r.number} ${vendorById(r.vendorId)?.name ?? ''} ${r.grnNumber ?? ''}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [search, status, reason]);

    const cols: DataTableColumn<PurchaseReturn>[] = [
        { key: 'num', header: 'Return #', cell: (r) => <span className="font-mono text-sm font-semibold">{r.number}</span> },
        { key: 'vendor', header: 'Vendor', cell: (r) => <span className="text-sm">{vendorById(r.vendorId)?.name ?? '—'}</span> },
        { key: 'grn', header: 'GRN', cell: (r) => <span className="font-mono text-xs text-slate-500">{r.grnNumber ?? '—'}</span> },
        { key: 'reason', header: 'Reason', cell: (r) => <span className="text-sm capitalize">{RETURN_REASON_LABEL[r.reason]}</span> },
        { key: 'date', header: 'Raised', cell: (r) => <span className="text-xs text-slate-500">{formatRelative(r.raisedAt)}</span> },
        { key: 'items', header: 'Items', align: 'right', cell: (r) => <span className="text-sm">{r.items.length}</span> },
        { key: 'val', header: 'Value', align: 'right', cell: (r) => <span className="text-sm font-medium">{formatINR(returnTotal(r))}</span> },
        { key: 'note', header: 'Debit / Credit', cell: (r) => <span className="font-mono text-xs text-slate-500">{r.debitNoteRef ?? r.creditNoteRef ?? '—'}</span> },
        { key: 'status', header: 'Status', cell: (r) => <Badge tone={RETURN_STATUS_TONE[r.status]}>{RETURN_STATUS_LABEL[r.status]}</Badge> },
    ];

    return (
        <>
            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search return, vendor, GRN…"
                filters={
                    <>
                        <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as ReturnStatus | '')} className="w-36">
                            <option value="">All statuses</option>
                            {Object.keys(RETURN_STATUS_LABEL).map((s) => (
                                <option key={s} value={s}>{RETURN_STATUS_LABEL[s as ReturnStatus]}</option>
                            ))}
                        </Select>
                        <Select aria-label="Reason" value={reason} onChange={(e) => setReason(e.target.value as ReturnReason | '')} className="w-44">
                            <option value="">All reasons</option>
                            {Object.keys(RETURN_REASON_LABEL).map((r) => (
                                <option key={r} value={r}>{RETURN_REASON_LABEL[r as ReturnReason]}</option>
                            ))}
                        </Select>
                    </>
                }
                actions={
                    <Button size="sm" onClick={() => push({ variant: 'info', title: 'New purchase return', description: 'Static UI — wiring deferred.' })}>
                        <Plus className="size-4" aria-hidden="true" />
                        New return
                    </Button>
                }
            />

            <DataTable
                columns={cols}
                rows={rows}
                rowKey={(r) => r.id}
                emptyState={<div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">No purchase returns match the filters.</div>}
            />
            <p className="mt-3 text-xs text-slate-500">Showing {rows.length} of {purchaseReturns.length} returns.</p>
        </>
    );
}
