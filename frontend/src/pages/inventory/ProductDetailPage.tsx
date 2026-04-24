import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Download,
    FileText,
    MapPin,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/cn';
import { formatINR, formatRelative } from '@/lib/format';
import {
    availableQty,
    inventoryProductById,
    ledgerForProduct,
    reservationsForProduct,
    stockStatus,
    type MovementType,
} from '@/mocks/inventory';
import { warehouses, warehouseById } from '@/mocks/warehouses';
import { userById } from '@/mocks/users';

type TabKey =
    | 'specs'
    | 'stock'
    | 'ledger'
    | 'reservations'
    | 'pricing'
    | 'attachments';

const TABS: Array<{ key: TabKey; label: string }> = [
    { key: 'specs', label: 'Specifications' },
    { key: 'stock', label: 'Stock by Warehouse' },
    { key: 'ledger', label: 'Ledger' },
    { key: 'reservations', label: 'Reservations' },
    { key: 'pricing', label: 'Pricing' },
    { key: 'attachments', label: 'Attachments' },
];

const STATUS_LABEL = { in: 'In stock', low: 'Low stock', out: 'Out of stock' } as const;
const STATUS_TONE = { in: 'emerald', low: 'amber', red: 'red' } as const;

const MOVEMENT_LABEL: Record<MovementType, string> = {
    purchase: 'Purchase',
    sale: 'Sale',
    transfer_in: 'Transfer in',
    transfer_out: 'Transfer out',
    adjustment: 'Adjustment',
    reservation: 'Reservation',
    release: 'Release',
};

const MOVEMENT_TONE: Record<MovementType, 'emerald' | 'red' | 'blue' | 'amber' | 'violet'> = {
    purchase: 'emerald',
    sale: 'blue',
    transfer_in: 'emerald',
    transfer_out: 'amber',
    adjustment: 'violet',
    reservation: 'amber',
    release: 'emerald',
};

const RESERVATION_TONE: Record<string, 'amber' | 'blue' | 'emerald' | 'neutral'> = {
    active: 'amber',
    partial: 'blue',
    released: 'neutral',
    shipped: 'emerald',
};

export default function ProductDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const product = inventoryProductById(id ?? '');
    const [tab, setTab] = useState<TabKey>('specs');
    const [ledgerLimit, setLedgerLimit] = useState(25);

    const ledger = useMemo(
        () => (product ? ledgerForProduct(product.id) : []),
        [product],
    );
    const reservations = useMemo(
        () => (product ? reservationsForProduct(product.id) : []),
        [product],
    );

    if (!product) {
        return <Navigate to="/inventory/products" replace />;
    }

    const st = stockStatus(product);
    const available = availableQty(product);

    return (
        <section>
            <button
                type="button"
                onClick={() => navigate('/inventory/products')}
                className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
            >
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                Back to products
            </button>

            <header className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold text-slate-800 md:text-2xl">
                            {product.name}
                        </h2>
                        <Badge tone={STATUS_TONE[st === 'out' ? 'red' : st]}>
                            {STATUS_LABEL[st]}
                        </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                        <span className="font-mono">{product.sku}</span> · {product.brand} ·{' '}
                        {product.category} · UoM {product.uom}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{product.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="size-4" aria-hidden="true" />
                        Export ledger
                    </Button>
                    <Button size="sm" asChild>
                        <Link to="/inventory/adjustments">New adjustment</Link>
                    </Button>
                </div>
            </header>

            {/* KPI strip */}
            <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-4">
                <Stat label="On hand" value={`${product.stockQty} ${product.uom}`} />
                <Stat
                    label="Reserved"
                    value={String(product.reservedQty)}
                    valueClassName="text-amber-700"
                />
                <Stat
                    label="Available"
                    value={String(available)}
                    valueClassName={available <= product.reorderPoint ? 'text-red-600' : 'text-emerald-700'}
                />
                <Stat label="Reorder pt" value={String(product.reorderPoint)} />
            </div>

            {/* Tabs */}
            <div
                role="tablist"
                aria-label="Product sections"
                className="mb-4 flex flex-wrap gap-1 border-b border-slate-200"
            >
                {TABS.map((t) => {
                    const count =
                        t.key === 'ledger'
                            ? ledger.length
                            : t.key === 'reservations'
                                ? reservations.length
                                : t.key === 'attachments'
                                    ? product.attachments.length
                                    : null;
                    return (
                        <button
                            key={t.key}
                            type="button"
                            role="tab"
                            aria-selected={tab === t.key}
                            onClick={() => setTab(t.key)}
                            className={cn(
                                'relative flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors',
                                tab === t.key
                                    ? 'text-primary'
                                    : 'text-slate-500 hover:text-slate-700',
                            )}
                        >
                            {t.label}
                            {count !== null && count > 0 && (
                                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                                    {count}
                                </span>
                            )}
                            {tab === t.key && (
                                <span
                                    aria-hidden="true"
                                    className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary"
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {tab === 'specs' && (
                <Card title="Specifications">
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                        {product.specifications.map((s) => (
                            <div key={s.key} className="flex flex-col">
                                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    {s.key}
                                </dt>
                                <dd className="text-slate-700">{s.value}</dd>
                            </div>
                        ))}
                    </dl>
                </Card>
            )}

            {tab === 'stock' && (
                <Card title="Stock distribution">
                    <ul className="divide-y divide-slate-100">
                        {warehouses.map((w) => {
                            const qty = product.stockByWarehouse[w.id] ?? 0;
                            return (
                                <li key={w.id} className="flex items-center justify-between py-3">
                                    <div className="flex items-start gap-2">
                                        <MapPin
                                            className="mt-0.5 size-4 text-slate-400"
                                            aria-hidden="true"
                                        />
                                        <div>
                                            <p className="font-medium text-slate-800">
                                                {w.name}{' '}
                                                <span className="text-xs font-normal text-slate-500">
                                                    ({w.code})
                                                </span>
                                            </p>
                                            <p className="text-xs text-slate-500">{w.city}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-semibold tabular-nums text-slate-800">
                                            {qty}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {product.uom}
                                        </p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </Card>
            )}

            {tab === 'ledger' && (
                <Card title={`Stock ledger (${ledger.length})`}>
                    {ledger.length === 0 ? (
                        <EmptyState
                            title="No movements yet"
                            description="Stock movements for this product will appear here."
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-semibold">When</th>
                                        <th className="px-3 py-2 text-left font-semibold">Warehouse</th>
                                        <th className="px-3 py-2 text-left font-semibold">Type</th>
                                        <th className="px-3 py-2 text-left font-semibold">Doc ref</th>
                                        <th className="px-3 py-2 text-right font-semibold">Qty</th>
                                        <th className="px-3 py-2 text-right font-semibold">Balance</th>
                                        <th className="px-3 py-2 text-left font-semibold">Actor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ledger.slice(0, ledgerLimit).map((m) => (
                                        <tr key={m.id} className="border-t border-slate-100">
                                            <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">
                                                {formatRelative(m.at)}
                                            </td>
                                            <td className="px-3 py-2 text-xs text-slate-600">
                                                {warehouseById(m.warehouseId)?.code ?? '—'}
                                            </td>
                                            <td className="px-3 py-2">
                                                <Badge tone={MOVEMENT_TONE[m.type]}>
                                                    {MOVEMENT_LABEL[m.type]}
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-2 font-mono text-xs text-slate-600">
                                                {m.docRef}
                                            </td>
                                            <td
                                                className={cn(
                                                    'px-3 py-2 text-right tabular-nums',
                                                    m.qty >= 0 ? 'text-emerald-700' : 'text-red-600',
                                                )}
                                            >
                                                {m.qty > 0 ? `+${m.qty}` : m.qty}
                                            </td>
                                            <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-800">
                                                {m.balance}
                                            </td>
                                            <td className="px-3 py-2 text-xs text-slate-500">
                                                {userById(m.actorId)?.name ?? '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {ledgerLimit < ledger.length && (
                                <div className="mt-3 text-center">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setLedgerLimit((n) => n + 25)}
                                    >
                                        Load more ({ledger.length - ledgerLimit} remaining)
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            )}

            {tab === 'reservations' && (
                <Card title={`Reservations (${reservations.length})`}>
                    {reservations.length === 0 ? (
                        <EmptyState
                            title="No reservations"
                            description="Active order reservations will appear here."
                        />
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {reservations.map((r) => (
                                <li key={r.id} className="flex items-center justify-between py-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Link
                                                to={`/orders/${r.orderId}`}
                                                className="font-medium text-primary hover:underline"
                                            >
                                                {r.orderNumber}
                                            </Link>
                                            <Badge tone={RESERVATION_TONE[r.status] ?? 'neutral'}>
                                                {r.status}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            {r.customerName} · {warehouseById(r.warehouseId)?.code} ·
                                            reserved {formatRelative(r.reservedAt)}
                                        </p>
                                    </div>
                                    <p className="text-sm font-semibold tabular-nums text-slate-800">
                                        {r.qty} {product.uom}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            )}

            {tab === 'pricing' && (
                <Card title="Pricing">
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                        <div>
                            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                List price
                            </dt>
                            <dd className="text-slate-800">
                                {formatINR(product.listPrice)} / {product.uom}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                GST
                            </dt>
                            <dd className="text-slate-800">{product.taxRate}%</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Dealer (−8%)
                            </dt>
                            <dd className="text-slate-800">
                                {formatINR(product.listPrice * 0.92)}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Project (−12%)
                            </dt>
                            <dd className="text-slate-800">
                                {formatINR(product.listPrice * 0.88)}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                OEM (−18%)
                            </dt>
                            <dd className="text-slate-800">
                                {formatINR(product.listPrice * 0.82)}
                            </dd>
                        </div>
                    </dl>
                </Card>
            )}

            {tab === 'attachments' && (
                <Card title={`Attachments (${product.attachments.length})`}>
                    {product.attachments.length === 0 ? (
                        <EmptyState
                            title="No attachments"
                            description="Datasheets and test certificates will appear here."
                        />
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {product.attachments.map((a) => (
                                <li key={a.id} className="flex items-center gap-3 py-3">
                                    <span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-500">
                                        <FileText className="size-4" aria-hidden="true" />
                                    </span>
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-800">{a.name}</p>
                                        <p className="text-xs text-slate-500">{a.size}</p>
                                    </div>
                                    <Button size="sm" variant="ghost">
                                        <Download className="size-4" aria-hidden="true" />
                                        Download
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            )}
        </section>
    );
}

function Card({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3>
            {children}
        </section>
    );
}

function Stat({
    label,
    value,
    valueClassName,
}: {
    label: string;
    value: string;
    valueClassName?: string;
}) {
    return (
        <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {label}
            </p>
            <p className={cn('text-sm font-semibold text-slate-700', valueClassName)}>
                {value}
            </p>
        </div>
    );
}
