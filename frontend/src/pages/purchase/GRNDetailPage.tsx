import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Camera, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
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
import { AuditDrawer, AuditTriggerButton } from '@/components/ui/AuditDrawer';
import { mockActivity } from '@/mocks/activity';
import { cn } from '@/lib/cn';
import { formatRelative } from '@/lib/format';
import {
    grnById,
    GRN_STAGE_LABEL,
    GRN_STAGE_TONE,
    QC_DECISION_LABEL,
    grnPostable,
    type QCDecision,
} from '@/mocks/grns';
import { vendorById } from '@/mocks/vendors';
import { warehouseById } from '@/mocks/warehouses';

export default function GRNDetailPage() {
    const { id = '' } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { push } = useToast();
    const grn = grnById(id);

    const [decisions, setDecisions] = useState<Record<string, QCDecision>>(
        () => Object.fromEntries((grn?.items ?? []).map((i) => [i.id, i.qcDecision])),
    );
    const [postOpen, setPostOpen] = useState(false);
    const [auditOpen, setAuditOpen] = useState(false);
    const [directOpen, setDirectOpen] = useState(false);
    const [tab, setTab] = useState<'items' | 'attachments'>('items');

    const itemsWithLocalDecision = useMemo(
        () => (grn?.items ?? []).map((i) => ({ ...i, qcDecision: decisions[i.id] ?? i.qcDecision })),
        [grn, decisions],
    );

    if (!grn) {
        return (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
                GRN not found.
                <div className="mt-3">
                    <Button variant="outline" onClick={() => navigate('/purchase/grns')}>Back</Button>
                </div>
            </div>
        );
    }

    const v = vendorById(grn.vendorId);
    const wh = warehouseById(grn.warehouseId);
    const allDecided = itemsWithLocalDecision.every((i) => i.qcDecision !== 'pending');
    const postable = grnPostable({ ...grn, items: itemsWithLocalDecision });

    const setDecision = (itemId: string, d: QCDecision) =>
        setDecisions((s) => ({ ...s, [itemId]: d }));

    return (
        <>
            <PageHeader
                title={grn.number}
                description={`${v?.name ?? '—'} · ${grn.isDirect ? 'Direct GRN (no PO)' : grn.poNumber}`}
                breadcrumb={[
                    { label: 'Procurement', href: '/purchase' },
                    { label: 'GRNs', href: '/purchase/grns' },
                    { label: grn.number },
                ]}
                actions={
                    <>
                        <Button variant="outline" size="sm" onClick={() => navigate('/purchase/grns')}>
                            <ArrowLeft className="size-4" aria-hidden="true" />
                            Back
                        </Button>
                        <AuditTriggerButton onClick={() => setAuditOpen(true)} />
                        <Button variant="outline" size="sm" onClick={() => setDirectOpen(true)}>
                            Direct GRN
                        </Button>
                        {grn.stage === 'qc_pending' && (
                            <Button
                                size="sm"
                                disabled={!allDecided}
                                title={!allDecided ? 'Decide QC for every line before submitting' : undefined}
                                onClick={() => push({ variant: 'success', title: 'QC submitted (mock)' })}
                            >
                                Submit QC
                            </Button>
                        )}
                        {grn.stage === 'qc_complete' && (
                            <Button size="sm" disabled={!postable} onClick={() => setPostOpen(true)}>
                                Post to stock
                            </Button>
                        )}
                    </>
                }
            />

            <section className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-4">
                <KV label="Stage" value={<Badge tone={GRN_STAGE_TONE[grn.stage]}>{GRN_STAGE_LABEL[grn.stage]}</Badge>} />
                <KV label="Received" value={<span className="text-sm">{formatRelative(grn.receivedAt)}</span>} />
                <KV label="Warehouse" value={<span className="text-sm">{wh?.name ?? '—'}</span>} />
                <KV label="Vehicle" value={<span className="text-sm">{grn.vehicleNumber ?? '—'}</span>} />
                <KV label="Received by" value={<span className="text-sm">{grn.receivedBy}</span>} />
                <KV label="Vendor invoice ref" value={<span className="text-sm">{grn.invoiceRef ?? '—'}</span>} />
            </section>

            <h3 className="mb-2 text-sm font-semibold text-slate-700">Items & QC</h3>
            <div role="tablist" aria-label="GRN sections" className="mb-3 flex gap-1 border-b border-slate-200">
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'items'}
                    onClick={() => setTab('items')}
                    className={cn('relative px-3 py-2 text-sm font-medium', tab === 'items' ? 'text-primary' : 'text-slate-500')}
                >
                    Items
                    {tab === 'items' && <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />}
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === 'attachments'}
                    onClick={() => setTab('attachments')}
                    className={cn('relative px-3 py-2 text-sm font-medium', tab === 'attachments' ? 'text-primary' : 'text-slate-500')}
                >
                    Attachments
                    {tab === 'attachments' && <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />}
                </button>
            </div>
            {tab === 'items' && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left font-semibold">SKU</th>
                            <th scope="col" className="px-4 py-3 text-left font-semibold">Description</th>
                            <th scope="col" className="px-4 py-3 text-right font-semibold">Ordered</th>
                            <th scope="col" className="px-4 py-3 text-right font-semibold">Received</th>
                            <th scope="col" className="px-4 py-3 text-right font-semibold">Accepted</th>
                            <th scope="col" className="px-4 py-3 text-right font-semibold">Rejected</th>
                            <th scope="col" className="px-4 py-3 text-right font-semibold">Hold</th>
                            <th scope="col" className="px-4 py-3 text-left font-semibold">Batch</th>
                            <th scope="col" className="px-4 py-3 text-left font-semibold">QC decision</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itemsWithLocalDecision.map((it) => (
                            <tr key={it.id} className="border-t border-slate-100">
                                <td className="px-4 py-3 font-mono text-xs">{it.sku}</td>
                                <td className="px-4 py-3 text-slate-700">{it.description}</td>
                                <td className="px-4 py-3 text-right">{it.orderedQty} {it.uom}</td>
                                <td className="px-4 py-3 text-right">{it.receivedQty}</td>
                                <td className="px-4 py-3 text-right text-emerald-700">{it.acceptedQty}</td>
                                <td className="px-4 py-3 text-right text-red-600">{it.rejectedQty}</td>
                                <td className="px-4 py-3 text-right text-amber-700">{it.onHoldQty}</td>
                                <td className="px-4 py-3 text-xs text-slate-500">{it.batchNumber ?? '—'}</td>
                                <td className="px-4 py-3">
                                    <QcRadio itemId={it.id} value={it.qcDecision} onChange={setDecision} disabled={grn.stage !== 'qc_pending'} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            )}
            {tab === 'attachments' && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                    <Paperclip className="mx-auto mb-2 size-6 text-slate-400" aria-hidden="true" />
                    <p className="font-medium text-slate-700">Delivery challan, packing list, e-way bill</p>
                    <p className="mt-1 text-xs">Drag & drop or click to upload (mock).</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => push({ variant: 'info', title: 'Upload mock', description: 'Wiring deferred to API phase.' })}>
                        <Camera className="size-4" aria-hidden="true" />
                        Add attachment
                    </Button>
                </div>
            )}

            {grn.notes && (
                <p className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-sm italic text-slate-600">
                    {grn.notes}
                </p>
            )}

            <Dialog open={postOpen} onOpenChange={setPostOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Post GRN to stock?</DialogTitle>
                        <DialogDescription>
                            This will increase available stock at {wh?.name ?? 'the warehouse'} for accepted quantities. Static UI mock — no actual stock movement.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        <div className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-xs text-amber-700">
                            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            <span>Once posted, this GRN cannot be edited. Rejected and on-hold quantities will not flow to stock.</span>
                        </div>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setPostOpen(false)}>Cancel</Button>
                        <Button
                            onClick={() => {
                                setPostOpen(false);
                                push({ variant: 'success', title: 'Posted to stock (mock)', description: grn.number });
                            }}
                        >
                            Confirm post
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={directOpen} onOpenChange={setDirectOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Direct GRN (no PO)</DialogTitle>
                        <DialogDescription>
                            Direct GRNs are admin-only and disabled in mock mode. In production this requires the
                            <code className="mx-1 rounded bg-slate-100 px-1 text-xs">grn.allow_direct</code>
                            feature flag and is audit-logged with a mandatory reason.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={() => setDirectOpen(false)}>Got it</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AuditDrawer
                open={auditOpen}
                onOpenChange={setAuditOpen}
                title={`${grn.number} · activity`}
                entries={mockActivity(grn.id, 'GRN')}
            />
        </>
    );
}

function QcRadio({
    itemId,
    value,
    onChange,
    disabled,
}: {
    itemId: string;
    value: QCDecision;
    onChange: (id: string, d: QCDecision) => void;
    disabled?: boolean;
}) {
    const opts: QCDecision[] = ['accept', 'reject', 'hold'];
    return (
        <div role="radiogroup" aria-label="QC decision" className="flex gap-1">
            {opts.map((o) => (
                <button
                    key={o}
                    type="button"
                    role="radio"
                    aria-checked={value === o}
                    disabled={disabled}
                    onClick={() => onChange(itemId, o)}
                    className={cn(
                        'rounded-md border px-2 py-1 text-xs font-medium transition-colors',
                        value === o
                            ? o === 'accept'
                                ? 'border-emerald-300 bg-emerald-100 text-emerald-700'
                                : o === 'reject'
                                    ? 'border-red-300 bg-red-100 text-red-700'
                                    : 'border-amber-300 bg-amber-100 text-amber-700'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
                        disabled && 'cursor-not-allowed opacity-60',
                    )}
                >
                    {QC_DECISION_LABEL[o]}
                </button>
            ))}
        </div>
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
