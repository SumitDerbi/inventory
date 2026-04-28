import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { FormField, Input, Select } from '@/components/ui/FormField';
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import { formatRelative } from '@/lib/format';
import { grns, GRN_STAGE_LABEL, GRN_STAGE_TONE, type GRN, type GRNStage } from '@/mocks/grns';
import { vendorById } from '@/mocks/vendors';
import { purchaseOrders } from '@/mocks/purchase-orders';

export default function GRNListPage() {
    const navigate = useNavigate();
    const { push } = useToast();
    const [search, setSearch] = useState('');
    const [stage, setStage] = useState<'' | GRNStage>('');
    const [newOpen, setNewOpen] = useState(false);
    const [form, setForm] = useState({ poId: '', vehicleNumber: '', invoiceRef: '' });

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
                    <Button size="sm" onClick={() => setNewOpen(true)}>
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

            <Dialog open={newOpen} onOpenChange={setNewOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>New GRN</DialogTitle>
                        <DialogDescription>Pick a PO; quantities are pre-filled from the PO lines.</DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        <div className="space-y-3">
                            <FormField label="Linked PO" required>
                                <Select value={form.poId} onChange={(e) => setForm({ ...form, poId: e.target.value })}>
                                    <option value="">— Select —</option>
                                    {purchaseOrders
                                        .filter((p) => p.stage === 'sent' || p.stage === 'partially_received')
                                        .map((p) => (
                                            <option key={p.id} value={p.id}>{p.number} · {vendorById(p.vendorId)?.name ?? ''}</option>
                                        ))}
                                </Select>
                            </FormField>
                            <FormField label="Vehicle number">
                                <Input value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} placeholder="MH-12-AB-1234" />
                            </FormField>
                            <FormField label="Vendor invoice ref">
                                <Input value={form.invoiceRef} onChange={(e) => setForm({ ...form, invoiceRef: e.target.value })} />
                            </FormField>
                        </div>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="ghost" size="sm" onClick={() => setNewOpen(false)}>Cancel</Button>
                        <Button
                            size="sm"
                            disabled={!form.poId}
                            onClick={() => {
                                setNewOpen(false);
                                push({ variant: 'success', title: 'GRN draft created (mock)' });
                            }}
                        >
                            Create draft
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
