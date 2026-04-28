import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { formatINR, formatRelative } from '@/lib/format';
import {
    APPROVAL_KIND_LABEL,
    APPROVAL_KIND_TONE,
    approvalHistoryForUser,
    type ApprovalHistoryEntry,
} from '@/mocks/approvals';

export default function ApprovalHistoryPage() {
    const toast = useToast();
    const rows = approvalHistoryForUser();

    const cols: DataTableColumn<ApprovalHistoryEntry>[] = [
        {
            key: 'kind',
            header: 'Kind',
            cell: (r) => <Badge tone={APPROVAL_KIND_TONE[r.kind]}>{APPROVAL_KIND_LABEL[r.kind]}</Badge>,
        },
        {
            key: 'ref',
            header: 'Reference',
            cell: (r) => (
                <Link to={r.entityLink} className="font-mono text-sm text-blue-700 hover:underline">
                    {r.entityLabel}
                </Link>
            ),
        },
        {
            key: 'decision',
            header: 'Decision',
            cell: (r) => (
                <Badge tone={r.decision === 'approved' ? 'emerald' : 'red'}>
                    {r.decision === 'approved' ? 'Approved' : 'Rejected'}
                </Badge>
            ),
        },
        {
            key: 'amount',
            header: 'Amount',
            align: 'right',
            cell: (r) => <span className="text-sm font-medium text-slate-900">{formatINR(r.amount)}</span>,
        },
        {
            key: 'comment',
            header: 'Note',
            cell: (r) => <span className="text-xs text-slate-600">{r.comment ?? '—'}</span>,
        },
        {
            key: 'when',
            header: 'When',
            cell: (r) => (
                <span className="text-xs text-slate-500" title={new Date(r.decidedAt).toLocaleString('en-IN')}>
                    {formatRelative(r.decidedAt)}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <PageHeader
                title="Approval history"
                description="Last 90 days of decisions you've recorded."
                breadcrumb={[
                    { label: 'Workspace' },
                    { label: 'Approvals', href: '/approvals' },
                    { label: 'History' },
                ]}
                actions={
                    <Button
                        variant="outline"
                        onClick={() =>
                            toast.push({
                                title: 'Exporting CSV',
                                description: 'Download will start shortly.',
                                variant: 'success',
                            })
                        }
                    >
                        <Download className="size-4" /> Export CSV
                    </Button>
                }
            />
            <DataTable
                columns={cols}
                rows={rows}
                rowKey={(r) => r.id}
                emptyState={<EmptyState title="No history yet" description="Decisions you take will appear here." />}
            />
        </div>
    );
}
