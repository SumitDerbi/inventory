import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/ui/FilterBar';
import { Select } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { formatINR } from '@/lib/format';
import {
    reorderRows,
    stockStatus,
    type ReorderRow,
} from '@/mocks/inventory';
import { warehouses, warehouseById } from '@/mocks/warehouses';

export default function ReorderPage() {
    const { push } = useToast();
    const all = useMemo(() => reorderRows(), []);
    const [severity, setSeverity] = useState<'' | 'low' | 'out'>('');
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [search, setSearch] = useState('');

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return all.filter((r) => {
            const st = stockStatus(r.product);
            if (severity && st !== severity) return false;
            if (
                warehouseFilter &&
                (r.product.stockByWarehouse[warehouseFilter] ?? 0) > 0
            ) {
                // keep only rows where THIS warehouse is the shortage location
                if (r.primaryWarehouseId !== warehouseFilter) return false;
            }
            if (q) {
                const hay = `${r.product.sku} ${r.product.name}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [all, severity, warehouseFilter, search]);

    return (
        <>
            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search SKU or product…"
                filters={
                    <>
                        <Select
                            aria-label="Severity"
                            value={severity}
                            onChange={(e) =>
                                setSeverity(e.target.value as '' | 'low' | 'out')
                            }
                            className="w-40"
                        >
                            <option value="">All severity</option>
                            <option value="low">Low stock</option>
                            <option value="out">Out of stock</option>
                        </Select>
                        <Select
                            aria-label="Warehouse"
                            value={warehouseFilter}
                            onChange={(e) => setWarehouseFilter(e.target.value)}
                            className="w-40"
                        >
                            <option value="">All warehouses</option>
                            {warehouses.map((w) => (
                                <option key={w.id} value={w.id}>
                                    {w.code}
                                </option>
                            ))}
                        </Select>
                    </>
                }
                actions={
                    <Button
                        size="sm"
                        onClick={() =>
                            push({
                                variant: 'success',
                                title: `PO draft created`,
                                description: `${rows.length} item(s) queued for approval.`,
                            })
                        }
                        disabled={rows.length === 0}
                    >
                        <ShoppingCart className="size-4" aria-hidden="true" />
                        Raise PO for all
                    </Button>
                }
            />

            {rows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
                    Nothing to reorder — stock looks healthy.
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-3 py-2 text-left font-semibold">Product</th>
                                <th className="px-3 py-2 text-left font-semibold">Severity</th>
                                <th className="px-3 py-2 text-left font-semibold">Warehouse</th>
                                <th className="px-3 py-2 text-right font-semibold">Available</th>
                                <th className="px-3 py-2 text-right font-semibold">Reorder pt</th>
                                <th className="px-3 py-2 text-right font-semibold">Shortfall</th>
                                <th className="px-3 py-2 text-right font-semibold">Suggested PO</th>
                                <th className="px-3 py-2 text-right font-semibold">Est. value</th>
                                <th className="px-3 py-2" />
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <ReorderTableRow key={r.product.id} row={r} onRaise={() =>
                                    push({
                                        variant: 'success',
                                        title: 'PO draft created',
                                        description: `${r.product.sku} × ${r.suggestedPoQty}.`,
                                    })
                                } />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <p className="mt-3 text-xs text-slate-500">
                Showing {rows.length} of {all.length} items needing attention.
            </p>
        </>
    );
}

function ReorderTableRow({
    row,
    onRaise,
}: {
    row: ReorderRow;
    onRaise: () => void;
}) {
    const st = stockStatus(row.product);
    const severityTone = st === 'out' ? 'red' : 'amber';
    return (
        <tr
            className={cn(
                'border-t border-slate-100',
                st === 'out' ? 'bg-red-50/60' : 'bg-amber-50/50',
            )}
        >
            <td className="px-3 py-2">
                <Link
                    to={`/inventory/products/${row.product.id}`}
                    className="font-medium text-slate-800 hover:text-primary hover:underline"
                >
                    {row.product.name}
                </Link>
                <p className="font-mono text-xs text-slate-500">{row.product.sku}</p>
            </td>
            <td className="px-3 py-2">
                <Badge tone={severityTone}>
                    {st === 'out' ? 'Out of stock' : 'Low'}
                </Badge>
            </td>
            <td className="px-3 py-2 text-xs text-slate-600">
                {warehouseById(row.primaryWarehouseId)?.code ?? '—'}
            </td>
            <td className="px-3 py-2 text-right tabular-nums">{row.available}</td>
            <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                {row.product.reorderPoint}
            </td>
            <td className="px-3 py-2 text-right font-semibold tabular-nums text-red-600">
                {row.shortfall || '—'}
            </td>
            <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-800">
                {row.suggestedPoQty}
            </td>
            <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                {formatINR(row.suggestedPoQty * row.product.listPrice)}
            </td>
            <td className="px-3 py-2 text-right">
                <Button size="sm" variant="outline" onClick={onRaise}>
                    Raise PO
                </Button>
            </td>
        </tr>
    );
}
