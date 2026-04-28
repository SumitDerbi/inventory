import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trophy, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { useToast } from '@/components/ui/Toast';
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
                    <Button variant="outline" size="sm" onClick={() => navigate('/purchase/rfqs')}>
                        <ArrowLeft className="size-4" aria-hidden="true" />
                        Back
                    </Button>
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
