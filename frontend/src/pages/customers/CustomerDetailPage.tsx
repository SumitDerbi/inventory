import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, GitMerge } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatINR } from '@/lib/format';
import { customerById } from '@/mocks/customers';

const TABS = [
    'Overview',
    'Contacts',
    'Addresses',
    'Orders',
    'Quotations',
    'Documents',
    'Activity',
] as const;
type TabName = (typeof TABS)[number];

export default function CustomerDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [tab, setTab] = useState<TabName>('Overview');

    const customer = useMemo(() => (id ? customerById(id) : undefined), [id]);

    if (!customer) {
        return (
            <div>
                <PageHeader title="Customer not found" />
                <Button variant="outline" onClick={() => navigate('/customers')}>
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Back to customers
                </Button>
            </div>
        );
    }

    const isMerged = customer.status === 'merged';
    const target = isMerged && customer.mergedIntoId
        ? customerById(customer.mergedIntoId)
        : null;

    return (
        <div>
            <PageHeader
                title={customer.name}
                description={customer.legalName ?? '—'}
                breadcrumb={[
                    { label: 'Customers', href: '/customers' },
                    { label: customer.name },
                ]}
                actions={
                    <Button
                        variant="outline"
                        onClick={() => navigate('/customers')}
                    >
                        <ArrowLeft className="size-4" aria-hidden="true" />
                        Back
                    </Button>
                }
            />

            {isMerged && (
                <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <GitMerge className="size-4" aria-hidden="true" />
                    <span>
                        This record was merged
                        {target ? (
                            <>
                                {' into '}
                                <Link
                                    to={`/customers/${target.id}`}
                                    className="font-medium underline"
                                >
                                    {target.name}
                                </Link>
                            </>
                        ) : (
                            '.'
                        )}
                    </span>
                </div>
            )}

            <div className="mb-4 flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
                {TABS.map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setTab(t)}
                        className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                            tab === t
                                ? 'bg-primary/10 text-primary'
                                : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
                {tab === 'Overview' && (
                    <dl className="grid gap-3 sm:grid-cols-2">
                        <Field label="Display name" value={customer.name} />
                        <Field
                            label="Legal name"
                            value={customer.legalName ?? '—'}
                        />
                        <Field
                            label="GST number"
                            value={customer.gstNumber ?? '—'}
                        />
                        <Field label="PAN" value={customer.pan ?? '—'} />
                        <Field
                            label="Industry"
                            value={customer.industry ?? '—'}
                        />
                        <Field
                            label="Territory"
                            value={customer.territory ?? '—'}
                        />
                        <Field
                            label="Segment"
                            value={customer.segment ?? '—'}
                        />
                        <Field
                            label="Status"
                            value={
                                <Badge
                                    tone={
                                        customer.status === 'active'
                                            ? 'green'
                                            : customer.status === 'merged'
                                            ? 'amber'
                                            : 'neutral'
                                    }
                                >
                                    {customer.status}
                                </Badge>
                            }
                        />
                        <Field
                            label="Total orders"
                            value={String(customer.totalOrders)}
                        />
                        <Field
                            label="Lifetime value"
                            value={formatINR(customer.lifetimeValue)}
                        />
                    </dl>
                )}

                {tab === 'Contacts' && (
                    <ul className="divide-y divide-slate-100">
                        {customer.contacts.map((c) => (
                            <li
                                key={c.id}
                                className="flex flex-wrap items-center gap-3 py-3"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-slate-800">
                                        {c.name}{' '}
                                        {c.isPrimary && (
                                            <Badge tone="blue">Primary</Badge>
                                        )}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {c.designation} · {c.phone} · {c.email}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {tab === 'Addresses' && (
                    <ul className="divide-y divide-slate-100">
                        {customer.addresses.map((a) => (
                            <li key={a.id} className="py-3">
                                <p className="font-medium text-slate-800 capitalize">
                                    {a.type} address
                                </p>
                                <p className="text-sm text-slate-600">
                                    {a.line1}, {a.city}, {a.state} {a.pincode}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}

                {(tab === 'Orders' ||
                    tab === 'Quotations' ||
                    tab === 'Documents') && (
                    <p className="text-sm text-slate-500">
                        Linked {tab.toLowerCase()} will appear here once data is
                        wired up to this customer record.
                    </p>
                )}

                {tab === 'Activity' && (
                    <ul className="divide-y divide-slate-100">
                        {customer.activity.map((a) => (
                            <li key={a.id} className="py-3 text-sm">
                                <p className="font-medium text-slate-800">
                                    {a.summary}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {a.actor} ·{' '}
                                    {new Date(a.at).toLocaleString('en-IN')}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function Field({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">
                {label}
            </dt>
            <dd className="mt-0.5 text-sm text-slate-700">{value}</dd>
        </div>
    );
}
