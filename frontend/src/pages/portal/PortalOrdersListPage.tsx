import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Input } from '@/components/ui/FormField';
import { Badge } from '@/components/ui/Badge';
import { portalOrders, type PortalOrder } from '@/mocks/portal/portal-orders';
import { stageLabel, ORDER_STAGES } from '@/lib/orderStatus';
import { formatINR } from '@/lib/format';

export default function PortalOrdersListPage() {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [stageFilter, setStageFilter] = useState<string>('all');

    const all = portalOrders();
    const filtered = all.filter((o) => {
        if (stageFilter !== 'all' && o.stage !== stageFilter) return false;
        if (query) {
            const q = query.toLowerCase();
            return (
                o.orderNumber.toLowerCase().includes(q) ||
                o.projectName.toLowerCase().includes(q)
            );
        }
        return true;
    });

    const columns: DataTableColumn<PortalOrder>[] = [
        {
            key: 'order',
            header: 'Order',
            cell: (o) => (
                <div className="min-w-0">
                    <div className="font-medium text-slate-900">{o.orderNumber}</div>
                    <div className="truncate text-xs text-slate-500">{o.projectName}</div>
                </div>
            ),
        },
        {
            key: 'expected',
            header: 'Expected delivery',
            cell: (o) =>
                new Date(o.expectedDeliveryDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                }),
        },
        {
            key: 'value',
            header: 'Order value',
            align: 'right',
            cell: (o) => formatINR(o.totalValue),
        },
        {
            key: 'stage',
            header: 'Status',
            cell: (o) => <StatusBadge status={stageLabel(o.stage)} />,
        },
        {
            key: 'readiness',
            header: 'Readiness',
            cell: (o) => (
                <Badge
                    tone={
                        o.readinessFlag === 'green'
                            ? 'emerald'
                            : o.readinessFlag === 'amber'
                                ? 'amber'
                                : 'red'
                    }
                >
                    {o.readinessFlag === 'green' ? 'On track' : o.readinessFlag === 'amber' ? 'At risk' : 'Delayed'}
                </Badge>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <PageHeader
                title="Orders"
                description="All confirmed orders for your account."
            />

            <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" />
                    <Input
                        type="search"
                        placeholder="Search by order number or project"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <select
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                >
                    <option value="all">All statuses</option>
                    {ORDER_STAGES.map((s) => (
                        <option key={s} value={s}>{stageLabel(s)}</option>
                    ))}
                </select>
            </div>

            <DataTable
                columns={columns}
                rows={filtered}
                rowKey={(o) => o.id}
                onRowClick={(o) => navigate(`/portal/orders/${o.id}`)}
            />
        </div>
    );
}
