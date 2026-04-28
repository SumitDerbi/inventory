import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { FormField, Input, Select, Textarea } from '@/components/ui/FormField';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { formatRelative } from '@/lib/format';
import { rfqs, RFQ_STATUS_LABEL, RFQ_STATUS_TONE, type RFQ, type RFQStatus } from '@/mocks/rfqs';
import { purchaseRequisitions } from '@/mocks/purchase-requisitions';
import { vendors } from '@/mocks/vendors';

export default function RFQListPage() {
    const navigate = useNavigate();
    const { push } = useToast();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<'' | RFQStatus>('');
    const [newOpen, setNewOpen] = useState(false);
    const [form, setForm] = useState({ prId: '', closingDate: '', vendorIds: new Set<string>(), notes: '' });
    const toggleVendor = (id: string) => setForm((s) => {
        const next = new Set(s.vendorIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return { ...s, vendorIds: next };
    });

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
                    <Button size="sm" onClick={() => setNewOpen(true)}>
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

            <Sheet open={newOpen} onOpenChange={setNewOpen}>
                <SheetContent side="right" className="w-[520px] max-w-full overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>New RFQ</SheetTitle>
                        <SheetDescription>Pick a PR, invite vendors, set the closing date.</SheetDescription>
                    </SheetHeader>
                    <div className="mt-4 space-y-3">
                        <FormField label="Source PR" required>
                            <Select value={form.prId} onChange={(e) => setForm({ ...form, prId: e.target.value })}>
                                <option value="">— Select —</option>
                                {purchaseRequisitions
                                    .filter((p) => p.status === 'approved' || p.status === 'rfq_issued')
                                    .map((p) => (
                                        <option key={p.id} value={p.id}>{p.number} · {p.department}</option>
                                    ))}
                            </Select>
                        </FormField>
                        <FormField label="Closing date" required>
                            <Input type="date" value={form.closingDate} onChange={(e) => setForm({ ...form, closingDate: e.target.value })} />
                        </FormField>
                        <FormField label={`Invite vendors (${form.vendorIds.size})`}>
                            <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2">
                                {vendors.filter((v) => v.status === 'active').slice(0, 8).map((v) => (
                                    <label key={v.id} className="flex items-center gap-2 rounded p-1 text-sm hover:bg-slate-50">
                                        <input type="checkbox" checked={form.vendorIds.has(v.id)} onChange={() => toggleVendor(v.id)} />
                                        <span>{v.name}</span>
                                        <Badge tone="sky" className="ml-auto">Tier {v.tier}</Badge>
                                    </label>
                                ))}
                            </div>
                        </FormField>
                        <FormField label="Cover note">
                            <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Subject, terms summary, evaluation criteria…" />
                        </FormField>
                    </div>
                    <SheetFooter>
                        <Button variant="ghost" size="sm" onClick={() => setNewOpen(false)}>Cancel</Button>
                        <Button
                            size="sm"
                            disabled={!form.prId || !form.closingDate || form.vendorIds.size === 0}
                            onClick={() => {
                                setNewOpen(false);
                                push({ variant: 'success', title: 'RFQ draft saved (mock)', description: `${form.vendorIds.size} vendor(s) invited` });
                            }}
                        >
                            Save & queue email
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </>
    );
}
