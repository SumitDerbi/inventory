import { orders } from './orders';
import { warehouses } from './warehouses';

export type DispatchStage =
    | 'planned'
    | 'packed'
    | 'loaded'
    | 'in_transit'
    | 'delivered'
    | 'pod_received'
    | 'closed'
    | 'cancelled';

export type DispatchStatus = DispatchStage;

export const DISPATCH_STAGES: DispatchStage[] = [
    'planned',
    'packed',
    'loaded',
    'in_transit',
    'delivered',
    'pod_received',
    'closed',
];

export const DISPATCH_STAGE_LABEL: Record<DispatchStage, string> = {
    planned: 'Planned',
    packed: 'Packed',
    loaded: 'Loaded',
    in_transit: 'In transit',
    delivered: 'Delivered',
    pod_received: 'POD received',
    closed: 'Closed',
    cancelled: 'Cancelled',
};

export const DISPATCH_TONE: Record<
    DispatchStage,
    'neutral' | 'amber' | 'blue' | 'sky' | 'emerald' | 'green' | 'red'
> = {
    planned: 'neutral',
    packed: 'sky',
    loaded: 'sky',
    in_transit: 'blue',
    delivered: 'emerald',
    pod_received: 'green',
    closed: 'green',
    cancelled: 'red',
};

export interface DispatchItem {
    id: string;
    orderId: string;
    orderNumber: string;
    productId: string;
    description: string;
    orderedQty: number;
    dispatchedQty: number;
    pendingQty: number;
    backorderQty: number;
    uom: string;
    weightKg: number;
    packageCount: number;
}

export interface RouteStop {
    id: string;
    label: string;
    city: string;
    arrivedAt: string | null;
    departedAt: string | null;
    notes?: string;
}

export interface DispatchDocument {
    id: string;
    type: 'challan' | 'packing_list' | 'shipment_summary' | 'invoice' | 'eway';
    label: string;
    refNumber: string;
    generatedAt: string; // ISO
}

export interface DispatchException {
    id: string;
    raisedAt: string;
    raisedBy: string;
    type: 'damaged' | 'short_dispatch' | 'failed_delivery' | 'wrong_item' | 'delay';
    rootCause: string;
    recommendedAction: string;
    status: 'open' | 'resolved';
    resolvedAt?: string;
}

export interface DispatchActivity {
    id: string;
    at: string;
    actorId: string;
    type: 'stage_change' | 'note' | 'exception' | 'pod' | 'document';
    summary: string;
}

export interface PodDetails {
    receivedBy: string;
    receivedAt: string;
    signatureFile: string;
    remarks?: string;
}

export interface Dispatch {
    id: string;
    challanNumber: string; // CH-2026-001
    createdAt: string;
    dispatchDate: string;
    expectedDeliveryDate: string;
    actualDeliveryDate: string | null;
    stage: DispatchStage;
    orderIds: string[];
    customerName: string;
    customerCompany: string;
    destinationCity: string;
    destinationAddress: string;
    sourceWarehouseId: string;
    transporterId: string;
    vehicleId: string;
    driverName: string;
    driverPhone: string;
    freightTerms: 'paid' | 'to_pay' | 'free';
    freightAmount: number;
    eWayBill: string | null;
    routeStops: RouteStop[];
    items: DispatchItem[];
    documents: DispatchDocument[];
    exceptions: DispatchException[];
    activity: DispatchActivity[];
    pod: PodDetails | null;
    totalWeightKg: number;
    totalPackages: number;
}

const TODAY = Date.now();
const iso = (offsetDays: number, hour = 10) =>
    new Date(TODAY + offsetDays * 86_400_000 + hour * 3_600_000).toISOString();

const FREIGHT_LABELS: Record<Dispatch['freightTerms'], string> = {
    paid: 'Paid',
    to_pay: 'To-pay',
    free: 'Free delivery',
};

export function freightTermsLabel(t: Dispatch['freightTerms']): string {
    return FREIGHT_LABELS[t];
}

const orderById = (id: string) => orders.find((o) => o.id === id);

/* ---------- Hand-crafted dispatches ---------- */

// d-001 — In transit, single order partial dispatch (so-001 phase 1)
const d001: Dispatch = {
    id: 'd-001',
    challanNumber: 'CH-2026-001',
    createdAt: iso(-3, 9),
    dispatchDate: iso(-2, 8),
    expectedDeliveryDate: iso(1),
    actualDeliveryDate: null,
    stage: 'in_transit',
    orderIds: ['so-001'],
    customerName: orderById('so-001')?.customerName ?? 'Rajesh Patel',
    customerCompany: orderById('so-001')?.companyName ?? 'Patel Engineering Ltd.',
    destinationCity: 'Ahmedabad',
    destinationAddress: 'Plot 214, GIDC Phase IV, Vatva, Ahmedabad 382445',
    sourceWarehouseId: 'wh-ho',
    transporterId: 'tr-1',
    vehicleId: 'veh-1',
    driverName: 'Mahesh Solanki',
    driverPhone: '+91 98987 12121',
    freightTerms: 'paid',
    freightAmount: 4500,
    eWayBill: '291029384756',
    routeStops: [
        { id: 'rs-1', label: 'Origin', city: 'Ahmedabad (WH-HO)', arrivedAt: iso(-2, 8), departedAt: iso(-2, 9) },
        { id: 'rs-2', label: 'Toll plaza', city: 'Vatva bypass', arrivedAt: iso(-2, 11), departedAt: iso(-2, 11) },
        { id: 'rs-3', label: 'Destination', city: 'Vatva GIDC Phase IV', arrivedAt: null, departedAt: null },
    ],
    items: [
        {
            id: 'di-001-1',
            orderId: 'so-001',
            orderNumber: 'SO-2026-001',
            productId: 'p-2',
            description: 'Centrifugal Pump 7.5 HP',
            orderedQty: 4,
            dispatchedQty: 4,
            pendingQty: 0,
            backorderQty: 0,
            uom: 'pcs',
            weightKg: 280,
            packageCount: 4,
        },
        {
            id: 'di-001-2',
            orderId: 'so-001',
            orderNumber: 'SO-2026-001',
            productId: 'p-13',
            description: 'VFD Drive 15 HP',
            orderedQty: 2,
            dispatchedQty: 2,
            pendingQty: 0,
            backorderQty: 0,
            uom: 'pcs',
            weightKg: 28,
            packageCount: 2,
        },
    ],
    documents: [
        { id: 'dd-001-1', type: 'challan', label: 'Delivery Challan', refNumber: 'CH-2026-001', generatedAt: iso(-3, 12) },
        { id: 'dd-001-2', type: 'packing_list', label: 'Packing List', refNumber: 'PL-2026-001', generatedAt: iso(-3, 12) },
        { id: 'dd-001-3', type: 'eway', label: 'E-way Bill', refNumber: '291029384756', generatedAt: iso(-2, 8) },
    ],
    exceptions: [],
    activity: [
        { id: 'da-001-1', at: iso(-3, 9), actorId: 'u-6', type: 'stage_change', summary: 'Dispatch planned from SO-2026-001 phase 1.' },
        { id: 'da-001-2', at: iso(-3, 12), actorId: 'u-6', type: 'document', summary: 'Challan & packing list generated.' },
        { id: 'da-001-3', at: iso(-2, 7), actorId: 'u-6', type: 'stage_change', summary: 'Items packed (6 cartons, 308 kg).' },
        { id: 'da-001-4', at: iso(-2, 8), actorId: 'u-7', type: 'stage_change', summary: 'Loaded onto GJ-01-AB-4521 (Tata 407).' },
        { id: 'da-001-5', at: iso(-2, 9), actorId: 'u-7', type: 'stage_change', summary: 'Vehicle departed Ahmedabad WH-HO.' },
    ],
    pod: null,
    totalWeightKg: 308,
    totalPackages: 6,
};

// d-002 — Delivered, awaiting POD
const d002: Dispatch = {
    id: 'd-002',
    challanNumber: 'CH-2026-002',
    createdAt: iso(-9, 10),
    dispatchDate: iso(-8, 7),
    expectedDeliveryDate: iso(-6),
    actualDeliveryDate: iso(-6, 14),
    stage: 'delivered',
    orderIds: ['so-009'],
    customerName: 'Parth Trivedi',
    customerCompany: 'Rajkot Auto Parts',
    destinationCity: 'Rajkot',
    destinationAddress: 'Plot 22, Aji GIDC Phase II, Rajkot 360003',
    sourceWarehouseId: 'wh-ho',
    transporterId: 'tr-1',
    vehicleId: 'veh-2',
    driverName: 'Bharat Chauhan',
    driverPhone: '+91 98987 23232',
    freightTerms: 'paid',
    freightAmount: 6800,
    eWayBill: '291023485612',
    routeStops: [
        { id: 'rs-1', label: 'Origin', city: 'Ahmedabad (WH-HO)', arrivedAt: iso(-8, 7), departedAt: iso(-8, 8) },
        { id: 'rs-2', label: 'Halt', city: 'Bagodara', arrivedAt: iso(-8, 11), departedAt: iso(-8, 12) },
        { id: 'rs-3', label: 'Destination', city: 'Rajkot site', arrivedAt: iso(-6, 14), departedAt: null },
    ],
    items: [
        {
            id: 'di-002-1',
            orderId: 'so-009',
            orderNumber: 'SO-2026-009',
            productId: 'p-1',
            description: 'Centrifugal Pump 5 HP',
            orderedQty: 6,
            dispatchedQty: 6,
            pendingQty: 0,
            backorderQty: 0,
            uom: 'pcs',
            weightKg: 360,
            packageCount: 6,
        },
        {
            id: 'di-002-2',
            orderId: 'so-009',
            orderNumber: 'SO-2026-009',
            productId: 'p-9',
            description: 'Pressure gauge — bourdon, 0–10 bar',
            orderedQty: 12,
            dispatchedQty: 12,
            pendingQty: 0,
            backorderQty: 0,
            uom: 'pcs',
            weightKg: 6,
            packageCount: 1,
        },
    ],
    documents: [
        { id: 'dd-002-1', type: 'challan', label: 'Delivery Challan', refNumber: 'CH-2026-002', generatedAt: iso(-9, 10) },
        { id: 'dd-002-2', type: 'packing_list', label: 'Packing List', refNumber: 'PL-2026-002', generatedAt: iso(-9, 10) },
        { id: 'dd-002-3', type: 'eway', label: 'E-way Bill', refNumber: '291023485612', generatedAt: iso(-8, 7) },
        { id: 'dd-002-4', type: 'invoice', label: 'Tax Invoice', refNumber: 'INV-2026-009', generatedAt: iso(-8, 7) },
    ],
    exceptions: [],
    activity: [
        { id: 'da-002-1', at: iso(-9, 10), actorId: 'u-6', type: 'stage_change', summary: 'Dispatch planned for SO-2026-009.' },
        { id: 'da-002-2', at: iso(-8, 7), actorId: 'u-7', type: 'stage_change', summary: 'Loaded & dispatched.' },
        { id: 'da-002-3', at: iso(-6, 14), actorId: 'u-7', type: 'stage_change', summary: 'Delivered at site; POD pending upload.' },
    ],
    pod: null,
    totalWeightKg: 366,
    totalPackages: 7,
};

// d-003 — Closed (POD received, archived)
const d003: Dispatch = {
    id: 'd-003',
    challanNumber: 'CH-2026-003',
    createdAt: iso(-22, 11),
    dispatchDate: iso(-21, 7),
    expectedDeliveryDate: iso(-19),
    actualDeliveryDate: iso(-19, 16),
    stage: 'closed',
    orderIds: ['so-003'],
    customerName: 'Anil Joshi',
    customerCompany: 'Surat Textile Mills',
    destinationCity: 'Surat',
    destinationAddress: 'Plot 18, Pandesara GIDC, Surat 394221',
    sourceWarehouseId: 'wh-br',
    transporterId: 'tr-1',
    vehicleId: 'veh-2',
    driverName: 'Bharat Chauhan',
    driverPhone: '+91 98987 23232',
    freightTerms: 'to_pay',
    freightAmount: 5200,
    eWayBill: '291018273645',
    routeStops: [
        { id: 'rs-1', label: 'Origin', city: 'Surat (WH-BR)', arrivedAt: iso(-21, 6), departedAt: iso(-21, 7) },
        { id: 'rs-2', label: 'Destination', city: 'Pandesara', arrivedAt: iso(-19, 16), departedAt: iso(-19, 17) },
    ],
    items: [
        {
            id: 'di-003-1',
            orderId: 'so-003',
            orderNumber: 'SO-2026-003',
            productId: 'p-2',
            description: 'Centrifugal Pump 7.5 HP',
            orderedQty: 3,
            dispatchedQty: 3,
            pendingQty: 0,
            backorderQty: 0,
            uom: 'pcs',
            weightKg: 210,
            packageCount: 3,
        },
        {
            id: 'di-003-2',
            orderId: 'so-003',
            orderNumber: 'SO-2026-003',
            productId: 'p-15',
            description: 'Sand Filter 24" Dia',
            orderedQty: 1,
            dispatchedQty: 1,
            pendingQty: 0,
            backorderQty: 0,
            uom: 'pcs',
            weightKg: 95,
            packageCount: 1,
        },
    ],
    documents: [
        { id: 'dd-003-1', type: 'challan', label: 'Delivery Challan', refNumber: 'CH-2026-003', generatedAt: iso(-22, 11) },
        { id: 'dd-003-2', type: 'packing_list', label: 'Packing List', refNumber: 'PL-2026-003', generatedAt: iso(-22, 11) },
        { id: 'dd-003-3', type: 'invoice', label: 'Tax Invoice', refNumber: 'INV-2026-003', generatedAt: iso(-21, 6) },
    ],
    exceptions: [],
    activity: [
        { id: 'da-003-1', at: iso(-22, 11), actorId: 'u-6', type: 'stage_change', summary: 'Planned & documents generated.' },
        { id: 'da-003-2', at: iso(-21, 7), actorId: 'u-7', type: 'stage_change', summary: 'Loaded and dispatched.' },
        { id: 'da-003-3', at: iso(-19, 16), actorId: 'u-7', type: 'stage_change', summary: 'Delivered.' },
        { id: 'da-003-4', at: iso(-18, 11), actorId: 'u-6', type: 'pod', summary: 'POD uploaded — signed by site engineer.' },
        { id: 'da-003-5', at: iso(-17, 9), actorId: 'u-2', type: 'stage_change', summary: 'Dispatch closed.' },
    ],
    pod: {
        receivedBy: 'Hetal Mehta',
        receivedAt: iso(-19, 16),
        signatureFile: 'pod-CH-2026-003.pdf',
        remarks: 'All items received in good condition.',
    },
    totalWeightKg: 305,
    totalPackages: 4,
};

// d-004 — Damaged exception, partial re-dispatch in flight
const d004: Dispatch = {
    id: 'd-004',
    challanNumber: 'CH-2026-004',
    createdAt: iso(-7, 9),
    dispatchDate: iso(-6, 8),
    expectedDeliveryDate: iso(-3),
    actualDeliveryDate: iso(-3, 12),
    stage: 'pod_received',
    orderIds: ['so-014'],
    customerName: 'Rupa Das',
    customerCompany: 'Eastern Steel Works',
    destinationCity: 'Kolkata',
    destinationAddress: 'Sector V, Salt Lake City, Kolkata 700091',
    sourceWarehouseId: 'wh-ho',
    transporterId: 'tr-5',
    vehicleId: 'veh-7',
    driverName: 'Subhash Ghosh',
    driverPhone: '+91 98987 78787',
    freightTerms: 'paid',
    freightAmount: 18500,
    eWayBill: '291019384756',
    routeStops: [
        { id: 'rs-1', label: 'Origin', city: 'Ahmedabad (WH-HO)', arrivedAt: iso(-6, 7), departedAt: iso(-6, 8) },
        { id: 'rs-2', label: 'Halt', city: 'Nagpur', arrivedAt: iso(-5, 14), departedAt: iso(-5, 18) },
        { id: 'rs-3', label: 'Destination', city: 'Kolkata Salt Lake', arrivedAt: iso(-3, 12), departedAt: iso(-3, 13) },
    ],
    items: [
        {
            id: 'di-004-1',
            orderId: 'so-014',
            orderNumber: 'SO-2026-014',
            productId: 'p-2',
            description: 'Centrifugal Pump 7.5 HP',
            orderedQty: 6,
            dispatchedQty: 6,
            pendingQty: 0,
            backorderQty: 0,
            uom: 'pcs',
            weightKg: 420,
            packageCount: 6,
        },
        {
            id: 'di-004-2',
            orderId: 'so-014',
            orderNumber: 'SO-2026-014',
            productId: 'p-13',
            description: 'VFD Drive 15 HP',
            orderedQty: 4,
            dispatchedQty: 4,
            pendingQty: 0,
            backorderQty: 0,
            uom: 'pcs',
            weightKg: 56,
            packageCount: 4,
        },
    ],
    documents: [
        { id: 'dd-004-1', type: 'challan', label: 'Delivery Challan', refNumber: 'CH-2026-004', generatedAt: iso(-7, 9) },
        { id: 'dd-004-2', type: 'packing_list', label: 'Packing List', refNumber: 'PL-2026-004', generatedAt: iso(-7, 9) },
        { id: 'dd-004-3', type: 'eway', label: 'E-way Bill', refNumber: '291019384756', generatedAt: iso(-6, 8) },
        { id: 'dd-004-4', type: 'shipment_summary', label: 'Shipment Summary', refNumber: 'SS-2026-004', generatedAt: iso(-6, 8) },
    ],
    exceptions: [
        {
            id: 'de-004-1',
            raisedAt: iso(-3, 13),
            raisedBy: 'u-7',
            type: 'damaged',
            rootCause: '1 × VFD Drive enclosure dented during transit (carton handling at Nagpur halt).',
            recommendedAction: 'Replace damaged unit from WH-HO stock; freight on transporter; raise insurance claim.',
            status: 'open',
        },
    ],
    activity: [
        { id: 'da-004-1', at: iso(-7, 9), actorId: 'u-6', type: 'stage_change', summary: 'Dispatch planned for SO-2026-014.' },
        { id: 'da-004-2', at: iso(-6, 8), actorId: 'u-7', type: 'stage_change', summary: 'Dispatched.' },
        { id: 'da-004-3', at: iso(-3, 12), actorId: 'u-7', type: 'stage_change', summary: 'Delivered.' },
        { id: 'da-004-4', at: iso(-3, 13), actorId: 'u-7', type: 'exception', summary: 'Damage exception raised — 1 × VFD enclosure dented.' },
        { id: 'da-004-5', at: iso(-2, 11), actorId: 'u-6', type: 'pod', summary: 'POD received noting partial acceptance.' },
    ],
    pod: {
        receivedBy: 'Suvendu Banerjee',
        receivedAt: iso(-3, 12),
        signatureFile: 'pod-CH-2026-004.pdf',
        remarks: '1 VFD unit accepted under protest; replacement requested.',
    },
    totalWeightKg: 476,
    totalPackages: 10,
};

// d-005 — Planned (just created)
const d005: Dispatch = {
    id: 'd-005',
    challanNumber: 'CH-2026-005',
    createdAt: iso(-1, 16),
    dispatchDate: iso(1, 8),
    expectedDeliveryDate: iso(3),
    actualDeliveryDate: null,
    stage: 'planned',
    orderIds: ['so-015'],
    customerName: 'Tanvi Joshi',
    customerCompany: 'Saraswati Polymers',
    destinationCity: 'Indore',
    destinationAddress: 'Sector E, Sanwer Road Industrial Area, Indore 452015',
    sourceWarehouseId: 'wh-ho',
    transporterId: 'tr-2',
    vehicleId: 'veh-3',
    driverName: 'Sanjay Pawar',
    driverPhone: '+91 98987 34343',
    freightTerms: 'paid',
    freightAmount: 9200,
    eWayBill: null,
    routeStops: [
        { id: 'rs-1', label: 'Origin', city: 'Ahmedabad (WH-HO)', arrivedAt: null, departedAt: null },
        { id: 'rs-2', label: 'Destination', city: 'Sanwer Road Indore', arrivedAt: null, departedAt: null },
    ],
    items: [
        {
            id: 'di-005-1',
            orderId: 'so-015',
            orderNumber: 'SO-2026-015',
            productId: 'p-3',
            description: 'Booster Pump 3 HP',
            orderedQty: 4,
            dispatchedQty: 4,
            pendingQty: 0,
            backorderQty: 0,
            uom: 'pcs',
            weightKg: 160,
            packageCount: 4,
        },
        {
            id: 'di-005-2',
            orderId: 'so-015',
            orderNumber: 'SO-2026-015',
            productId: 'p-7',
            description: 'PVC Pipe 2" Sch-80',
            orderedQty: 60,
            dispatchedQty: 60,
            pendingQty: 0,
            backorderQty: 0,
            uom: 'mtr',
            weightKg: 90,
            packageCount: 3,
        },
    ],
    documents: [
        { id: 'dd-005-1', type: 'challan', label: 'Delivery Challan', refNumber: 'CH-2026-005', generatedAt: iso(-1, 16) },
        { id: 'dd-005-2', type: 'packing_list', label: 'Packing List', refNumber: 'PL-2026-005', generatedAt: iso(-1, 16) },
    ],
    exceptions: [],
    activity: [
        { id: 'da-005-1', at: iso(-1, 16), actorId: 'u-6', type: 'stage_change', summary: 'Dispatch planned for SO-2026-015.' },
    ],
    pod: null,
    totalWeightKg: 250,
    totalPackages: 7,
};

// d-006 — Packed, awaiting loading
const d006: Dispatch = {
    id: 'd-006',
    challanNumber: 'CH-2026-006',
    createdAt: iso(-2, 14),
    dispatchDate: iso(0, 9),
    expectedDeliveryDate: iso(2),
    actualDeliveryDate: null,
    stage: 'packed',
    orderIds: ['so-018'],
    customerName: 'Omkar Bhatt',
    customerCompany: 'Silver Line Cement',
    destinationCity: 'Jaipur',
    destinationAddress: 'Sitapura Industrial Area, Jaipur 302022',
    sourceWarehouseId: 'wh-ho',
    transporterId: 'tr-3',
    vehicleId: 'veh-5',
    driverName: 'Karan Yadav',
    driverPhone: '+91 98987 56565',
    freightTerms: 'paid',
    freightAmount: 11200,
    eWayBill: null,
    routeStops: [
        { id: 'rs-1', label: 'Origin', city: 'Ahmedabad (WH-HO)', arrivedAt: null, departedAt: null },
        { id: 'rs-2', label: 'Destination', city: 'Sitapura Jaipur', arrivedAt: null, departedAt: null },
    ],
    items: [
        {
            id: 'di-006-1',
            orderId: 'so-018',
            orderNumber: 'SO-2026-018',
            productId: 'p-2',
            description: 'Centrifugal Pump 7.5 HP',
            orderedQty: 5,
            dispatchedQty: 5,
            pendingQty: 0,
            backorderQty: 0,
            uom: 'pcs',
            weightKg: 350,
            packageCount: 5,
        },
        {
            id: 'di-006-2',
            orderId: 'so-018',
            orderNumber: 'SO-2026-018',
            productId: 'p-30',
            description: 'Mechanical Seal — TC/SiC',
            orderedQty: 5,
            dispatchedQty: 5,
            pendingQty: 0,
            backorderQty: 0,
            uom: 'pcs',
            weightKg: 5,
            packageCount: 1,
        },
    ],
    documents: [
        { id: 'dd-006-1', type: 'challan', label: 'Delivery Challan', refNumber: 'CH-2026-006', generatedAt: iso(-2, 14) },
        { id: 'dd-006-2', type: 'packing_list', label: 'Packing List', refNumber: 'PL-2026-006', generatedAt: iso(-2, 14) },
    ],
    exceptions: [],
    activity: [
        { id: 'da-006-1', at: iso(-2, 14), actorId: 'u-6', type: 'stage_change', summary: 'Dispatch planned.' },
        { id: 'da-006-2', at: iso(-1, 11), actorId: 'u-6', type: 'stage_change', summary: 'Items packed (6 pkgs, 355 kg).' },
    ],
    pod: null,
    totalWeightKg: 355,
    totalPackages: 6,
};

// d-007 — Multi-order consolidation, in transit
const d007: Dispatch = {
    id: 'd-007',
    challanNumber: 'CH-2026-007',
    createdAt: iso(-4, 10),
    dispatchDate: iso(-3, 7),
    expectedDeliveryDate: iso(2),
    actualDeliveryDate: null,
    stage: 'in_transit',
    orderIds: ['so-008', 'so-013'],
    customerName: 'Multiple sites',
    customerCompany: 'SunRise Hotels & BluePeak Resorts',
    destinationCity: 'Udaipur / Goa',
    destinationAddress: 'Multi-stop: Udaipur (SunRise STP) → Goa (BluePeak Pool)',
    sourceWarehouseId: 'wh-ho',
    transporterId: 'tr-2',
    vehicleId: 'veh-4',
    driverName: 'Anil Borade',
    driverPhone: '+91 98987 45454',
    freightTerms: 'paid',
    freightAmount: 24500,
    eWayBill: '291089384756',
    routeStops: [
        { id: 'rs-1', label: 'Origin', city: 'Ahmedabad (WH-HO)', arrivedAt: iso(-3, 6), departedAt: iso(-3, 7) },
        { id: 'rs-2', label: 'Stop 1', city: 'Udaipur (SunRise Hotels)', arrivedAt: iso(-2, 12), departedAt: iso(-2, 14) },
        { id: 'rs-3', label: 'Destination', city: 'Goa (BluePeak Resorts)', arrivedAt: null, departedAt: null },
    ],
    items: [
        {
            id: 'di-007-1',
            orderId: 'so-008',
            orderNumber: 'SO-2026-008',
            productId: 'p-1',
            description: 'Centrifugal Pump 5 HP',
            orderedQty: 8,
            dispatchedQty: 8,
            pendingQty: 0,
            backorderQty: 0,
            uom: 'pcs',
            weightKg: 480,
            packageCount: 8,
        },
        {
            id: 'di-007-2',
            orderId: 'so-013',
            orderNumber: 'SO-2026-013',
            productId: 'p-3',
            description: 'Booster Pump 3 HP',
            orderedQty: 3,
            dispatchedQty: 3,
            pendingQty: 0,
            backorderQty: 0,
            uom: 'pcs',
            weightKg: 120,
            packageCount: 3,
        },
        {
            id: 'di-007-3',
            orderId: 'so-013',
            orderNumber: 'SO-2026-013',
            productId: 'p-15',
            description: 'Sand Filter 24" Dia',
            orderedQty: 2,
            dispatchedQty: 2,
            pendingQty: 0,
            backorderQty: 0,
            uom: 'pcs',
            weightKg: 190,
            packageCount: 2,
        },
    ],
    documents: [
        { id: 'dd-007-1', type: 'challan', label: 'Delivery Challan', refNumber: 'CH-2026-007', generatedAt: iso(-4, 10) },
        { id: 'dd-007-2', type: 'packing_list', label: 'Packing List', refNumber: 'PL-2026-007', generatedAt: iso(-4, 10) },
        { id: 'dd-007-3', type: 'shipment_summary', label: 'Shipment Summary', refNumber: 'SS-2026-007', generatedAt: iso(-4, 10) },
        { id: 'dd-007-4', type: 'eway', label: 'E-way Bill', refNumber: '291089384756', generatedAt: iso(-3, 7) },
    ],
    exceptions: [],
    activity: [
        { id: 'da-007-1', at: iso(-4, 10), actorId: 'u-6', type: 'stage_change', summary: 'Consolidated dispatch planned for SO-2026-008 + SO-2026-013.' },
        { id: 'da-007-2', at: iso(-3, 7), actorId: 'u-7', type: 'stage_change', summary: 'Loaded onto 32ft trailer; departed.' },
        { id: 'da-007-3', at: iso(-2, 12), actorId: 'u-7', type: 'stage_change', summary: 'Delivered Udaipur leg (8 pumps to SunRise Hotels).' },
    ],
    pod: null,
    totalWeightKg: 790,
    totalPackages: 13,
};

// d-008 — Failed delivery exception (open)
const d008: Dispatch = {
    id: 'd-008',
    challanNumber: 'CH-2026-008',
    createdAt: iso(-12, 9),
    dispatchDate: iso(-11, 8),
    expectedDeliveryDate: iso(-9),
    actualDeliveryDate: null,
    stage: 'in_transit',
    orderIds: ['so-006'],
    customerName: 'Divya Shah',
    customerCompany: 'Zenith Chemicals',
    destinationCity: 'Vapi',
    destinationAddress: '2nd Phase GIDC, Vapi 396195',
    sourceWarehouseId: 'wh-ho',
    transporterId: 'tr-1',
    vehicleId: 'veh-1',
    driverName: 'Mahesh Solanki',
    driverPhone: '+91 98987 12121',
    freightTerms: 'paid',
    freightAmount: 7800,
    eWayBill: '291045671234',
    routeStops: [
        { id: 'rs-1', label: 'Origin', city: 'Ahmedabad (WH-HO)', arrivedAt: iso(-11, 7), departedAt: iso(-11, 8) },
        { id: 'rs-2', label: 'Attempt 1', city: 'Vapi GIDC (gate locked)', arrivedAt: iso(-10, 14), departedAt: iso(-10, 15) },
    ],
    items: [
        {
            id: 'di-008-1',
            orderId: 'so-006',
            orderNumber: 'SO-2026-006',
            productId: 'p-2',
            description: 'Centrifugal Pump 7.5 HP',
            orderedQty: 4,
            dispatchedQty: 4,
            pendingQty: 0,
            backorderQty: 0,
            uom: 'pcs',
            weightKg: 280,
            packageCount: 4,
        },
    ],
    documents: [
        { id: 'dd-008-1', type: 'challan', label: 'Delivery Challan', refNumber: 'CH-2026-008', generatedAt: iso(-12, 9) },
        { id: 'dd-008-2', type: 'eway', label: 'E-way Bill', refNumber: '291045671234', generatedAt: iso(-11, 8) },
    ],
    exceptions: [
        {
            id: 'de-008-1',
            raisedAt: iso(-10, 15),
            raisedBy: 'u-7',
            type: 'failed_delivery',
            rootCause: 'Customer site closed for festival; no authorised receiver available.',
            recommendedAction: 'Re-attempt delivery on next working day; demurrage waiver requested from transporter.',
            status: 'open',
        },
    ],
    activity: [
        { id: 'da-008-1', at: iso(-12, 9), actorId: 'u-6', type: 'stage_change', summary: 'Dispatch planned.' },
        { id: 'da-008-2', at: iso(-11, 8), actorId: 'u-7', type: 'stage_change', summary: 'Loaded & dispatched.' },
        { id: 'da-008-3', at: iso(-10, 14), actorId: 'u-7', type: 'note', summary: 'Reached destination.' },
        { id: 'da-008-4', at: iso(-10, 15), actorId: 'u-7', type: 'exception', summary: 'Failed delivery — site closed.' },
    ],
    pod: null,
    totalWeightKg: 280,
    totalPackages: 4,
};

// d-009 — Cancelled before dispatch
const d009: Dispatch = {
    id: 'd-009',
    challanNumber: 'CH-2026-009',
    createdAt: iso(-15, 11),
    dispatchDate: iso(-14, 8),
    expectedDeliveryDate: iso(-12),
    actualDeliveryDate: null,
    stage: 'cancelled',
    orderIds: ['so-019'],
    customerName: 'Vivek Malhotra',
    customerCompany: 'UrbanGreen Infrastructure',
    destinationCity: 'Gurugram',
    destinationAddress: 'Sector 35, Gurugram 122001',
    sourceWarehouseId: 'wh-ho',
    transporterId: 'tr-3',
    vehicleId: 'veh-5',
    driverName: 'Karan Yadav',
    driverPhone: '+91 98987 56565',
    freightTerms: 'paid',
    freightAmount: 0,
    eWayBill: null,
    routeStops: [],
    items: [
        {
            id: 'di-009-1',
            orderId: 'so-019',
            orderNumber: 'SO-2026-019',
            productId: 'p-1',
            description: 'Centrifugal Pump 5 HP',
            orderedQty: 4,
            dispatchedQty: 0,
            pendingQty: 4,
            backorderQty: 0,
            uom: 'pcs',
            weightKg: 240,
            packageCount: 4,
        },
    ],
    documents: [
        { id: 'dd-009-1', type: 'challan', label: 'Delivery Challan (cancelled)', refNumber: 'CH-2026-009', generatedAt: iso(-15, 11) },
    ],
    exceptions: [],
    activity: [
        { id: 'da-009-1', at: iso(-15, 11), actorId: 'u-6', type: 'stage_change', summary: 'Dispatch planned.' },
        { id: 'da-009-2', at: iso(-14, 9), actorId: 'u-2', type: 'stage_change', summary: 'Dispatch cancelled — order cancelled by customer.' },
    ],
    pod: null,
    totalWeightKg: 240,
    totalPackages: 4,
};

// d-010 — Local own-fleet delivery, in transit
const d010: Dispatch = {
    id: 'd-010',
    challanNumber: 'CH-2026-010',
    createdAt: iso(0, 9),
    dispatchDate: iso(0, 11),
    expectedDeliveryDate: iso(0),
    actualDeliveryDate: null,
    stage: 'loaded',
    orderIds: ['so-002'],
    customerName: 'M Kumar',
    customerCompany: 'Vatva Industries',
    destinationCity: 'Ahmedabad',
    destinationAddress: 'Plot 42, Vatva GIDC, Ahmedabad',
    sourceWarehouseId: 'wh-ho',
    transporterId: 'tr-6',
    vehicleId: 'veh-9',
    driverName: 'Devang Joshi',
    driverPhone: '+91 98987 90909',
    freightTerms: 'free',
    freightAmount: 0,
    eWayBill: null,
    routeStops: [
        { id: 'rs-1', label: 'Origin', city: 'Ahmedabad (WH-HO)', arrivedAt: iso(0, 10), departedAt: null },
        { id: 'rs-2', label: 'Destination', city: 'Vatva GIDC', arrivedAt: null, departedAt: null },
    ],
    items: [
        {
            id: 'di-010-1',
            orderId: 'so-002',
            orderNumber: 'SO-2026-002',
            productId: 'p-9',
            description: 'Pressure gauge — bourdon, 0–10 bar',
            orderedQty: 18,
            dispatchedQty: 18,
            pendingQty: 0,
            backorderQty: 0,
            uom: 'pcs',
            weightKg: 9,
            packageCount: 1,
        },
    ],
    documents: [
        { id: 'dd-010-1', type: 'challan', label: 'Delivery Challan', refNumber: 'CH-2026-010', generatedAt: iso(0, 9) },
    ],
    exceptions: [],
    activity: [
        { id: 'da-010-1', at: iso(0, 9), actorId: 'u-6', type: 'stage_change', summary: 'Local pickup arranged.' },
        { id: 'da-010-2', at: iso(0, 10), actorId: 'u-7', type: 'stage_change', summary: 'Loaded in own fleet Tata Ace.' },
    ],
    pod: null,
    totalWeightKg: 9,
    totalPackages: 1,
};

export const dispatches: Dispatch[] = [
    d001,
    d002,
    d003,
    d004,
    d005,
    d006,
    d007,
    d008,
    d009,
    d010,
];

export function dispatchById(id: string): Dispatch | undefined {
    return dispatches.find((d) => d.id === id);
}

export function dispatchesForOrder(orderId: string): Dispatch[] {
    return dispatches.filter((d) => d.orderIds.includes(orderId));
}

/* ---------- Stage transitions ---------- */

const ALLOWED_NEXT: Record<DispatchStage, DispatchStage[]> = {
    planned: ['packed', 'cancelled'],
    packed: ['loaded', 'cancelled'],
    loaded: ['in_transit', 'cancelled'],
    in_transit: ['delivered'],
    delivered: ['pod_received'],
    pod_received: ['closed'],
    closed: [],
    cancelled: [],
};

export function nextStages(stage: DispatchStage): DispatchStage[] {
    return ALLOWED_NEXT[stage];
}

export function canAdvanceTo(from: DispatchStage, to: DispatchStage): boolean {
    return ALLOWED_NEXT[from].includes(to);
}

/* ---------- Summary ---------- */

export function dispatchSummary() {
    const total = dispatches.length;
    const inTransit = dispatches.filter((d) => d.stage === 'in_transit').length;
    const awaitingPod = dispatches.filter(
        (d) => d.stage === 'delivered',
    ).length;
    const exceptions = dispatches.filter((d) =>
        d.exceptions.some((e) => e.status === 'open'),
    ).length;
    return { total, inTransit, awaitingPod, exceptions };
}

/* ---------- Ready orders for Plan Dispatch wizard ---------- */

export interface ReadyOrderSummary {
    id: string;
    orderNumber: string;
    customerName: string;
    companyName: string;
    siteCity: string;
    expectedDeliveryDate: string;
    totalValue: number;
    readiness: 'green' | 'amber' | 'red';
    itemCount: number;
}

export function readyOrders(): ReadyOrderSummary[] {
    return orders
        .filter((o) => o.stage === 'ready')
        .map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            customerName: o.customerName,
            companyName: o.companyName,
            siteCity:
                ('siteCity' in o ? (o as { siteCity?: string }).siteCity : undefined) ??
                ('siteAddress' in o
                    ? (o as { siteAddress?: string }).siteAddress?.split(',').slice(-2, -1)[0]?.trim()
                    : undefined) ??
                '—',
            expectedDeliveryDate:
                ('expectedDeliveryDate' in o ? o.expectedDeliveryDate : undefined) ??
                iso(7),
            totalValue: o.totalValue,
            readiness: o.readinessFlag ?? 'green',
            itemCount: 'items' in o && Array.isArray(o.items) ? o.items.length : 1,
        }));
}

/* ---------- Source warehouse helper ---------- */

export const SOURCE_WAREHOUSES = warehouses;
