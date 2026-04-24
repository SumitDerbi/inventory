import { orders } from './orders';

export type JobStatus =
    | 'scheduled'
    | 'en_route'
    | 'in_progress'
    | 'completed'
    | 'signed_off'
    | 'cancelled';

export type JobPriority = 'low' | 'normal' | 'high' | 'urgent';

export type JobType =
    | 'installation'
    | 'commissioning'
    | 'service_visit'
    | 'amc'
    | 'breakdown';

export type ChecklistItemStatus = 'pending' | 'pass' | 'fail' | 'na';

export interface JobChecklistItem {
    id: string;
    label: string;
    requiresPhoto?: boolean;
    status: ChecklistItemStatus;
    remark?: string;
}

export interface JobChecklistGroup {
    id: string;
    title: string;
    items: JobChecklistItem[];
}

export interface JobPhoto {
    id: string;
    url: string;
    caption: string;
    uploadedAt: string;
    uploadedBy: string; // userId
}

export type ObservationSeverity = 'info' | 'minor' | 'major' | 'critical';

export interface JobObservation {
    id: string;
    severity: ObservationSeverity;
    note: string;
    raisedAt: string;
    raisedBy: string; // userId
}

export interface CommissioningReading {
    label: string;
    value: string;
    unit: string;
    inSpec: boolean;
}

export interface CommissioningReport {
    submittedAt: string | null;
    submittedBy: string | null;
    readings: CommissioningReading[];
    summary: string;
    customerSignedFile: string | null;
    customerName: string | null;
}

export interface JobActivity {
    id: string;
    at: string;
    actorId: string;
    summary: string;
}

export interface Job {
    id: string;
    jobNumber: string;
    type: JobType;
    productCategory: string;
    status: JobStatus;
    priority: JobPriority;
    orderId: string;
    orderNumber: string;
    customerName: string;
    customerCompany: string;
    siteAddress: string;
    siteCity: string;
    siteContact: string;
    siteContactPhone: string;
    engineerId: string;
    helperIds: string[];
    scheduledStart: string; // ISO
    scheduledEnd: string; // ISO
    actualStart: string | null;
    actualEnd: string | null;
    estimatedHours: number;
    travelKm: number;
    notes: string;
    checklistTemplateId: string;
    checklist: JobChecklistGroup[];
    photos: JobPhoto[];
    observations: JobObservation[];
    report: CommissioningReport;
    activity: JobActivity[];
    createdAt: string;
    customerRating: number | null;
}

export const JOB_STATUSES: JobStatus[] = [
    'scheduled',
    'en_route',
    'in_progress',
    'completed',
    'signed_off',
];

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
    scheduled: 'Scheduled',
    en_route: 'En route',
    in_progress: 'In progress',
    completed: 'Completed',
    signed_off: 'Signed off',
    cancelled: 'Cancelled',
};

export const JOB_STATUS_TONE: Record<
    JobStatus,
    'neutral' | 'sky' | 'blue' | 'amber' | 'emerald' | 'green' | 'red'
> = {
    scheduled: 'neutral',
    en_route: 'sky',
    in_progress: 'blue',
    completed: 'emerald',
    signed_off: 'green',
    cancelled: 'red',
};

export const JOB_PRIORITY_LABEL: Record<JobPriority, string> = {
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    urgent: 'Urgent',
};

export const JOB_PRIORITY_TONE: Record<
    JobPriority,
    'neutral' | 'sky' | 'amber' | 'urgent'
> = {
    low: 'neutral',
    normal: 'sky',
    high: 'amber',
    urgent: 'urgent',
};

export const JOB_TYPE_LABEL: Record<JobType, string> = {
    installation: 'Installation',
    commissioning: 'Commissioning',
    service_visit: 'Service visit',
    amc: 'AMC visit',
    breakdown: 'Breakdown',
};

const ALLOWED_NEXT: Record<JobStatus, JobStatus[]> = {
    scheduled: ['en_route', 'cancelled'],
    en_route: ['in_progress', 'cancelled'],
    in_progress: ['completed'],
    completed: ['signed_off'],
    signed_off: [],
    cancelled: [],
};

export function nextJobStatuses(s: JobStatus): JobStatus[] {
    return ALLOWED_NEXT[s];
}

export function canAdvanceJob(from: JobStatus, to: JobStatus): boolean {
    return ALLOWED_NEXT[from]?.includes(to) ?? false;
}

const TODAY = Date.now();
const ONE_DAY = 86_400_000;
const ONE_HOUR = 3_600_000;

function iso(offsetDays: number, hour = 9, minute = 0): string {
    const d = new Date(TODAY + offsetDays * ONE_DAY);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
}

function checklistFromTemplate(
    items: Array<{ id: string; label: string; requiresPhoto?: boolean }>,
    statuses: ChecklistItemStatus[],
): JobChecklistItem[] {
    return items.map((it, i) => ({
        ...it,
        status: statuses[i] ?? 'pending',
    }));
}

const PUMP_GROUPS = (allDone: boolean): JobChecklistGroup[] => [
    {
        id: 'g1',
        title: 'Pre-installation',
        items: checklistFromTemplate(
            [
                { id: 'p-1', label: 'Site survey completed and shared with customer' },
                { id: 'p-2', label: 'Foundation level checked (within 2 mm tolerance)' },
                { id: 'p-3', label: 'Power supply cable rating verified' },
                { id: 'p-4', label: 'PPE issued to crew' },
            ],
            allDone
                ? ['pass', 'pass', 'pass', 'pass']
                : ['pass', 'pass', 'pass', 'pending'],
        ),
    },
    {
        id: 'g2',
        title: 'Mechanical installation',
        items: checklistFromTemplate(
            [
                { id: 'm-1', label: 'Pump base anchored with grout' },
                {
                    id: 'm-2',
                    label: 'Coupling alignment within OEM spec',
                    requiresPhoto: true,
                },
                { id: 'm-3', label: 'Suction & delivery piping torque-checked' },
                { id: 'm-4', label: 'Anti-vibration pads installed' },
            ],
            allDone
                ? ['pass', 'pass', 'pass', 'pass']
                : ['pass', 'pending', 'pending', 'pending'],
        ),
    },
    {
        id: 'g3',
        title: 'Electrical & control',
        items: checklistFromTemplate(
            [
                { id: 'e-1', label: 'Earthing continuity tested' },
                { id: 'e-2', label: 'Phase sequence verified' },
                { id: 'e-3', label: 'Overload relay set per FLA' },
                {
                    id: 'e-4',
                    label: 'Control panel labels affixed',
                    requiresPhoto: true,
                },
            ],
            allDone
                ? ['pass', 'pass', 'pass', 'pass']
                : ['pending', 'pending', 'pending', 'pending'],
        ),
    },
    {
        id: 'g4',
        title: 'Commissioning & handover',
        items: checklistFromTemplate(
            [
                { id: 'c-1', label: 'No-load run for 10 minutes' },
                { id: 'c-2', label: 'Load run with rated discharge' },
                { id: 'c-3', label: 'Customer trained on start/stop procedure' },
                {
                    id: 'c-4',
                    label: 'Commissioning report signed',
                    requiresPhoto: true,
                },
            ],
            allDone
                ? ['pass', 'pass', 'pass', 'pass']
                : ['pending', 'pending', 'pending', 'pending'],
        ),
    },
];

const FIRE_GROUPS = (): JobChecklistGroup[] => [
    {
        id: 'g1',
        title: 'Pre-commissioning',
        items: checklistFromTemplate(
            [
                { id: 'p-1', label: 'Hydraulic test pressure achieved' },
                { id: 'p-2', label: 'Pump room ventilation OK' },
                { id: 'p-3', label: 'Diesel tank fuel level >75%' },
            ],
            ['pass', 'pass', 'fail'],
        ),
    },
    {
        id: 'g2',
        title: 'Functional tests',
        items: checklistFromTemplate(
            [
                { id: 'f-1', label: 'Jockey pump cut-in/cut-out verified' },
                { id: 'f-2', label: 'Main electric pump auto-start verified' },
                { id: 'f-3', label: 'Diesel pump auto-start with 5-attempt sequencer' },
                {
                    id: 'f-4',
                    label: 'Sprinkler test valve flow OK',
                    requiresPhoto: true,
                },
            ],
            ['pass', 'pass', 'pending', 'pending'],
        ),
    },
    {
        id: 'g3',
        title: 'Documentation',
        items: checklistFromTemplate(
            [
                { id: 'd-1', label: 'Test report signed by site safety officer' },
                { id: 'd-2', label: 'NOC application papers handed over' },
            ],
            ['pending', 'pending'],
        ),
    },
];

const SOLAR_GROUPS = (allDone: boolean): JobChecklistGroup[] => [
    {
        id: 'g1',
        title: 'Array',
        items: checklistFromTemplate(
            [
                { id: 's-1', label: 'Module Voc / Isc within 5% of spec' },
                { id: 's-2', label: 'Mounting structure earthed' },
                {
                    id: 's-3',
                    label: 'String labelling complete',
                    requiresPhoto: true,
                },
            ],
            allDone ? ['pass', 'pass', 'pass'] : ['pending', 'pending', 'pending'],
        ),
    },
    {
        id: 'g2',
        title: 'VFD & pump',
        items: checklistFromTemplate(
            [
                { id: 'v-1', label: 'VFD parameters set per pump curve' },
                { id: 'v-2', label: 'Dry-run protection verified' },
                { id: 'v-3', label: 'Tank-full sensor tested' },
            ],
            allDone ? ['pass', 'pass', 'pass'] : ['pending', 'pending', 'pending'],
        ),
    },
    {
        id: 'g3',
        title: 'Handover',
        items: checklistFromTemplate(
            [
                { id: 'h-1', label: 'Customer manual handed over' },
                { id: 'h-2', label: 'AMC card filled' },
            ],
            allDone ? ['pass', 'pass'] : ['pending', 'pending'],
        ),
    },
];

function emptyReport(): CommissioningReport {
    return {
        submittedAt: null,
        submittedBy: null,
        readings: [],
        summary: '',
        customerSignedFile: null,
        customerName: null,
    };
}

export const jobs: Job[] = [
    {
        id: 'job-001',
        jobNumber: 'JOB-2026-001',
        type: 'installation',
        productCategory: 'Pumps & Motors',
        status: 'in_progress',
        priority: 'high',
        orderId: 'so-001',
        orderNumber: 'SO-2026-001',
        customerName: 'Rajesh Patel',
        customerCompany: 'Patel Engineering Ltd.',
        siteAddress: 'Plot 214, GIDC Phase IV, Vatva, Ahmedabad 382445',
        siteCity: 'Ahmedabad',
        siteContact: 'Hiren Patel',
        siteContactPhone: '+91 98250 41122',
        engineerId: 'eng-1',
        helperIds: ['u-7'],
        scheduledStart: iso(0, 9, 0),
        scheduledEnd: iso(0, 17, 0),
        actualStart: new Date(TODAY + 0 * ONE_DAY + 9 * ONE_HOUR + 18 * 60_000)
            .toISOString(),
        actualEnd: null,
        estimatedHours: 8,
        travelKm: 18,
        notes: 'Two pumps, parallel piping. Customer wants commissioning the same day.',
        checklistTemplateId: 'tmpl-pump',
        checklist: PUMP_GROUPS(false),
        photos: [
            {
                id: 'ph-1',
                url: 'https://placehold.co/600x400/e2e8f0/475569?text=Foundation',
                caption: 'Foundation level check',
                uploadedAt: iso(0, 9, 45),
                uploadedBy: 'u-8',
            },
            {
                id: 'ph-2',
                url: 'https://placehold.co/600x400/e2e8f0/475569?text=Coupling',
                caption: 'Coupling alignment dial-gauge reading',
                uploadedAt: iso(0, 11, 20),
                uploadedBy: 'u-8',
            },
        ],
        observations: [
            {
                id: 'obs-1',
                severity: 'minor',
                note: 'Anchor bolt thread length 5 mm short — using thicker washer as packer.',
                raisedAt: iso(0, 10, 5),
                raisedBy: 'u-8',
            },
        ],
        report: emptyReport(),
        activity: [
            {
                id: 'a-1',
                at: iso(-1, 16, 30),
                actorId: 'u-3',
                summary: 'Job scheduled and assigned to Manish Patel.',
            },
            {
                id: 'a-2',
                at: iso(0, 8, 5),
                actorId: 'u-8',
                summary: 'Engineer started travel from Ahmedabad base.',
            },
            {
                id: 'a-3',
                at: iso(0, 9, 18),
                actorId: 'u-8',
                summary: 'Arrived at site, started installation.',
            },
        ],
        createdAt: iso(-3, 11, 0),
        customerRating: null,
    },
    {
        id: 'job-002',
        jobNumber: 'JOB-2026-002',
        type: 'commissioning',
        productCategory: 'Solar Pumping',
        status: 'scheduled',
        priority: 'normal',
        orderId: 'so-014',
        orderNumber: 'SO-2026-014',
        customerName: 'Saurabh Bose',
        customerCompany: 'Bengal Bottlers',
        siteAddress: 'Belur Industrial Area, Howrah 711202',
        siteCity: 'Kolkata',
        siteContact: 'Anirban Roy',
        siteContactPhone: '+91 98300 22118',
        engineerId: 'eng-2',
        helperIds: [],
        scheduledStart: iso(2, 10, 0),
        scheduledEnd: iso(2, 16, 0),
        actualStart: null,
        actualEnd: null,
        estimatedHours: 6,
        travelKm: 0,
        notes: 'Travel by train one day before. Hotel pre-booked.',
        checklistTemplateId: 'tmpl-solar',
        checklist: SOLAR_GROUPS(false),
        photos: [],
        observations: [],
        report: emptyReport(),
        activity: [
            {
                id: 'a-1',
                at: iso(-2, 15, 0),
                actorId: 'u-3',
                summary: 'Job scheduled and assigned to Ritika Sharma.',
            },
        ],
        createdAt: iso(-2, 15, 0),
        customerRating: null,
    },
    {
        id: 'job-003',
        jobNumber: 'JOB-2026-003',
        type: 'commissioning',
        productCategory: 'Fire Fighting',
        status: 'in_progress',
        priority: 'urgent',
        orderId: 'so-006',
        orderNumber: 'SO-2026-006',
        customerName: 'Mehul Shah',
        customerCompany: 'Vapi Industries Pvt Ltd',
        siteAddress: 'Plot 88, GIDC Vapi Phase II',
        siteCity: 'Vapi',
        siteContact: 'Bharat Doshi',
        siteContactPhone: '+91 98250 70011',
        engineerId: 'eng-3',
        helperIds: ['u-7'],
        scheduledStart: iso(0, 8, 0),
        scheduledEnd: iso(0, 18, 0),
        actualStart: iso(0, 8, 30),
        actualEnd: null,
        estimatedHours: 10,
        travelKm: 12,
        notes: 'NOC inspector visiting tomorrow morning — must close fuel issue today.',
        checklistTemplateId: 'tmpl-firefighting',
        checklist: FIRE_GROUPS(),
        photos: [
            {
                id: 'ph-1',
                url: 'https://placehold.co/600x400/fee2e2/991b1b?text=Diesel+Tank',
                caption: 'Diesel tank gauge — currently at 60%, requires top-up.',
                uploadedAt: iso(0, 9, 15),
                uploadedBy: 'u-10',
            },
        ],
        observations: [
            {
                id: 'obs-1',
                severity: 'major',
                note: 'Diesel tank fuel level 60% (NFPA expects >75%) — requesting site team to refuel before further tests.',
                raisedAt: iso(0, 9, 20),
                raisedBy: 'u-10',
            },
        ],
        report: emptyReport(),
        activity: [
            {
                id: 'a-1',
                at: iso(-2, 17, 0),
                actorId: 'u-3',
                summary: 'Job created from breakdown ticket.',
            },
            {
                id: 'a-2',
                at: iso(0, 8, 30),
                actorId: 'u-10',
                summary: 'Started commissioning checks.',
            },
            {
                id: 'a-3',
                at: iso(0, 9, 20),
                actorId: 'u-10',
                summary: 'Major observation logged: fuel level below NFPA threshold.',
            },
        ],
        createdAt: iso(-2, 17, 0),
        customerRating: null,
    },
    {
        id: 'job-004',
        jobNumber: 'JOB-2026-004',
        type: 'installation',
        productCategory: 'Pumps & Motors',
        status: 'completed',
        priority: 'normal',
        orderId: 'so-004',
        orderNumber: 'SO-2026-004',
        customerName: 'Neha Verma',
        customerCompany: 'GreenLeaf Pharma',
        siteAddress: 'Plot 41, GIDC Ankleshwar',
        siteCity: 'Ankleshwar',
        siteContact: 'Anand Mehta',
        siteContactPhone: '+91 98250 56432',
        engineerId: 'eng-1',
        helperIds: ['u-7'],
        scheduledStart: iso(-2, 9, 0),
        scheduledEnd: iso(-2, 17, 0),
        actualStart: iso(-2, 9, 10),
        actualEnd: iso(-2, 16, 40),
        estimatedHours: 8,
        travelKm: 88,
        notes: 'Cooling tower revamp — 2 pumps replaced.',
        checklistTemplateId: 'tmpl-pump',
        checklist: PUMP_GROUPS(true),
        photos: [
            {
                id: 'ph-1',
                url: 'https://placehold.co/600x400/dcfce7/166534?text=Pump+Installed',
                caption: 'Pumps in place after grouting',
                uploadedAt: iso(-2, 13, 0),
                uploadedBy: 'u-8',
            },
            {
                id: 'ph-2',
                url: 'https://placehold.co/600x400/dcfce7/166534?text=Panel',
                caption: 'Control panel commissioned',
                uploadedAt: iso(-2, 15, 30),
                uploadedBy: 'u-8',
            },
        ],
        observations: [],
        report: {
            submittedAt: iso(-2, 16, 30),
            submittedBy: 'u-8',
            customerName: 'Anand Mehta',
            customerSignedFile: 'commissioning-so-2026-004.pdf',
            summary:
                'Both pumps installed and commissioned. No-load and load runs satisfactory. Customer trained on operation.',
            readings: [
                { label: 'Discharge head', value: '32', unit: 'm', inSpec: true },
                { label: 'Flow rate', value: '180', unit: 'm³/h', inSpec: true },
                { label: 'Motor current', value: '24.6', unit: 'A', inSpec: true },
                { label: 'Vibration (DE)', value: '2.1', unit: 'mm/s', inSpec: true },
                { label: 'Noise level', value: '78', unit: 'dB', inSpec: true },
            ],
        },
        activity: [
            {
                id: 'a-1',
                at: iso(-4, 10, 0),
                actorId: 'u-3',
                summary: 'Job scheduled and assigned to Manish Patel.',
            },
            {
                id: 'a-2',
                at: iso(-2, 9, 10),
                actorId: 'u-8',
                summary: 'Started installation.',
            },
            {
                id: 'a-3',
                at: iso(-2, 16, 30),
                actorId: 'u-8',
                summary: 'Commissioning report submitted.',
            },
            {
                id: 'a-4',
                at: iso(-2, 16, 40),
                actorId: 'u-8',
                summary: 'Job marked completed; awaiting customer sign-off.',
            },
        ],
        createdAt: iso(-4, 10, 0),
        customerRating: null,
    },
    {
        id: 'job-005',
        jobNumber: 'JOB-2026-005',
        type: 'commissioning',
        productCategory: 'Pumps & Motors',
        status: 'signed_off',
        priority: 'normal',
        orderId: 'so-003',
        orderNumber: 'SO-2026-003',
        customerName: 'Anil Joshi',
        customerCompany: 'Surat Textile Mills',
        siteAddress: 'Pandesara GIDC, Surat',
        siteCity: 'Surat',
        siteContact: 'Devang Joshi',
        siteContactPhone: '+91 98250 67889',
        engineerId: 'eng-3',
        helperIds: [],
        scheduledStart: iso(-7, 9, 0),
        scheduledEnd: iso(-7, 14, 0),
        actualStart: iso(-7, 9, 0),
        actualEnd: iso(-7, 13, 30),
        estimatedHours: 5,
        travelKm: 14,
        notes: '',
        checklistTemplateId: 'tmpl-pump',
        checklist: PUMP_GROUPS(true),
        photos: [
            {
                id: 'ph-1',
                url: 'https://placehold.co/600x400/dcfce7/166534?text=Boiler+Feed',
                caption: 'Boiler feed pump after commissioning',
                uploadedAt: iso(-7, 12, 0),
                uploadedBy: 'u-10',
            },
        ],
        observations: [],
        report: {
            submittedAt: iso(-7, 13, 0),
            submittedBy: 'u-10',
            customerName: 'Devang Joshi',
            customerSignedFile: 'commissioning-so-2026-003.pdf',
            summary:
                'Boiler feed pump commissioned, all parameters within spec.',
            readings: [
                { label: 'Discharge pressure', value: '12.4', unit: 'bar', inSpec: true },
                { label: 'Flow rate', value: '45', unit: 'm³/h', inSpec: true },
                { label: 'Motor current', value: '18.2', unit: 'A', inSpec: true },
                { label: 'Bearing temp', value: '54', unit: '°C', inSpec: true },
            ],
        },
        activity: [
            {
                id: 'a-1',
                at: iso(-9, 11, 0),
                actorId: 'u-3',
                summary: 'Job scheduled.',
            },
            {
                id: 'a-2',
                at: iso(-7, 13, 30),
                actorId: 'u-10',
                summary: 'Job completed.',
            },
            {
                id: 'a-3',
                at: iso(-6, 10, 0),
                actorId: 'u-1',
                summary: 'Customer signed off — rating 5/5.',
            },
        ],
        createdAt: iso(-9, 11, 0),
        customerRating: 5,
    },
    {
        id: 'job-006',
        jobNumber: 'JOB-2026-006',
        type: 'service_visit',
        productCategory: 'Pumps & Motors',
        status: 'scheduled',
        priority: 'low',
        orderId: 'so-009',
        orderNumber: 'SO-2026-009',
        customerName: 'Rinku Solanki',
        customerCompany: 'Rajkot Engineering',
        siteAddress: 'GIDC Lodhika, Rajkot',
        siteCity: 'Rajkot',
        siteContact: 'Rinku Solanki',
        siteContactPhone: '+91 98250 90011',
        engineerId: 'eng-2',
        helperIds: [],
        scheduledStart: iso(3, 11, 0),
        scheduledEnd: iso(3, 14, 0),
        actualStart: null,
        actualEnd: null,
        estimatedHours: 3,
        travelKm: 0,
        notes: 'Routine quarterly check.',
        checklistTemplateId: 'tmpl-pump',
        checklist: PUMP_GROUPS(false),
        photos: [],
        observations: [],
        report: emptyReport(),
        activity: [
            {
                id: 'a-1',
                at: iso(-1, 15, 0),
                actorId: 'u-3',
                summary: 'Service visit scheduled.',
            },
        ],
        createdAt: iso(-1, 15, 0),
        customerRating: null,
    },
    {
        id: 'job-007',
        jobNumber: 'JOB-2026-007',
        type: 'breakdown',
        productCategory: 'Pumps & Motors',
        status: 'scheduled',
        priority: 'urgent',
        orderId: 'so-018',
        orderNumber: 'SO-2026-018',
        customerName: 'Manoj Bhatia',
        customerCompany: 'Jaipur Cooling Systems',
        siteAddress: 'Sitapura, Jaipur',
        siteCity: 'Jaipur',
        siteContact: 'Manoj Bhatia',
        siteContactPhone: '+91 98290 33445',
        engineerId: 'eng-1',
        helperIds: [],
        scheduledStart: iso(1, 9, 0),
        scheduledEnd: iso(1, 17, 0),
        actualStart: null,
        actualEnd: null,
        estimatedHours: 8,
        travelKm: 0,
        notes: 'Pump making abnormal noise — likely bearing failure.',
        checklistTemplateId: 'tmpl-pump',
        checklist: PUMP_GROUPS(false),
        photos: [],
        observations: [],
        report: emptyReport(),
        activity: [
            {
                id: 'a-1',
                at: iso(0, 8, 0),
                actorId: 'u-3',
                summary: 'Breakdown reported by customer.',
            },
            {
                id: 'a-2',
                at: iso(0, 8, 30),
                actorId: 'u-3',
                summary: 'Engineer assigned, parts arranged ex-Ahmedabad.',
            },
        ],
        createdAt: iso(0, 8, 0),
        customerRating: null,
    },
    {
        id: 'job-008',
        jobNumber: 'JOB-2026-008',
        type: 'amc',
        productCategory: 'Fire Fighting',
        status: 'completed',
        priority: 'normal',
        orderId: 'so-006',
        orderNumber: 'SO-2026-006',
        customerName: 'Mehul Shah',
        customerCompany: 'Vapi Industries Pvt Ltd',
        siteAddress: 'Plot 88, GIDC Vapi Phase II',
        siteCity: 'Vapi',
        siteContact: 'Bharat Doshi',
        siteContactPhone: '+91 98250 70011',
        engineerId: 'eng-3',
        helperIds: [],
        scheduledStart: iso(-1, 10, 0),
        scheduledEnd: iso(-1, 13, 0),
        actualStart: iso(-1, 10, 5),
        actualEnd: iso(-1, 12, 50),
        estimatedHours: 3,
        travelKm: 12,
        notes: 'Quarterly AMC visit.',
        checklistTemplateId: 'tmpl-firefighting',
        checklist: FIRE_GROUPS(),
        photos: [],
        observations: [
            {
                id: 'obs-1',
                severity: 'minor',
                note: 'Sprinkler valve gasket showing wear — recommend replacement within 30 days.',
                raisedAt: iso(-1, 12, 30),
                raisedBy: 'u-10',
            },
        ],
        report: {
            submittedAt: iso(-1, 12, 50),
            submittedBy: 'u-10',
            customerName: 'Bharat Doshi',
            customerSignedFile: 'amc-so-2026-006-q1.pdf',
            summary:
                'AMC visit completed. One minor observation logged for follow-up.',
            readings: [
                { label: 'Standby pressure', value: '7.0', unit: 'bar', inSpec: true },
                { label: 'Pump start time', value: '4.8', unit: 's', inSpec: true },
            ],
        },
        activity: [
            {
                id: 'a-1',
                at: iso(-3, 16, 0),
                actorId: 'u-3',
                summary: 'AMC visit scheduled.',
            },
            {
                id: 'a-2',
                at: iso(-1, 12, 50),
                actorId: 'u-10',
                summary: 'AMC visit completed.',
            },
        ],
        createdAt: iso(-3, 16, 0),
        customerRating: null,
    },
];

export function jobById(id: string | null | undefined): Job | undefined {
    if (!id) return undefined;
    return jobs.find((j) => j.id === id);
}

export function jobsForOrder(orderId: string): Job[] {
    return jobs.filter((j) => j.orderId === orderId);
}

export function jobsForEngineer(engineerId: string): Job[] {
    return jobs.filter((j) => j.engineerId === engineerId);
}

export function checklistProgress(job: Job): {
    total: number;
    completed: number;
    failed: number;
    pct: number;
} {
    let total = 0;
    let completed = 0;
    let failed = 0;
    for (const g of job.checklist) {
        for (const it of g.items) {
            total += 1;
            if (it.status === 'pass' || it.status === 'na') completed += 1;
            if (it.status === 'fail') failed += 1;
        }
    }
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, failed, pct };
}

export function jobsSummary() {
    const total = jobs.length;
    const scheduled = jobs.filter((j) => j.status === 'scheduled').length;
    const inProgress = jobs.filter(
        (j) => j.status === 'in_progress' || j.status === 'en_route',
    ).length;
    const awaitingSignoff = jobs.filter((j) => j.status === 'completed').length;
    const urgentOpen = jobs.filter(
        (j) =>
            j.priority === 'urgent' &&
            j.status !== 'signed_off' &&
            j.status !== 'cancelled',
    ).length;
    return { total, scheduled, inProgress, awaitingSignoff, urgentOpen };
}

export function ordersAwaitingJob() {
    return orders
        .filter((o) => o.stage === 'dispatched' || o.stage === 'installed')
        .map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            customerName: o.customerName,
            companyName: o.companyName,
            siteAddress: o.siteAddress,
        }));
}
