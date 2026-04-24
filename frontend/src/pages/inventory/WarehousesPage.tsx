import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Phone, User as UserIcon } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import {
    inventoryProducts,
    ledgerForWarehouse,
    stockValueINR,
} from '@/mocks/inventory';
import { warehouses, type Warehouse } from '@/mocks/warehouses';
import { formatINR } from '@/lib/format';

export default function WarehousesPage() {
    const [activeId, setActiveId] = useState<string>(warehouses[0]?.id ?? '');

    const summaries = useMemo(() => {
        return warehouses.map((w) => {
            const stockValue = inventoryProducts.reduce((acc, p) => {
                const q = p.stockByWarehouse[w.id] ?? 0;
                return acc + q * p.listPrice;
            }, 0);
            const skuCount = inventoryProducts.filter(
                (p) => (p.stockByWarehouse[w.id] ?? 0) > 0,
            ).length;
            const movementCount = ledgerForWarehouse(w.id).length;
            return { id: w.id, stockValue, skuCount, movementCount };
        });
    }, []);

    const active = warehouses.find((w) => w.id === activeId);

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
            <nav aria-label="Warehouses" className="space-y-2">
                {warehouses.map((w) => {
                    const s = summaries.find((x) => x.id === w.id);
                    const isActive = w.id === activeId;
                    return (
                        <button
                            key={w.id}
                            type="button"
                            onClick={() => setActiveId(w.id)}
                            className={cn(
                                'block w-full rounded-xl border p-4 text-left transition',
                                isActive
                                    ? 'border-primary bg-primary/5'
                                    : 'border-slate-200 bg-white hover:bg-slate-50',
                            )}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="flex items-center gap-2 font-semibold text-slate-800">
                                        <Building2
                                            className="size-4 text-slate-400"
                                            aria-hidden="true"
                                        />
                                        {w.name}
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        {w.code} · {w.city}
                                    </p>
                                </div>
                                <Badge tone="neutral">{s?.skuCount ?? 0} SKUs</Badge>
                            </div>
                            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <dt className="text-slate-400">Value</dt>
                                    <dd className="font-semibold text-slate-700">
                                        {formatINR(s?.stockValue ?? 0)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-slate-400">Movements</dt>
                                    <dd className="font-semibold text-slate-700">
                                        {s?.movementCount ?? 0}
                                    </dd>
                                </div>
                            </dl>
                        </button>
                    );
                })}
            </nav>

            {active && <WarehouseDetail warehouse={active} />}
        </div>
    );
}

function WarehouseDetail({ warehouse }: { warehouse: Warehouse }) {
    const topProducts = useMemo(() => {
        return [...inventoryProducts]
            .map((p) => ({
                p,
                qty: p.stockByWarehouse[warehouse.id] ?? 0,
            }))
            .filter((x) => x.qty > 0)
            .sort((a, b) => stockValueINR(b.p) - stockValueINR(a.p))
            .slice(0, 8);
    }, [warehouse.id]);

    return (
        <section className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-base font-semibold text-slate-800">
                    {warehouse.name}{' '}
                    <span className="text-sm font-normal text-slate-500">
                        ({warehouse.code})
                    </span>
                </h3>
                <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div className="flex items-start gap-2">
                        <MapPin
                            className="mt-0.5 size-4 shrink-0 text-slate-400"
                            aria-hidden="true"
                        />
                        <div>
                            <dt className="text-xs font-semibold uppercase text-slate-400">
                                Address
                            </dt>
                            <dd className="text-slate-700">{warehouse.address}</dd>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <UserIcon
                            className="mt-0.5 size-4 shrink-0 text-slate-400"
                            aria-hidden="true"
                        />
                        <div>
                            <dt className="text-xs font-semibold uppercase text-slate-400">
                                In-charge
                            </dt>
                            <dd className="text-slate-700">{warehouse.contactPerson}</dd>
                            <dd className="flex items-center gap-1 text-xs text-slate-500">
                                <Phone className="size-3" aria-hidden="true" />
                                {warehouse.phone}
                            </dd>
                        </div>
                    </div>
                </dl>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="mb-3 text-sm font-semibold text-slate-700">
                    Zones & racks
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {warehouse.zones.map((z) => (
                        <div
                            key={z.code}
                            className="rounded-lg border border-slate-200 p-3"
                        >
                            <p className="text-sm font-semibold text-slate-800">
                                Zone {z.code} · {z.label}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1">
                                {z.racks.map((r) => (
                                    <span
                                        key={r}
                                        className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600"
                                    >
                                        {r}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="mb-3 text-sm font-semibold text-slate-700">
                    Top items by value
                </h4>
                <ul className="divide-y divide-slate-100">
                    {topProducts.map(({ p, qty }) => (
                        <li
                            key={p.id}
                            className="flex items-center justify-between py-2 text-sm"
                        >
                            <Link
                                to={`/inventory/products/${p.id}`}
                                className="min-w-0 truncate text-slate-800 hover:text-primary hover:underline"
                            >
                                <span className="font-mono text-xs text-slate-500">
                                    {p.sku}
                                </span>{' '}
                                {p.name}
                            </Link>
                            <span className="tabular-nums text-slate-600">
                                {qty} {p.uom} ·{' '}
                                <span className="font-semibold text-slate-800">
                                    {formatINR(qty * p.listPrice)}
                                </span>
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
