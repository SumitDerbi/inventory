import type {
    InquiryPriority,
    InquiryStatus,
    InquiryType,
} from '@/lib/inquiryStatus';

export interface InquiryLineItem {
    id: string;
    productDescription: string;
    category: string;
    specificationNotes: string;
    quantity: number;
    unit: string;
    estimatedValue: number;
    notes: string;
}

export type FollowUpType = 'call' | 'email' | 'visit' | 'whatsapp' | 'meeting';
export type FollowUpStatus = 'pending' | 'completed' | 'missed' | 'rescheduled';

export interface InquiryFollowUp {
    id: string;
    inquiryId: string;
    followUpType: FollowUpType;
    scheduledAt: string; // ISO
    completedAt: string | null;
    status: FollowUpStatus;
    outcome: string | null;
    nextFollowUpDate: string | null;
    assignedTo: string; // userId
}

export type ActivityActionType =
    | 'created'
    | 'status_changed'
    | 'assigned'
    | 'note_added'
    | 'follow_up_added'
    | 'attachment_added'
    | 'email_sent'
    | 'converted';

export interface InquiryActivity {
    id: string;
    inquiryId: string;
    actionType: ActivityActionType;
    oldValue: string | null;
    newValue: string | null;
    remarks: string | null;
    performedBy: string; // userId
    performedAt: string; // ISO
}

export interface InquiryAttachment {
    id: string;
    inquiryId: string;
    name: string;
    sizeKb: number;
    version: number;
    uploadedBy: string; // userId
    uploadedAt: string; // ISO
}

export interface Inquiry {
    id: string;
    inquiryNumber: string;
    sourceId: string;
    customerId: string | null;
    customerName: string;
    companyName: string;
    mobile: string;
    email: string;
    city: string;
    state: string;
    projectName: string;
    projectDescription: string;
    productCategoryId: string;
    inquiryType: InquiryType;
    priority: InquiryPriority;
    status: InquiryStatus;
    assignedTo: string | null;
    expectedOrderDate: string | null;
    siteLocation: string;
    budgetRange: string;
    sourceReference: string;
    lostReason: string | null;
    notes: string;
    createdAt: string;
    lineItems: InquiryLineItem[];
    followUps: InquiryFollowUp[];
    activity: InquiryActivity[];
    attachments: InquiryAttachment[];
}

const now = Date.now();
const days = (n: number) => new Date(now - n * 86_400_000).toISOString();
const future = (n: number) => new Date(now + n * 86_400_000).toISOString();

function makeLineItems(
    inquiryId: string,
    items: Array<Partial<InquiryLineItem> & { productDescription: string }>,
): InquiryLineItem[] {
    return items.map((it, idx) => ({
        id: `${inquiryId}-li-${idx + 1}`,
        productDescription: it.productDescription,
        category: it.category ?? 'General',
        specificationNotes: it.specificationNotes ?? '',
        quantity: it.quantity ?? 1,
        unit: it.unit ?? 'pcs',
        estimatedValue: it.estimatedValue ?? 0,
        notes: it.notes ?? '',
    }));
}

function makeFollowUps(
    inquiryId: string,
    items: Array<Omit<InquiryFollowUp, 'id' | 'inquiryId'>>,
): InquiryFollowUp[] {
    return items.map((f, idx) => ({ id: `${inquiryId}-fu-${idx + 1}`, inquiryId, ...f }));
}

function makeActivity(
    inquiryId: string,
    items: Array<Omit<InquiryActivity, 'id' | 'inquiryId'>>,
): InquiryActivity[] {
    return items.map((a, idx) => ({ id: `${inquiryId}-act-${idx + 1}`, inquiryId, ...a }));
}

function makeAttachments(
    inquiryId: string,
    items: Array<Omit<InquiryAttachment, 'id' | 'inquiryId'>>,
): InquiryAttachment[] {
    return items.map((a, idx) => ({ id: `${inquiryId}-att-${idx + 1}`, inquiryId, ...a }));
}

/* ------------------------------------------------------------------ */
/* Detailed inquiries — first 3 are fully fleshed out, rest are       */
/* lighter rows that still cover every status/source/priority/type    */
/* combination so the list filters can be exercised end-to-end.       */
/* ------------------------------------------------------------------ */

const detailedInquiries: Inquiry[] = [
    {
        id: 'inq-1001',
        inquiryNumber: 'INQ-2026-0001',
        sourceId: 's-2',
        customerId: null,
        customerName: 'Mahesh Patel',
        companyName: 'Patel Engineering Works',
        mobile: '+91 98250 11221',
        email: 'mahesh@patel-eng.in',
        city: 'Ahmedabad',
        state: 'Gujarat',
        projectName: 'Effluent Treatment Plant Phase II',
        projectDescription:
            'Capacity expansion of ETP — needs 4 high-pressure pumps and associated valves with inline strainers.',
        productCategoryId: 'pc-1',
        inquiryType: 'new_project',
        priority: 'high',
        status: 'in_progress',
        assignedTo: 'u-1',
        expectedOrderDate: future(21),
        siteLocation: 'Plot 14, Naroda GIDC, Ahmedabad',
        budgetRange: '₹18–22 L',
        sourceReference: 'Form #W-2026-441',
        lostReason: null,
        notes: 'Pressure rating 12 bar; client prefers Grundfos / Kirloskar.',
        createdAt: days(4),
        lineItems: makeLineItems('inq-1001', [
            {
                productDescription: 'Centrifugal pump — 5 HP, 12 bar',
                category: 'Industrial Pumps',
                specificationNotes: 'Stainless steel impeller, IE3 motor',
                quantity: 4,
                unit: 'pcs',
                estimatedValue: 1_280_000,
            },
            {
                productDescription: 'Y-strainer DN50, SS304',
                category: 'Valves & Fittings',
                quantity: 8,
                unit: 'pcs',
                estimatedValue: 96_000,
            },
            {
                productDescription: 'Pressure gauge 0–16 bar with isolation valve',
                category: 'Valves & Fittings',
                quantity: 12,
                unit: 'set',
                estimatedValue: 54_000,
            },
        ]),
        followUps: makeFollowUps('inq-1001', [
            {
                followUpType: 'call',
                scheduledAt: days(2),
                completedAt: days(2),
                status: 'completed',
                outcome: 'Confirmed pump specifications. Client to share GA drawings.',
                nextFollowUpDate: future(2),
                assignedTo: 'u-1',
            },
            {
                followUpType: 'visit',
                scheduledAt: future(2),
                completedAt: null,
                status: 'pending',
                outcome: null,
                nextFollowUpDate: null,
                assignedTo: 'u-1',
            },
        ]),
        activity: makeActivity('inq-1001', [
            {
                actionType: 'created',
                oldValue: null,
                newValue: 'New',
                remarks: 'Inquiry intake from website form.',
                performedBy: 'u-5',
                performedAt: days(4),
            },
            {
                actionType: 'assigned',
                oldValue: null,
                newValue: 'Aarav Mehta',
                remarks: null,
                performedBy: 'u-3',
                performedAt: days(4),
            },
            {
                actionType: 'status_changed',
                oldValue: 'New',
                newValue: 'In Progress',
                remarks: null,
                performedBy: 'u-1',
                performedAt: days(3),
            },
            {
                actionType: 'note_added',
                oldValue: null,
                newValue: null,
                remarks: 'Customer prefers IE3 efficiency motors.',
                performedBy: 'u-1',
                performedAt: days(3),
            },
            {
                actionType: 'follow_up_added',
                oldValue: null,
                newValue: 'Site visit scheduled',
                remarks: null,
                performedBy: 'u-1',
                performedAt: days(2),
            },
            {
                actionType: 'email_sent',
                oldValue: null,
                newValue: 'Spec sheet shared',
                remarks: 'Sent product spec PDF.',
                performedBy: 'u-1',
                performedAt: days(1),
            },
        ]),
        attachments: makeAttachments('inq-1001', [
            {
                name: 'patel-eng-rfq.pdf',
                sizeKb: 412,
                version: 1,
                uploadedBy: 'u-5',
                uploadedAt: days(4),
            },
            {
                name: 'site-layout-v2.dwg',
                sizeKb: 1820,
                version: 2,
                uploadedBy: 'u-1',
                uploadedAt: days(2),
            },
        ]),
    },
    {
        id: 'inq-1002',
        inquiryNumber: 'INQ-2026-0002',
        sourceId: 's-1',
        customerId: null,
        customerName: 'Reema Kulkarni',
        companyName: 'Sunrise Textiles Pvt Ltd',
        mobile: '+91 98765 43210',
        email: 'reema.k@sunrise-tex.in',
        city: 'Pune',
        state: 'Maharashtra',
        projectName: 'Boiler feed pump replacement',
        projectDescription: 'Single replacement unit, like-for-like with existing 7.5 HP pump.',
        productCategoryId: 'pc-1',
        inquiryType: 'spare_parts',
        priority: 'medium',
        status: 'quoted',
        assignedTo: 'u-2',
        expectedOrderDate: future(7),
        siteLocation: 'Bhosari MIDC, Pune',
        budgetRange: '₹2–3 L',
        sourceReference: 'Dealer: Maharashtra Engg Sales',
        lostReason: null,
        notes: '',
        createdAt: days(9),
        lineItems: makeLineItems('inq-1002', [
            {
                productDescription: 'Boiler feed pump 7.5 HP',
                category: 'Industrial Pumps',
                quantity: 1,
                unit: 'pcs',
                estimatedValue: 240_000,
            },
        ]),
        followUps: makeFollowUps('inq-1002', [
            {
                followUpType: 'whatsapp',
                scheduledAt: days(7),
                completedAt: days(7),
                status: 'completed',
                outcome: 'Shared brochure. Client requested formal quote.',
                nextFollowUpDate: null,
                assignedTo: 'u-2',
            },
            {
                followUpType: 'email',
                scheduledAt: future(1),
                completedAt: null,
                status: 'pending',
                outcome: null,
                nextFollowUpDate: null,
                assignedTo: 'u-2',
            },
        ]),
        activity: makeActivity('inq-1002', [
            {
                actionType: 'created',
                oldValue: null,
                newValue: 'New',
                remarks: 'Dealer phone-in.',
                performedBy: 'u-2',
                performedAt: days(9),
            },
            {
                actionType: 'status_changed',
                oldValue: 'New',
                newValue: 'In Progress',
                remarks: null,
                performedBy: 'u-2',
                performedAt: days(8),
            },
            {
                actionType: 'status_changed',
                oldValue: 'In Progress',
                newValue: 'Quoted',
                remarks: 'Quotation Q-2026-0117 issued.',
                performedBy: 'u-2',
                performedAt: days(2),
            },
        ]),
        attachments: makeAttachments('inq-1002', [
            {
                name: 'quote-Q-2026-0117.pdf',
                sizeKb: 188,
                version: 1,
                uploadedBy: 'u-2',
                uploadedAt: days(2),
            },
        ]),
    },
    {
        id: 'inq-1003',
        inquiryNumber: 'INQ-2026-0003',
        sourceId: 's-3',
        customerId: null,
        customerName: 'Imran Sheikh',
        companyName: 'Sheikh Constructions',
        mobile: '+91 90000 12345',
        email: '',
        city: 'Surat',
        state: 'Gujarat',
        projectName: 'Site dewatering rentals',
        projectDescription: 'Required at construction site for monsoon prep.',
        productCategoryId: 'pc-1',
        inquiryType: 'service',
        priority: 'low',
        status: 'lost',
        assignedTo: 'u-4',
        expectedOrderDate: null,
        siteLocation: 'Adajan, Surat',
        budgetRange: '₹50 K',
        sourceReference: '',
        lostReason: 'Client opted for a competitor offering rental at lower daily rate.',
        notes: '',
        createdAt: days(28),
        lineItems: makeLineItems('inq-1003', [
            {
                productDescription: 'Submersible dewatering pump 3 HP',
                category: 'Industrial Pumps',
                quantity: 2,
                unit: 'pcs',
                estimatedValue: 90_000,
            },
        ]),
        followUps: makeFollowUps('inq-1003', [
            {
                followUpType: 'call',
                scheduledAt: days(26),
                completedAt: days(26),
                status: 'completed',
                outcome: 'Client requested rental option, not sale.',
                nextFollowUpDate: null,
                assignedTo: 'u-4',
            },
        ]),
        activity: makeActivity('inq-1003', [
            {
                actionType: 'created',
                oldValue: null,
                newValue: 'New',
                remarks: 'Walk-in at branch.',
                performedBy: 'u-4',
                performedAt: days(28),
            },
            {
                actionType: 'status_changed',
                oldValue: 'New',
                newValue: 'Lost',
                remarks: 'Marked lost: rental price competition.',
                performedBy: 'u-4',
                performedAt: days(20),
            },
        ]),
        attachments: [],
    },
];

/* Lightweight rows ----------------------------------------------------- */

const lightRows: Array<{
    id: string;
    inquiryNumber: string;
    sourceId: string;
    customerName: string;
    companyName: string;
    mobile: string;
    email: string;
    city: string;
    state: string;
    projectName: string;
    productCategoryId: string;
    inquiryType: InquiryType;
    priority: InquiryPriority;
    status: InquiryStatus;
    assignedTo: string;
    daysAgo: number;
    estValue: number;
    lostReason?: string;
}> = [
        { id: 'inq-1004', inquiryNumber: 'INQ-2026-0004', sourceId: 's-2', customerName: 'Anita Verma', companyName: 'Verma Foods', mobile: '+91 98101 22334', email: 'anita@vermafoods.in', city: 'Delhi', state: 'Delhi', projectName: 'Cold storage compressor', productCategoryId: 'pc-3', inquiryType: 'new_project', priority: 'high', status: 'new', assignedTo: 'u-1', daysAgo: 1, estValue: 540_000 },
        { id: 'inq-1005', inquiryNumber: 'INQ-2026-0005', sourceId: 's-4', customerName: 'Rakesh Pillai', companyName: 'Pillai & Co', mobile: '+91 99005 11122', email: 'rakesh@pillaico.in', city: 'Kochi', state: 'Kerala', projectName: 'AMC for utility pumps', productCategoryId: 'pc-7', inquiryType: 'amc', priority: 'medium', status: 'in_progress', assignedTo: 'u-2', daysAgo: 6, estValue: 380_000 },
        { id: 'inq-1006', inquiryNumber: 'INQ-2026-0006', sourceId: 's-5', customerName: 'Nikita Joshi', companyName: 'Joshi Pharma', mobile: '+91 91234 56780', email: 'nikita@joshipharma.in', city: 'Mumbai', state: 'Maharashtra', projectName: 'Cleanroom pipe network', productCategoryId: 'pc-5', inquiryType: 'new_project', priority: 'high', status: 'quoted', assignedTo: 'u-3', daysAgo: 12, estValue: 2_100_000 },
        { id: 'inq-1007', inquiryNumber: 'INQ-2026-0007', sourceId: 's-1', customerName: 'Suresh Kumar', companyName: 'SK Mech Works', mobile: '+91 98886 33321', email: '', city: 'Coimbatore', state: 'Tamil Nadu', projectName: 'Electrical panel retrofit', productCategoryId: 'pc-6', inquiryType: 'spare_parts', priority: 'low', status: 'on_hold', assignedTo: 'u-4', daysAgo: 14, estValue: 75_000 },
        { id: 'inq-1008', inquiryNumber: 'INQ-2026-0008', sourceId: 's-6', customerName: 'Priya Bhatt', companyName: 'Bhatt Energies', mobile: '+91 97770 88665', email: 'priya@bhattenergies.in', city: 'Vadodara', state: 'Gujarat', projectName: 'Solar pump kit', productCategoryId: 'pc-1', inquiryType: 'new_project', priority: 'medium', status: 'converted', assignedTo: 'u-1', daysAgo: 18, estValue: 720_000 },
        { id: 'inq-1009', inquiryNumber: 'INQ-2026-0009', sourceId: 's-7', customerName: 'Vinod Singh', companyName: 'Singh Agro', mobile: '+91 90909 12345', email: 'vinod@singhagro.in', city: 'Lucknow', state: 'Uttar Pradesh', projectName: 'Irrigation pumps – 12 units', productCategoryId: 'pc-1', inquiryType: 'new_project', priority: 'high', status: 'quoted', assignedTo: 'u-2', daysAgo: 8, estValue: 1_350_000 },
        { id: 'inq-1010', inquiryNumber: 'INQ-2026-0010', sourceId: 's-2', customerName: 'Meera Nair', companyName: 'Nair Marine', mobile: '+91 96543 22110', email: 'meera@nairmarine.in', city: 'Mangalore', state: 'Karnataka', projectName: 'Marine grade valves', productCategoryId: 'pc-2', inquiryType: 'spare_parts', priority: 'medium', status: 'in_progress', assignedTo: 'u-4', daysAgo: 5, estValue: 165_000 },
        { id: 'inq-1011', inquiryNumber: 'INQ-2026-0011', sourceId: 's-3', customerName: 'Harish Gupta', companyName: 'Gupta Plastics', mobile: '+91 99887 65544', email: '', city: 'Indore', state: 'Madhya Pradesh', projectName: 'Air compressor 50 HP', productCategoryId: 'pc-3', inquiryType: 'new_project', priority: 'high', status: 'new', assignedTo: 'u-3', daysAgo: 0, estValue: 980_000 },
        { id: 'inq-1012', inquiryNumber: 'INQ-2026-0012', sourceId: 's-1', customerName: 'Lata Iyer', companyName: 'Iyer Brewery', mobile: '+91 98899 77665', email: 'lata@iyerbrew.in', city: 'Bengaluru', state: 'Karnataka', projectName: 'Service contract renewal', productCategoryId: 'pc-7', inquiryType: 'service', priority: 'medium', status: 'in_progress', assignedTo: 'u-2', daysAgo: 11, estValue: 220_000 },
        { id: 'inq-1013', inquiryNumber: 'INQ-2026-0013', sourceId: 's-2', customerName: 'Arvind Menon', companyName: 'Menon Steel', mobile: '+91 90123 45678', email: 'arvind@menonsteel.in', city: 'Trichy', state: 'Tamil Nadu', projectName: 'CNC coolant pumps', productCategoryId: 'pc-1', inquiryType: 'spare_parts', priority: 'low', status: 'lost', assignedTo: 'u-1', daysAgo: 32, estValue: 130_000, lostReason: 'No budget approval this quarter.' },
        { id: 'inq-1014', inquiryNumber: 'INQ-2026-0014', sourceId: 's-4', customerName: 'Sneha Pawar', companyName: 'Pawar Diagnostics', mobile: '+91 91111 22233', email: 'sneha@pawardx.in', city: 'Nashik', state: 'Maharashtra', projectName: 'Vacuum pump for autoclave', productCategoryId: 'pc-1', inquiryType: 'spare_parts', priority: 'medium', status: 'quoted', assignedTo: 'u-2', daysAgo: 4, estValue: 95_000 },
        { id: 'inq-1015', inquiryNumber: 'INQ-2026-0015', sourceId: 's-5', customerName: 'Gopal Rao', companyName: 'Rao Hydraulics', mobile: '+91 92222 33344', email: 'gopal@raohyd.in', city: 'Hyderabad', state: 'Telangana', projectName: 'Hydraulic test bench valves', productCategoryId: 'pc-2', inquiryType: 'new_project', priority: 'high', status: 'in_progress', assignedTo: 'u-3', daysAgo: 6, estValue: 410_000 },
        { id: 'inq-1016', inquiryNumber: 'INQ-2026-0016', sourceId: 's-6', customerName: 'Tara Banerjee', companyName: 'Banerjee Foods', mobile: '+91 93333 44455', email: '', city: 'Kolkata', state: 'West Bengal', projectName: 'Process cooling AMC', productCategoryId: 'pc-7', inquiryType: 'amc', priority: 'low', status: 'on_hold', assignedTo: 'u-4', daysAgo: 22, estValue: 320_000 },
        { id: 'inq-1017', inquiryNumber: 'INQ-2026-0017', sourceId: 's-7', customerName: 'Manoj Desai', companyName: 'Desai Polymers', mobile: '+91 94444 55566', email: 'manoj@desaipoly.in', city: 'Rajkot', state: 'Gujarat', projectName: 'Granulator spares', productCategoryId: 'pc-4', inquiryType: 'spare_parts', priority: 'medium', status: 'converted', assignedTo: 'u-1', daysAgo: 25, estValue: 145_000 },
        { id: 'inq-1018', inquiryNumber: 'INQ-2026-0018', sourceId: 's-2', customerName: 'Ritika Saxena', companyName: 'Saxena Hospitals', mobile: '+91 95555 66677', email: 'ritika@saxenahosp.in', city: 'Jaipur', state: 'Rajasthan', projectName: 'Medical gas piping', productCategoryId: 'pc-5', inquiryType: 'new_project', priority: 'high', status: 'new', assignedTo: 'u-2', daysAgo: 0, estValue: 1_180_000 },
        { id: 'inq-1019', inquiryNumber: 'INQ-2026-0019', sourceId: 's-1', customerName: 'Pranav Joshi', companyName: 'Joshi Auto Parts', mobile: '+91 96666 77788', email: '', city: 'Aurangabad', state: 'Maharashtra', projectName: 'Compressor PM kit', productCategoryId: 'pc-4', inquiryType: 'amc', priority: 'medium', status: 'in_progress', assignedTo: 'u-1', daysAgo: 9, estValue: 86_000 },
        { id: 'inq-1020', inquiryNumber: 'INQ-2026-0020', sourceId: 's-3', customerName: 'Kiran Shetty', companyName: 'Shetty Cement', mobile: '+91 97777 88899', email: 'kiran@shettycement.in', city: 'Hubli', state: 'Karnataka', projectName: 'Slurry pump replacement', productCategoryId: 'pc-1', inquiryType: 'spare_parts', priority: 'high', status: 'quoted', assignedTo: 'u-3', daysAgo: 3, estValue: 285_000 },
        { id: 'inq-1021', inquiryNumber: 'INQ-2026-0021', sourceId: 's-4', customerName: 'Divya Krishnan', companyName: 'Krishnan Tea Estates', mobile: '+91 98765 11000', email: 'divya@kte.in', city: 'Coonoor', state: 'Tamil Nadu', projectName: 'Steam line valves', productCategoryId: 'pc-2', inquiryType: 'new_project', priority: 'medium', status: 'in_progress', assignedTo: 'u-4', daysAgo: 10, estValue: 192_000 },
        { id: 'inq-1022', inquiryNumber: 'INQ-2026-0022', sourceId: 's-5', customerName: 'Yusuf Ali', companyName: 'Ali Marine Services', mobile: '+91 90011 22033', email: '', city: 'Visakhapatnam', state: 'Andhra Pradesh', projectName: 'Bilge pump overhaul', productCategoryId: 'pc-1', inquiryType: 'service', priority: 'low', status: 'lost', assignedTo: 'u-1', daysAgo: 38, estValue: 64_000, lostReason: 'Awarded to OEM service partner.' },
        { id: 'inq-1023', inquiryNumber: 'INQ-2026-0023', sourceId: 's-6', customerName: 'Ananya Roy', companyName: 'Roy Bottlers', mobile: '+91 91122 33044', email: 'ananya@roybottlers.in', city: 'Guwahati', state: 'Assam', projectName: 'Filling line valves', productCategoryId: 'pc-2', inquiryType: 'new_project', priority: 'medium', status: 'new', assignedTo: 'u-2', daysAgo: 2, estValue: 360_000 },
        { id: 'inq-1024', inquiryNumber: 'INQ-2026-0024', sourceId: 's-7', customerName: 'Bhavesh Modi', companyName: 'Modi Chemicals', mobile: '+91 92233 44055', email: 'bhavesh@modichem.in', city: 'Ankleshwar', state: 'Gujarat', projectName: 'Acid handling pumps', productCategoryId: 'pc-1', inquiryType: 'new_project', priority: 'high', status: 'in_progress', assignedTo: 'u-3', daysAgo: 5, estValue: 1_640_000 },
        { id: 'inq-1025', inquiryNumber: 'INQ-2026-0025', sourceId: 's-2', customerName: 'Komal Singh', companyName: 'Singh Press Tools', mobile: '+91 93344 55066', email: 'komal@spt.in', city: 'Faridabad', state: 'Haryana', projectName: 'Press hydraulic spares', productCategoryId: 'pc-4', inquiryType: 'spare_parts', priority: 'medium', status: 'quoted', assignedTo: 'u-1', daysAgo: 7, estValue: 215_000 },
        { id: 'inq-1026', inquiryNumber: 'INQ-2026-0026', sourceId: 's-1', customerName: 'Tarun Agarwal', companyName: 'Agarwal Realty', mobile: '+91 94455 66077', email: 'tarun@agarwalrealty.in', city: 'Noida', state: 'Uttar Pradesh', projectName: 'Building water pumps', productCategoryId: 'pc-1', inquiryType: 'new_project', priority: 'medium', status: 'on_hold', assignedTo: 'u-4', daysAgo: 16, estValue: 470_000 },
        { id: 'inq-1027', inquiryNumber: 'INQ-2026-0027', sourceId: 's-3', customerName: 'Sangeeta Reddy', companyName: 'Reddy Labs', mobile: '+91 95566 77088', email: 'sangeeta@reddylabs.in', city: 'Hyderabad', state: 'Telangana', projectName: 'Lab vacuum pump', productCategoryId: 'pc-1', inquiryType: 'spare_parts', priority: 'low', status: 'converted', assignedTo: 'u-2', daysAgo: 30, estValue: 58_000 },
        { id: 'inq-1028', inquiryNumber: 'INQ-2026-0028', sourceId: 's-4', customerName: 'Farhan Khan', companyName: 'Khan Engineering', mobile: '+91 96677 88099', email: '', city: 'Bhopal', state: 'Madhya Pradesh', projectName: 'AMC for HVAC chillers', productCategoryId: 'pc-7', inquiryType: 'amc', priority: 'medium', status: 'new', assignedTo: 'u-3', daysAgo: 1, estValue: 425_000 },
        { id: 'inq-1029', inquiryNumber: 'INQ-2026-0029', sourceId: 's-5', customerName: 'Ishita Sen', companyName: 'Sen Refractories', mobile: '+91 97788 99000', email: 'ishita@senref.in', city: 'Jamshedpur', state: 'Jharkhand', projectName: 'Pneumatic conveying spares', productCategoryId: 'pc-4', inquiryType: 'other', priority: 'low', status: 'in_progress', assignedTo: 'u-1', daysAgo: 13, estValue: 88_000 },
        { id: 'inq-1030', inquiryNumber: 'INQ-2026-0030', sourceId: 's-6', customerName: 'Devansh Goel', companyName: 'Goel Power', mobile: '+91 98899 00011', email: 'devansh@goelpower.in', city: 'Gurugram', state: 'Haryana', projectName: 'DG set spare panel', productCategoryId: 'pc-6', inquiryType: 'spare_parts', priority: 'high', status: 'quoted', assignedTo: 'u-2', daysAgo: 6, estValue: 312_000 },
        { id: 'inq-1031', inquiryNumber: 'INQ-2026-0031', sourceId: 's-7', customerName: 'Pooja Mishra', companyName: 'Mishra Beverages', mobile: '+91 90011 88822', email: 'pooja@mishrabev.in', city: 'Patna', state: 'Bihar', projectName: 'CIP pump skid', productCategoryId: 'pc-1', inquiryType: 'new_project', priority: 'high', status: 'in_progress', assignedTo: 'u-4', daysAgo: 4, estValue: 905_000 },
        { id: 'inq-1032', inquiryNumber: 'INQ-2026-0032', sourceId: 's-2', customerName: 'Rohit Sinha', companyName: 'Sinha Engineering', mobile: '+91 91122 88833', email: '', city: 'Ranchi', state: 'Jharkhand', projectName: 'Pipe & fittings bulk', productCategoryId: 'pc-5', inquiryType: 'new_project', priority: 'medium', status: 'new', assignedTo: 'u-1', daysAgo: 0, estValue: 175_000 },
    ];

const expandedRows: Inquiry[] = lightRows.map((r) => ({
    id: r.id,
    inquiryNumber: r.inquiryNumber,
    sourceId: r.sourceId,
    customerId: null,
    customerName: r.customerName,
    companyName: r.companyName,
    mobile: r.mobile,
    email: r.email,
    city: r.city,
    state: r.state,
    projectName: r.projectName,
    projectDescription: '',
    productCategoryId: r.productCategoryId,
    inquiryType: r.inquiryType,
    priority: r.priority,
    status: r.status,
    assignedTo: r.assignedTo,
    expectedOrderDate: r.status === 'lost' ? null : future(14),
    siteLocation: `${r.city}, ${r.state}`,
    budgetRange: '',
    sourceReference: '',
    lostReason: r.lostReason ?? null,
    notes: '',
    createdAt: days(r.daysAgo),
    lineItems: makeLineItems(r.id, [
        {
            productDescription: r.projectName,
            quantity: 1,
            unit: 'lot',
            estimatedValue: r.estValue,
        },
    ]),
    followUps: [],
    activity: makeActivity(r.id, [
        {
            actionType: 'created',
            oldValue: null,
            newValue: 'New',
            remarks: null,
            performedBy: r.assignedTo,
            performedAt: days(r.daysAgo),
        },
    ]),
    attachments: [],
}));

export const inquiries: Inquiry[] = [...detailedInquiries, ...expandedRows];

export function inquiryById(id: string): Inquiry | undefined {
    return inquiries.find((i) => i.id === id);
}
