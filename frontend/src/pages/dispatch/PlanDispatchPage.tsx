import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Truck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select, Textarea } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { formatINR, formatRelative } from '@/lib/format';
import { readyOrders, type ReadyOrderSummary } from '@/mocks/dispatches';
import { transporters } from '@/mocks/transporters';
import { vehicles, vehiclesForTransporter } from '@/mocks/vehicles';
import { warehouses } from '@/mocks/warehouses';

const TOMORROW_ISO = new Date(Date.now() + 86_400_000)
    .toISOString()
    .slice(0, 10);

type Step = 1 | 2 | 3 | 4;

const STEPS: Array<{ id: Step; label: string }> = [
    { id: 1, label: 'Select orders' },
    { id: 2, label: 'Consolidate' },
    { id: 3, label: 'Transporter' },
    { id: 4, label: 'Review' },
];

const READINESS_TONE: Record<ReadyOrderSummary['readiness'], 'emerald' | 'amber' | 'red'> = {
    green: 'emerald',
    amber: 'amber',
    red: 'red',
};

export default function PlanDispatchPage() {
    const navigate = useNavigate();
    const { push } = useToast();
    const orders = useMemo(() => readyOrders(), []);

    const [step, setStep] = useState<Step>(1);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [sourceWarehouseId, setSourceWarehouseId] = useState('wh-ho');
    const [scheduledDate, setScheduledDate] = useState(TOMORROW_ISO);
    const [transporterId, setTransporterId] = useState('');
    const [vehicleId, setVehicleId] = useState('');
    const [freightTerms, setFreightTerms] = useState<'paid' | 'to_pay' | 'free'>(
        'paid',
    );
    const [freightAmount, setFreightAmount] = useState<string>('5000');
    const [notes, setNotes] = useState('');

    const selectedOrders = orders.filter((o) => selectedIds.has(o.id));
    const totalValue = selectedOrders.reduce((s, o) => s + o.totalValue, 0);
    const transporterVehicles = transporterId
        ? vehiclesForTransporter(transporterId)
        : vehicles;

    const canProceed = (): boolean => {
        if (step === 1) return selectedIds.size > 0;
        if (step === 2) return Boolean(sourceWarehouseId && scheduledDate);
        if (step === 3) return Boolean(transporterId && vehicleId);
        return true;
    };

    const toggle = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const submit = () => {
        push({
            variant: 'success',
            title: 'Dispatch created',
            description: `Challan drafted for ${selectedOrders.length} order(s) — ${formatINR(totalValue)}.`,
        });
        navigate('/dispatch');
    };

    return (
        <div className="space-y-4">
            <div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/dispatch')}
                    className="-ml-2"
                >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Back to dispatches
                </Button>
            </div>

            {/* Stepper */}
            <ol className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs">
                {STEPS.map((s, idx) => {
                    const active = step === s.id;
                    const done = step > s.id;
                    return (
                        <li key={s.id} className="flex items-center gap-2">
                            <div
                                className={cn(
                                    'flex size-6 items-center justify-center rounded-full border text-[11px] font-semibold',
                                    done
                                        ? 'border-emerald-500 bg-emerald-500 text-white'
                                        : active
                                            ? 'border-primary bg-primary text-white'
                                            : 'border-slate-200 bg-white text-slate-400',
                                )}
                            >
                                {done ? <Check className="size-3" /> : s.id}
                            </div>
                            <span
                                className={cn(
                                    'font-medium',
                                    active
                                        ? 'text-slate-800'
                                        : done
                                            ? 'text-slate-600'
                                            : 'text-slate-400',
                                )}
                            >
                                {s.label}
                            </span>
                            {idx < STEPS.length - 1 && (
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        'h-px w-6 sm:w-12',
                                        done ? 'bg-emerald-300' : 'bg-slate-200',
                                    )}
                                />
                            )}
                        </li>
                    );
                })}
            </ol>

            {/* Step body */}
            {step === 1 && (
                <section className="rounded-xl border border-slate-200 bg-white">
                    <header className="border-b border-slate-100 px-4 py-3">
                        <h3 className="text-sm font-semibold text-slate-800">
                            Select ready orders
                        </h3>
                        <p className="text-xs text-slate-500">
                            Only orders in <strong>Ready</strong> stage are listed.
                        </p>
                    </header>
                    {orders.length === 0 ? (
                        <div className="px-4 py-12 text-center text-sm text-slate-500">
                            No ready orders available right now.
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {orders.map((o) => {
                                const checked = selectedIds.has(o.id);
                                return (
                                    <li key={o.id}>
                                        <label className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-slate-50">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggle(o.id)}
                                                className="size-4 rounded border-slate-300"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-slate-800">
                                                    <span className="font-mono text-sm">
                                                        {o.orderNumber}
                                                    </span>{' '}
                                                    · {o.companyName}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {o.customerName} · {o.siteCity} ·{' '}
                                                    {o.itemCount} items
                                                </p>
                                            </div>
                                            <div className="text-right text-xs text-slate-500">
                                                <p>
                                                    Expected{' '}
                                                    {formatRelative(o.expectedDeliveryDate)}
                                                </p>
                                                <p className="font-semibold text-slate-800">
                                                    {formatINR(o.totalValue)}
                                                </p>
                                            </div>
                                            <Badge tone={READINESS_TONE[o.readiness]}>
                                                {o.readiness}
                                            </Badge>
                                        </label>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            )}

            {step === 2 && (
                <section className="rounded-xl border border-slate-200 bg-white p-4">
                    <h3 className="mb-3 text-sm font-semibold text-slate-800">
                        Consolidate &amp; schedule
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <FormRow label="Source warehouse">
                            <Select
                                value={sourceWarehouseId}
                                onChange={(e) => setSourceWarehouseId(e.target.value)}
                            >
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>
                                        {w.code} — {w.name}
                                    </option>
                                ))}
                            </Select>
                        </FormRow>
                        <FormRow label="Scheduled dispatch date">
                            <Input
                                type="date"
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                            />
                        </FormRow>
                    </div>
                    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase text-slate-500">
                            Consolidation summary
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                            {selectedOrders.length} order(s) ·{' '}
                            <strong>{formatINR(totalValue)}</strong>
                        </p>
                        <ul className="mt-2 space-y-1 text-xs text-slate-500">
                            {selectedOrders.map((o) => (
                                <li key={o.id}>
                                    <span className="font-mono">{o.orderNumber}</span> ·{' '}
                                    {o.companyName} · {o.siteCity}
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            )}

            {step === 3 && (
                <section className="rounded-xl border border-slate-200 bg-white p-4">
                    <h3 className="mb-3 text-sm font-semibold text-slate-800">
                        Pick transporter &amp; vehicle
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <FormRow label="Transporter">
                            <Select
                                value={transporterId}
                                onChange={(e) => {
                                    setTransporterId(e.target.value);
                                    setVehicleId('');
                                }}
                            >
                                <option value="">Select transporter…</option>
                                {transporters.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} ({t.onTimePct}% on-time)
                                    </option>
                                ))}
                            </Select>
                        </FormRow>
                        <FormRow label="Vehicle">
                            <Select
                                value={vehicleId}
                                onChange={(e) => setVehicleId(e.target.value)}
                                disabled={!transporterId}
                            >
                                <option value="">Select vehicle…</option>
                                {transporterVehicles
                                    .filter((v) => v.status === 'available')
                                    .map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.registration} · {v.typeLabel} ({v.capacityKg}{' '}
                                            kg)
                                        </option>
                                    ))}
                            </Select>
                        </FormRow>
                        <FormRow label="Freight terms">
                            <Select
                                value={freightTerms}
                                onChange={(e) =>
                                    setFreightTerms(
                                        e.target.value as 'paid' | 'to_pay' | 'free',
                                    )
                                }
                            >
                                <option value="paid">Paid</option>
                                <option value="to_pay">To-pay</option>
                                <option value="free">Free delivery</option>
                            </Select>
                        </FormRow>
                        <FormRow label="Freight amount (₹)">
                            <Input
                                type="number"
                                inputMode="numeric"
                                value={freightAmount}
                                onChange={(e) => setFreightAmount(e.target.value)}
                                disabled={freightTerms === 'free'}
                            />
                        </FormRow>
                        <FormRow label="Notes" className="sm:col-span-2">
                            <Textarea
                                rows={3}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Loading instructions, contact at site, etc."
                            />
                        </FormRow>
                    </div>
                </section>
            )}

            {step === 4 && (
                <section className="rounded-xl border border-slate-200 bg-white p-4">
                    <h3 className="mb-3 text-sm font-semibold text-slate-800">
                        Review &amp; create
                    </h3>
                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                        <ReviewField
                            label="Orders"
                            value={`${selectedOrders.length} order(s)`}
                        />
                        <ReviewField
                            label="Total order value"
                            value={formatINR(totalValue)}
                        />
                        <ReviewField
                            label="Source warehouse"
                            value={
                                warehouses.find((w) => w.id === sourceWarehouseId)?.code ??
                                '—'
                            }
                        />
                        <ReviewField
                            label="Scheduled"
                            value={new Date(scheduledDate).toDateString()}
                        />
                        <ReviewField
                            label="Transporter"
                            value={
                                transporters.find((t) => t.id === transporterId)?.name ??
                                '—'
                            }
                        />
                        <ReviewField
                            label="Vehicle"
                            value={
                                vehicles.find((v) => v.id === vehicleId)?.registration ??
                                '—'
                            }
                        />
                        <ReviewField
                            label="Freight"
                            value={
                                freightTerms === 'free'
                                    ? 'Free delivery'
                                    : `${freightTerms === 'paid' ? 'Paid' : 'To-pay'} · ${formatINR(Number(freightAmount) || 0)}`
                            }
                        />
                        {notes && (
                            <ReviewField
                                label="Notes"
                                value={notes}
                                className="sm:col-span-2"
                            />
                        )}
                    </dl>
                </section>
            )}

            {/* Footer nav */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep((Math.max(1, step - 1) as Step))}
                    disabled={step === 1}
                >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Back
                </Button>
                {step < 4 ? (
                    <Button
                        size="sm"
                        disabled={!canProceed()}
                        onClick={() => setStep((step + 1) as Step)}
                    >
                        Next
                        <ArrowRight className="size-4" aria-hidden="true" />
                    </Button>
                ) : (
                    <Button size="sm" onClick={submit}>
                        <Truck className="size-4" aria-hidden="true" />
                        Create dispatch
                    </Button>
                )}
            </div>
        </div>
    );
}

function FormRow({
    label,
    children,
    className,
}: {
    label: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('space-y-1', className)}>
            <label className="text-xs font-semibold uppercase text-slate-500">
                {label}
            </label>
            {children}
        </div>
    );
}

function ReviewField({
    label,
    value,
    className,
}: {
    label: string;
    value: string;
    className?: string;
}) {
    return (
        <div className={className}>
            <dt className="text-xs font-semibold uppercase text-slate-400">
                {label}
            </dt>
            <dd className="text-slate-700">{value}</dd>
        </div>
    );
}
