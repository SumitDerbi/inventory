import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/FormField';
import {
    portalQuotations,
    canApprovePortalQuote,
    quotationStatusTone,
    type PortalQuotation,
} from '@/mocks/portal/portal-quotations';
import { formatINR } from '@/lib/format';

export default function PortalQuotationsListPage() {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    const all = portalQuotations();
    const filtered = all.filter((q) => {
        if (filter === 'pending' && !canApprovePortalQuote(q)) return false;
        if (filter === 'approved' && q.status !== 'approved') return false;
        if (filter === 'rejected' && q.status !== 'rejected') return false;
        if (query) {
            const s = query.toLowerCase();
            return q.quotationNumber.toLowerCase().includes(s) || q.projectName.toLowerCase().includes(s);
        }
        return true;
    });

    const columns: DataTableColumn<PortalQuotation>[] = [
        {
            key: 'no',
            header: 'Quotation',
            cell: (q) => (
                <div className="min-w-0">
                    <div className="font-medium text-slate-900">{q.quotationNumber}</div>
                    <div className="truncate text-xs text-slate-500">{q.projectName}</div>
                </div>
            ),
        },
        {
            key: 'valid',
            header: 'Valid until',
            cell: (q) =>
                new Date(q.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        },
        { key: 'amt', header: 'Amount', align: 'right', cell: (q) => formatINR(q.grandTotal) },
        {
            key: 'st',
            header: 'Status',
            cell: (q) => <Badge tone={quotationStatusTone(q.status)}>{q.statusLabel}</Badge>,
        },
        {
            key: 'act',
            header: '',
            cell: (q) => (canApprovePortalQuote(q) ? <Badge tone="amber">Action needed</Badge> : null),
        },
    ];

    return (
        <div className="space-y-4">
            <PageHeader title="Quotations" description="Quotes shared by the sales team for your review." />

            <div className="flex flex-col gap-2 md:flex-row">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" />
                    <Input
                        type="search"
                        placeholder="Search by quotation number or project"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-1 rounded-md border border-slate-200 bg-white p-1">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                        <button
                            key={f}
                            type="button"
                            onClick={() => setFilter(f)}
                            className={`rounded px-3 py-1 text-xs font-medium capitalize ${
                                filter === f ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <DataTable
                columns={columns}
                rows={filtered}
                rowKey={(q) => q.id}
                onRowClick={(q) => navigate(`/portal/quotations/${q.id}`)}
            />
        </div>
    );
}
