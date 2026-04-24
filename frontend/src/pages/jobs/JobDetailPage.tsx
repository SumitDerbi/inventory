import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    Camera,
    CheckCircle2,
    ClipboardList,
    FileSignature,
    Image as ImageIcon,
    Phone,
    Star,
    Upload,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { Input, Select, Textarea } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { formatRelative } from '@/lib/format';
import {
    JOB_PRIORITY_LABEL,
    JOB_PRIORITY_TONE,
    JOB_STATUS_LABEL,
    JOB_STATUS_TONE,
    JOB_STATUSES,
    JOB_TYPE_LABEL,
    canAdvanceJob,
    checklistProgress,
    jobById,
    nextJobStatuses,
    type ChecklistItemStatus,
    type Job,
    type JobObservation,
    type JobStatus,
    type ObservationSeverity,
} from '@/mocks/jobs';
import { engineerById } from '@/mocks/engineers';
import { userById } from '@/mocks/users';

type TabKey =
    | 'overview'
    | 'checklist'
    | 'photos'
    | 'report'
    | 'observations'
    | 'activity';

const TABS: Array<{ key: TabKey; label: string }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'checklist', label: 'Checklist' },
    { key: 'photos', label: 'Photos' },
    { key: 'report', label: 'Commissioning' },
    { key: 'observations', label: 'Observations' },
    { key: 'activity', label: 'Activity' },
];

const SEVERITY_TONE: Record<ObservationSeverity, 'sky' | 'amber' | 'orange' | 'red'> = {
    info: 'sky',
    minor: 'amber',
    major: 'orange',
    critical: 'red',
};

const SEVERITY_LABEL: Record<ObservationSeverity, string> = {
    info: 'Info',
    minor: 'Minor',
    major: 'Major',
    critical: 'Critical',
};

const ITEM_STATUS_TONE: Record<
    ChecklistItemStatus,
    'neutral' | 'emerald' | 'red' | 'sky'
> = {
    pending: 'neutral',
    pass: 'emerald',
    fail: 'red',
    na: 'sky',
};

const ITEM_STATUS_LABEL: Record<ChecklistItemStatus, string> = {
    pending: 'Pending',
    pass: 'Pass',
    fail: 'Fail',
    na: 'N/A',
};

export default function JobDetailPage() {
    const { id = '' } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { push } = useToast();
    const job = jobById(id);

    const [tab, setTab] = useState<TabKey>('overview');
    const [advanceOpen, setAdvanceOpen] = useState(false);
    const [advanceTarget, setAdvanceTarget] = useState<JobStatus | null>(null);
    const [observationOpen, setObservationOpen] = useState(false);
    const [photoOpen, setPhotoOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [lightbox, setLightbox] = useState<string | null>(null);

    const progress = useMemo(
        () => (job ? checklistProgress(job) : { total: 0, completed: 0, failed: 0, pct: 0 }),
        [job],
    );

    if (!job) {
        return <Navigate to="/jobs" replace />;
    }

    const allowedNext = nextJobStatuses(job.status);
    const engineer = engineerById(job.engineerId);
    const isClosed = job.status === 'signed_off' || job.status === 'cancelled';
    const openObservations = job.observations.filter(
        (o) => o.severity === 'major' || o.severity === 'critical',
    );

    return (
        <div className="space-y-4">
            <div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/jobs')}
                    className="-ml-2"
                >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Back to jobs
                </Button>
            </div>

            {/* Header */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 md:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-mono text-xl font-semibold text-slate-800">
                                {job.jobNumber}
                            </h2>
                            <Badge tone={JOB_STATUS_TONE[job.status]}>
                                {JOB_STATUS_LABEL[job.status]}
                            </Badge>
                            <Badge tone={JOB_PRIORITY_TONE[job.priority]}>
                                {JOB_PRIORITY_LABEL[job.priority]}
                            </Badge>
                            <Badge tone="neutral">{JOB_TYPE_LABEL[job.type]}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-700">
                            {job.customerCompany} · {job.customerName}
                        </p>
                        <p className="text-xs text-slate-500">{job.siteAddress}</p>
                        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span>
                                Order:{' '}
                                <Link
                                    to={`/orders/${job.orderId}`}
                                    className="font-mono text-primary hover:underline"
                                >
                                    {job.orderNumber}
                                </Link>
                            </span>
                            <span>·</span>
                            <span>Created {formatRelative(job.createdAt)}</span>
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {!isClosed && allowedNext.length > 0 && (
                            <Button
                                size="sm"
                                onClick={() => {
                                    setAdvanceTarget(allowedNext[0]);
                                    setAdvanceOpen(true);
                                }}
                            >
                                <CheckCircle2 className="size-4" aria-hidden="true" />
                                {advanceLabel(job.status, allowedNext[0])}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Stepper */}
                <ol className="mt-5 flex flex-wrap items-center gap-2 text-xs">
                    {JOB_STATUSES.map((stg, idx) => {
                        const activeIdx = JOB_STATUSES.indexOf(job.status);
                        const active = idx === activeIdx;
                        const done = idx < activeIdx;
                        return (
                            <li key={stg} className="flex items-center gap-2">
                                <div
                                    className={cn(
                                        'flex size-6 items-center justify-center rounded-full border text-[11px] font-semibold',
                                        done
                                            ? 'border-emerald-500 bg-emerald-500 text-white'
                                            : active
                                                ? 'border-primary bg-primary text-white'
                                                : 'border-slate-200 bg-white text-slate-400',
                                    )}
                                >
                                    {idx + 1}
                                </div>
                                <span
                                    className={cn(
                                        'font-medium',
                                        active
                                            ? 'text-slate-800'
                                            : done
                                                ? 'text-slate-600'
                                                : 'text-slate-400',
                                    )}
                                >
                                    {JOB_STATUS_LABEL[stg]}
                                </span>
                                {idx < JOB_STATUSES.length - 1 && (
                                    <span
                                        aria-hidden="true"
                                        className={cn(
                                            'h-px w-6 sm:w-10',
                                            done ? 'bg-emerald-300' : 'bg-slate-200',
                                        )}
                                    />
                                )}
                            </li>
                        );
                    })}
                </ol>

                {openObservations.length > 0 && (
                    <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        <AlertTriangle
                            className="mt-0.5 size-4 shrink-0"
                            aria-hidden="true"
                        />
                        <p>
                            <strong>{openObservations.length} open observation(s)</strong> —
                            see Observations tab.
                        </p>
                    </div>
                )}
            </div>

            {/* KPI strip */}
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-4">
                <Stat
                    label="Checklist"
                    value={`${progress.completed}/${progress.total} (${progress.pct}%)`}
                    valueClassName={
                        progress.failed > 0 ? 'text-red-600' : 'text-slate-800'
                    }
                />
                <Stat
                    label="Engineer"
                    value={engineer?.fullName ?? '—'}
                />
                <Stat
                    label="Scheduled"
                    value={new Date(job.scheduledStart).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                />
                <Stat
                    label="Travel"
                    value={`${job.travelKm} km · ${job.estimatedHours} h`}
                />
            </div>

            {/* Tabs */}
            <div
                role="tablist"
                aria-label="Job sections"
                className="flex flex-wrap gap-1 border-b border-slate-200"
            >
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        role="tab"
                        aria-selected={tab === t.key}
                        onClick={() => setTab(t.key)}
                        className={cn(
                            'relative px-3 py-2 text-sm font-medium transition-colors',
                            tab === t.key
                                ? 'text-primary'
                                : 'text-slate-500 hover:text-slate-700',
                        )}
                    >
                        {t.label}
                        {tab === t.key && (
                            <span
                                aria-hidden="true"
                                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary"
                            />
                        )}
                    </button>
                ))}
            </div>

            {tab === 'overview' && <OverviewTab job={job} />}
            {tab === 'checklist' && <ChecklistTab job={job} />}
            {tab === 'photos' && (
                <PhotosTab
                    job={job}
                    onOpenLightbox={setLightbox}
                    onUpload={() => setPhotoOpen(true)}
                />
            )}
            {tab === 'report' && (
                <CommissioningTab
                    job={job}
                    onSubmitReport={() => setReportOpen(true)}
                />
            )}
            {tab === 'observations' && (
                <ObservationsTab
                    job={job}
                    onAdd={() => setObservationOpen(true)}
                />
            )}
            {tab === 'activity' && <ActivityTab job={job} />}

            <AdvanceJobDialog
                open={advanceOpen}
                onOpenChange={setAdvanceOpen}
                job={job}
                target={advanceTarget}
                allowedNext={allowedNext}
                progress={progress}
                onTargetChange={setAdvanceTarget}
                onConfirm={() => {
                    setAdvanceOpen(false);
                    if (advanceTarget) {
                        push({
                            variant: 'success',
                            title: 'Job updated',
                            description: `${job.jobNumber} → ${JOB_STATUS_LABEL[advanceTarget]}`,
                        });
                    }
                }}
            />

            <ObservationDialog
                open={observationOpen}
                onOpenChange={setObservationOpen}
                onSubmit={(payload) => {
                    setObservationOpen(false);
                    push({
                        variant: 'success',
                        title: 'Observation logged',
                        description: `${SEVERITY_LABEL[payload.severity]} — ${payload.note.slice(0, 40)}…`,
                    });
                }}
            />

            <PhotoUploadDialog
                open={photoOpen}
                onOpenChange={setPhotoOpen}
                onSubmit={(caption) => {
                    setPhotoOpen(false);
                    push({
                        variant: 'success',
                        title: 'Photo uploaded',
                        description: caption || 'Site photo captured',
                    });
                }}
            />

            <ReportDialog
                open={reportOpen}
                onOpenChange={setReportOpen}
                onSubmit={(customer) => {
                    setReportOpen(false);
                    push({
                        variant: 'success',
                        title: 'Commissioning report submitted',
                        description: `Signed by ${customer}`,
                    });
                }}
            />

            <Lightbox
                open={lightbox !== null}
                src={lightbox}
                onClose={() => setLightbox(null)}
            />
        </div>
    );
}

function advanceLabel(from: JobStatus, to: JobStatus): string {
    if (from === 'scheduled' && to === 'en_route') return 'Start travel';
    if (from === 'en_route' && to === 'in_progress') return 'Start work';
    if (from === 'in_progress' && to === 'completed') return 'Mark complete';
    if (from === 'completed' && to === 'signed_off') return 'Capture sign-off';
    return `Advance to ${JOB_STATUS_LABEL[to]}`;
}

/* ------------------------------------------------------------------ */
/* Tabs                                                                */
/* ------------------------------------------------------------------ */

function OverviewTab({ job }: { job: Job }) {
    const engineer = engineerById(job.engineerId);
    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Site & contact">
                <dl className="space-y-2 text-sm">
                    <Field label="Customer" value={`${job.customerCompany} (${job.customerName})`} />
                    <Field label="Site address" value={job.siteAddress} />
                    <Field label="City" value={job.siteCity} />
                    <Field
                        label="Site contact"
                        value={`${job.siteContact} · ${job.siteContactPhone}`}
                    />
                    <Field
                        label="Linked order"
                        value={job.orderNumber}
                        mono
                    />
                </dl>
            </Card>

            <Card title="Engineer & helpers">
                {engineer ? (
                    <div className="space-y-3 text-sm">
                        <div>
                            <p className="font-semibold text-slate-800">
                                {engineer.fullName}
                            </p>
                            <p className="font-mono text-xs text-slate-500">
                                {engineer.code} · {engineer.baseCity}
                            </p>
                        </div>
                        <p className="flex items-center gap-2 text-slate-700">
                            <Phone className="size-3.5 text-slate-400" aria-hidden="true" />
                            <span className="font-mono text-xs">{engineer.phone}</span>
                        </p>
                        {job.helperIds.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold uppercase text-slate-400">
                                    Helpers
                                </p>
                                <ul className="mt-1 list-disc pl-5 text-slate-700">
                                    {job.helperIds.map((id) => (
                                        <li key={id}>{userById(id)?.name ?? id}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-1 pt-2">
                            {engineer.skills
                                .filter((s) => s.proficiency === 'expert')
                                .slice(0, 4)
                                .map((s) => (
                                    <span
                                        key={s.category}
                                        className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700"
                                    >
                                        {s.category}
                                    </span>
                                ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-slate-500">Engineer not assigned.</p>
                )}
            </Card>

            <Card title="Schedule" className="lg:col-span-2">
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <Field
                        label="Scheduled start"
                        value={new Date(job.scheduledStart).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                        })}
                    />
                    <Field
                        label="Scheduled end"
                        value={new Date(job.scheduledEnd).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                        })}
                    />
                    <Field
                        label="Actual start"
                        value={
                            job.actualStart
                                ? new Date(job.actualStart).toLocaleString('en-IN', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                })
                                : '—'
                        }
                    />
                    <Field
                        label="Actual end"
                        value={
                            job.actualEnd
                                ? new Date(job.actualEnd).toLocaleString('en-IN', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                })
                                : '—'
                        }
                    />
                </dl>
                {job.notes && (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                        <p className="text-xs font-semibold uppercase text-slate-500">
                            Job notes
                        </p>
                        <p className="mt-1">{job.notes}</p>
                    </div>
                )}
            </Card>
        </div>
    );
}

function ChecklistTab({ job }: { job: Job }) {
    const progress = checklistProgress(job);
    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-700">
                        <ClipboardList
                            className="size-4 text-slate-400"
                            aria-hidden="true"
                        />
                        <span>
                            Progress: <strong>{progress.pct}%</strong> ({progress.completed}/
                            {progress.total})
                        </span>
                    </div>
                    {progress.failed > 0 && (
                        <Badge tone="red">{progress.failed} failed</Badge>
                    )}
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                        className={cn(
                            'h-full rounded-full transition-all',
                            progress.failed > 0
                                ? 'bg-amber-500'
                                : 'bg-emerald-500',
                        )}
                        style={{ width: `${progress.pct}%` }}
                    />
                </div>
            </div>

            {job.checklist.map((g) => (
                <section
                    key={g.id}
                    className="rounded-xl border border-slate-200 bg-white"
                >
                    <header className="border-b border-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                        {g.title}
                    </header>
                    <ul className="divide-y divide-slate-100">
                        {g.items.map((it) => (
                            <li
                                key={it.id}
                                className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-slate-800">
                                        {it.label}
                                        {it.requiresPhoto && (
                                            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-sky-50 px-1.5 py-0.5 text-[10px] text-sky-700">
                                                <Camera
                                                    className="size-3"
                                                    aria-hidden="true"
                                                />
                                                Photo
                                            </span>
                                        )}
                                    </p>
                                    {it.remark && (
                                        <p className="mt-1 text-xs italic text-slate-500">
                                            {it.remark}
                                        </p>
                                    )}
                                </div>
                                <Badge tone={ITEM_STATUS_TONE[it.status]}>
                                    {ITEM_STATUS_LABEL[it.status]}
                                </Badge>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
}

function PhotosTab({
    job,
    onOpenLightbox,
    onUpload,
}: {
    job: Job;
    onOpenLightbox: (src: string) => void;
    onUpload: () => void;
}) {
    return (
        <div className="space-y-3">
            <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={onUpload}>
                    <Upload className="size-4" aria-hidden="true" />
                    Upload photo
                </Button>
            </div>
            {job.photos.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
                    <ImageIcon
                        className="mx-auto size-8 text-slate-300"
                        aria-hidden="true"
                    />
                    <p className="mt-2 text-sm text-slate-500">
                        No photos uploaded yet.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {job.photos.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => onOpenLightbox(p.url)}
                            className="group block overflow-hidden rounded-xl border border-slate-200 bg-white text-left"
                        >
                            <div className="aspect-square overflow-hidden bg-slate-100">
                                <img
                                    src={p.url}
                                    alt={p.caption}
                                    className="size-full object-cover transition-transform group-hover:scale-105"
                                />
                            </div>
                            <div className="px-3 py-2">
                                <p className="line-clamp-2 text-xs text-slate-700">
                                    {p.caption}
                                </p>
                                <p className="mt-1 text-[10px] text-slate-400">
                                    {formatRelative(p.uploadedAt)} ·{' '}
                                    {userById(p.uploadedBy)?.name ?? '—'}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function CommissioningTab({
    job,
    onSubmitReport,
}: {
    job: Job;
    onSubmitReport: () => void;
}) {
    const r = job.report;
    if (!r.submittedAt) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
                {job.status === 'in_progress' || job.status === 'completed' ? (
                    <div className="space-y-4">
                        <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                            <FileSignature
                                className="mx-auto size-8 text-slate-400"
                                aria-hidden="true"
                            />
                            <p className="mt-2 text-sm text-slate-600">
                                Capture readings and customer sign-off to submit the
                                commissioning report.
                            </p>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={onSubmitReport}>
                                <FileSignature
                                    className="size-4"
                                    aria-hidden="true"
                                />
                                Submit report
                            </Button>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-slate-500">
                        The commissioning report becomes available once the job is{' '}
                        <strong>In progress</strong>.
                    </p>
                )}
            </div>
        );
    }
    return (
        <div className="space-y-4">
            <Card title="Report summary">
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <Field
                        label="Submitted at"
                        value={formatRelative(r.submittedAt)}
                    />
                    <Field
                        label="Submitted by"
                        value={
                            r.submittedBy
                                ? userById(r.submittedBy)?.name ?? r.submittedBy
                                : '—'
                        }
                    />
                    <Field
                        label="Customer signatory"
                        value={r.customerName ?? '—'}
                    />
                    <Field
                        label="Signed PDF"
                        value={r.customerSignedFile ?? '—'}
                        mono
                    />
                </dl>
                {r.summary && (
                    <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                        {r.summary}
                    </p>
                )}
            </Card>

            <Card title="Test readings">
                {r.readings.length === 0 ? (
                    <p className="text-sm text-slate-500">No readings captured.</p>
                ) : (
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-3 py-2 text-left font-semibold">
                                        Parameter
                                    </th>
                                    <th className="px-3 py-2 text-right font-semibold">
                                        Reading
                                    </th>
                                    <th className="px-3 py-2 text-left font-semibold">
                                        Unit
                                    </th>
                                    <th className="px-3 py-2 text-center font-semibold">
                                        In-spec
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {r.readings.map((rd, i) => (
                                    <tr
                                        key={`${rd.label}-${i}`}
                                        className="border-t border-slate-100"
                                    >
                                        <td className="px-3 py-2 text-slate-700">
                                            {rd.label}
                                        </td>
                                        <td className="px-3 py-2 text-right tabular-nums font-semibold text-slate-800">
                                            {rd.value}
                                        </td>
                                        <td className="px-3 py-2 text-slate-500">
                                            {rd.unit}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            {rd.inSpec ? (
                                                <Badge tone="emerald">OK</Badge>
                                            ) : (
                                                <Badge tone="red">Out</Badge>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {job.customerRating !== null && (
                <Card title="Customer feedback">
                    <p className="flex items-center gap-2 text-sm text-slate-700">
                        <Star className="size-4 text-amber-500" aria-hidden="true" />
                        Rated <strong>{job.customerRating} / 5</strong>
                    </p>
                </Card>
            )}
        </div>
    );
}

function ObservationsTab({
    job,
    onAdd,
}: {
    job: Job;
    onAdd: () => void;
}) {
    return (
        <div className="space-y-3">
            <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={onAdd}>
                    <AlertTriangle className="size-4" aria-hidden="true" />
                    Log observation
                </Button>
            </div>
            {job.observations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
                    No observations recorded for this job.
                </div>
            ) : (
                <ul className="space-y-3">
                    {job.observations.map((o) => (
                        <ObservationRow key={o.id} obs={o} />
                    ))}
                </ul>
            )}
        </div>
    );
}

function ObservationRow({ obs }: { obs: JobObservation }) {
    return (
        <li className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge tone={SEVERITY_TONE[obs.severity]}>
                    {SEVERITY_LABEL[obs.severity]}
                </Badge>
                <p className="text-xs text-slate-500">
                    {formatRelative(obs.raisedAt)} ·{' '}
                    {userById(obs.raisedBy)?.name ?? obs.raisedBy}
                </p>
            </div>
            <p className="mt-2 text-sm text-slate-700">{obs.note}</p>
        </li>
    );
}

function ActivityTab({ job }: { job: Job }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <ol className="space-y-3">
                {job.activity.map((a) => (
                    <li key={a.id} className="flex gap-3">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                            <Activity className="size-3.5" aria-hidden="true" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-800">{a.summary}</p>
                            <p className="text-xs text-slate-500">
                                {formatRelative(a.at)} ·{' '}
                                {userById(a.actorId)?.name ?? a.actorId}
                            </p>
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Dialogs                                                             */
/* ------------------------------------------------------------------ */

function AdvanceJobDialog({
    open,
    onOpenChange,
    job,
    target,
    allowedNext,
    progress,
    onTargetChange,
    onConfirm,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    job: Job;
    target: JobStatus | null;
    allowedNext: JobStatus[];
    progress: { total: number; completed: number; pct: number; failed: number };
    onTargetChange: (s: JobStatus) => void;
    onConfirm: () => void;
}) {
    const blocked = !target || !canAdvanceJob(job.status, target);
    const checklistGate =
        target === 'completed' && progress.pct < 100;
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Update job status</DialogTitle>
                    <DialogDescription>
                        {job.jobNumber} is currently{' '}
                        <strong>{JOB_STATUS_LABEL[job.status]}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody className="space-y-3">
                    <div className="space-y-1">
                        <label
                            htmlFor="job-next"
                            className="text-xs font-semibold uppercase text-slate-500"
                        >
                            Next status
                        </label>
                        <Select
                            id="job-next"
                            value={target ?? ''}
                            onChange={(e) =>
                                onTargetChange(e.target.value as JobStatus)
                            }
                        >
                            {allowedNext.map((s) => (
                                <option key={s} value={s}>
                                    {JOB_STATUS_LABEL[s]}
                                </option>
                            ))}
                        </Select>
                    </div>
                    {checklistGate && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                            <p className="flex items-center gap-2 font-medium">
                                <AlertTriangle className="size-4" aria-hidden="true" />
                                Checklist not yet 100% — recommend completing all items
                                before marking the job complete.
                            </p>
                        </div>
                    )}
                </DialogBody>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button type="button" disabled={blocked} onClick={onConfirm}>
                        Confirm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ObservationDialog({
    open,
    onOpenChange,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    onSubmit: (p: { severity: ObservationSeverity; note: string }) => void;
}) {
    const [severity, setSeverity] = useState<ObservationSeverity>('minor');
    const [note, setNote] = useState('');
    const canSubmit = note.trim().length >= 5;
    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                onOpenChange(o);
                if (!o) {
                    setSeverity('minor');
                    setNote('');
                }
            }}
        >
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Log observation</DialogTitle>
                    <DialogDescription>
                        Capture a site observation with severity for the office team.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody className="space-y-3">
                    <div className="space-y-1">
                        <label
                            htmlFor="obs-sev"
                            className="text-xs font-semibold uppercase text-slate-500"
                        >
                            Severity
                        </label>
                        <Select
                            id="obs-sev"
                            value={severity}
                            onChange={(e) =>
                                setSeverity(e.target.value as ObservationSeverity)
                            }
                        >
                            <option value="info">Info</option>
                            <option value="minor">Minor</option>
                            <option value="major">Major</option>
                            <option value="critical">Critical</option>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <label
                            htmlFor="obs-note"
                            className="text-xs font-semibold uppercase text-slate-500"
                        >
                            Observation
                        </label>
                        <Textarea
                            id="obs-note"
                            rows={4}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="What did you observe?"
                        />
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={!canSubmit}
                        onClick={() => onSubmit({ severity, note })}
                    >
                        Log observation
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function PhotoUploadDialog({
    open,
    onOpenChange,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    onSubmit: (caption: string) => void;
}) {
    const [caption, setCaption] = useState('');
    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                onOpenChange(o);
                if (!o) setCaption('');
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload site photo</DialogTitle>
                    <DialogDescription>
                        Attach a photo with a short caption.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody className="space-y-3">
                    <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
                        <Upload
                            className="mx-auto size-6 text-slate-400"
                            aria-hidden="true"
                        />
                        <p className="mt-1">Drop image or tap to capture (mock)</p>
                    </div>
                    <div className="space-y-1">
                        <label
                            htmlFor="ph-cap"
                            className="text-xs font-semibold uppercase text-slate-500"
                        >
                            Caption
                        </label>
                        <Input
                            id="ph-cap"
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="e.g., Pump base after grouting"
                        />
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button type="button" onClick={() => onSubmit(caption)}>
                        Upload
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ReportDialog({
    open,
    onOpenChange,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    onSubmit: (customerName: string) => void;
}) {
    const [customerName, setCustomerName] = useState('');
    const [summary, setSummary] = useState('');
    const canSubmit =
        customerName.trim().length >= 2 && summary.trim().length >= 5;
    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                onOpenChange(o);
                if (!o) {
                    setCustomerName('');
                    setSummary('');
                }
            }}
        >
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Submit commissioning report</DialogTitle>
                    <DialogDescription>
                        Capture customer sign-off and a short summary. Test readings
                        are added separately.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody className="space-y-3">
                    <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
                        <FileSignature
                            className="mx-auto size-6 text-slate-400"
                            aria-hidden="true"
                        />
                        <p className="mt-1">Drop signed PDF here (mock)</p>
                    </div>
                    <div className="space-y-1">
                        <label
                            htmlFor="rep-cust"
                            className="text-xs font-semibold uppercase text-slate-500"
                        >
                            Customer signatory
                        </label>
                        <Input
                            id="rep-cust"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Name of person who signed"
                        />
                    </div>
                    <div className="space-y-1">
                        <label
                            htmlFor="rep-sum"
                            className="text-xs font-semibold uppercase text-slate-500"
                        >
                            Summary
                        </label>
                        <Textarea
                            id="rep-sum"
                            rows={3}
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                        />
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={!canSubmit}
                        onClick={() => onSubmit(customerName)}
                    >
                        Submit
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function Lightbox({
    open,
    src,
    onClose,
}: {
    open: boolean;
    src: string | null;
    onClose: () => void;
}) {
    if (!open || !src) return null;
    return (
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={onClose}
        >
            <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="Close"
            >
                <X className="size-5" aria-hidden="true" />
            </button>
            <img
                src={src}
                alt=""
                className="max-h-full max-w-full rounded-lg"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function Card({
    title,
    children,
    className,
}: {
    title: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn(
                'rounded-xl border border-slate-200 bg-white p-4',
                className,
            )}
        >
            <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3>
            {children}
        </section>
    );
}

function Stat({
    label,
    value,
    valueClassName,
}: {
    label: string;
    value: string;
    valueClassName?: string;
}) {
    return (
        <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {label}
            </p>
            <p
                className={cn(
                    'mt-1 text-base font-semibold text-slate-800',
                    valueClassName,
                )}
            >
                {value}
            </p>
        </div>
    );
}

function Field({
    label,
    value,
    mono,
}: {
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div>
            <dt className="text-xs font-semibold uppercase text-slate-400">
                {label}
            </dt>
            <dd className={cn('text-slate-700', mono && 'font-mono text-xs')}>
                {value}
            </dd>
        </div>
    );
}
