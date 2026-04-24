import type { OrderStage } from '@/lib/orderStatus';

export interface OrderLineItem {
    id: string;
    productId: string;
    description: string;
    specNotes: string;
    orderedQty: number;
    reservedQty: number;
    dispatchedQty: number;
    backorderQty: number;
    uom: string;
    netPrice: number;
    taxRate: number;
}

export interface DeliveryPlan {
    id: string;
    scheduledDate: string; // ISO
    quantity: number;
    address: string;
    notes: string;
    status: 'scheduled' | 'dispatched' | 'delivered';
}

export interface MrpRow {
    productId: string;
    description: string;
    required: number;
    available: number;
    reserved: number;
    shortage: number;
    procurementEta: string | null; // ISO or null
    depends: string; // e.g. "PO-2026-014 (Acme Pumps)"
}

export interface InstallationChecklist {
    civilReady: boolean;
    electricalReady: boolean;
    approvalsReceived: boolean;
    siteContactName: string;
    siteContactMobile: string;
    expectedInstallationDate: string; // ISO
    notes: string;
}

export interface OrderDocument {
    id: string;
    type: 'quotation' | 'customer_po' | 'delivery_note' | 'invoice' | 'installation_report';
    label: string;
    refNumber: string;
    uploadedAt: string; // ISO
}

export interface OrderActivity {
    id: string;
    type:
    | 'stage_change'
    | 'note'
    | 'dispatch'
    | 'cancel'
    | 'amendment'
    | 'invoice'
    | 'readiness';
    at: string;
    actorId: string;
    summary: string;
}

export interface SalesOrder {
    id: string;
    orderNumber: string; // SO-2026-001
    quotationId: string;
    quotationNumber: string;
    customerName: string;
    companyName: string;
    projectName: string;
    siteAddress: string;
    ownerId: string; // userId
    confirmedAt: string; // ISO
    expectedDeliveryDate: string; // ISO
    stage: OrderStage;
    pendingApproval: null | { type: 'cancellation' | 'amendment'; reason: string; requestedAt: string; requestedBy: string };
    items: OrderLineItem[];
    deliveryPlans: DeliveryPlan[];
    mrp: MrpRow[];
    installation: InstallationChecklist;
    documents: OrderDocument[];
    activity: OrderActivity[];
    totalValue: number;
    readinessFlag: 'green' | 'amber' | 'red';
}

const today = Date.now();
const iso = (offsetDays: number): string =>
    new Date(today + offsetDays * 86400000).toISOString();

/* ---------- Detailed SO-2026-001 (processing + shortage) ---------- */

const so001: SalesOrder = {
    id: 'so-001',
    orderNumber: 'SO-2026-001',
    quotationId: 'qt-001',
    quotationNumber: 'Q-2026-001',
    customerName: 'Rajesh Patel',
    companyName: 'Patel Engineering Ltd.',
    projectName: 'ETP Phase II — Ahmedabad',
    siteAddress: 'Plot 214, GIDC Phase IV, Vatva, Ahmedabad 382445',
    ownerId: 'u-2',
    confirmedAt: iso(-14),
    expectedDeliveryDate: iso(18),
    stage: 'processing',
    pendingApproval: null,
    items: [
        {
            id: 'oli-001-1',
            productId: 'p-2',
            description: 'Centrifugal Pump 7.5 HP',
            specNotes: 'CI body, 415V',
            orderedQty: 4,
            reservedQty: 4,
            dispatchedQty: 0,
            backorderQty: 0,
            uom: 'pcs',
            netPrice: 62800,
            taxRate: 18,
        },
        {
            id: 'oli-001-2',
            productId: 'p-13',
            description: 'VFD Drive 15 HP',
            specNotes: '',
            orderedQty: 2,
            reservedQty: 2,
            dispatchedQty: 0,
            backorderQty: 0,
            uom: 'pcs',
            netPrice: 46500,
            taxRate: 18,
        },
        {
            id: 'oli-001-3',
            productId: 'p-15',
            description: 'Sand Filter 24" Dia',
            specNotes: 'with MPV',
            orderedQty: 2,
            reservedQty: 1,
            dispatchedQty: 0,
            backorderQty: 1,
            uom: 'pcs',
            netPrice: 54200,
            taxRate: 18,
        },
        {
            id: 'oli-001-4',
            productId: 'p-20',
            description: 'Commissioning & Training',
            specNotes: 'Lump-sum',
            orderedQty: 1,
            reservedQty: 1,
            dispatchedQty: 0,
            backorderQty: 0,
            uom: 'lot',
            netPrice: 25000,
            taxRate: 18,
        },
    ],
    deliveryPlans: [
        {
            id: 'dp-001-1',
            scheduledDate: iso(10),
            quantity: 4,
            address: 'Plot 214, GIDC Phase IV, Vatva, Ahmedabad',
            notes: 'Phase 1 — pumps only',
            status: 'scheduled',
        },
        {
            id: 'dp-001-2',
            scheduledDate: iso(18),
            quantity: 4,
            address: 'Plot 214, GIDC Phase IV, Vatva, Ahmedabad',
            notes: 'Phase 2 — controls + filters',
            status: 'scheduled',
        },
    ],
    mrp: [
        { productId: 'p-2', description: 'Centrifugal Pump 7.5 HP', required: 4, available: 11, reserved: 4, shortage: 0, procurementEta: null, depends: 'In stock' },
        { productId: 'p-13', description: 'VFD Drive 15 HP', required: 2, available: 14, reserved: 2, shortage: 0, procurementEta: null, depends: 'In stock' },
        { productId: 'p-15', description: 'Sand Filter 24" Dia', required: 2, available: 1, reserved: 1, shortage: 1, procurementEta: iso(8), depends: 'PO-2026-014 (Acme Pumps)' },
        { productId: 'p-20', description: 'Commissioning & Training', required: 1, available: 999, reserved: 1, shortage: 0, procurementEta: null, depends: 'Service' },
    ],
    installation: {
        civilReady: true,
        electricalReady: false,
        approvalsReceived: true,
        siteContactName: 'Kiran Desai',
        siteContactMobile: '+91 98240 11223',
        expectedInstallationDate: iso(22),
        notes: 'Electrical panel still pending — customer contractor awaiting transformer.',
    },
    documents: [
        { id: 'doc-001-1', type: 'quotation', label: 'Final Quotation v3', refNumber: 'Q-2026-001 v3', uploadedAt: iso(-15) },
        { id: 'doc-001-2', type: 'customer_po', label: 'Customer PO', refNumber: 'PEL/PO/2026/0117', uploadedAt: iso(-14) },
    ],
    activity: [
        { id: 'act-001-1', type: 'stage_change', at: iso(-14), actorId: 'u-2', summary: 'Order confirmed from Q-2026-001 v3.' },
        { id: 'act-001-2', type: 'readiness', at: iso(-10), actorId: 'u-3', summary: 'Stock reserved for 3 of 4 items; Sand Filter short by 1 — procurement PO raised.' },
        { id: 'act-001-3', type: 'stage_change', at: iso(-7), actorId: 'u-3', summary: 'Moved to Processing.' },
        { id: 'act-001-4', type: 'note', at: iso(-3), actorId: 'u-2', summary: 'Customer confirmed site access after 20th.' },
    ],
    totalValue: 4 * 62800 + 2 * 46500 + 2 * 54200 + 25000 + 35000 + 85000,
    readinessFlag: 'amber',
};

/* ---------- Detailed SO-2026-002 (ready, full stock, installation pending) ---------- */

const so002: SalesOrder = {
    id: 'so-002',
    orderNumber: 'SO-2026-002',
    quotationId: 'qt-003',
    quotationNumber: 'Q-2026-003',
    customerName: 'Priya Sharma',
    companyName: 'AquaPure Systems',
    projectName: 'RO Plant Upgrade — Baroda',
    siteAddress: '12 Industrial Estate, Makarpura, Vadodara 390010',
    ownerId: 'u-1',
    confirmedAt: iso(-9),
    expectedDeliveryDate: iso(5),
    stage: 'ready',
    pendingApproval: null,
    items: [
        {
            id: 'oli-002-1',
            productId: 'p-17',
            description: 'RO Membrane 4040',
            specNotes: 'TFC, 2500 GPD',
            orderedQty: 8,
            reservedQty: 8,
            dispatchedQty: 0,
            backorderQty: 0,
            uom: 'pcs',
            netPrice: 14200,
            taxRate: 18,
        },
        {
            id: 'oli-002-2',
            productId: 'p-16',
            description: 'Carbon Filter 24" Dia',
            specNotes: '',
            orderedQty: 2,
            reservedQty: 2,
            dispatchedQty: 0,
            backorderQty: 0,
            uom: 'pcs',
            netPrice: 58900,
            taxRate: 18,
        },
        {
            id: 'oli-002-3',
            productId: 'p-19',
            description: 'Installation Labour',
            specNotes: '',
            orderedQty: 3,
            reservedQty: 3,
            dispatchedQty: 0,
            backorderQty: 0,
            uom: 'day',
            netPrice: 4200,
            taxRate: 18,
        },
    ],
    deliveryPlans: [
        {
            id: 'dp-002-1',
            scheduledDate: iso(5),
            quantity: 10,
            address: '12 Industrial Estate, Makarpura, Vadodara',
            notes: 'Single delivery',
            status: 'scheduled',
        },
    ],
    mrp: [
        { productId: 'p-17', description: 'RO Membrane 4040', required: 8, available: 32, reserved: 8, shortage: 0, procurementEta: null, depends: 'In stock' },
        { productId: 'p-16', description: 'Carbon Filter 24" Dia', required: 2, available: 6, reserved: 2, shortage: 0, procurementEta: null, depends: 'In stock' },
        { productId: 'p-19', description: 'Installation Labour', required: 3, available: 999, reserved: 3, shortage: 0, procurementEta: null, depends: 'Service' },
    ],
    installation: {
        civilReady: true,
        electricalReady: true,
        approvalsReceived: true,
        siteContactName: 'Mahesh Patel',
        siteContactMobile: '+91 90990 55441',
        expectedInstallationDate: iso(8),
        notes: 'Site fully ready — awaiting dispatch.',
    },
    documents: [
        { id: 'doc-002-1', type: 'quotation', label: 'Accepted Quotation', refNumber: 'Q-2026-003', uploadedAt: iso(-10) },
        { id: 'doc-002-2', type: 'customer_po', label: 'Customer PO', refNumber: 'APS/PO/2026/041', uploadedAt: iso(-9) },
    ],
    activity: [
        { id: 'act-002-1', type: 'stage_change', at: iso(-9), actorId: 'u-1', summary: 'Order confirmed.' },
        { id: 'act-002-2', type: 'readiness', at: iso(-7), actorId: 'u-3', summary: 'All items in stock; fully reserved.' },
        { id: 'act-002-3', type: 'stage_change', at: iso(-2), actorId: 'u-3', summary: 'Moved to Ready — awaiting dispatch.' },
    ],
    totalValue: 8 * 14200 + 2 * 58900 + 3 * 4200,
    readinessFlag: 'green',
};

/* ---------- Light specs for 18 more orders ---------- */

interface LightSpec {
    id: string;
    orderNumber: string;
    quotationId: string;
    quotationNumber: string;
    customerName: string;
    companyName: string;
    projectName: string;
    siteCity: string;
    ownerId: string;
    offsetDays: number;
    expectedDeliveryOffset: number;
    stage: OrderStage;
    totalValue: number;
    readinessFlag: 'green' | 'amber' | 'red';
    shortage?: boolean;
    pendingApproval?: SalesOrder['pendingApproval'];
}

const lightSpecs: LightSpec[] = [
    { id: 'so-003', orderNumber: 'SO-2026-003', quotationId: 'qt-005', quotationNumber: 'Q-2026-005', customerName: 'Anil Joshi', companyName: 'Surat Textile Mills', projectName: 'Boiler feed water', siteCity: 'Surat', ownerId: 'u-1', offsetDays: -20, expectedDeliveryOffset: -2, stage: 'dispatched', totalValue: 485000, readinessFlag: 'green' },
    { id: 'so-004', orderNumber: 'SO-2026-004', quotationId: 'qt-006', quotationNumber: 'Q-2026-006', customerName: 'Neha Verma', companyName: 'GreenLeaf Pharma', projectName: 'Cooling tower revamp', siteCity: 'Ankleshwar', ownerId: 'u-2', offsetDays: -28, expectedDeliveryOffset: -10, stage: 'installed', totalValue: 720000, readinessFlag: 'green' },
    { id: 'so-005', orderNumber: 'SO-2026-005', quotationId: 'qt-007', quotationNumber: 'Q-2026-007', customerName: 'Rajiv Nair', companyName: 'Kochi Ports', projectName: 'Dewatering system', siteCity: 'Kochi', ownerId: 'u-4', offsetDays: -6, expectedDeliveryOffset: 12, stage: 'confirmed', totalValue: 1250000, readinessFlag: 'amber' },
    { id: 'so-006', orderNumber: 'SO-2026-006', quotationId: 'qt-008', quotationNumber: 'Q-2026-008', customerName: 'Divya Shah', companyName: 'Zenith Chemicals', projectName: 'Acid transfer skid', siteCity: 'Vapi', ownerId: 'u-2', offsetDays: -11, expectedDeliveryOffset: 9, stage: 'processing', totalValue: 640000, readinessFlag: 'red', shortage: true },
    { id: 'so-007', orderNumber: 'SO-2026-007', quotationId: 'qt-009', quotationNumber: 'Q-2026-009', customerName: 'Sanjay Rao', companyName: 'Bhuj Irrigation Co-op', projectName: 'Borewell automation', siteCity: 'Bhuj', ownerId: 'u-4', offsetDays: -34, expectedDeliveryOffset: -14, stage: 'installed', totalValue: 380000, readinessFlag: 'green' },
    { id: 'so-008', orderNumber: 'SO-2026-008', quotationId: 'qt-010', quotationNumber: 'Q-2026-010', customerName: 'Meera Iyer', companyName: 'SunRise Hotels', projectName: 'STP plant', siteCity: 'Udaipur', ownerId: 'u-1', offsetDays: -3, expectedDeliveryOffset: 20, stage: 'confirmed', totalValue: 920000, readinessFlag: 'green' },
    { id: 'so-009', orderNumber: 'SO-2026-009', quotationId: 'qt-011', quotationNumber: 'Q-2026-011', customerName: 'Parth Trivedi', companyName: 'Rajkot Auto Parts', projectName: 'Compressed air network', siteCity: 'Rajkot', ownerId: 'u-2', offsetDays: -16, expectedDeliveryOffset: 4, stage: 'ready', totalValue: 275000, readinessFlag: 'green' },
    { id: 'so-010', orderNumber: 'SO-2026-010', quotationId: 'qt-012', quotationNumber: 'Q-2026-012', customerName: 'Kavya Menon', companyName: 'Coastal Aqua', projectName: 'Desalination Phase 1', siteCity: 'Mangalore', ownerId: 'u-4', offsetDays: -22, expectedDeliveryOffset: 5, stage: 'processing', totalValue: 1850000, readinessFlag: 'amber', shortage: true },
    { id: 'so-011', orderNumber: 'SO-2026-011', quotationId: 'qt-013', quotationNumber: 'Q-2026-013', customerName: 'Harsh Vyas', companyName: 'MegaBuild Contractors', projectName: 'Hostel plumbing', siteCity: 'Pune', ownerId: 'u-1', offsetDays: -5, expectedDeliveryOffset: 15, stage: 'on_hold', totalValue: 510000, readinessFlag: 'amber', pendingApproval: { type: 'amendment', reason: 'Customer wants to reduce qty of pumps from 6 to 4; awaiting sales manager approval.', requestedAt: iso(-2), requestedBy: 'u-1' } },
    { id: 'so-012', orderNumber: 'SO-2026-012', quotationId: 'qt-014', quotationNumber: 'Q-2026-014', customerName: 'Isha Deshpande', companyName: 'FreshMilk Dairy', projectName: 'Pasteuriser pumps', siteCity: 'Nashik', ownerId: 'u-2', offsetDays: -42, expectedDeliveryOffset: -22, stage: 'installed', totalValue: 295000, readinessFlag: 'green' },
    { id: 'so-013', orderNumber: 'SO-2026-013', quotationId: 'qt-015', quotationNumber: 'Q-2026-015', customerName: 'Nikhil Pandey', companyName: 'BluePeak Resorts', projectName: 'Pool filtration', siteCity: 'Goa', ownerId: 'u-4', offsetDays: -8, expectedDeliveryOffset: 11, stage: 'confirmed', totalValue: 210000, readinessFlag: 'green' },
    { id: 'so-014', orderNumber: 'SO-2026-014', quotationId: 'qt-016', quotationNumber: 'Q-2026-016', customerName: 'Rupa Das', companyName: 'Eastern Steel Works', projectName: 'Scale pit dewatering', siteCity: 'Kolkata', ownerId: 'u-1', offsetDays: -13, expectedDeliveryOffset: 6, stage: 'processing', totalValue: 680000, readinessFlag: 'amber' },
    { id: 'so-015', orderNumber: 'SO-2026-015', quotationId: 'qt-017', quotationNumber: 'Q-2026-017', customerName: 'Tanvi Joshi', companyName: 'Saraswati Polymers', projectName: 'Chiller circulation', siteCity: 'Indore', ownerId: 'u-2', offsetDays: -18, expectedDeliveryOffset: 2, stage: 'ready', totalValue: 420000, readinessFlag: 'green' },
    { id: 'so-016', orderNumber: 'SO-2026-016', quotationId: 'qt-018', quotationNumber: 'Q-2026-018', customerName: 'Aniket Patil', companyName: 'GlobeTrans Logistics', projectName: 'Fuel storage transfer', siteCity: 'Aurangabad', ownerId: 'u-4', offsetDays: -25, expectedDeliveryOffset: -5, stage: 'dispatched', totalValue: 345000, readinessFlag: 'green' },
    { id: 'so-017', orderNumber: 'SO-2026-017', quotationId: 'qt-019', quotationNumber: 'Q-2026-019', customerName: 'Bhavna Kumar', companyName: 'Cygnus Hospitals', projectName: 'Water purification', siteCity: 'Delhi', ownerId: 'u-1', offsetDays: -1, expectedDeliveryOffset: 25, stage: 'confirmed', totalValue: 1100000, readinessFlag: 'amber' },
    { id: 'so-018', orderNumber: 'SO-2026-018', quotationId: 'qt-020', quotationNumber: 'Q-2026-020', customerName: 'Omkar Bhatt', companyName: 'Silver Line Cement', projectName: 'Slurry transfer', siteCity: 'Jaipur', ownerId: 'u-2', offsetDays: -30, expectedDeliveryOffset: 0, stage: 'ready', totalValue: 560000, readinessFlag: 'green' },
    { id: 'so-019', orderNumber: 'SO-2026-019', quotationId: 'qt-004', quotationNumber: 'Q-2026-004', customerName: 'Vivek Malhotra', companyName: 'UrbanGreen Infrastructure', projectName: 'Storm water pumps', siteCity: 'Gurugram', ownerId: 'u-4', offsetDays: -7, expectedDeliveryOffset: 14, stage: 'cancelled', totalValue: 445000, readinessFlag: 'red' },
    { id: 'so-020', orderNumber: 'SO-2026-020', quotationId: 'qt-002', quotationNumber: 'Q-2026-002', customerName: 'Sunita Reddy', companyName: 'Hyderabad Metro Water', projectName: 'Distribution booster', siteCity: 'Hyderabad', ownerId: 'u-1', offsetDays: -4, expectedDeliveryOffset: 21, stage: 'confirmed', totalValue: 1650000, readinessFlag: 'amber', pendingApproval: { type: 'cancellation', reason: 'Customer evaluating alternate vendor; hold for 48h.', requestedAt: iso(-1), requestedBy: 'u-3' } },
];

function buildLight(spec: LightSpec): SalesOrder {
    const orderedQty = 4;
    const dispatchedQty = spec.stage === 'installed' || spec.stage === 'dispatched' ? orderedQty : 0;
    return {
        id: spec.id,
        orderNumber: spec.orderNumber,
        quotationId: spec.quotationId,
        quotationNumber: spec.quotationNumber,
        customerName: spec.customerName,
        companyName: spec.companyName,
        projectName: spec.projectName,
        siteAddress: `${spec.siteCity} — project site`,
        ownerId: spec.ownerId,
        confirmedAt: iso(spec.offsetDays),
        expectedDeliveryDate: iso(spec.expectedDeliveryOffset),
        stage: spec.stage,
        pendingApproval: spec.pendingApproval ?? null,
        items: [
            {
                id: `${spec.id}-li-1`,
                productId: 'p-1',
                description: 'Project equipment package',
                specNotes: 'See quotation',
                orderedQty,
                reservedQty: orderedQty - (spec.shortage ? 1 : 0),
                dispatchedQty,
                backorderQty: spec.shortage ? 1 : 0,
                uom: 'pcs',
                netPrice: Math.round(spec.totalValue / orderedQty),
                taxRate: 18,
            },
        ],
        deliveryPlans: [
            {
                id: `${spec.id}-dp-1`,
                scheduledDate: iso(spec.expectedDeliveryOffset),
                quantity: orderedQty,
                address: spec.siteCity,
                notes: 'Single consignment',
                status:
                    spec.stage === 'dispatched' || spec.stage === 'installed'
                        ? 'dispatched'
                        : 'scheduled',
            },
        ],
        mrp: [
            {
                productId: 'p-1',
                description: 'Project equipment package',
                required: orderedQty,
                available: spec.shortage ? orderedQty - 1 : orderedQty + 2,
                reserved: orderedQty - (spec.shortage ? 1 : 0),
                shortage: spec.shortage ? 1 : 0,
                procurementEta: spec.shortage ? iso(10) : null,
                depends: spec.shortage ? 'PO-2026-022 (Supplier)' : 'In stock',
            },
        ],
        installation: {
            civilReady: spec.stage === 'installed' || spec.stage === 'ready',
            electricalReady: spec.stage === 'installed',
            approvalsReceived: true,
            siteContactName: 'Site engineer',
            siteContactMobile: '+91 90000 00000',
            expectedInstallationDate: iso(spec.expectedDeliveryOffset + 4),
            notes: 'Standard project checklist.',
        },
        documents: [
            { id: `${spec.id}-doc-1`, type: 'quotation', label: 'Accepted Quotation', refNumber: spec.quotationNumber, uploadedAt: iso(spec.offsetDays - 1) },
            { id: `${spec.id}-doc-2`, type: 'customer_po', label: 'Customer PO', refNumber: `PO/${spec.orderNumber.slice(-4)}`, uploadedAt: iso(spec.offsetDays) },
        ],
        activity: [
            { id: `${spec.id}-act-1`, type: 'stage_change', at: iso(spec.offsetDays), actorId: spec.ownerId, summary: `Order confirmed from ${spec.quotationNumber}.` },
            ...(spec.stage !== 'confirmed'
                ? [{ id: `${spec.id}-act-2`, type: 'stage_change' as const, at: iso(spec.offsetDays + 3), actorId: 'u-3', summary: `Moved to ${spec.stage}.` }]
                : []),
            ...(spec.pendingApproval
                ? [{ id: `${spec.id}-act-3`, type: (spec.pendingApproval.type === 'amendment' ? 'amendment' : 'cancel') as OrderActivity['type'], at: spec.pendingApproval.requestedAt, actorId: spec.pendingApproval.requestedBy, summary: `${spec.pendingApproval.type} requested: ${spec.pendingApproval.reason}` }]
                : []),
        ],
        totalValue: spec.totalValue,
        readinessFlag: spec.readinessFlag,
    };
}

export const orders: SalesOrder[] = [so001, so002, ...lightSpecs.map(buildLight)];

export function orderById(id: string): SalesOrder | undefined {
    return orders.find((o) => o.id === id);
}

export function itemPending(li: OrderLineItem): number {
    return Math.max(0, li.orderedQty - li.dispatchedQty);
}
