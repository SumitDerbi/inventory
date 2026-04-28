import { useState } from 'react';
import { Settings2, ShieldCheck, Sliders } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FormField, Input } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import {
    approvalRules,
    toleranceDefault,
    type ApprovalRule,
} from '@/mocks/admin-purchase';
import { formatINR } from '@/lib/format';

type TabId = 'approval' | 'tolerance';

const TABS: Array<{ id: TabId; label: string; icon: typeof Settings2 }> = [
    { id: 'approval', label: 'Approval rules', icon: ShieldCheck },
    { id: 'tolerance', label: 'Tolerance settings', icon: Sliders },
];

function ruleConditionLabel(rule: ApprovalRule): string {
    switch (rule.condition.kind) {
        case 'amount':
            return `Amount ≥ ${formatINR(rule.condition.gteINR)}`;
        case 'category':
            return `Category = ${rule.condition.category}`;
        case 'vendor':
            return `Vendor = ${rule.condition.vendorId}`;
    }
}

export default function PurchaseAdminPage() {
    const { push } = useToast();
    const [tab, setTab] = useState<TabId>('approval');
    const [rules, setRules] = useState(approvalRules);
    const [tol, setTol] = useState(toleranceDefault);

    return (
        <div>
            <PageHeader
                title="Purchase admin"
                description="Approval rules and tolerance settings for procurement workflows."
                actions={
                    <Badge tone="neutral">
                        <Settings2 className="size-3" aria-hidden="true" />
                        Admin only
                    </Badge>
                }
            />

            <div role="tablist" aria-label="Admin sections" className="mb-4 flex flex-wrap gap-1 border-b border-slate-200">
                {TABS.map((t) => {
                    const Icon = t.icon;
                    const active = tab === t.id;
                    return (
                        <button
                            key={t.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => setTab(t.id)}
                            className={cn(
                                'relative flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors',
                                active ? 'text-primary' : 'text-slate-500 hover:text-slate-700',
                            )}
                        >
                            <Icon className="size-4" aria-hidden="true" />
                            {t.label}
                            {active && (
                                <span
                                    aria-hidden="true"
                                    className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary"
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {tab === 'approval' && (
                <div className="space-y-3">
                    {rules.map((r) => (
                        <div key={r.id} className="rounded-lg border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-slate-800">{r.name}</h3>
                                        <Badge tone={r.enabled ? 'emerald' : 'neutral'}>
                                            {r.enabled ? 'Enabled' : 'Disabled'}
                                        </Badge>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">{r.description}</p>
                                    <p className="mt-1 text-xs text-slate-600">
                                        <span className="font-medium">Condition:</span> {ruleConditionLabel(r)}
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setRules((rs) =>
                                            rs.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x)),
                                        );
                                        push({
                                            variant: 'success',
                                            title: r.enabled ? 'Rule disabled' : 'Rule enabled',
                                            description: r.name,
                                        });
                                    }}
                                >
                                    {r.enabled ? 'Disable' : 'Enable'}
                                </Button>
                            </div>
                            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                {r.levels.map((lv) => (
                                    <div
                                        key={lv.level}
                                        className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs"
                                    >
                                        <div className="font-semibold text-slate-700">Level {lv.level}</div>
                                        <div className="text-slate-600">{lv.role}</div>
                                        <div className="text-slate-500">SLA: {lv.slaHours}h</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {tab === 'tolerance' && (
                <div className="max-w-2xl space-y-4 rounded-lg border border-slate-200 bg-white p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField label="Quantity tolerance %" htmlFor="qty-pct">
                            <Input
                                id="qty-pct"
                                type="number"
                                value={tol.qtyPct}
                                onChange={(e) => setTol({ ...tol, qtyPct: Number(e.target.value) })}
                            />
                        </FormField>
                        <FormField label="Quantity tolerance (units)" htmlFor="qty-units">
                            <Input
                                id="qty-units"
                                type="number"
                                value={tol.qtyUnits}
                                onChange={(e) => setTol({ ...tol, qtyUnits: Number(e.target.value) })}
                            />
                        </FormField>
                        <FormField label="Price tolerance %" htmlFor="price-pct">
                            <Input
                                id="price-pct"
                                type="number"
                                value={tol.pricePct}
                                onChange={(e) => setTol({ ...tol, pricePct: Number(e.target.value) })}
                            />
                        </FormField>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={tol.allowNegative}
                            onChange={(e) => setTol({ ...tol, allowNegative: e.target.checked })}
                        />
                        Allow short receipts (negative variance)
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={tol.autoCloseOnTolerance}
                            onChange={(e) => setTol({ ...tol, autoCloseOnTolerance: e.target.checked })}
                        />
                        Auto-close PO when tolerance is met
                    </label>
                    <div>
                        <Button
                            onClick={() =>
                                push({
                                    variant: 'success',
                                    title: 'Tolerance saved',
                                    description: 'New defaults applied to upcoming GRNs and invoices.',
                                })
                            }
                        >
                            Save settings
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
