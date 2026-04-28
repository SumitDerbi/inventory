/**
 * Portal projection of `jobs.ts` — engineer name only (no contact),
 * schedule, completion %, customer-rateable status. Mobile + internal
 * remarks are stripped.
 */
import { jobs } from '../jobs';
import type { JobStatus, JobType } from '../jobs';
import { engineers } from '../engineers';
import { currentClientUser } from './client-users';

export interface PortalJobChecklistGroup {
    title: string;
    items: { label: string; status: 'pending' | 'pass' | 'fail' | 'na' }[];
}

export interface PortalJob {
    id: string;
    jobNumber: string;
    type: JobType;
    status: JobStatus;
    orderNumber: string;
    siteAddress: string;
    siteCity: string;
    engineerName: string;
    scheduledStart: string;
    scheduledEnd: string;
    actualStart: string | null;
    actualEnd: string | null;
    estimatedHours: number;
    completionPct: number;
    checklist: PortalJobChecklistGroup[];
    customerRating: number | null;
}

function engineerName(id: string): string {
    return engineers.find((e) => e.id === id)?.fullName ?? '—';
}

function completionPct(j: typeof jobs[number]): number {
    const all = j.checklist.flatMap((g) => g.items);
    if (all.length === 0) return 0;
    const done = all.filter((i) => i.status === 'pass' || i.status === 'na').length;
    return Math.round((done / all.length) * 100);
}

function project(j: typeof jobs[number]): PortalJob {
    return {
        id: j.id,
        jobNumber: j.jobNumber,
        type: j.type,
        status: j.status,
        orderNumber: j.orderNumber,
        siteAddress: j.siteAddress,
        siteCity: j.siteCity,
        engineerName: engineerName(j.engineerId),
        scheduledStart: j.scheduledStart,
        scheduledEnd: j.scheduledEnd,
        actualStart: j.actualStart,
        actualEnd: j.actualEnd,
        estimatedHours: j.estimatedHours,
        completionPct: completionPct(j),
        checklist: j.checklist.map((g) => ({
            title: g.title,
            items: g.items.map((i) => ({ label: i.label, status: i.status })),
        })),
        customerRating: j.customerRating,
    };
}

export function portalJobs(): PortalJob[] {
    const company = currentClientUser().companyName;
    return jobs.filter((j) => j.customerCompany === company).map(project);
}

export function portalJobById(id: string): PortalJob | undefined {
    const company = currentClientUser().companyName;
    const j = jobs.find((x) => x.id === id && x.customerCompany === company);
    return j ? project(j) : undefined;
}

export function submitPortalJobFeedback(jobId: string, rating: number): void {
    const j = jobs.find((x) => x.id === jobId);
    if (!j) return;
    j.customerRating = rating;
}
