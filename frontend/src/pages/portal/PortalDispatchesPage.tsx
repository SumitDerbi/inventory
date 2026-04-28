import { useState } from 'react';
import { Truck, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { portalDispatches, type PortalDispatch } from '@/mocks/portal/portal-dispatches';
import {
    DISPATCH_STAGE_LABEL,
    DISPATCH_TONE,
} from '@/mocks/dispatches';

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function DispatchCard({ d }: { d: PortalDispatch }) {
    const [open, setOpen] = useState(false);

    return (
        <article className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <Truck className="size-4 text-slate-400" />
                        <h3 className="font-semibold text-slate-900">{d.challanNumber}</h3>
                        <Badge tone={DISPATCH_TONE[d.stage]}>{DISPATCH_STAGE_LABEL[d.stage]}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                        {d.transporterName} · {d.vehicleNumber}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="size-3" /> {d.destinationCity}
                    </div>
                </div>
                <div className="text-right text-xs">
                    <div className="text-slate-400">ETA</div>
                    <div className="font-medium text-slate-900">{formatDate(d.expectedDeliveryDate)}</div>
                    {d.actualDeliveryDate && (
                        <div className="mt-1 text-emerald-600">Delivered {formatDate(d.actualDeliveryDate)}</div>
                    )}
                </div>
            </div>

            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
            >
                {open ? <>Hide route <ChevronUp className="size-3" /></> : <>Show route <ChevronDown className="size-3" /></>}
            </button>

            {open && (
                <ol className="relative mt-3 space-y-3 border-l-2 border-slate-200 pl-4">
                    {d.routeStops.length === 0 ? (
                        <li className="text-xs text-slate-500">No checkpoints recorded yet.</li>
                    ) : (
                        d.routeStops.map((s) => {
                            const reached = Boolean(s.arrivedAt);
                            return (
                                <li key={s.id} className="relative">
                                    <span
                                        className={`absolute -left-[22px] top-1 flex size-4 items-center justify-center rounded-full border-2 ${
                                            reached ? 'border-blue-500 bg-white' : 'border-slate-300 bg-white'
                                        }`}
                                    >
                                        {reached && <span className="size-1.5 rounded-full bg-blue-500" />}
                                    </span>
                                    <div className="text-sm font-medium text-slate-900">{s.label}</div>
                                    <div className="text-xs text-slate-500">{s.city}</div>
                                    <div className="text-xs text-slate-400">
                                        {reached ? `Arrived ${formatDate(s.arrivedAt)}` : 'Pending'}
                                    </div>
                                </li>
                            );
                        })
                    )}
                </ol>
            )}

            {d.eWayBill && (
                <div className="mt-3 rounded-md bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
                    E-way bill: <code>{d.eWayBill}</code>
                </div>
            )}
        </article>
    );
}

export default function PortalDispatchesPage() {
    const list = portalDispatches();

    return (
        <div className="space-y-4">
            <PageHeader title="Dispatches" description="Track your shipments and deliveries." />

            {list.length === 0 ? (
                <EmptyState
                    title="No dispatches yet"
                    description="Once an order is shipped, you'll see live tracking here."
                />
            ) : (
                <div className="grid gap-3 md:grid-cols-2">
                    {list.map((d) => (
                        <DispatchCard key={d.id} d={d} />
                    ))}
                </div>
            )}
        </div>
    );
}
