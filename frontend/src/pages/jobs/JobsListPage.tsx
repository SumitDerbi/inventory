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
    JOB_PRIORITY_LABEL,
    JOB_PRIORITY_TONE,
    JOB_STATUSES,
    JOB_STATUS_LABEL,
    JOB_STATUS_TONE,
    JOB_TYPE_LABEL,
    type Job,
    type JobPriority,
    type JobStatus,
    type JobType,
    jobs,
} from '@/mocks/jobs';
import { engineers, engineerById } from '@/mocks/engineers';

const TYPE_OPTIONS: JobType[] = [
    'installation',
    'commissioning',
    'service_visit',
    'amc',
    'breakdown',
];

const PRIORITY_OPTIONS: JobPriority[] = ['low', 'normal', 'high', 'urgent'];

export default function JobsListPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<'' | JobStatus | 'cancelled'>('');
    const [engineerId, setEngineerId] = useState('');
    const [type, setType] = useState<'' | JobType>('');
    const [priority, setPriority] = useState<'' | JobPriority>('');

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return jobs.filter((j) => {
            if (status && j.status !== status) return false;
            if (engineerId && j.engineerId !== engineerId) return false;
            if (type && j.type !== type) return false;
            if (priority && j.priority !== priority) return false;
            if (q) {
                const hay =
                    `${j.jobNumber} ${j.orderNumber} ${j.customerName} ${j.customerCompany} ${j.siteCity}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [search, status, engineerId, type, priority]);

    const columns: DataTableColumn<Job>[] = [
        {
            key: 'job',
            header: 'Job #',
            cell: (j) => (
                <div>
                    <p className="font-mono text-sm font-semibold text-slate-800">
                        {j.jobNumber}
                    </p>
                    <p className="text-xs text-slate-500">{JOB_TYPE_LABEL[j.type]}</p>
                </div>
            ),
        },
        {
            key: 'order',
            header: 'Order',
            cell: (j) => (
                <span className="font-mono text-xs text-primary">{j.orderNumber}</span>
            ),
        },
        {
            key: 'customer',
            header: 'Customer',
            cell: (j) => (
                <div className="min-w-0">
                    <p className="truncate text-sm text-slate-800">
                        {j.customerCompany}
                    </p>
                    <p className="truncate text-xs text-slate-500">{j.customerName}</p>
                </div>
            ),
        },
        {
            key: 'site',
            header: 'Site',
            cell: (j) => <span className="text-slate-700">{j.siteCity}</span>,
        },
        {
            key: 'engineer',
            header: 'Engineer',
            cell: (j) => engineerById(j.engineerId)?.fullName ?? '—',
        },
        {
            key: 'schedule',
            header: 'Schedule',
            cell: (j) => (
                <div>
                    <p className="text-sm text-slate-700">
                        {formatRelative(j.scheduledStart)}
                    </p>
                    <p className="text-xs text-slate-500">
                        {new Date(j.scheduledStart).toLocaleString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: 'short',
                        })}
                    </p>
                </div>
            ),
        },
        {
            key: 'priority',
            header: 'Priority',
            cell: (j) => (
                <Badge tone={JOB_PRIORITY_TONE[j.priority]}>
                    {JOB_PRIORITY_LABEL[j.priority]}
                </Badge>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            cell: (j) => (
                <Badge tone={JOB_STATUS_TONE[j.status]}>
                    {JOB_STATUS_LABEL[j.status]}
                </Badge>
            ),
        },
    ];

    return (
        <>
            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search job, order, customer, city…"
                filters={
                    <>
                        <Select
                            aria-label="Status"
                            value={status}
                            onChange={(e) =>
                                setStatus(
                                    e.target.value as JobStatus | 'cancelled' | '',
                                )
                            }
                            className="w-36"
                        >
                            <option value="">All status</option>
                            {JOB_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {JOB_STATUS_LABEL[s]}
                                </option>
                            ))}
                            <option value="cancelled">Cancelled</option>
                        </Select>
                        <Select
                            aria-label="Engineer"
                            value={engineerId}
                            onChange={(e) => setEngineerId(e.target.value)}
                            className="w-44"
                        >
                            <option value="">All engineers</option>
                            {engineers.map((e) => (
                                <option key={e.id} value={e.id}>
                                    {e.fullName}
                                </option>
                            ))}
                        </Select>
                        <Select
                            aria-label="Type"
                            value={type}
                            onChange={(e) =>
                                setType(e.target.value as JobType | '')
                            }
                            className="w-40"
                        >
                            <option value="">All types</option>
                            {TYPE_OPTIONS.map((t) => (
                                <option key={t} value={t}>
                                    {JOB_TYPE_LABEL[t]}
                                </option>
                            ))}
                        </Select>
                        <Select
                            aria-label="Priority"
                            value={priority}
                            onChange={(e) =>
                                setPriority(e.target.value as JobPriority | '')
                            }
                            className="w-32"
                        >
                            <option value="">All priority</option>
                            {PRIORITY_OPTIONS.map((p) => (
                                <option key={p} value={p}>
                                    {JOB_PRIORITY_LABEL[p]}
                                </option>
                            ))}
                        </Select>
                    </>
                }
                actions={
                    <Button size="sm">
                        <Plus className="size-4" aria-hidden="true" />
                        Schedule job
                    </Button>
                }
            />

            <DataTable<Job>
                columns={columns}
                rows={rows}
                rowKey={(j) => j.id}
                onRowClick={(j) => navigate(`/jobs/${j.id}`)}
                caption="Jobs"
                emptyState={
                    <div className="px-6 py-12 text-center text-sm text-slate-500">
                        No jobs match the current filters.
                    </div>
                }
            />

            <p className="mt-3 text-xs text-slate-500">
                Showing {rows.length} of {jobs.length} jobs.
            </p>
        </>
    );
}
