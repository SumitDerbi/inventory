import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Select } from '@/components/ui/FormField';
import { formatRelative } from '@/lib/format';
import {
    DISPATCH_STAGE_LABEL,
    DISPATCH_STAGES,
    DISPATCH_TONE,
    dispatches,
    type Dispatch,
    type DispatchStage,
} from '@/mocks/dispatches';
import { transporters, transporterById } from '@/mocks/transporters';
import { vehicleById } from '@/mocks/vehicles';

const STAGE_OPTIONS: Array<{ value: '' | DispatchStage; label: string }> = [
    { value: '', label: 'All stages' },
    ...DISPATCH_STAGES.map((s) => ({ value: s, label: DISPATCH_STAGE_LABEL[s] })),
    { value: 'cancelled', label: 'Cancelled' },
];

export default function DispatchListPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [stage, setStage] = useState<'' | DispatchStage>('');
    const [transporterId, setTransporterId] = useState('');
    const [destCity, setDestCity] = useState('');

    const cities = useMemo(() => {
        const set = new Set(dispatches.map((d) => d.destinationCity));
        return Array.from(set).sort();
    }, []);

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return dispatches.filter((d) => {
            if (stage && d.stage !== stage) return false;
            if (transporterId && d.transporterId !== transporterId) return false;
            if (destCity && d.destinationCity !== destCity) return false;
            if (q) {
                const hay =
                    `${d.challanNumber} ${d.customerName} ${d.customerCompany} ${d.orderIds.join(' ')}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [search, stage, transporterId, destCity]);

    const columns: DataTableColumn<Dispatch>[] = [
        {
            key: 'challan',
            header: 'Challan #',
            cell: (d) => (
                <span className="font-mono text-sm font-semibold text-slate-800">
                    {d.challanNumber}
                </span>
            ),
        },
        {
            key: 'date',
            header: 'Dispatch date',
            cell: (d) => (
                <span className="text-xs text-slate-500">
                    {formatRelative(d.dispatchDate)}
                </span>
            ),
        },
        {
            key: 'orders',
            header: 'Order(s)',
            cell: (d) => (
                <div className="space-y-0.5">
                    {d.orderIds.map((oid, idx) => (
                        <p
                            key={oid}
                            className="font-mono text-xs text-slate-600"
                        >
                            {/* Render order numbers from item lookup if available */}
                            {d.items.find((i) => i.orderId === oid)?.orderNumber ??
                                oid.toUpperCase()}
                            {idx < d.orderIds.length - 1 ? ',' : ''}
                        </p>
                    ))}
                </div>
            ),
        },
        {
            key: 'customer',
            header: 'Customer',
            cell: (d) => (
                <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">
                        {d.customerCompany}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                        {d.customerName}
                    </p>
                </div>
            ),
        },
        {
            key: 'transporter',
            header: 'Transporter',
            cell: (d) => (
                <div>
                    <p className="text-sm text-slate-700">
                        {transporterById(d.transporterId)?.name ?? '—'}
                    </p>
                    <p className="font-mono text-xs text-slate-500">
                        {vehicleById(d.vehicleId)?.registration ?? '—'}
                    </p>
                </div>
            ),
        },
        {
            key: 'destination',
            header: 'Destination',
            cell: (d) => (
                <span className="text-sm text-slate-700">{d.destinationCity}</span>
            ),
        },
        {
            key: 'stage',
            header: 'Status',
            cell: (d) => (
                <Badge tone={DISPATCH_TONE[d.stage]}>
                    {DISPATCH_STAGE_LABEL[d.stage]}
                </Badge>
            ),
        },
        {
            key: 'eta',
            header: 'Delivery',
            align: 'right',
            cell: (d) => (
                <span className="text-xs text-slate-500">
                    {d.actualDeliveryDate
                        ? formatRelative(d.actualDeliveryDate)
                        : formatRelative(d.expectedDeliveryDate)}
                </span>
            ),
        },
    ];

    return (
        <>
            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search challan, customer, order…"
                filters={
                    <>
                        <Select
                            aria-label="Status"
                            value={stage}
                            onChange={(e) =>
                                setStage(e.target.value as '' | DispatchStage)
                            }
                            className="w-40"
                        >
                            {STAGE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </Select>
                        <Select
                            aria-label="Transporter"
                            value={transporterId}
                            onChange={(e) => setTransporterId(e.target.value)}
                            className="w-44"
                        >
                            <option value="">All transporters</option>
                            {transporters.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </Select>
                        <Select
                            aria-label="Destination"
                            value={destCity}
                            onChange={(e) => setDestCity(e.target.value)}
                            className="w-40"
                        >
                            <option value="">All cities</option>
                            {cities.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </Select>
                    </>
                }
                actions={
                    <Button size="sm" onClick={() => navigate('/dispatch/plan')}>
                        <Plus className="size-4" aria-hidden="true" />
                        Plan dispatch
                    </Button>
                }
            />

            <DataTable<Dispatch>
                columns={columns}
                rows={rows}
                rowKey={(d) => d.id}
                onRowClick={(d) => navigate(`/dispatch/${d.id}`)}
                caption="Dispatches"
                emptyState={
                    <div className="px-6 py-12 text-center text-sm text-slate-500">
                        No dispatches match the current filters.
                    </div>
                }
            />

            <p className="mt-3 text-xs text-slate-500">
                Showing {rows.length} of {dispatches.length} dispatches.
            </p>
        </>
    );
}
