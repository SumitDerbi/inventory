import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import {
    availableQty,
    inventoryProducts,
    stockStatus,
    type InventoryProduct,
    type StockStatus,
} from '@/mocks/inventory';
import { warehouses } from '@/mocks/warehouses';

const CATEGORIES = Array.from(
    new Set(inventoryProducts.map((p) => p.category)),
).sort();
const BRANDS = Array.from(new Set(inventoryProducts.map((p) => p.brand))).sort();

const STATUS_LABEL: Record<StockStatus, string> = {
    in: 'In stock',
    low: 'Low',
    out: 'Out',
};

const STATUS_TONE: Record<StockStatus, 'emerald' | 'amber' | 'red'> = {
    in: 'emerald',
    low: 'amber',
    out: 'red',
};

const ROW_HIGHLIGHT: Record<StockStatus, string> = {
    in: '',
    low: 'bg-amber-50',
    out: 'bg-red-50',
};

export default function ProductsListPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [brand, setBrand] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<'' | StockStatus>('');

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return inventoryProducts.filter((p) => {
            if (category && p.category !== category) return false;
            if (brand && p.brand !== brand) return false;
            if (warehouseFilter && (p.stockByWarehouse[warehouseFilter] ?? 0) <= 0)
                return false;
            if (statusFilter && stockStatus(p) !== statusFilter) return false;
            if (q) {
                const hay = `${p.sku} ${p.name} ${p.brand} ${p.category}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [search, category, brand, warehouseFilter, statusFilter]);

    function reset() {
        setSearch('');
        setCategory('');
        setBrand('');
        setWarehouseFilter('');
        setStatusFilter('');
    }

    const columns: DataTableColumn<InventoryProduct>[] = [
        {
            key: 'sku',
            header: 'SKU',
            cell: (p) => (
                <span className="font-mono text-xs text-slate-600">{p.sku}</span>
            ),
        },
        {
            key: 'name',
            header: 'Name',
            cell: (p) => (
                <div>
                    <p className="font-medium text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-500">
                        {p.brand} · {p.description}
                    </p>
                </div>
            ),
        },
        { key: 'category', header: 'Category', cell: (p) => p.category },
        { key: 'uom', header: 'UoM', cell: (p) => p.uom },
        {
            key: 'stock',
            header: 'Stock',
            align: 'right',
            cell: (p) => <span className="tabular-nums">{p.stockQty}</span>,
        },
        {
            key: 'reserved',
            header: 'Reserved',
            align: 'right',
            cell: (p) => (
                <span className="tabular-nums text-slate-500">{p.reservedQty}</span>
            ),
        },
        {
            key: 'available',
            header: 'Available',
            align: 'right',
            cell: (p) => (
                <span className="tabular-nums font-semibold text-slate-700">
                    {availableQty(p)}
                </span>
            ),
        },
        {
            key: 'reorder',
            header: 'Reorder pt',
            align: 'right',
            cell: (p) => (
                <span className="tabular-nums text-slate-500">{p.reorderPoint}</span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            cell: (p) => {
                const st = stockStatus(p);
                return <Badge tone={STATUS_TONE[st]}>{STATUS_LABEL[st]}</Badge>;
            },
        },
    ];

    return (
        <>
            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search SKU, product, brand…"
                filters={
                    <>
                        <Select
                            aria-label="Category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-44"
                        >
                            <option value="">All categories</option>
                            {CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </Select>
                        <Select
                            aria-label="Brand"
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                            className="w-36"
                        >
                            <option value="">All brands</option>
                            {BRANDS.map((b) => (
                                <option key={b} value={b}>
                                    {b}
                                </option>
                            ))}
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
                        <Select
                            aria-label="Stock status"
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(e.target.value as StockStatus | '')
                            }
                            className="w-36"
                        >
                            <option value="">All status</option>
                            <option value="in">In stock</option>
                            <option value="low">Low stock</option>
                            <option value="out">Out of stock</option>
                        </Select>
                        <Button variant="ghost" size="sm" onClick={reset}>
                            Reset
                        </Button>
                    </>
                }
            />

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <ProductsTable
                    columns={columns}
                    rows={rows}
                    onRowClick={(p) => navigate(`/inventory/products/${p.id}`)}
                />
            </div>

            <p className="mt-3 text-xs text-slate-500">
                Showing {rows.length} of {inventoryProducts.length} products.
            </p>
        </>
    );
}

/* Custom renderer to apply per-row highlight classes. */
function ProductsTable({
    columns,
    rows,
    onRowClick,
}: {
    columns: DataTableColumn<InventoryProduct>[];
    rows: InventoryProduct[];
    onRowClick: (p: InventoryProduct) => void;
}) {
    if (rows.length === 0) {
        return (
            <DataTable<InventoryProduct>
                columns={columns}
                rows={rows}
                rowKey={(p) => p.id}
                emptyState={
                    <div className="px-6 py-12 text-center text-sm text-slate-500">
                        No products match the current filters.
                    </div>
                }
            />
        );
    }
    return (
        <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                    {columns.map((c) => (
                        <th
                            key={c.key}
                            className={cn(
                                'px-3 py-2 font-semibold',
                                c.align === 'right' && 'text-right',
                                c.align === 'center' && 'text-center',
                                (!c.align || c.align === 'left') && 'text-left',
                            )}
                        >
                            {c.header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((p) => {
                    const st = stockStatus(p);
                    return (
                        <tr
                            key={p.id}
                            onClick={() => onRowClick(p)}
                            className={cn(
                                'cursor-pointer border-t border-slate-100 hover:bg-slate-50',
                                ROW_HIGHLIGHT[st],
                            )}
                        >
                            {columns.map((c) => (
                                <td
                                    key={c.key}
                                    className={cn(
                                        'px-3 py-2 align-middle',
                                        c.align === 'right' && 'text-right',
                                        c.align === 'center' && 'text-center',
                                    )}
                                >
                                    {c.cell(p)}
                                </td>
                            ))}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
