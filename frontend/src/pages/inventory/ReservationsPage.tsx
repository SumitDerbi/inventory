import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Select } from '@/components/ui/FormField';
import { formatRelative } from '@/lib/format';
import {
    inventoryProductById,
    reservations,
    type Reservation,
} from '@/mocks/inventory';
import { warehouses, warehouseById } from '@/mocks/warehouses';

const STATUS_TONE: Record<Reservation['status'], 'amber' | 'blue' | 'neutral' | 'emerald'> = {
    active: 'amber',
    partial: 'blue',
    released: 'neutral',
    shipped: 'emerald',
};

const STATUSES: Reservation['status'][] = [
    'active',
    'partial',
    'released',
    'shipped',
];

export default function ReservationsPage() {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<'' | Reservation['status']>('');
    const [warehouseFilter, setWarehouseFilter] = useState('');

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return reservations.filter((r) => {
            if (status && r.status !== status) return false;
            if (warehouseFilter && r.warehouseId !== warehouseFilter) return false;
            if (q) {
                const p = inventoryProductById(r.productId);
                const hay = `${r.orderNumber} ${r.customerName} ${p?.sku ?? ''} ${p?.name ?? ''}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [search, status, warehouseFilter]);

    const columns: DataTableColumn<Reservation>[] = [
        {
            key: 'order',
            header: 'Order',
            cell: (r) => (
                <Link
                    to={`/orders/${r.orderId}`}
                    className="font-medium text-primary hover:underline"
                >
                    {r.orderNumber}
                </Link>
            ),
        },
        {
            key: 'customer',
            header: 'Customer',
            cell: (r) => r.customerName,
        },
        {
            key: 'product',
            header: 'Product',
            cell: (r) => {
                const p = inventoryProductById(r.productId);
                return (
                    <div>
                        <p className="font-medium text-slate-800">{p?.name ?? '—'}</p>
                        <p className="font-mono text-xs text-slate-500">{p?.sku}</p>
                    </div>
                );
            },
        },
        {
            key: 'warehouse',
            header: 'Warehouse',
            cell: (r) => warehouseById(r.warehouseId)?.code ?? '—',
        },
        {
            key: 'qty',
            header: 'Qty',
            align: 'right',
            cell: (r) => {
                const p = inventoryProductById(r.productId);
                return (
                    <span className="tabular-nums font-semibold text-slate-800">
                        {r.qty} {p?.uom ?? ''}
                    </span>
                );
            },
        },
        {
            key: 'status',
            header: 'Status',
            cell: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>,
        },
        {
            key: 'reserved',
            header: 'Reserved',
            cell: (r) => (
                <span className="text-xs text-slate-500">
                    {formatRelative(r.reservedAt)}
                </span>
            ),
        },
        {
            key: 'expected',
            header: 'Expected dispatch',
            cell: (r) => (
                <span className="text-xs text-slate-500">
                    {formatRelative(r.expectedDispatch)}
                </span>
            ),
        },
    ];

    return (
        <>
            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search order, customer, SKU…"
                filters={
                    <>
                        <Select
                            aria-label="Status"
                            value={status}
                            onChange={(e) =>
                                setStatus(e.target.value as Reservation['status'] | '')
                            }
                            className="w-36"
                        >
                            <option value="">All status</option>
                            {STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {s}
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
                    </>
                }
            />

            <DataTable<Reservation>
                columns={columns}
                rows={rows}
                rowKey={(r) => r.id}
                caption="Reservations"
                emptyState={
                    <div className="px-6 py-12 text-center text-sm text-slate-500">
                        No reservations match the current filters.
                    </div>
                }
            />

            <p className="mt-3 text-xs text-slate-500">
                Showing {rows.length} of {reservations.length} reservations.
            </p>
        </>
    );
}
