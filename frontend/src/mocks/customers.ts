export type CustomerSegment = 'enterprise' | 'mid_market' | 'sme';
export type CustomerStatus = 'active' | 'inactive' | 'merged';

export interface CustomerAddress {
    id: string;
    line1: string;
    city: string;
    state: string;
    pincode: string;
    type: 'billing' | 'shipping';
}

export interface CustomerContact {
    id: string;
    name: string;
    designation: string;
    phone: string;
    email: string;
    isPrimary: boolean;
}

export interface CustomerActivityEntry {
    id: string;
    type: 'inquiry' | 'quotation' | 'order' | 'job' | 'document' | 'note' | 'merge';
    summary: string;
    at: string;
    actor: string;
    href?: string;
}

export interface Customer {
    id: string;
    name: string;
    legalName?: string;
    gstNumber?: string;
    pan?: string;
    primaryContact: { name: string; phone: string; email: string };
    contacts: CustomerContact[];
    addresses: CustomerAddress[];
    industry?: string;
    territory?: string;
    segment?: CustomerSegment;
    status: CustomerStatus;
    totalOrders: number;
    lifetimeValue: number;
    createdAt: string;
    mergedIntoId?: string | null;
    activity: CustomerActivityEntry[];
}

const today = Date.now();
const iso = (offsetDays: number): string =>
    new Date(today + offsetDays * 86400000).toISOString();

function makeContacts(seed: string, primary: { name: string; phone: string; email: string }): CustomerContact[] {
    return [
        {
            id: `${seed}-c1`,
            name: primary.name,
            designation: 'Procurement Head',
            phone: primary.phone,
            email: primary.email,
            isPrimary: true,
        },
        {
            id: `${seed}-c2`,
            name: 'Site Engineer',
            designation: 'Project Engineer',
            phone: '+91-9' + seed.slice(-2).padEnd(9, '0'),
            email: `engineer.${seed}@example.com`,
            isPrimary: false,
        },
    ];
}

function makeAddresses(seed: string, city: string, state: string): CustomerAddress[] {
    return [
        {
            id: `${seed}-a1`,
            line1: `Plot ${seed.slice(-2)}, Industrial Area`,
            city,
            state,
            pincode: '400001',
            type: 'billing',
        },
        {
            id: `${seed}-a2`,
            line1: `Site Office, ${city} Phase II`,
            city,
            state,
            pincode: '400002',
            type: 'shipping',
        },
    ];
}

function defaultActivity(id: string): CustomerActivityEntry[] {
    return [
        {
            id: `${id}-act-1`,
            type: 'note',
            summary: 'Customer record created',
            at: iso(-180),
            actor: 'System',
        },
    ];
}

export const customers: Customer[] = [
    {
        id: 'cust-001',
        name: 'Rajesh Patel',
        legalName: 'Patel Engineering Ltd.',
        gstNumber: '24AAACP1234A1Z5',
        pan: 'AAACP1234A',
        primaryContact: {
            name: 'Rajesh Patel',
            phone: '+91-9824012345',
            email: 'rajesh@patel-eng.com',
        },
        contacts: makeContacts('cust-001', {
            name: 'Rajesh Patel',
            phone: '+91-9824012345',
            email: 'rajesh@patel-eng.com',
        }),
        addresses: makeAddresses('cust-001', 'Ahmedabad', 'Gujarat'),
        industry: 'Pharmaceuticals',
        territory: 'West',
        segment: 'enterprise',
        status: 'active',
        totalOrders: 12,
        lifetimeValue: 4_82_50_000,
        createdAt: iso(-540),
        activity: defaultActivity('cust-001'),
    },
    {
        id: 'cust-002',
        name: 'Sunita Kapoor',
        legalName: 'GreenTech Industries',
        gstNumber: '27AABCG5678B1Z9',
        pan: 'AABCG5678B',
        primaryContact: {
            name: 'Sunita Kapoor',
            phone: '+91-9876501234',
            email: 'sunita@greentech.in',
        },
        contacts: makeContacts('cust-002', {
            name: 'Sunita Kapoor',
            phone: '+91-9876501234',
            email: 'sunita@greentech.in',
        }),
        addresses: makeAddresses('cust-002', 'Pune', 'Maharashtra'),
        industry: 'Chemicals',
        territory: 'West',
        segment: 'mid_market',
        status: 'active',
        totalOrders: 7,
        lifetimeValue: 1_92_00_000,
        createdAt: iso(-420),
        activity: defaultActivity('cust-002'),
    },
    {
        id: 'cust-003',
        name: 'Anil Sharma',
        legalName: 'Sharma Textiles Pvt Ltd',
        gstNumber: '07AAACS9012C1Z3',
        primaryContact: {
            name: 'Anil Sharma',
            phone: '+91-9811223344',
            email: 'anil@sharmatex.in',
        },
        contacts: makeContacts('cust-003', {
            name: 'Anil Sharma',
            phone: '+91-9811223344',
            email: 'anil@sharmatex.in',
        }),
        addresses: makeAddresses('cust-003', 'Delhi', 'Delhi'),
        industry: 'Textiles',
        territory: 'North',
        segment: 'mid_market',
        status: 'active',
        totalOrders: 5,
        lifetimeValue: 88_00_000,
        createdAt: iso(-360),
        activity: defaultActivity('cust-003'),
    },
    {
        id: 'cust-004',
        name: 'Meera Iyer',
        legalName: 'Coastal Foods',
        gstNumber: '33AABCC1122D1Z7',
        primaryContact: {
            name: 'Meera Iyer',
            phone: '+91-9442011223',
            email: 'meera@coastalfoods.com',
        },
        contacts: makeContacts('cust-004', {
            name: 'Meera Iyer',
            phone: '+91-9442011223',
            email: 'meera@coastalfoods.com',
        }),
        addresses: makeAddresses('cust-004', 'Chennai', 'Tamil Nadu'),
        industry: 'Food & Beverage',
        territory: 'South',
        segment: 'sme',
        status: 'active',
        totalOrders: 3,
        lifetimeValue: 28_50_000,
        createdAt: iso(-280),
        activity: defaultActivity('cust-004'),
    },
    {
        id: 'cust-005',
        name: 'Vikram Singh',
        legalName: 'Singh Auto Components',
        gstNumber: '06AAACV3344E1Z1',
        primaryContact: {
            name: 'Vikram Singh',
            phone: '+91-9988776655',
            email: 'vikram@singhauto.in',
        },
        contacts: makeContacts('cust-005', {
            name: 'Vikram Singh',
            phone: '+91-9988776655',
            email: 'vikram@singhauto.in',
        }),
        addresses: makeAddresses('cust-005', 'Gurgaon', 'Haryana'),
        industry: 'Automotive',
        territory: 'North',
        segment: 'enterprise',
        status: 'active',
        totalOrders: 18,
        lifetimeValue: 6_14_00_000,
        createdAt: iso(-720),
        activity: defaultActivity('cust-005'),
    },
    {
        id: 'cust-006',
        name: 'Rajesh Patel',
        legalName: 'Patel Engg Limited',
        gstNumber: '24AAACP1234A1Z5',
        primaryContact: {
            name: 'Rajesh Patel',
            phone: '+91-9824012345',
            email: 'rajesh.patel@patel-eng.com',
        },
        contacts: makeContacts('cust-006', {
            name: 'Rajesh Patel',
            phone: '+91-9824012345',
            email: 'rajesh.patel@patel-eng.com',
        }),
        addresses: makeAddresses('cust-006', 'Ahmedabad', 'Gujarat'),
        industry: 'Pharmaceuticals',
        territory: 'West',
        segment: 'enterprise',
        status: 'active',
        totalOrders: 1,
        lifetimeValue: 18_00_000,
        createdAt: iso(-90),
        activity: defaultActivity('cust-006'),
    },
    {
        id: 'cust-007',
        name: 'Priya Nair',
        legalName: 'Nair Agro Industries',
        gstNumber: '32AAACN5566F1Z9',
        primaryContact: {
            name: 'Priya Nair',
            phone: '+91-9876123456',
            email: 'priya@nairagro.in',
        },
        contacts: makeContacts('cust-007', {
            name: 'Priya Nair',
            phone: '+91-9876123456',
            email: 'priya@nairagro.in',
        }),
        addresses: makeAddresses('cust-007', 'Kochi', 'Kerala'),
        industry: 'Agriculture',
        territory: 'South',
        segment: 'sme',
        status: 'active',
        totalOrders: 2,
        lifetimeValue: 14_25_000,
        createdAt: iso(-150),
        activity: defaultActivity('cust-007'),
    },
    {
        id: 'cust-008',
        name: 'Arjun Reddy',
        legalName: 'Reddy Constructions',
        gstNumber: '36AAACR7788G1Z2',
        primaryContact: {
            name: 'Arjun Reddy',
            phone: '+91-9000112233',
            email: 'arjun@reddyconst.com',
        },
        contacts: makeContacts('cust-008', {
            name: 'Arjun Reddy',
            phone: '+91-9000112233',
            email: 'arjun@reddyconst.com',
        }),
        addresses: makeAddresses('cust-008', 'Hyderabad', 'Telangana'),
        industry: 'Construction',
        territory: 'South',
        segment: 'mid_market',
        status: 'active',
        totalOrders: 9,
        lifetimeValue: 2_45_00_000,
        createdAt: iso(-380),
        activity: defaultActivity('cust-008'),
    },
    {
        id: 'cust-009',
        name: 'Neha Joshi',
        legalName: 'Joshi Pharma Pvt Ltd',
        gstNumber: '27AAACJ9900H1Z5',
        primaryContact: {
            name: 'Neha Joshi',
            phone: '+91-9765432100',
            email: 'neha@joshipharma.com',
        },
        contacts: makeContacts('cust-009', {
            name: 'Neha Joshi',
            phone: '+91-9765432100',
            email: 'neha@joshipharma.com',
        }),
        addresses: makeAddresses('cust-009', 'Mumbai', 'Maharashtra'),
        industry: 'Pharmaceuticals',
        territory: 'West',
        segment: 'enterprise',
        status: 'active',
        totalOrders: 14,
        lifetimeValue: 5_20_50_000,
        createdAt: iso(-600),
        activity: defaultActivity('cust-009'),
    },
    {
        id: 'cust-010',
        name: 'Karthik Menon',
        legalName: 'Menon Engineering Works',
        gstNumber: '32AAACM1234I1Z6',
        primaryContact: {
            name: 'Karthik Menon',
            phone: '+91-9847123456',
            email: 'karthik@menoneng.com',
        },
        contacts: makeContacts('cust-010', {
            name: 'Karthik Menon',
            phone: '+91-9847123456',
            email: 'karthik@menoneng.com',
        }),
        addresses: makeAddresses('cust-010', 'Trivandrum', 'Kerala'),
        industry: 'Engineering',
        territory: 'South',
        segment: 'sme',
        status: 'active',
        totalOrders: 4,
        lifetimeValue: 62_00_000,
        createdAt: iso(-220),
        activity: defaultActivity('cust-010'),
    },
    {
        id: 'cust-011',
        name: 'Sandeep Verma',
        legalName: 'Verma Industries',
        gstNumber: '09AAACV5566J1Z2',
        primaryContact: {
            name: 'Sandeep Verma',
            phone: '+91-9990001122',
            email: 'sandeep@vermaind.com',
        },
        contacts: makeContacts('cust-011', {
            name: 'Sandeep Verma',
            phone: '+91-9990001122',
            email: 'sandeep@vermaind.com',
        }),
        addresses: makeAddresses('cust-011', 'Lucknow', 'Uttar Pradesh'),
        industry: 'Manufacturing',
        territory: 'North',
        segment: 'mid_market',
        status: 'inactive',
        totalOrders: 0,
        lifetimeValue: 0,
        createdAt: iso(-700),
        activity: defaultActivity('cust-011'),
    },
    {
        id: 'cust-012',
        name: 'Kavita Bose',
        legalName: 'Bose Power Solutions',
        gstNumber: '19AAACB7788K1Z4',
        primaryContact: {
            name: 'Kavita Bose',
            phone: '+91-9831122334',
            email: 'kavita@bosepower.in',
        },
        contacts: makeContacts('cust-012', {
            name: 'Kavita Bose',
            phone: '+91-9831122334',
            email: 'kavita@bosepower.in',
        }),
        addresses: makeAddresses('cust-012', 'Kolkata', 'West Bengal'),
        industry: 'Energy',
        territory: 'East',
        segment: 'mid_market',
        status: 'active',
        totalOrders: 6,
        lifetimeValue: 1_15_00_000,
        createdAt: iso(-310),
        activity: defaultActivity('cust-012'),
    },
];

export function customerById(id: string): Customer | undefined {
    return customers.find((c) => c.id === id);
}

export function searchCustomers(q: string): Customer[] {
    const t = q.trim().toLowerCase();
    if (!t) return customers;
    return customers.filter((c) => {
        const hay = [
            c.name,
            c.legalName ?? '',
            c.gstNumber ?? '',
            c.pan ?? '',
            c.primaryContact.phone,
            c.primaryContact.email,
            c.industry ?? '',
            c.territory ?? '',
        ]
            .join(' ')
            .toLowerCase();
        return hay.includes(t);
    });
}

export interface DuplicateProbe {
    mobile?: string;
    email?: string;
    gst?: string;
    excludeId?: string;
}

export function findDuplicates(probe: DuplicateProbe): Customer[] {
    const m = probe.mobile?.replace(/\D/g, '').slice(-10);
    const e = probe.email?.trim().toLowerCase();
    const g = probe.gst?.trim().toUpperCase();
    return customers.filter((c) => {
        if (probe.excludeId && c.id === probe.excludeId) return false;
        if (c.status === 'merged') return false;
        const cMob = c.primaryContact.phone.replace(/\D/g, '').slice(-10);
        const cEmail = c.primaryContact.email.toLowerCase();
        const cGst = (c.gstNumber ?? '').toUpperCase();
        return (
            (!!m && cMob === m) ||
            (!!e && cEmail === e) ||
            (!!g && !!cGst && cGst === g)
        );
    });
}

export interface MergeFieldChoices {
    name: 'source' | 'target';
    legalName: 'source' | 'target';
    gstNumber: 'source' | 'target';
    pan: 'source' | 'target';
    primaryContact: 'source' | 'target';
    industry: 'source' | 'target';
    territory: 'source' | 'target';
    segment: 'source' | 'target';
    contacts: 'source' | 'target' | 'both';
    addresses: 'source' | 'target' | 'both';
}

export const DEFAULT_MERGE_CHOICES: MergeFieldChoices = {
    name: 'target',
    legalName: 'target',
    gstNumber: 'target',
    pan: 'target',
    primaryContact: 'target',
    industry: 'target',
    territory: 'target',
    segment: 'target',
    contacts: 'both',
    addresses: 'both',
};

export interface MergePreview {
    conflicts: Array<{
        field: keyof MergeFieldChoices;
        label: string;
        sourceValue: string;
        targetValue: string;
        multi?: boolean;
    }>;
    impact: {
        inquiries: number;
        quotations: number;
        orders: number;
        jobs: number;
        documents: number;
    };
}

export function previewMerge(sourceId: string, targetId: string): MergePreview {
    const s = customerById(sourceId);
    const t = customerById(targetId);
    if (!s || !t) {
        return {
            conflicts: [],
            impact: { inquiries: 0, quotations: 0, orders: 0, jobs: 0, documents: 0 },
        };
    }
    const conflicts: MergePreview['conflicts'] = [];
    const fieldDefs: Array<{
        field: keyof MergeFieldChoices;
        label: string;
        get: (c: Customer) => string;
        multi?: boolean;
    }> = [
        { field: 'name', label: 'Display name', get: (c) => c.name },
        { field: 'legalName', label: 'Legal name', get: (c) => c.legalName ?? '' },
        { field: 'gstNumber', label: 'GST number', get: (c) => c.gstNumber ?? '' },
        { field: 'pan', label: 'PAN', get: (c) => c.pan ?? '' },
        {
            field: 'primaryContact',
            label: 'Primary contact',
            get: (c) => `${c.primaryContact.name} · ${c.primaryContact.phone}`,
        },
        { field: 'industry', label: 'Industry', get: (c) => c.industry ?? '' },
        { field: 'territory', label: 'Territory', get: (c) => c.territory ?? '' },
        { field: 'segment', label: 'Segment', get: (c) => c.segment ?? '' },
        {
            field: 'contacts',
            label: 'Contacts',
            get: (c) => `${c.contacts.length} contact(s)`,
            multi: true,
        },
        {
            field: 'addresses',
            label: 'Addresses',
            get: (c) => `${c.addresses.length} address(es)`,
            multi: true,
        },
    ];
    for (const f of fieldDefs) {
        const sv = f.get(s);
        const tv = f.get(t);
        if (sv !== tv && (sv || tv)) {
            conflicts.push({
                field: f.field,
                label: f.label,
                sourceValue: sv || '—',
                targetValue: tv || '—',
                multi: f.multi,
            });
        }
    }
    return {
        conflicts,
        impact: {
            inquiries: s.totalOrders, // proxy counts in mock
            quotations: Math.max(1, Math.floor(s.totalOrders * 1.4)),
            orders: s.totalOrders,
            jobs: Math.floor(s.totalOrders * 0.6),
            documents: Math.max(1, s.totalOrders * 2),
        },
    };
}

export function mergeCustomers(
    sourceId: string,
    targetId: string,
    choices: MergeFieldChoices,
): Customer | null {
    const s = customerById(sourceId);
    const t = customerById(targetId);
    if (!s || !t) return null;
    if (s.status === 'merged' || t.status === 'merged') return null;

    function pick<K extends keyof Customer>(key: K, side: 'source' | 'target'): Customer[K] {
        return (side === 'source' ? s![key] : t![key]) as Customer[K];
    }

    t.name = pick('name', choices.name) as string;
    t.legalName = pick('legalName', choices.legalName) as string | undefined;
    t.gstNumber = pick('gstNumber', choices.gstNumber) as string | undefined;
    t.pan = pick('pan', choices.pan) as string | undefined;
    t.primaryContact = pick('primaryContact', choices.primaryContact) as Customer['primaryContact'];
    t.industry = pick('industry', choices.industry) as string | undefined;
    t.territory = pick('territory', choices.territory) as string | undefined;
    t.segment = pick('segment', choices.segment) as CustomerSegment | undefined;

    if (choices.contacts === 'both') {
        const seen = new Set(t.contacts.map((c) => c.email + c.phone));
        for (const c of s.contacts) {
            const k = c.email + c.phone;
            if (!seen.has(k)) {
                t.contacts.push({ ...c, isPrimary: false });
                seen.add(k);
            }
        }
    } else if (choices.contacts === 'source') {
        t.contacts = s.contacts.map((c) => ({ ...c }));
    }

    if (choices.addresses === 'both') {
        const seen = new Set(t.addresses.map((a) => a.line1 + a.pincode));
        for (const a of s.addresses) {
            const k = a.line1 + a.pincode;
            if (!seen.has(k)) {
                t.addresses.push({ ...a });
                seen.add(k);
            }
        }
    } else if (choices.addresses === 'source') {
        t.addresses = s.addresses.map((a) => ({ ...a }));
    }

    t.totalOrders += s.totalOrders;
    t.lifetimeValue += s.lifetimeValue;

    const mergeStamp = new Date().toISOString();
    t.activity.unshift({
        id: `${t.id}-merge-${Date.now()}`,
        type: 'merge',
        summary: `Merged customer "${s.name}" (${s.id}) into this record`,
        at: mergeStamp,
        actor: 'You',
    });

    s.status = 'merged';
    s.mergedIntoId = t.id;
    s.activity.unshift({
        id: `${s.id}-merge-${Date.now()}`,
        type: 'merge',
        summary: `Merged into "${t.name}" (${t.id})`,
        at: mergeStamp,
        actor: 'You',
    });

    return t;
}
