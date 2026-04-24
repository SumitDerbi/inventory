import type { QuotationStatus } from '@/lib/quotationStatus';

export interface QuotationLineItem {
    id: string;
    productId: string;
    description: string;
    specNotes: string;
    quantity: number;
    uom: string;
    listPrice: number;
    discountPercent: number;
    taxRate: number;
}

export interface QuotationApprovalStep {
    id: string;
    order: number;
    approverId: string; // userId
    role: string;
    status: 'pending' | 'approved' | 'rejected' | 'waiting';
    remark: string | null;
    actedAt: string | null;
}

export interface QuotationCommunication {
    id: string;
    type: 'email_sent' | 'email_received' | 'acknowledgement' | 'revision_request' | 'call_note';
    subject: string;
    body: string;
    fromName: string;
    toName: string;
    at: string;
}

export interface QuotationVersion {
    version: number;
    createdAt: string;
    createdBy: string; // userId
    status: QuotationStatus;
    validUntil: string; // ISO date
    paymentTerms: string;
    deliveryPeriod: string;
    warranty: string;
    freight: number;
    installationCharge: number;
    termsTemplateId: string;
    termsBody: string;
    lineItems: QuotationLineItem[];
    approvals: QuotationApprovalStep[];
    communications: QuotationCommunication[];
    changesSummary: string; // diff vs previous version
}

export interface Quotation {
    id: string;
    quotationNumber: string;
    inquiryId: string | null;
    customerName: string;
    companyName: string;
    projectName: string;
    ownerId: string;
    createdAt: string;
    currentVersion: number;
    versions: QuotationVersion[];
}

const today = Date.now();
const iso = (offsetDays: number): string =>
    new Date(today + offsetDays * 86400000).toISOString();

/* ---------- Detailed Q-2026-001 (3 versions, converted) ---------- */

const q001: Quotation = {
    id: 'qt-001',
    quotationNumber: 'Q-2026-001',
    inquiryId: 'inq-1001',
    customerName: 'Rajesh Patel',
    companyName: 'Patel Engineering Ltd.',
    projectName: 'ETP Phase II — Ahmedabad',
    ownerId: 'u-2',
    createdAt: iso(-48),
    currentVersion: 3,
    versions: [
        {
            version: 1,
            createdAt: iso(-48),
            createdBy: 'u-2',
            status: 'sent',
            validUntil: iso(-18),
            paymentTerms: '30% advance, 60% before dispatch, 10% post-installation',
            deliveryPeriod: '6 weeks from PO',
            warranty: '12 months from commissioning',
            freight: 35000,
            installationCharge: 85000,
            termsTemplateId: 'tpl-standard',
            termsBody: 'Initial draft — see version 3 for final.',
            lineItems: [
                { id: 'li-001-1-a', productId: 'p-2', description: 'Centrifugal Pump 7.5 HP', specNotes: 'CI body, 415V', quantity: 4, uom: 'pcs', listPrice: 62800, discountPercent: 0, taxRate: 18 },
                { id: 'li-001-1-b', productId: 'p-13', description: 'VFD Drive 15 HP', specNotes: '', quantity: 2, uom: 'pcs', listPrice: 46500, discountPercent: 0, taxRate: 18 },
                { id: 'li-001-1-c', productId: 'p-15', description: 'Sand Filter 24" Dia', specNotes: 'with MPV', quantity: 2, uom: 'pcs', listPrice: 54200, discountPercent: 0, taxRate: 18 },
            ],
            approvals: [
                { id: 'ap-001-1-a', order: 1, approverId: 'u-3', role: 'Sales Manager', status: 'approved', remark: 'Pricing in line.', actedAt: iso(-47) },
            ],
            communications: [
                { id: 'co-001-1-a', type: 'email_sent', subject: 'Quotation Q-2026-001 v1 — ETP Phase II', body: 'Please find attached our initial quotation for the pumps, VFDs and sand filters.', fromName: 'Diya Kapoor', toName: 'Rajesh Patel', at: iso(-46) },
                { id: 'co-001-1-b', type: 'revision_request', subject: 'Request: 5% discount + revised freight', body: 'Client requested 5% discount and freight on FOB site basis.', fromName: 'Rajesh Patel', toName: 'Diya Kapoor', at: iso(-40) },
            ],
            changesSummary: 'Initial version.',
        },
        {
            version: 2,
            createdAt: iso(-38),
            createdBy: 'u-2',
            status: 'sent',
            validUntil: iso(-8),
            paymentTerms: '30% advance, 60% before dispatch, 10% post-installation',
            deliveryPeriod: '6 weeks from PO',
            warranty: '12 months from commissioning',
            freight: 28000,
            installationCharge: 85000,
            termsTemplateId: 'tpl-standard',
            termsBody: 'Revised after client feedback — see version 3 for final.',
            lineItems: [
                { id: 'li-001-2-a', productId: 'p-2', description: 'Centrifugal Pump 7.5 HP', specNotes: 'CI body, 415V', quantity: 4, uom: 'pcs', listPrice: 62800, discountPercent: 5, taxRate: 18 },
                { id: 'li-001-2-b', productId: 'p-13', description: 'VFD Drive 15 HP', specNotes: '', quantity: 2, uom: 'pcs', listPrice: 46500, discountPercent: 5, taxRate: 18 },
                { id: 'li-001-2-c', productId: 'p-15', description: 'Sand Filter 24" Dia', specNotes: 'with MPV', quantity: 2, uom: 'pcs', listPrice: 54200, discountPercent: 5, taxRate: 18 },
            ],
            approvals: [
                { id: 'ap-001-2-a', order: 1, approverId: 'u-3', role: 'Sales Manager', status: 'approved', remark: 'Discount within delegated limits.', actedAt: iso(-37) },
            ],
            communications: [
                { id: 'co-001-2-a', type: 'email_sent', subject: 'Quotation Q-2026-001 v2 — revised', body: 'Updated with 5% discount and freight on FOB site basis as discussed.', fromName: 'Diya Kapoor', toName: 'Rajesh Patel', at: iso(-37) },
                { id: 'co-001-2-b', type: 'revision_request', subject: 'Add carbon filter; drop one VFD', body: 'Please add 1 × carbon filter and revise VFDs to 1 no.', fromName: 'Rajesh Patel', toName: 'Diya Kapoor', at: iso(-30) },
            ],
            changesSummary: '3 price rows updated (+5% discount); freight −7,000.',
        },
        {
            version: 3,
            createdAt: iso(-28),
            createdBy: 'u-2',
            status: 'converted',
            validUntil: iso(2),
            paymentTerms: '30% advance, 60% before dispatch, 10% post-installation',
            deliveryPeriod: '6 weeks from PO',
            warranty: '12 months from commissioning',
            freight: 28000,
            installationCharge: 85000,
            termsTemplateId: 'tpl-turnkey',
            termsBody: 'Turnkey project terms — supply, installation, commissioning.',
            lineItems: [
                { id: 'li-001-3-a', productId: 'p-2', description: 'Centrifugal Pump 7.5 HP', specNotes: 'CI body, 415V', quantity: 4, uom: 'pcs', listPrice: 62800, discountPercent: 5, taxRate: 18 },
                { id: 'li-001-3-b', productId: 'p-13', description: 'VFD Drive 15 HP', specNotes: '', quantity: 1, uom: 'pcs', listPrice: 46500, discountPercent: 5, taxRate: 18 },
                { id: 'li-001-3-c', productId: 'p-15', description: 'Sand Filter 24" Dia', specNotes: 'with MPV', quantity: 2, uom: 'pcs', listPrice: 54200, discountPercent: 5, taxRate: 18 },
                { id: 'li-001-3-d', productId: 'p-16', description: 'Carbon Filter 24" Dia', specNotes: 'with MPV', quantity: 1, uom: 'pcs', listPrice: 58900, discountPercent: 5, taxRate: 18 },
                { id: 'li-001-3-e', productId: 'p-20', description: 'Commissioning & Training', specNotes: 'lump sum', quantity: 1, uom: 'lot', listPrice: 25000, discountPercent: 0, taxRate: 18 },
            ],
            approvals: [
                { id: 'ap-001-3-a', order: 1, approverId: 'u-3', role: 'Sales Manager', status: 'approved', remark: 'Final scope agreed.', actedAt: iso(-27) },
                { id: 'ap-001-3-b', order: 2, approverId: 'u-1', role: 'Director', status: 'approved', remark: 'Approved for issue.', actedAt: iso(-26) },
            ],
            communications: [
                { id: 'co-001-3-a', type: 'email_sent', subject: 'Quotation Q-2026-001 v3 — final', body: 'Final quotation with revised scope. Please revert with your PO.', fromName: 'Diya Kapoor', toName: 'Rajesh Patel', at: iso(-26) },
                { id: 'co-001-3-b', type: 'acknowledgement', subject: 'PO issued — PatEng/PO/2026/0041', body: 'PO attached; please proceed with dispatch planning.', fromName: 'Rajesh Patel', toName: 'Diya Kapoor', at: iso(-20) },
            ],
            changesSummary: 'Added carbon filter + commissioning; reduced VFD qty 2→1.',
        },
    ],
};

/* ---------- Detailed Q-2026-002 (pending approval) ---------- */

const q002: Quotation = {
    id: 'qt-002',
    quotationNumber: 'Q-2026-002',
    inquiryId: 'inq-1002',
    customerName: 'Meera Shah',
    companyName: 'Sunrise Textiles',
    projectName: 'Boiler pump replacement',
    ownerId: 'u-4',
    createdAt: iso(-7),
    currentVersion: 1,
    versions: [
        {
            version: 1,
            createdAt: iso(-7),
            createdBy: 'u-4',
            status: 'pending_approval',
            validUntil: iso(23),
            paymentTerms: '50% advance, 50% before dispatch',
            deliveryPeriod: '3 weeks from PO',
            warranty: '12 months',
            freight: 12000,
            installationCharge: 18000,
            termsTemplateId: 'tpl-standard',
            termsBody: 'Standard commercial terms apply.',
            lineItems: [
                { id: 'li-002-1-a', productId: 'p-3', description: 'Submersible Pump 5 HP', specNotes: 'SS 304 body', quantity: 2, uom: 'pcs', listPrice: 71200, discountPercent: 3, taxRate: 18 },
                { id: 'li-002-1-b', productId: 'p-14', description: 'Starter Panel 50 A', specNotes: 'DOL', quantity: 2, uom: 'pcs', listPrice: 28800, discountPercent: 0, taxRate: 18 },
                { id: 'li-002-1-c', productId: 'p-19', description: 'Installation Labour (Day)', specNotes: '', quantity: 3, uom: 'day', listPrice: 4200, discountPercent: 0, taxRate: 18 },
            ],
            approvals: [
                { id: 'ap-002-1-a', order: 1, approverId: 'u-3', role: 'Sales Manager', status: 'pending', remark: null, actedAt: null },
                { id: 'ap-002-1-b', order: 2, approverId: 'u-1', role: 'Director', status: 'waiting', remark: null, actedAt: null },
            ],
            communications: [],
            changesSummary: 'Initial version.',
        },
    ],
};

/* ---------- Light rows (status/version coverage) ---------- */

interface LightSpec {
    id: string;
    no: string;
    customer: string;
    company: string;
    project: string;
    owner: string;
    status: QuotationStatus;
    versions: number;
    dayOffset: number;
    amountMid: number; // approx total used to pick a product set
}

const lightSpecs: LightSpec[] = [
    { id: 'qt-003', no: 'Q-2026-003', customer: 'Arjun Sheikh', company: 'Sheikh Constructions', project: 'Warehouse WTP', owner: 'u-2', status: 'rejected', versions: 2, dayOffset: -30, amountMid: 450000 },
    { id: 'qt-004', no: 'Q-2026-004', customer: 'Kavya Nair', company: 'Nair Dairy Farms', project: 'Chilling plant pumps', owner: 'u-4', status: 'approved', versions: 1, dayOffset: -4, amountMid: 320000 },
    { id: 'qt-005', no: 'Q-2026-005', customer: 'Rohit Desai', company: 'Desai Chemicals', project: 'Acid transfer pumps', owner: 'u-2', status: 'draft', versions: 1, dayOffset: -2, amountMid: 180000 },
    { id: 'qt-006', no: 'Q-2026-006', customer: 'Ishita Rao', company: 'Rao Municipal', project: 'STP upgrade', owner: 'u-3', status: 'sent', versions: 2, dayOffset: -12, amountMid: 720000 },
    { id: 'qt-007', no: 'Q-2026-007', customer: 'Manoj Verma', company: 'Verma Builders', project: 'High-rise plumbing', owner: 'u-4', status: 'revision_requested', versions: 1, dayOffset: -5, amountMid: 260000 },
    { id: 'qt-008', no: 'Q-2026-008', customer: 'Aditi Kulkarni', company: 'Kulkarni Hospitals', project: 'RO water system', owner: 'u-2', status: 'expired', versions: 1, dayOffset: -75, amountMid: 215000 },
    { id: 'qt-009', no: 'Q-2026-009', customer: 'Varun Menon', company: 'Menon Foods', project: 'Boiler feedwater', owner: 'u-4', status: 'sent', versions: 1, dayOffset: -15, amountMid: 145000 },
    { id: 'qt-010', no: 'Q-2026-010', customer: 'Priya Jain', company: 'Jain Paper Mills', project: 'Cooling tower pumps', owner: 'u-2', status: 'pending_approval', versions: 1, dayOffset: -3, amountMid: 540000 },
    { id: 'qt-011', no: 'Q-2026-011', customer: 'Sahil Khan', company: 'Khan Infra', project: 'Tunnel dewatering', owner: 'u-3', status: 'converted', versions: 2, dayOffset: -55, amountMid: 890000 },
    { id: 'qt-012', no: 'Q-2026-012', customer: 'Neha Agarwal', company: 'Agarwal Hotels', project: 'Laundry utility', owner: 'u-4', status: 'draft', versions: 1, dayOffset: -1, amountMid: 95000 },
    { id: 'qt-013', no: 'Q-2026-013', customer: 'Kunal Roy', company: 'Roy Pharma', project: 'DM water plant', owner: 'u-2', status: 'approved', versions: 2, dayOffset: -10, amountMid: 430000 },
    { id: 'qt-014', no: 'Q-2026-014', customer: 'Sneha Gupta', company: 'Gupta Textiles', project: 'Dye-house effluent', owner: 'u-4', status: 'sent', versions: 1, dayOffset: -20, amountMid: 380000 },
    { id: 'qt-015', no: 'Q-2026-015', customer: 'Tanya Bhat', company: 'Bhat Beverages', project: 'CIP system', owner: 'u-3', status: 'expired', versions: 2, dayOffset: -92, amountMid: 310000 },
    { id: 'qt-016', no: 'Q-2026-016', customer: 'Rahul Pillai', company: 'Pillai Realty', project: 'STP commissioning', owner: 'u-2', status: 'converted', versions: 1, dayOffset: -38, amountMid: 275000 },
    { id: 'qt-017', no: 'Q-2026-017', customer: 'Ananya Das', company: 'Das Engineering', project: 'AMC + spares', owner: 'u-4', status: 'rejected', versions: 1, dayOffset: -22, amountMid: 62000 },
    { id: 'qt-018', no: 'Q-2026-018', customer: 'Vivek Joshi', company: 'Joshi Constructions', project: 'Tank farm piping', owner: 'u-2', status: 'draft', versions: 1, dayOffset: 0, amountMid: 165000 },
    { id: 'qt-019', no: 'Q-2026-019', customer: 'Pooja Iyer', company: 'Iyer Hospitality', project: 'Resort water system', owner: 'u-4', status: 'pending_approval', versions: 1, dayOffset: -2, amountMid: 228000 },
    { id: 'qt-020', no: 'Q-2026-020', customer: 'Arnav Malhotra', company: 'Malhotra Industries', project: 'Boiler pumps retrofit', owner: 'u-3', status: 'sent', versions: 2, dayOffset: -18, amountMid: 495000 },
];

function productSetFor(amountMid: number): Array<{ productId: string; qty: number; uom: string; list: number; tax: number }> {
    // Cheap: one or two rows that roughly sum to amountMid.
    if (amountMid < 150000) {
        return [
            { productId: 'p-6', qty: 6, uom: 'pcs', list: 8400, tax: 18 },
            { productId: 'p-10', qty: 12, uom: 'nos', list: 3100, tax: 18 },
        ];
    }
    if (amountMid < 300000) {
        return [
            { productId: 'p-4', qty: 2, uom: 'pcs', list: 58600, tax: 18 },
            { productId: 'p-14', qty: 2, uom: 'pcs', list: 28800, tax: 18 },
            { productId: 'p-19', qty: 5, uom: 'day', list: 4200, tax: 18 },
        ];
    }
    if (amountMid < 500000) {
        return [
            { productId: 'p-1', qty: 4, uom: 'pcs', list: 48500, tax: 18 },
            { productId: 'p-13', qty: 2, uom: 'pcs', list: 46500, tax: 18 },
            { productId: 'p-15', qty: 1, uom: 'pcs', list: 54200, tax: 18 },
            { productId: 'p-20', qty: 1, uom: 'lot', list: 25000, tax: 18 },
        ];
    }
    return [
        { productId: 'p-3', qty: 4, uom: 'pcs', list: 71200, tax: 18 },
        { productId: 'p-13', qty: 3, uom: 'pcs', list: 46500, tax: 18 },
        { productId: 'p-15', qty: 2, uom: 'pcs', list: 54200, tax: 18 },
        { productId: 'p-16', qty: 1, uom: 'pcs', list: 58900, tax: 18 },
        { productId: 'p-20', qty: 1, uom: 'lot', list: 25000, tax: 18 },
    ];
}

function buildLight(spec: LightSpec): Quotation {
    const { id, no, customer, company, project, owner, status, versions, dayOffset, amountMid } = spec;
    const items = productSetFor(amountMid).map((x, i) => ({
        id: `${id}-li-${i + 1}`,
        productId: x.productId,
        description: '',
        specNotes: '',
        quantity: x.qty,
        uom: x.uom,
        listPrice: x.list,
        discountPercent: 0,
        taxRate: x.tax,
    }));

    const vers: QuotationVersion[] = [];
    for (let v = 1; v <= versions; v++) {
        const isCurrent = v === versions;
        const vStatus: QuotationStatus = isCurrent ? status : 'sent';
        vers.push({
            version: v,
            createdAt: iso(dayOffset - (versions - v) * 5),
            createdBy: owner,
            status: vStatus,
            validUntil: iso(dayOffset + 30),
            paymentTerms: '30% advance, 70% before dispatch',
            deliveryPeriod: '4 weeks from PO',
            warranty: '12 months from commissioning',
            freight: Math.round(amountMid * 0.05),
            installationCharge: Math.round(amountMid * 0.08),
            termsTemplateId: 'tpl-standard',
            termsBody: 'Standard commercial terms apply.',
            lineItems: items.map((li) => ({ ...li, id: `${id}-v${v}-${li.id}` })),
            approvals:
                vStatus === 'pending_approval'
                    ? [
                        { id: `${id}-ap-${v}-1`, order: 1, approverId: 'u-3', role: 'Sales Manager', status: 'pending', remark: null, actedAt: null },
                    ]
                    : vStatus === 'approved' || vStatus === 'sent' || vStatus === 'converted'
                        ? [
                            { id: `${id}-ap-${v}-1`, order: 1, approverId: 'u-3', role: 'Sales Manager', status: 'approved', remark: 'OK.', actedAt: iso(dayOffset + 1) },
                        ]
                        : vStatus === 'rejected'
                            ? [
                                { id: `${id}-ap-${v}-1`, order: 1, approverId: 'u-3', role: 'Sales Manager', status: 'rejected', remark: 'Pricing too high.', actedAt: iso(dayOffset + 1) },
                            ]
                            : [],
            communications:
                vStatus === 'sent' || vStatus === 'converted'
                    ? [
                        {
                            id: `${id}-co-${v}-1`,
                            type: 'email_sent',
                            subject: `${no} — ${project}`,
                            body: 'Please find attached our quotation for your review.',
                            fromName: 'Diya Kapoor',
                            toName: customer,
                            at: iso(dayOffset + 2),
                        },
                    ]
                    : [],
            changesSummary: v === 1 ? 'Initial version.' : 'Pricing revised per client feedback.',
        });
    }

    return {
        id,
        quotationNumber: no,
        inquiryId: null,
        customerName: customer,
        companyName: company,
        projectName: project,
        ownerId: owner,
        createdAt: iso(dayOffset),
        currentVersion: versions,
        versions: vers,
    };
}

export const quotations: Quotation[] = [q001, q002, ...lightSpecs.map(buildLight)];

export function quotationById(id: string): Quotation | undefined {
    return quotations.find((q) => q.id === id);
}

export function currentVersion(q: Quotation): QuotationVersion {
    return q.versions.find((v) => v.version === q.currentVersion) ?? q.versions[q.versions.length - 1];
}

export interface LineTotals {
    netPrice: number; // after discount, before tax
    taxAmount: number;
    total: number; // net + tax
    subtotal: number; // listPrice × qty (before discount)
}

export function lineTotals(li: QuotationLineItem): LineTotals {
    const subtotal = li.listPrice * li.quantity;
    const discountAmount = subtotal * (li.discountPercent / 100);
    const netPrice = subtotal - discountAmount;
    const taxAmount = netPrice * (li.taxRate / 100);
    return { subtotal, netPrice, taxAmount, total: netPrice + taxAmount };
}

export interface QuotationTotals {
    subtotal: number;
    discount: number;
    net: number;
    tax: number;
    freight: number;
    installation: number;
    grandTotal: number;
}

export function versionTotals(v: QuotationVersion): QuotationTotals {
    let subtotal = 0;
    let discount = 0;
    let tax = 0;
    for (const li of v.lineItems) {
        const t = lineTotals(li);
        subtotal += t.subtotal;
        discount += t.subtotal - t.netPrice;
        tax += t.taxAmount;
    }
    const net = subtotal - discount;
    const grandTotal = net + tax + v.freight + v.installationCharge;
    return {
        subtotal,
        discount,
        net,
        tax,
        freight: v.freight,
        installation: v.installationCharge,
        grandTotal,
    };
}
