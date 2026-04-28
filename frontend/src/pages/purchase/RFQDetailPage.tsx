import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trophy, Zap, Mail, Split } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { useToast } from '@/components/ui/Toast';
import { AuditDrawer, AuditTriggerButton } from '@/components/ui/AuditDrawer';
import { mockActivity } from '@/mocks/activity';
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { FormField, Input, Textarea } from '@/components/ui/FormField';
import { cn } from '@/lib/cn';
import { formatINR, formatRelative } from '@/lib/format';
import {
    rfqById,
    RFQ_STATUS_LABEL,
    RFQ_STATUS_TONE,
    compareQuotes,
} from '@/mocks/rfqs';
import { vendorById } from '@/mocks/vendors';

export default function RFQDetailPage() {
    const { id = '' } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { push } = useToast();
    const rfq = rfqById(id);
    const [awardedVendor, setAwardedVendor] = useState<string | null>(null);
    const [splitMode, setSplitMode] = useState(false);
    const [splitMap, setSplitMap] = useState<Record<string, string>>({}); // itemId -> vendorId
    const [auditOpen, setAuditOpen] = useState(false);
    const [emailOpen, setEmailOpen] = useState(false);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [buyerNotes, setBuyerNotes] = useState<Record<string, string>>({}); // itemId -> note

    const summary = useMemo(() => (rfq ? compareQuotes(rfq) : []), [rfq]);

    if (!rfq) {
        return (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
                RFQ not found.
                <div className="mt-3">
                    <Button variant="outline" onClick={() => navigate('/purchase/rfqs')}>Back</Button>
                </div>
            </div>
        );
    }

    const award = (vendorId: string) => {
        setAwardedVendor(vendorId);
        push({ variant: 'success', title: 'Vendor awarded (mock)', description: vendorById(vendorId)?.name ?? '' });
    };

    return (
        <>
            <PageHeader
                title={rfq.number}
                description={`Linked to ${rfq.prNumber} · ${rfq.invitedVendorIds.length} vendors invited`}
                breadcrumb={[
                    { label: 'Procurement', href: '/purchase' },
                    { label: 'RFQs', href: '/purchase/rfqs' },
                    { label: rfq.number },
                ]}
                actions={
                    <>
                        <Button variant="outline" size="sm" onClick={() => navigate('/purchase/rfqs')}>
                            <ArrowLeft className="size-4" aria-hidden="true" />
                            Back
                        </Button>
                        <AuditTriggerButton onClick={() => setAuditOpen(true)} />
                        {rfq.status === 'draft' && (
                            <Button
                                size="sm"
                                onClick={() => {
                                    setEmailSubject(`RFQ ${rfq.number} — quotation request`);
                                    setEmailBody(`Dear vendor,\n\nRequest for quote for the items listed in ${rfq.number}. Closing ${rfq.closingDate}.\n\nRegards,\nProcurement team`);
                                    setEmailOpen(true);
                                }}
                            >
                                <Mail className="size-4" aria-hidden="true" />
                                Send to vendors
                            </Button>
                        )}
                        {rfq.status === 'quotes_received' && (
                            <Button
                                variant={splitMode ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setSplitMode((v) => !v)}
                            >
                                <Split className="size-4" aria-hidden="true" />
                                {splitMode ? 'Exit split mode' : 'Award split'}
                            </Button>
                        )}
                    </>
                }
            />

            <section className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-4">
                <KV label="Status" value={<Badge tone={RFQ_STATUS_TONE[rfq.status]}>{RFQ_STATUS_LABEL[rfq.status]}</Badge>} />
                <KV label="Issued" value={<span className="text-sm">{formatRelative(rfq.raisedAt)}</span>} />
                <KV label="Closing" value={<span className="text-sm">{formatRelative(rfq.closingDate)}</span>} />
                <KV label="Quotes received" value={<span className="text-sm">{rfq.quotes.length} of {rfq.invitedVendorIds.length}</span>} />
            </section>

            <h3 className="mb-2 text-sm font-semibold text-slate-700">Quote comparison</h3>
            {rfq.quotes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
                    No quotes received yet. Awaiting vendor responses.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th scope="col" className="border-b border-slate-200 px-4 py-3 text-left font-semibold">Item</th>
                                <th scope="col" className="border-b border-slate-200 px-4 py-3 text-right font-semibold">Qty</th>
                                {rfq.quotes.map((q) => (
                                    <th key={q.id} scope="col" className="border-b border-slate-200 px-4 py-3 text-right font-semibold">
                                        <div>{vendorById(q.vendorId)?.name}</div>
                                        <div className="text-[10px] font-normal text-slate-400">
                                            Lead {q.leadDays}d · {q.paymentTermsDays}d terms
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rfq.items.map((it) => {
                                const sum = summary.find((s) => s.rfqItemId === it.id);
                                return (
                                    <tr key={it.id} className="even:bg-slate-50/40">
                                        <td className="border-b border-slate-100 px-4 py-3">
                                            <p className="font-medium text-slate-800">{it.description}</p>
                                            <p className="font-mono text-xs text-slate-500">{it.sku}</p>
                                            {it.targetRate && (
                                                <p className="text-xs text-slate-400">Target {formatINR(it.targetRate)}</p>
                                            )}
                                        </td>
                                        <td className="border-b border-slate-100 px-4 py-3 text-right text-sm">
                                            {it.qty} {it.uom}
                                        </td>
                                        {rfq.quotes.map((q) => {
                                            const line = q.items.find((qi) => qi.rfqItemId === it.id);
                                            if (!line) {
                                                return <td key={q.id} className="border-b border-slate-100 px-4 py-3 text-right text-xs text-slate-400">—</td>;
                                            }
                                            const isBestPrice = sum?.bestVendorId === q.vendorId;
                                            const isFastest = sum?.fastestVendorId === q.vendorId;
                                            return (
                                                <td
                                                    key={q.id}
                                                    className={cn(
                                                        'border-b border-slate-100 px-4 py-3 text-right text-sm',
                                                        isBestPrice && 'bg-emerald-50',
                                                        isFastest && !isBestPrice && 'bg-sky-50',
                                                    )}
                                                >
                                                    <div className="font-medium text-slate-800">{formatINR(line.unitPrice)}</div>
                                                    <div className="text-[10px] text-slate-500">
                                                        Lead {line.leadDays}d
                                                        {line.discountPct > 0 && ` · ${line.discountPct}% off`}
                                                    </div>
                                                    <div className="mt-0.5 flex items-center justify-end gap-1">
                                                        {isBestPrice && (
                                                            <Badge tone="emerald" className="gap-0.5 text-[10px]">
                                                                <Trophy className="size-3" aria-hidden="true" /> Best
                                                            </Badge>
                                                        )}
                                                        {isFastest && (
                                                            <Badge tone="sky" className="gap-0.5 text-[10px]">
                                                                <Zap className="size-3" aria-hidden="true" /> Fastest
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-50">
                                <td colSpan={2} className="px-4 py-3 text-right text-xs font-semibold text-slate-500">
                                    Total quote value
                                </td>
                                {rfq.quotes.map((q) => {
                                    const total = q.items.reduce((s, qi) => {
                                        const it = rfq.items.find((x) => x.id === qi.rfqItemId);
                                        return s + (it ? it.qty * qi.unitPrice * (1 - qi.discountPct / 100) : 0);
                                    }, 0);
                                    return (
                                        <td key={q.id} className="px-4 py-3 text-right text-sm font-semibold text-slate-800">
                                            {formatINR(total)}
                                        </td>
                                    );
                                })}
                            </tr>
                            <tr>
                                <td colSpan={2} className="px-4 py-3 text-right text-xs font-semibold text-slate-500">
                                    Award
                                </td>
                                {rfq.quotes.map((q) => {
                                    const isAwardedHere = rfq.awardedQuoteId === q.id || awardedVendor === q.vendorId;
                                    return (
                                        <td key={q.id} className="px-4 py-3 text-right">
                                            {isAwardedHere ? (
                                                <Badge tone="emerald">Awarded</Badge>
                                            ) : rfq.status === 'quotes_received' ? (
                                                <Button size="sm" variant="outline" onClick={() => award(q.vendorId)}>
                                                    Award
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-slate-400">—</span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            {rfq.notes && (
                <p className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-sm italic text-slate-600">
                    {rfq.notes}
                </p>
            )}

            {splitMode && (
                <section className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm text-violet-800">
                    <p className="font-semibold">Award split mode</p>
                    <p className="mt-1">Pick a winning vendor per line below; on confirm, one draft PO will be created per awarded vendor.</p>
                    <div className="mt-3 space-y-2">
                        {rfq.items.map((it) => {
                            const candidates = rfq.quotes
                                .map((q) => ({ vendorId: q.vendorId, line: q.items.find((qi) => qi.rfqItemId === it.id) }))
                                .filter((c) => c.line);
                            return (
                                <div key={it.id} className="flex flex-wrap items-center gap-2 rounded-md bg-white/70 p-2">
                                    <span className="min-w-32 font-mono text-xs text-slate-600">{it.sku}</span>
                                    <span className="flex-1 text-xs text-slate-700">{it.description}</span>
                                    <select
                                        className="rounded border border-slate-300 px-2 py-1 text-xs"
                                        value={splitMap[it.id] ?? ''}
                                        onChange={(e) => setSplitMap((m) => ({ ...m, [it.id]: e.target.value }))}
                                    >
                                        <option value="">— pick vendor —</option>
                                        {candidates.map((c) => (
                                            <option key={c.vendorId} value={c.vendorId}>
                                                {vendorById(c.vendorId)?.name} · {formatINR(c.line!.unitPrice)}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        placeholder="Buyer note"
                                        className="rounded border border-slate-300 px-2 py-1 text-xs"
                                        value={buyerNotes[it.id] ?? ''}
                                        onChange={(e) => setBuyerNotes((m) => ({ ...m, [it.id]: e.target.value }))}
                                    />
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-3 flex justify-end">
                        <Button
                            size="sm"
                            onClick={() => {
                                const winners = new Set(Object.values(splitMap).filter(Boolean));
                                push({
                                    variant: 'success',
                                    title: 'Award split saved (mock)',
                                    description: `${winners.size} draft PO${winners.size === 1 ? '' : 's'} would be created.`,
                                });
                                setSplitMode(false);
                            }}
                        >
                            Confirm split award
                        </Button>
                    </div>
                </section>
            )}

            <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send RFQ to invited vendors</DialogTitle>
                        <DialogDescription>Uses the rfq_invite email template. Recipients: {rfq.invitedVendorIds.length} vendor(s).</DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        <FormField label="Subject">
                            <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                        </FormField>
                        <FormField label="Body">
                            <Textarea rows={6} value={emailBody} onChange={(e) => setEmailBody(e.target.value)} />
                        </FormField>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEmailOpen(false)}>Cancel</Button>
                        <Button
                            onClick={() => {
                                setEmailOpen(false);
                                push({ variant: 'success', title: 'RFQ sent (mock)', description: `${rfq.invitedVendorIds.length} email(s) queued.` });
                            }}
                        >
                            Send
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AuditDrawer
                open={auditOpen}
                onOpenChange={setAuditOpen}
                title={`${rfq.number} · activity`}
                entries={mockActivity(rfq.id, 'RFQ')}
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
