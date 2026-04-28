import { useState } from 'react';
import { Wrench, Calendar, MapPin, Star } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
} from '@/components/ui/Dialog';
import {
    portalJobs,
    submitPortalJobFeedback,
    type PortalJob,
} from '@/mocks/portal/portal-jobs';
import {
    JOB_STATUS_LABEL,
    JOB_STATUS_TONE,
    JOB_TYPE_LABEL,
} from '@/mocks/jobs';

function formatDateTime(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function StarRating({ value, onChange, readOnly }: { value: number; onChange?: (n: number) => void; readOnly?: boolean }) {
    return (
        <div className="flex gap-1" role="radiogroup">
            {[1, 2, 3, 4, 5].map((n) => (
                <button
                    key={n}
                    type="button"
                    disabled={readOnly}
                    aria-label={`${n} star`}
                    onClick={() => onChange?.(n)}
                    className={readOnly ? 'cursor-default' : 'cursor-pointer'}
                >
                    <Star
                        className={`size-5 ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                    />
                </button>
            ))}
        </div>
    );
}

function JobCard({ job, onRate }: { job: PortalJob; onRate: (j: PortalJob) => void }) {
    return (
        <article className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <Wrench className="size-4 text-slate-400" />
                        <h3 className="font-semibold text-slate-900">{job.jobNumber}</h3>
                        <Badge tone={JOB_STATUS_TONE[job.status]}>{JOB_STATUS_LABEL[job.status]}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                        {JOB_TYPE_LABEL[job.type]} · Order {job.orderNumber}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="size-3" /> {job.siteCity}
                    </div>
                </div>
                <div className="text-right text-xs">
                    <div className="text-slate-400">Engineer</div>
                    <div className="font-medium text-slate-900">{job.engineerName}</div>
                </div>
            </div>

            <div className="mt-3 flex items-center gap-1 text-xs text-slate-500">
                <Calendar className="size-3" />
                <span>{formatDateTime(job.scheduledStart)} → {formatDateTime(job.scheduledEnd)}</span>
            </div>

            {job.status !== 'scheduled' && (
                <div className="mt-3">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Progress</span>
                        <span className="font-medium text-slate-700">{job.completionPct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full bg-blue-500" style={{ width: `${job.completionPct}%` }} />
                    </div>
                </div>
            )}

            {(job.status === 'completed' || job.status === 'signed_off') && (
                <div className="mt-3 flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                    <div>
                        <div className="text-xs text-slate-500">Your rating</div>
                        {job.customerRating ? (
                            <StarRating value={job.customerRating} readOnly />
                        ) : (
                            <span className="text-xs text-slate-400">Not rated</span>
                        )}
                    </div>
                    {!job.customerRating && (
                        <Button size="sm" variant="outline" onClick={() => onRate(job)}>
                            Rate visit
                        </Button>
                    )}
                </div>
            )}
        </article>
    );
}

export default function PortalJobsPage() {
    const toast = useToast();
    const [, force] = useState(0);
    const [rating, setRating] = useState<number>(0);
    const [activeJob, setActiveJob] = useState<PortalJob | null>(null);

    const list = portalJobs();

    function submit() {
        if (!activeJob || rating === 0) return;
        submitPortalJobFeedback(activeJob.id, rating);
        toast.push({ title: 'Thanks for the feedback!', variant: 'success' });
        setActiveJob(null);
        setRating(0);
        force((n) => n + 1);
    }

    return (
        <div className="space-y-4">
            <PageHeader title="Service & installation jobs" description="Visit history and upcoming engineer schedule." />

            {list.length === 0 ? (
                <EmptyState
                    title="No jobs yet"
                    description="Once installation or service visits are scheduled, they'll appear here."
                />
            ) : (
                <div className="grid gap-3 md:grid-cols-2">
                    {list.map((j) => (
                        <JobCard key={j.id} job={j} onRate={(jj) => { setActiveJob(jj); setRating(0); }} />
                    ))}
                </div>
            )}

            <Dialog open={Boolean(activeJob)} onOpenChange={(o) => !o && setActiveJob(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rate this visit</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <p className="mb-3 text-sm text-slate-600">
                            How was the experience with engineer <b>{activeJob?.engineerName}</b>?
                        </p>
                        <StarRating value={rating} onChange={setRating} />
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setActiveJob(null)}>Cancel</Button>
                        <Button variant="primary" disabled={rating === 0} onClick={submit}>Submit</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
