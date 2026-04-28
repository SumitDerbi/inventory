import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetClose,
} from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { formatINR, formatRelative } from '@/lib/format';
import { AuditDrawer, AuditTriggerButton } from '@/components/ui/AuditDrawer';
import { mockActivity } from '@/mocks/activity';
import {
    returnById,
    RETURN_STATUS_LABEL,
    RETURN_STATUS_TONE,
    RETURN_REASON_LABEL,
    returnTotal,
    type ReturnItem,
} from '@/mocks/purchase-returns';
import { vendorById } from '@/mocks/vendors';

type Tab = 'items' | 'attachments';
const TABS: Array<{ id: Tab; label: string }> = [
    { id: 'items', label: 'Items' },
    { id: 'attachments', label: 'Attachments' },
];

export default function PurchaseReturnDetailPage() {
    const { id = '' } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { push } = useToast();
    const r = returnById(id);
    const [tab, setTab] = useState<Tab>('items');
    const [auditOpen, setAuditOpen] = useState(false);
    const [pdfOpen, setPdfOpen] = useState(false);

    if (!r) {
        return (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
                Purchase return not found.
                <div className="mt-3">
                    <Button variant="outline" onClick={() => navigate('/purchase/returns')}>Back</Button>
                </div>
            </div>
        );
    }

    const v = vendorById(r.vendorId);
    const total = returnTotal(r);

    const cols: DataTableColumn<ReturnItem>[] = [
        { key: 'sku', header: 'SKU', cell: (i) => <span className="font-mono text-xs">{i.sku}</span> },
        { key: 'desc', header: 'Description', cell: (i) => <span className="text-sm">{i.description}</span> },
        { key: 'qty', header: 'Qty', align: 'right', cell: (i) => <span className="text-sm">{i.qty} {i.uom}</span> },
        { key: 'rate', header: 'Rate', align: 'right', cell: (i) => <span className="text-sm">{formatINR(i.unitPrice)}</span> },
        { key: 'val', header: 'Value', align: 'right', cell: (i) => <span className="text-sm font-medium">{formatINR(i.qty * i.unitPrice)}</span> },
        { key: 'reason', header: 'Reason', cell: (i) => <span className="text-xs text-slate-500">{RETURN_REASON_LABEL[i.reason]}</span> },
        { key: 'note', header: 'Notes', cell: (i) => <span className="text-xs text-slate-500">{i.notes ?? '—'}</span> },
    ];

    return (
        <>
            <PageHeader
                title={r.number}
                description={`${v?.name ?? '—'} · ${RETURN_REASON_LABEL[r.reason]}`}
                breadcrumb={[
                    { label: 'Procurement', href: '/purchase' },
                    { label: 'Returns', href: '/purchase/returns' },
                    { label: r.number },
                ]}
                actions={
                    <>
                        <Button variant="outline" size="sm" onClick={() => navigate('/purchase/returns')}>
                            <ArrowLeft className="size-4" aria-hidden="true" />
                            Back
                        </Button>
                        <AuditTriggerButton onClick={() => setAuditOpen(true)} />
                        <Button variant="outline" size="sm" onClick={() => setPdfOpen(true)}>
                            <FileText className="size-4" aria-hidden="true" />
                            Debit note PDF
                        </Button>
                        {r.status === 'draft' && (
                            <Button size="sm" onClick={() => push({ variant: 'success', title: 'Return approved (mock)' })}>
                                Approve
                            </Button>
                        )}
                        {r.status === 'approved' && (
                            <Button size="sm" onClick={() => push({ variant: 'success', title: 'Marked shipped (mock)' })}>
                                Mark shipped
                            </Button>
                        )}
                    </>
                }
            />

            <section className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-4">
                <KV label="Status" value={<Badge tone={RETURN_STATUS_TONE[r.status]}>{RETURN_STATUS_LABEL[r.status]}</Badge>} />
                <KV label="Raised" value={<span className="text-sm">{formatRelative(r.raisedAt)}</span>} />
                <KV label="GRN" value={<span className="font-mono text-xs">{r.grnNumber ?? '—'}</span>} />
                <KV label="PO" value={<span className="font-mono text-xs">{r.poNumber ?? '—'}</span>} />
                <KV label="Debit note" value={<span className="font-mono text-xs">{r.debitNoteRef ?? '—'}</span>} />
                <KV label="Credit note" value={<span className="font-mono text-xs">{r.creditNoteRef ?? '—'}</span>} />
                <KV label="Items" value={<span className="text-sm">{r.items.length}</span>} />
                <KV label="Total" value={<span className="text-sm font-semibold">{formatINR(total)}</span>} />
            </section>

            <div role="tablist" aria-label="Return sections" className="mb-3 flex gap-1 border-b border-slate-200">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        role="tab"
                        aria-selected={tab === t.id}
                        onClick={() => setTab(t.id)}
                        className={cn(
                            'relative px-3 py-2 text-sm font-medium transition-colors',
                            tab === t.id ? 'text-primary' : 'text-slate-500 hover:text-slate-700',
                        )}
                    >
                        {t.label}
                        {tab === t.id && (
                            <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
                        )}
                    </button>
                ))}
            </div>

            {tab === 'items' && (
                <DataTable columns={cols} rows={r.items} rowKey={(i) => i.id} />
            )}
            {tab === 'attachments' && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                    <Paperclip className="mx-auto mb-2 size-6 text-slate-400" aria-hidden="true" />
                    <p className="font-medium text-slate-700">Debit note PDF, photos, e-way bill</p>
                    <p className="mt-1 text-xs">Drag & drop or click to upload (mock).</p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => push({ variant: 'info', title: 'Upload mock', description: 'Wiring deferred to API phase.' })}
                    >
                        Add attachment
                    </Button>
                </div>
            )}

            {r.notes && (
                <p className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-sm italic text-slate-600">{r.notes}</p>
            )}

            <Sheet open={pdfOpen} onOpenChange={setPdfOpen}>
                <SheetContent side="right" className="w-[640px] max-w-full overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Debit note preview</SheetTitle>
                        <SheetDescription>Static mock — final layout produced by reporting service.</SheetDescription>
                    </SheetHeader>
                    <div className="mt-4 space-y-4 text-sm">
                        <div className="rounded-md border border-slate-200 bg-white p-4">
                            <h2 className="text-base font-semibold">DEBIT NOTE</h2>
                            <p className="mt-1 text-xs text-slate-500">{r.number} · raised {formatRelative(r.raisedAt)}</p>
                            <div className="mt-3 grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs uppercase text-slate-400">Vendor</p>
                                    <p className="text-sm">{v?.name ?? '—'}</p>
                                    <p className="text-xs text-slate-500">{v?.gstin ?? ''}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase text-slate-400">Reference</p>
                                    <p className="text-xs text-slate-500">PO {r.poNumber ?? '—'}</p>
                                    <p className="text-xs text-slate-500">GRN {r.grnNumber ?? '—'}</p>
                                </div>
                            </div>
                        </div>
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-2 py-2">SKU</th>
                                    <th className="px-2 py-2">Description</th>
                                    <th className="px-2 py-2 text-right">Qty</th>
                                    <th className="px-2 py-2 text-right">Rate</th>
                                    <th className="px-2 py-2 text-right">Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {r.items.map((it) => (
                                    <tr key={it.id} className="border-t border-slate-100">
                                        <td className="px-2 py-2 font-mono">{it.sku}</td>
                                        <td className="px-2 py-2">{it.description}</td>
                                        <td className="px-2 py-2 text-right">{it.qty} {it.uom}</td>
                                        <td className="px-2 py-2 text-right">{formatINR(it.unitPrice)}</td>
                                        <td className="px-2 py-2 text-right">{formatINR(it.qty * it.unitPrice)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t border-slate-200">
                                    <td colSpan={4} className="px-2 py-2 text-right font-semibold">Total</td>
                                    <td className="px-2 py-2 text-right font-semibold">{formatINR(total)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <SheetClose asChild>
                        <Button variant="outline" size="sm" className="mt-4">Close</Button>
                    </SheetClose>
                </SheetContent>
            </Sheet>

            <AuditDrawer
                open={auditOpen}
                onOpenChange={setAuditOpen}
                title={`${r.number} · activity`}
                entries={mockActivity(r.id, 'Return')}
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
