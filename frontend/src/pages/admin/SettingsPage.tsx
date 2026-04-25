import { useMemo, useState } from 'react';
import {
    AlertCircle,
    Building2,
    CheckCircle2,
    CircleDashed,
    FileText,
    Hash,
    Mail,
    MessageSquareText,
    Percent,
    Plug,
    Save,
    Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FormField, Input, Textarea } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import {
    companyProfile,
    emailTemplates,
    integrations,
    notificationChannels,
    numberingSeries,
    paymentTerms,
    previewSeries,
    taxRules,
    type EmailTemplate,
    type EmailTemplateKey,
    type IntegrationConfig,
    type NumberingSeries,
} from '@/mocks/admin';

type TabId =
    | 'company'
    | 'numbering'
    | 'tax'
    | 'payments'
    | 'email'
    | 'notifications'
    | 'integrations';

interface TabDef {
    id: TabId;
    label: string;
    icon: LucideIcon;
    description: string;
}

const TABS: TabDef[] = [
    {
        id: 'company',
        label: 'Company profile',
        icon: Building2,
        description: 'Legal name, GSTIN, registered address.',
    },
    {
        id: 'numbering',
        label: 'Numbering series',
        icon: Hash,
        description: 'Document numbering pattern and counters.',
    },
    {
        id: 'tax',
        label: 'Tax rules',
        icon: Percent,
        description: 'GST slabs and tax codes.',
    },
    {
        id: 'payments',
        label: 'Payment terms',
        icon: Wallet,
        description: 'Reusable payment conditions.',
    },
    {
        id: 'email',
        label: 'Email templates',
        icon: Mail,
        description: 'Outgoing emails with variable placeholders.',
    },
    {
        id: 'notifications',
        label: 'Notification channels',
        icon: MessageSquareText,
        description: 'Email, SMS, WhatsApp, push.',
    },
    {
        id: 'integrations',
        label: 'Integrations',
        icon: Plug,
        description: 'Accounting, comms, storage and payments.',
    },
];

export default function SettingsPage() {
    const [tab, setTab] = useState<TabId>('company');
    const { push } = useToast();

    function notifySaved(label: string) {
        push({
            variant: 'success',
            title: 'Settings saved',
            description: `${label} updated.`,
        });
    }

    return (
        <div>
            <PageHeader
                title="Settings"
                description="Application preferences, company profile and integrations."
            />

            <div className="grid gap-4 lg:grid-cols-[260px,1fr]">
                <aside className="rounded-xl border border-slate-200 bg-white p-2">
                    <ul className="flex flex-col gap-1">
                        {TABS.map((t) => {
                            const active = tab === t.id;
                            const Icon = t.icon;
                            return (
                                <li key={t.id}>
                                    <button
                                        type="button"
                                        onClick={() => setTab(t.id)}
                                        className={cn(
                                            'flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition',
                                            active
                                                ? 'bg-primary/10 text-primary'
                                                : 'hover:bg-slate-50 text-slate-700',
                                        )}
                                        aria-current={active ? 'page' : undefined}
                                    >
                                        <Icon
                                            className={cn(
                                                'mt-0.5 size-4 shrink-0',
                                                active
                                                    ? 'text-primary'
                                                    : 'text-slate-400',
                                            )}
                                            aria-hidden="true"
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-medium">
                                                {t.label}
                                            </span>
                                            <span className="mt-0.5 block text-xs text-slate-500 line-clamp-2">
                                                {t.description}
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </aside>

                <section className="rounded-xl border border-slate-200 bg-white">
                    {tab === 'company' && (
                        <CompanyTab onSave={() => notifySaved('Company profile')} />
                    )}
                    {tab === 'numbering' && (
                        <NumberingTab onSave={() => notifySaved('Numbering series')} />
                    )}
                    {tab === 'tax' && (
                        <TaxTab onSave={() => notifySaved('Tax rules')} />
                    )}
                    {tab === 'payments' && (
                        <PaymentTermsTab
                            onSave={() => notifySaved('Payment terms')}
                        />
                    )}
                    {tab === 'email' && (
                        <EmailTab onSave={() => notifySaved('Email template')} />
                    )}
                    {tab === 'notifications' && (
                        <NotificationsTab
                            onSave={() => notifySaved('Notification channels')}
                        />
                    )}
                    {tab === 'integrations' && <IntegrationsTab />}
                </section>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Company profile                                                     */
/* ------------------------------------------------------------------ */

function TabHeader({
    title,
    description,
    actions,
}: {
    title: string;
    description: string;
    actions?: React.ReactNode;
}) {
    return (
        <header className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 md:flex-row md:items-end md:justify-between">
            <div>
                <h2 className="text-base font-semibold text-slate-800">{title}</h2>
                <p className="text-sm text-slate-500">{description}</p>
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </header>
    );
}

function CompanyTab({ onSave }: { onSave: () => void }) {
    const [draft, setDraft] = useState(companyProfile);

    return (
        <>
            <TabHeader
                title="Company profile"
                description="Used on invoices, quotations and outgoing emails."
                actions={
                    <Button onClick={onSave}>
                        <Save className="size-4" aria-hidden="true" />
                        Save
                    </Button>
                }
            />
            <div className="grid gap-4 p-5 md:grid-cols-2">
                <FormField label="Legal name" required>
                    <Input
                        value={draft.legalName}
                        onChange={(e) =>
                            setDraft({ ...draft, legalName: e.target.value })
                        }
                    />
                </FormField>
                <FormField label="Trade name">
                    <Input
                        value={draft.tradeName}
                        onChange={(e) =>
                            setDraft({ ...draft, tradeName: e.target.value })
                        }
                    />
                </FormField>
                <FormField label="GSTIN">
                    <Input
                        value={draft.gstin}
                        onChange={(e) =>
                            setDraft({ ...draft, gstin: e.target.value })
                        }
                    />
                </FormField>
                <FormField label="PAN">
                    <Input
                        value={draft.pan}
                        onChange={(e) => setDraft({ ...draft, pan: e.target.value })}
                    />
                </FormField>
                <FormField label="CIN">
                    <Input
                        value={draft.cin}
                        onChange={(e) => setDraft({ ...draft, cin: e.target.value })}
                    />
                </FormField>
                <FormField label="Phone">
                    <Input
                        value={draft.phone}
                        onChange={(e) =>
                            setDraft({ ...draft, phone: e.target.value })
                        }
                    />
                </FormField>
                <FormField label="Address line 1" className="md:col-span-2">
                    <Input
                        value={draft.addressLine1}
                        onChange={(e) =>
                            setDraft({ ...draft, addressLine1: e.target.value })
                        }
                    />
                </FormField>
                <FormField label="Address line 2" className="md:col-span-2">
                    <Input
                        value={draft.addressLine2}
                        onChange={(e) =>
                            setDraft({ ...draft, addressLine2: e.target.value })
                        }
                    />
                </FormField>
                <FormField label="City">
                    <Input
                        value={draft.city}
                        onChange={(e) =>
                            setDraft({ ...draft, city: e.target.value })
                        }
                    />
                </FormField>
                <FormField label="State">
                    <Input
                        value={draft.state}
                        onChange={(e) =>
                            setDraft({ ...draft, state: e.target.value })
                        }
                    />
                </FormField>
                <FormField label="Pincode">
                    <Input
                        value={draft.pincode}
                        onChange={(e) =>
                            setDraft({ ...draft, pincode: e.target.value })
                        }
                    />
                </FormField>
                <FormField label="Country">
                    <Input
                        value={draft.country}
                        onChange={(e) =>
                            setDraft({ ...draft, country: e.target.value })
                        }
                    />
                </FormField>
                <FormField label="Email">
                    <Input
                        type="email"
                        value={draft.email}
                        onChange={(e) =>
                            setDraft({ ...draft, email: e.target.value })
                        }
                    />
                </FormField>
                <FormField label="Website">
                    <Input
                        value={draft.website}
                        onChange={(e) =>
                            setDraft({ ...draft, website: e.target.value })
                        }
                    />
                </FormField>
                <FormField label="Logo" className="md:col-span-2">
                    <div className="flex items-center gap-3 rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
                        <span
                            className="flex size-12 items-center justify-center rounded bg-primary/10 text-sm font-semibold text-primary"
                            aria-hidden="true"
                        >
                            PI
                        </span>
                        <Button variant="outline" size="sm" type="button">
                            Upload logo
                        </Button>
                        <span>PNG / SVG · max 200 KB</span>
                    </div>
                </FormField>
            </div>
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Numbering series                                                    */
/* ------------------------------------------------------------------ */

function NumberingTab({ onSave }: { onSave: () => void }) {
    const [series, setSeries] = useState<NumberingSeries[]>(numberingSeries);

    function update(idx: number, patch: Partial<NumberingSeries>) {
        setSeries((curr) =>
            curr.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
        );
    }

    return (
        <>
            <TabHeader
                title="Numbering series"
                description="Each document type has a prefix, pattern and current sequence."
                actions={
                    <Button onClick={onSave}>
                        <Save className="size-4" aria-hidden="true" />
                        Save
                    </Button>
                }
            />
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                            <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">
                                Document
                            </th>
                            <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">
                                Prefix
                            </th>
                            <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">
                                Pattern
                            </th>
                            <th className="border-b border-slate-200 px-4 py-3 text-right font-semibold">
                                Next #
                            </th>
                            <th className="border-b border-slate-200 px-4 py-3 text-center font-semibold">
                                FY reset
                            </th>
                            <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">
                                Preview
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {series.map((s, idx) => {
                            const preview = previewSeries(
                                s.pattern,
                                s.prefix,
                                s.nextNumber,
                            );
                            return (
                                <tr key={s.id} className="hover:bg-slate-50/60">
                                    <td className="border-b border-slate-100 px-4 py-3 font-medium text-slate-700">
                                        {s.label}
                                    </td>
                                    <td className="border-b border-slate-100 px-4 py-3">
                                        <Input
                                            value={s.prefix}
                                            onChange={(e) =>
                                                update(idx, {
                                                    prefix: e.target.value,
                                                })
                                            }
                                            className="w-24"
                                        />
                                    </td>
                                    <td className="border-b border-slate-100 px-4 py-3">
                                        <Input
                                            value={s.pattern}
                                            onChange={(e) =>
                                                update(idx, {
                                                    pattern: e.target.value,
                                                })
                                            }
                                            className="w-56 font-mono text-xs"
                                        />
                                    </td>
                                    <td className="border-b border-slate-100 px-4 py-3 text-right">
                                        <Input
                                            type="number"
                                            value={s.nextNumber}
                                            onChange={(e) =>
                                                update(idx, {
                                                    nextNumber: Number(
                                                        e.target.value,
                                                    ),
                                                })
                                            }
                                            className="w-24 text-right"
                                        />
                                    </td>
                                    <td className="border-b border-slate-100 px-4 py-3 text-center">
                                        <input
                                            type="checkbox"
                                            checked={s.fyReset}
                                            onChange={(e) =>
                                                update(idx, {
                                                    fyReset: e.target.checked,
                                                })
                                            }
                                            className="size-4 rounded border-slate-300 text-primary focus:ring-primary"
                                            aria-label={`FY reset for ${s.label}`}
                                        />
                                    </td>
                                    <td className="border-b border-slate-100 px-4 py-3 font-mono text-xs text-emerald-700">
                                        {preview}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <p className="px-5 py-3 text-xs text-slate-400">
                Pattern tokens: <code className="font-mono">{'{prefix}'}</code>,{' '}
                <code className="font-mono">{'{fy}'}</code>,{' '}
                <code className="font-mono">{'{seq:N}'}</code> (zero-padded to N
                digits).
            </p>
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Tax rules                                                           */
/* ------------------------------------------------------------------ */

function TaxTab({ onSave }: { onSave: () => void }) {
    return (
        <>
            <TabHeader
                title="Tax rules"
                description="GST slabs available for line-items and orders."
                actions={
                    <Button onClick={onSave}>
                        <Save className="size-4" aria-hidden="true" />
                        Save
                    </Button>
                }
            />
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                            <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">
                                Code
                            </th>
                            <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">
                                Label
                            </th>
                            <th className="border-b border-slate-200 px-4 py-3 text-right font-semibold">
                                CGST
                            </th>
                            <th className="border-b border-slate-200 px-4 py-3 text-right font-semibold">
                                SGST
                            </th>
                            <th className="border-b border-slate-200 px-4 py-3 text-right font-semibold">
                                IGST
                            </th>
                            <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">
                                Applies to
                            </th>
                            <th className="border-b border-slate-200 px-4 py-3 text-center font-semibold">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {taxRules.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50/60">
                                <td className="border-b border-slate-100 px-4 py-3 font-mono text-xs text-slate-600">
                                    {t.code}
                                </td>
                                <td className="border-b border-slate-100 px-4 py-3 font-medium text-slate-700">
                                    {t.label}
                                </td>
                                <td className="border-b border-slate-100 px-4 py-3 text-right tabular-nums text-slate-600">
                                    {t.cgst.toFixed(1)}%
                                </td>
                                <td className="border-b border-slate-100 px-4 py-3 text-right tabular-nums text-slate-600">
                                    {t.sgst.toFixed(1)}%
                                </td>
                                <td className="border-b border-slate-100 px-4 py-3 text-right tabular-nums text-slate-600">
                                    {t.igst.toFixed(1)}%
                                </td>
                                <td className="border-b border-slate-100 px-4 py-3 text-slate-500">
                                    {t.appliesTo}
                                </td>
                                <td className="border-b border-slate-100 px-4 py-3 text-center">
                                    {t.active ? (
                                        <Badge tone="emerald">Active</Badge>
                                    ) : (
                                        <Badge tone="neutral">Disabled</Badge>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Payment terms                                                       */
/* ------------------------------------------------------------------ */

function PaymentTermsTab({ onSave }: { onSave: () => void }) {
    return (
        <>
            <TabHeader
                title="Payment terms"
                description="Reusable terms attached to quotations and orders."
                actions={
                    <Button onClick={onSave}>
                        <Save className="size-4" aria-hidden="true" />
                        Save
                    </Button>
                }
            />
            <ul className="divide-y divide-slate-100">
                {paymentTerms.map((p) => (
                    <li
                        key={p.id}
                        className="flex flex-col gap-1 px-5 py-4 md:flex-row md:items-center md:justify-between"
                    >
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-slate-500">
                                    {p.code}
                                </span>
                                <span className="font-medium text-slate-800">
                                    {p.label}
                                </span>
                                {p.active ? (
                                    <Badge tone="emerald">Active</Badge>
                                ) : (
                                    <Badge tone="neutral">Disabled</Badge>
                                )}
                            </div>
                            <p className="mt-0.5 text-sm text-slate-500">
                                {p.description}
                            </p>
                        </div>
                        <div className="text-xs text-slate-400 md:text-right">
                            Net {p.netDays} day{p.netDays === 1 ? '' : 's'}
                        </div>
                    </li>
                ))}
            </ul>
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Email templates                                                     */
/* ------------------------------------------------------------------ */

function EmailTab({ onSave }: { onSave: () => void }) {
    const [activeId, setActiveId] = useState<EmailTemplateKey>(
        emailTemplates[0].id,
    );
    const active = useMemo(
        () => emailTemplates.find((t) => t.id === activeId) ?? emailTemplates[0],
        [activeId],
    );
    const [draft, setDraft] = useState<EmailTemplate>(active);

    function selectTemplate(id: EmailTemplateKey) {
        const next = emailTemplates.find((t) => t.id === id);
        if (next) {
            setActiveId(id);
            setDraft(next);
        }
    }

    return (
        <>
            <TabHeader
                title="Email templates"
                description="Customise outgoing emails. Variables in curly braces are auto-substituted."
                actions={
                    <Button onClick={onSave}>
                        <Save className="size-4" aria-hidden="true" />
                        Save
                    </Button>
                }
            />
            <div className="grid gap-4 p-5 md:grid-cols-[220px,1fr]">
                <ul className="flex flex-col gap-1">
                    {emailTemplates.map((t) => {
                        const isActive = t.id === activeId;
                        return (
                            <li key={t.id}>
                                <button
                                    type="button"
                                    onClick={() => selectTemplate(t.id)}
                                    className={cn(
                                        'flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left transition',
                                        isActive
                                            ? 'bg-primary/10 text-primary'
                                            : 'hover:bg-slate-50 text-slate-700',
                                    )}
                                >
                                    <FileText
                                        className={cn(
                                            'mt-0.5 size-4 shrink-0',
                                            isActive
                                                ? 'text-primary'
                                                : 'text-slate-400',
                                        )}
                                        aria-hidden="true"
                                    />
                                    <span className="text-sm font-medium">
                                        {t.label}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
                <div className="grid gap-3">
                    <FormField label="Subject">
                        <Input
                            value={draft.subject}
                            onChange={(e) =>
                                setDraft({ ...draft, subject: e.target.value })
                            }
                        />
                    </FormField>
                    <FormField
                        label="Body"
                        helper="Variables surrounded by curly braces will be substituted at send time."
                    >
                        <Textarea
                            rows={9}
                            value={draft.body}
                            onChange={(e) =>
                                setDraft({ ...draft, body: e.target.value })
                            }
                            className="font-mono text-xs"
                        />
                    </FormField>
                    <div>
                        <div className="mb-1 text-xs font-medium text-slate-600">
                            Available variables
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {draft.variables.map((v) => (
                                <span
                                    key={v}
                                    className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs text-slate-600"
                                >
                                    {`{${v}}`}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Notification channels                                               */
/* ------------------------------------------------------------------ */

function NotificationsTab({ onSave }: { onSave: () => void }) {
    const [channels, setChannels] = useState(notificationChannels);

    function toggle(idx: number) {
        setChannels((curr) =>
            curr.map((c, i) =>
                i === idx ? { ...c, enabled: !c.enabled } : c,
            ),
        );
    }

    return (
        <>
            <TabHeader
                title="Notification channels"
                description="Control where outbound notifications can be delivered."
                actions={
                    <Button onClick={onSave}>
                        <Save className="size-4" aria-hidden="true" />
                        Save
                    </Button>
                }
            />
            <ul className="divide-y divide-slate-100">
                {channels.map((c, idx) => (
                    <li
                        key={c.channel}
                        className="flex items-center justify-between gap-3 px-5 py-4"
                    >
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-800">
                                    {c.label}
                                </span>
                                {c.enabled ? (
                                    <Badge tone="emerald">Enabled</Badge>
                                ) : (
                                    <Badge tone="neutral">Disabled</Badge>
                                )}
                            </div>
                            <p className="mt-0.5 text-sm text-slate-500">
                                {c.detail}
                            </p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={c.enabled}
                            onClick={() => toggle(idx)}
                            className={cn(
                                'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition',
                                c.enabled ? 'bg-primary' : 'bg-slate-200',
                            )}
                        >
                            <span
                                className={cn(
                                    'inline-block size-5 transform rounded-full bg-white shadow transition',
                                    c.enabled ? 'translate-x-5' : 'translate-x-0.5',
                                )}
                            />
                        </button>
                    </li>
                ))}
            </ul>
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Integrations                                                        */
/* ------------------------------------------------------------------ */

const INTEGRATION_STATUS_BADGE: Record<
    IntegrationConfig['status'],
    { tone: 'emerald' | 'red' | 'neutral'; label: string; icon: LucideIcon }
> = {
    connected: { tone: 'emerald', label: 'Connected', icon: CheckCircle2 },
    available: { tone: 'neutral', label: 'Available', icon: CircleDashed },
    error: { tone: 'red', label: 'Needs attention', icon: AlertCircle },
};

function IntegrationsTab() {
    return (
        <>
            <TabHeader
                title="Integrations"
                description="Connect external services for accounting, comms, storage and payments."
            />
            <div className="grid gap-3 p-5 md:grid-cols-2">
                {integrations.map((i) => {
                    const meta = INTEGRATION_STATUS_BADGE[i.status];
                    const Icon = meta.icon;
                    return (
                        <div
                            key={i.id}
                            className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-slate-800">
                                            {i.name}
                                        </span>
                                        <Badge tone="neutral" className="capitalize">
                                            {i.category}
                                        </Badge>
                                    </div>
                                    <p className="mt-0.5 text-sm text-slate-500">
                                        {i.description}
                                    </p>
                                </div>
                                <Badge tone={meta.tone} className="shrink-0">
                                    <Icon
                                        className="-ml-0.5 mr-1 size-3"
                                        aria-hidden="true"
                                    />
                                    {meta.label}
                                </Badge>
                            </div>
                            {i.detail && (
                                <p className="text-xs text-slate-400">{i.detail}</p>
                            )}
                            <div className="mt-1 flex justify-end">
                                <Button variant="outline" size="sm">
                                    {i.status === 'connected'
                                        ? 'Manage'
                                        : i.status === 'error'
                                            ? 'Reconnect'
                                            : 'Connect'}
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
