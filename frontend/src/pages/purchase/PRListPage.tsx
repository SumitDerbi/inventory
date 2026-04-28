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
    const [newOpen, setNewOpen] = useState(false);
    const [form, setForm] = useState({ department: '', priority: 'normal', source: 'manual', requiredBy: '', notes: '' });

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
                    <Button size="sm" onClick={() => setNewOpen(true)}>
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

            <Sheet open={newOpen} onOpenChange={setNewOpen}>
                <SheetContent side="right" className="w-[480px] max-w-full overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>New purchase requisition</SheetTitle>
                        <SheetDescription>Static mock — wiring deferred to API phase.</SheetDescription>
                    </SheetHeader>
                    <div className="mt-4 space-y-3">
                        <FormField label="Department" required>
                            <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Production / Service / Sales" />
                        </FormField>
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Source">
                                <Select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                                    <option value="manual">Manual</option>
                                    <option value="reorder">Reorder</option>
                                    <option value="sales_order">Sales order</option>
                                    <option value="project">Project</option>
                                </Select>
                            </FormField>
                            <FormField label="Priority">
                                <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                                    <option value="low">Low</option>
                                    <option value="normal">Normal</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </Select>
                            </FormField>
                        </div>
                        <FormField label="Required by">
                            <Input type="date" value={form.requiredBy} onChange={(e) => setForm({ ...form, requiredBy: e.target.value })} />
                        </FormField>
                        <FormField label="Notes">
                            <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                        </FormField>
                        <p className="rounded-md bg-slate-50 p-2 text-xs text-slate-500">
                            Line items can be added on the next step (deferred in mock).
                        </p>
                    </div>
                    <SheetFooter>
                        <Button variant="ghost" size="sm" onClick={() => setNewOpen(false)}>Cancel</Button>
                        <Button
                            size="sm"
                            disabled={!form.department.trim()}
                            onClick={() => {
                                setNewOpen(false);
                                push({ variant: 'success', title: 'PR draft created (mock)', description: form.department });
                            }}
                        >
                            Save draft
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </>
    );
}
