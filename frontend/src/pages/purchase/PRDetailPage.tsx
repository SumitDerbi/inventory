import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { useToast } from '@/components/ui/Toast';
import { AuditDrawer, AuditTriggerButton } from '@/components/ui/AuditDrawer';
import { mockActivity } from '@/mocks/activity';
import { formatINR, formatRelative } from '@/lib/format';
import {
    prById,
    PR_STATUS_LABEL,
    PR_STATUS_TONE,
    prTotal,
    prItemValue,
    type PurchaseRequisitionItem,
} from '@/mocks/purchase-requisitions';
import { warehouseById } from '@/mocks/warehouses';

export default function PRDetailPage() {
    const { id = '' } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { push } = useToast();
    const [auditOpen, setAuditOpen] = useState(false);
    const pr = prById(id);
    if (!pr) {
        return (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
                PR not found.
                <div className="mt-3">
                    <Button variant="outline" onClick={() => navigate('/purchase/requisitions')}>Back</Button>
                </div>
            </div>
        );
    }

    const wh = warehouseById(pr.warehouseId);

    const cols: DataTableColumn<PurchaseRequisitionItem>[] = [
        { key: 'sku', header: 'SKU', cell: (i) => <span className="font-mono text-xs">{i.sku}</span> },
        { key: 'desc', header: 'Description', cell: (i) => <span className="text-sm text-slate-700">{i.description}</span> },
        { key: 'qty', header: 'Qty', align: 'right', cell: (i) => <span className="text-sm">{i.qty} {i.uom}</span> },
        { key: 'rate', header: 'Est. rate', align: 'right', cell: (i) => <span className="text-sm">{formatINR(i.estimatedRate)}</span> },
        { key: 'reqby', header: 'Required by', cell: (i) => <span className="text-xs text-slate-500">{formatRelative(i.requiredBy)}</span> },
        { key: 'val', header: 'Value', align: 'right', cell: (i) => <span className="text-sm font-medium">{formatINR(prItemValue(i))}</span> },
    ];

    return (
        <>
            <PageHeader
                title={pr.number}
                description={`${pr.department} · ${pr.source.replace('_', ' ')} ${pr.sourceRef ?? ''}`}
                breadcrumb={[
                    { label: 'Procurement', href: '/purchase' },
                    { label: 'Requisitions', href: '/purchase/requisitions' },
                    { label: pr.number },
                ]}
                actions={
                    <>
                        <Button variant="outline" size="sm" onClick={() => navigate('/purchase/requisitions')}>
                            <ArrowLeft className="size-4" aria-hidden="true" />
                            Back
                        </Button>
                        <AuditTriggerButton onClick={() => setAuditOpen(true)} />
                        {pr.status === 'submitted' && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        push({ variant: 'warning', title: 'Rejected (mock)', description: pr.number })
                                    }
                                >
                                    Reject
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() =>
                                        push({ variant: 'success', title: 'Approved (mock)', description: pr.number })
                                    }
                                >
                                    Approve
                                </Button>
                            </>
                        )}
                        {pr.status === 'approved' && (
                            <Button
                                size="sm"
                                onClick={() =>
                                    push({ variant: 'info', title: 'Issue RFQ (mock)', description: 'Wiring deferred to API phase.' })
                                }
                            >
                                Issue RFQ
                            </Button>
                        )}
                    </>
                }
            />

            <section className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-4">
                <KV label="Status" value={<Badge tone={PR_STATUS_TONE[pr.status]}>{PR_STATUS_LABEL[pr.status]}</Badge>} />
                <KV label="Priority" value={<span className="text-sm capitalize text-slate-700">{pr.priority}</span>} />
                <KV label="Required by" value={<span className="text-sm">{formatRelative(pr.requiredBy)}</span>} />
                <KV label="Warehouse" value={<span className="text-sm">{wh?.name ?? '—'}</span>} />
            </section>

            <h3 className="mb-2 text-sm font-semibold text-slate-700">Items</h3>
            <DataTable columns={cols} rows={pr.items} rowKey={(i) => i.id} className="mb-4" />

            <div className="mb-6 flex justify-end rounded-xl border border-slate-200 bg-white p-4 text-sm">
                <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Estimated total</p>
                    <p className="text-2xl font-semibold text-slate-800">{formatINR(prTotal(pr))}</p>
                </div>
            </div>

            <h3 className="mb-2 text-sm font-semibold text-slate-700">Approval chain</h3>
            {pr.approvalChain.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
                    No approvals required (draft).
                </div>
            ) : (
                <ol className="space-y-2">
                    {pr.approvalChain.map((a, idx) => (
                        <li
                            key={a.id}
                            className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm"
                        >
                            <div>
                                <p className="font-medium text-slate-800">
                                    Step {idx + 1} · {a.approverName}
                                </p>
                                <p className="text-xs text-slate-500">{a.role}</p>
                                {a.comment && <p className="mt-1 text-xs text-slate-600">"{a.comment}"</p>}
                            </div>
                            <div className="text-right">
                                <Badge
                                    tone={
                                        a.decision === 'approved'
                                            ? 'emerald'
                                            : a.decision === 'rejected'
                                                ? 'red'
                                                : 'amber'
                                    }
                                >
                                    {a.decision}
                                </Badge>
                                {a.decidedAt && (
                                    <p className="mt-1 text-xs text-slate-500">
                                        {formatRelative(a.decidedAt)}
                                    </p>
                                )}
                            </div>
                        </li>
                    ))}
                </ol>
            )}

            {pr.notes && (
                <p className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-sm italic text-slate-600">
                    {pr.notes}
                </p>
            )}

            <AuditDrawer
                open={auditOpen}
                onOpenChange={setAuditOpen}
                title={`${pr.number} · activity`}
                entries={mockActivity(pr.id, 'PR')}
            />
        </>
    );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
            <dd className="mt-1">{value}</dd>
        </div>
    );
}
