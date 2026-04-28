import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, ExternalLink, Search, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input, Select } from '@/components/ui/FormField';
import { formatINR, formatRelative } from '@/lib/format';
import { ROLE_LABEL, type UserRole } from '@/mocks/users';
import {
    APPROVAL_KIND_LABEL,
    APPROVAL_KIND_TONE,
    approvalKpis,
    approvalsForRole,
    type ApprovalKind,
    type ApprovalRequest,
    type SLAStatus,
} from '@/mocks/approvals';
import { ApprovalActionDialog, type ApprovalDialogMode } from '@/components/approvals/ApprovalActionDialog';

const SLA_TONE: Record<SLAStatus, 'emerald' | 'amber' | 'red'> = {
    on_track: 'emerald',
    due_soon: 'amber',
    breached: 'red',
};

const SLA_LABEL: Record<SLAStatus, string> = {
    on_track: 'On track',
    due_soon: 'Due soon',
    breached: 'Breached',
};

const ROLE_OPTIONS: UserRole[] = ['admin', 'sales_manager', 'inventory', 'accounts'];

export default function ApprovalsInboxPage() {
    const navigate = useNavigate();

    const [role, setRole] = useState<UserRole>('admin');
    const [kindFilter, setKindFilter] = useState<'' | ApprovalKind>('');
    const [slaFilter, setSlaFilter] = useState<'' | SLAStatus>('');
    const [search, setSearch] = useState('');
    const [version, setVersion] = useState(0);

    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [actionMode, setActionMode] = useState<ApprovalDialogMode | null>(null);
    const [actionRow, setActionRow] = useState<ApprovalRequest | null>(null);
    const [bulkOpen, setBulkOpen] = useState(false);

    void version;

    const allForRole = useMemo(() => {
        void version;
        return approvalsForRole(role);
    }, [role, version]);
    const kpis = useMemo(() => {
        void version;
        return approvalKpis(role);
    }, [role, version]);

    const filtered = allForRole.filter((r) => {
        if (kindFilter && r.kind !== kindFilter) return false;
        if (slaFilter && r.slaStatus !== slaFilter) return false;
        if (search.trim()) {
            const hay = `${r.entityLabel} ${r.summary} ${r.submittedByName}`.toLowerCase();
            if (!hay.includes(search.toLowerCase())) return false;
        }
        return true;
    });

    const selectedRows = filtered.filter((r) => selected.has(r.id));
    const sameKind =
        selectedRows.length > 0 && selectedRows.every((r) => r.kind === selectedRows[0].kind);

    function toggleAll() {
        if (selected.size === filtered.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(filtered.map((r) => r.id)));
        }
    }
    function toggleRow(id: string) {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelected(next);
    }

    function handleAction(row: ApprovalRequest, mode: ApprovalDialogMode) {
        setActionRow(row);
        setActionMode(mode);
    }
    function handleCompleted() {
        setSelected(new Set());
        setVersion((v) => v + 1);
    }

    const cols: DataTableColumn<ApprovalRequest>[] = [
        {
            key: 'select',
            header: (
                <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={filtered.length > 0 && selected.size === filtered.length}
                    onChange={toggleAll}
                />
            ),
            cell: (r) => (
                <input
                    type="checkbox"
                    aria-label={`Select ${r.entityLabel}`}
                    checked={selected.has(r.id)}
                    onChange={() => toggleRow(r.id)}
                    onClick={(e) => e.stopPropagation()}
                />
            ),
            className: 'w-10',
        },
        {
            key: 'kind',
            header: 'Kind',
            cell: (r) => <Badge tone={APPROVAL_KIND_TONE[r.kind]}>{APPROVAL_KIND_LABEL[r.kind]}</Badge>,
        },
        {
            key: 'ref',
            header: 'Reference',
            cell: (r) => (
                <Link
                    to={r.entityLink}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 font-mono text-sm text-blue-700 hover:underline"
                >
                    {r.entityLabel} <ExternalLink className="size-3" />
                </Link>
            ),
        },
        {
            key: 'summary',
            header: 'Summary',
            cell: (r) => <span className="text-sm text-slate-700">{r.summary}</span>,
        },
        {
            key: 'submittedBy',
            header: 'Submitted by',
            cell: (r) => <span className="text-sm text-slate-700">{r.submittedByName}</span>,
        },
        {
            key: 'submittedAt',
            header: 'Submitted',
            cell: (r) => (
                <span className="text-xs text-slate-500" title={new Date(r.submittedAt).toLocaleString('en-IN')}>
                    {formatRelative(r.submittedAt)}
                </span>
            ),
        },
        {
            key: 'amount',
            header: 'Amount',
            align: 'right',
            cell: (r) => <span className="text-sm font-medium text-slate-900">{formatINR(r.amount)}</span>,
        },
        {
            key: 'level',
            header: 'Level',
            cell: (r) => (
                <span className="text-xs text-slate-600">
                    L{r.level}/{r.levelOf} · {r.levelRoleLabel}
                </span>
            ),
        },
        {
            key: 'sla',
            header: 'SLA',
            cell: (r) => <Badge tone={SLA_TONE[r.slaStatus]}>{SLA_LABEL[r.slaStatus]}</Badge>,
        },
        {
            key: 'actions',
            header: 'Actions',
            cell: (r) => (
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="outline" onClick={() => handleAction(r, 'approve')}>
                        <CheckCircle2 className="size-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleAction(r, 'reject')}>
                        <XCircle className="size-3.5" /> Reject
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <PageHeader
                title="My approvals"
                description="Pending approval requests routed to your role across all modules."
                breadcrumb={[{ label: 'Workspace' }, { label: 'Approvals' }]}
                actions={
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Acting as</span>
                        <Select
                            value={role}
                            onChange={(e) => {
                                setRole(e.target.value as UserRole);
                                setSelected(new Set());
                            }}
                            className="w-44"
                            aria-label="Switch role"
                        >
                            {ROLE_OPTIONS.map((r) => (
                                <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                            ))}
                        </Select>
                    </div>
                }
            />

            <div className="grid gap-3 md:grid-cols-4">
                <StatCard label="Awaiting me" value={kpis.awaitingMe.toString()} tone="blue" />
                <StatCard label="Due in 24 h" value={kpis.dueSoon.toString()} tone="amber" />
                <StatCard label="Breached" value={kpis.breached.toString()} tone="red" />
                <StatCard label="Total value pending" value={formatINR(kpis.totalValuePending)} tone="violet" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[220px] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" />
                    <Input
                        type="search"
                        placeholder="Search reference, summary or requester"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select
                    value={kindFilter}
                    onChange={(e) => setKindFilter(e.target.value as '' | ApprovalKind)}
                    className="w-48"
                >
                    <option value="">All kinds</option>
                    {(Object.keys(APPROVAL_KIND_LABEL) as ApprovalKind[]).map((k) => (
                        <option key={k} value={k}>{APPROVAL_KIND_LABEL[k]}</option>
                    ))}
                </Select>
                <Select
                    value={slaFilter}
                    onChange={(e) => setSlaFilter(e.target.value as '' | SLAStatus)}
                    className="w-40"
                >
                    <option value="">All SLA</option>
                    <option value="on_track">On track</option>
                    <option value="due_soon">Due soon</option>
                    <option value="breached">Breached</option>
                </Select>
            </div>

            {selectedRows.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm">
                    <div className="flex items-center gap-2 text-blue-900">
                        <span className="font-medium">{selectedRows.length} selected</span>
                        {!sameKind && (
                            <span className="text-xs text-blue-700">Bulk actions require a single kind.</span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="primary"
                            disabled={!sameKind}
                            onClick={() => {
                                setActionMode('approve');
                                setBulkOpen(true);
                            }}
                        >
                            <CheckCircle2 className="size-3.5" /> Bulk approve
                        </Button>
                        <Button
                            size="sm"
                            variant="danger"
                            disabled={!sameKind}
                            onClick={() => {
                                setActionMode('reject');
                                setBulkOpen(true);
                            }}
                        >
                            <XCircle className="size-3.5" /> Bulk reject
                        </Button>
                    </div>
                </div>
            )}

            <DataTable
                columns={cols}
                rows={filtered}
                rowKey={(r) => r.id}
                onRowClick={(r) => navigate(r.entityLink)}
                emptyState={
                    <EmptyState
                        title="Nothing waiting for you. Nice."
                        description="As soon as a request needs your approval it will appear here."
                        icon={ChevronRight}
                    />
                }
            />

            <ApprovalActionDialog
                open={actionMode !== null && !bulkOpen && actionRow !== null}
                onOpenChange={(o) => {
                    if (!o) {
                        setActionMode(null);
                        setActionRow(null);
                    }
                }}
                mode={actionMode ?? 'approve'}
                request={actionRow ?? undefined}
                onCompleted={handleCompleted}
            />

            <ApprovalActionDialog
                open={bulkOpen}
                onOpenChange={(o) => {
                    if (!o) {
                        setBulkOpen(false);
                        setActionMode(null);
                    }
                }}
                mode={actionMode ?? 'approve'}
                bulkRequests={selectedRows}
                onCompleted={handleCompleted}
            />
        </div>
    );
}
