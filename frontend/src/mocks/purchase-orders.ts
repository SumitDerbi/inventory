import { products } from './products';
import { warehouses } from './warehouses';

export type POStage =
    | 'draft'
    | 'pending_approval'
    | 'approved'
    | 'sent'
    | 'partially_received'
    | 'received'
    | 'closed'
    | 'cancelled';

export const PO_STAGES: POStage[] = [
    'draft',
    'pending_approval',
    'approved',
    'sent',
    'partially_received',
    'received',
    'closed',
];

export const PO_STAGE_LABEL: Record<POStage, string> = {
    draft: 'Draft',
    pending_approval: 'Pending approval',
    approved: 'Approved',
    sent: 'Sent to vendor',
    partially_received: 'Partially received',
    received: 'Received',
    closed: 'Closed',
    cancelled: 'Cancelled',
};

export const PO_STAGE_TONE: Record<
    POStage,
    'neutral' | 'amber' | 'sky' | 'blue' | 'emerald' | 'green' | 'red'
> = {
    draft: 'neutral',
    pending_approval: 'amber',
    approved: 'sky',
    sent: 'blue',
    partially_received: 'amber',
    received: 'emerald',
    closed: 'green',
    cancelled: 'red',
};

export interface POItem {
    id: string;
    productId: string;
    sku: string;
    description: string;
    qty: number;
    receivedQty: number;
    pendingQty: number;
    rejectedQty: number;
    uom: string;
    unitPrice: number;
    discountPct: number;
    gstPct: number;
    notes?: string;
}

export interface PODeliverySchedule {
    id: string;
    poItemId: string;
    qty: number;
    expectedDate: string;
    status: 'pending' | 'partial' | 'completed' | 'late';
}

export interface POAmendment {
    id: string;
    at: string;
    by: string;
    summary: string;
}

export interface PurchaseOrder {
    id: string;
    number: string; // PO-2026-0001
    vendorId: string;
    prId?: string;
    prNumber?: string;
    rfqId?: string;
    poDate: string;
    expectedDeliveryDate: string;
    warehouseId: string;
    stage: POStage;
    paymentTermsDays: number;
    deliveryTerms: string;
    incoterm: 'FOB' | 'CIF' | 'EXW' | 'DDP' | 'Ex-Works' | 'Door delivery';
    currency: 'INR' | 'USD' | 'EUR';
    exchangeRate: number;
    placeOfSupply: string;
    isInterstate: boolean;
    items: POItem[];
    schedule: PODeliverySchedule[];
    amendments: POAmendment[];
    freight: number;
    otherCharges: number;
    discount: number;
    notes?: string;
    approvedBy?: string;
    approvedAt?: string;
}

const TODAY = Date.now();
const iso = (offsetDays: number) =>
    new Date(TODAY + offsetDays * 86_400_000).toISOString();

const mkItem = (
    id: string,
    sku: string,
    qty: number,
    unitPrice: number,
    receivedQty = 0,
    rejectedQty = 0,
): POItem => {
    const p = products.find((x) => x.sku === sku);
    return {
        id,
        productId: p?.id ?? 'p-1',
        sku,
        description: p?.name ?? sku,
        qty,
        receivedQty,
        pendingQty: Math.max(0, qty - receivedQty - rejectedQty),
        rejectedQty,
        uom: p?.uom ?? 'pcs',
        unitPrice,
        discountPct: 0,
        gstPct: 18,
    };
};

export const purchaseOrders: PurchaseOrder[] = [
    {
        id: 'po-001',
        number: 'PO-2026-0001',
        vendorId: 'v-001',
        prId: 'pr-001',
        prNumber: 'PR-2026-0001',
        rfqId: 'rfq-004',
        poDate: iso(-19),
        expectedDeliveryDate: iso(-7),
        warehouseId: warehouses[0].id,
        stage: 'received',
        paymentTermsDays: 45,
        deliveryTerms: 'Door delivery, freight included',
        incoterm: 'Door delivery',
        currency: 'INR',
        exchangeRate: 1,
        placeOfSupply: 'Maharashtra',
        isInterstate: true,
        items: [
            mkItem('poi-001-1', 'PMP-CF-5HP', 8, 41500, 8),
            mkItem('poi-001-2', 'PMP-CF-7HP', 4, 55800, 4),
        ],
        schedule: [
            { id: 'pos-001-1', poItemId: 'poi-001-1', qty: 8, expectedDate: iso(-7), status: 'completed' },
            { id: 'pos-001-2', poItemId: 'poi-001-2', qty: 4, expectedDate: iso(-7), status: 'completed' },
        ],
        amendments: [],
        freight: 0,
        otherCharges: 0,
        discount: 0,
        approvedBy: 'Aarav Mehta',
        approvedAt: iso(-19),
    },
    {
        id: 'po-002',
        number: 'PO-2026-0002',
        vendorId: 'v-002',
        prId: 'pr-002',
        prNumber: 'PR-2026-0002',
        rfqId: 'rfq-005',
        poDate: iso(-12),
        expectedDeliveryDate: iso(2),
        warehouseId: warehouses[0].id,
        stage: 'partially_received',
        paymentTermsDays: 30,
        deliveryTerms: 'Door delivery',
        incoterm: 'Door delivery',
        currency: 'INR',
        exchangeRate: 1,
        placeOfSupply: 'Maharashtra',
        isInterstate: true,
        items: [
            mkItem('poi-002-1', 'MTR-3P-15HP', 6, 76000, 4),
            mkItem('poi-002-2', 'CTRL-VFD-15HP', 6, 41500, 4),
        ],
        schedule: [
            { id: 'pos-002-1', poItemId: 'poi-002-1', qty: 6, expectedDate: iso(2), status: 'partial' },
            { id: 'pos-002-2', poItemId: 'poi-002-2', qty: 6, expectedDate: iso(2), status: 'partial' },
        ],
        amendments: [],
        freight: 4500,
        otherCharges: 0,
        discount: 0,
        approvedBy: 'Aarav Mehta',
        approvedAt: iso(-12),
    },
    {
        id: 'po-003',
        number: 'PO-2026-0003',
        vendorId: 'v-006',
        prId: 'pr-004',
        prNumber: 'PR-2026-0004',
        rfqId: 'rfq-003',
        poDate: iso(-4),
        expectedDeliveryDate: iso(3),
        warehouseId: warehouses[2].id,
        stage: 'sent',
        paymentTermsDays: 30,
        deliveryTerms: 'Door delivery',
        incoterm: 'Door delivery',
        currency: 'INR',
        exchangeRate: 1,
        placeOfSupply: 'Gujarat',
        isInterstate: false,
        items: [
            mkItem('poi-003-1', 'TNK-FRP-10KL', 2, 130000),
            mkItem('poi-003-2', 'FLT-SAND-24', 4, 52000),
            mkItem('poi-003-3', 'FLT-CARB-24', 4, 57000),
        ],
        schedule: [
            { id: 'pos-003-1', poItemId: 'poi-003-1', qty: 2, expectedDate: iso(3), status: 'pending' },
            { id: 'pos-003-2', poItemId: 'poi-003-2', qty: 4, expectedDate: iso(3), status: 'pending' },
            { id: 'pos-003-3', poItemId: 'poi-003-3', qty: 4, expectedDate: iso(3), status: 'pending' },
        ],
        amendments: [],
        freight: 8500,
        otherCharges: 0,
        discount: 0,
        approvedBy: 'Rohan Iyer',
        approvedAt: iso(-4),
    },
    {
        id: 'po-004',
        number: 'PO-2026-0004',
        vendorId: 'v-008',
        poDate: iso(-3),
        expectedDeliveryDate: iso(0),
        warehouseId: warehouses[0].id,
        stage: 'sent',
        paymentTermsDays: 15,
        deliveryTerms: 'Ex-works, vendor to deliver',
        incoterm: 'EXW',
        currency: 'INR',
        exchangeRate: 1,
        placeOfSupply: 'Gujarat',
        isInterstate: false,
        items: [mkItem('poi-004-1', 'CHEM-ALUM-50KG', 200, 1100)],
        schedule: [{ id: 'pos-004-1', poItemId: 'poi-004-1', qty: 200, expectedDate: iso(0), status: 'pending' }],
        amendments: [],
        freight: 1500,
        otherCharges: 0,
        discount: 0,
        approvedBy: 'Aarav Mehta',
        approvedAt: iso(-3),
    },
    {
        id: 'po-005',
        number: 'PO-2026-0005',
        vendorId: 'v-009',
        prId: 'pr-006',
        prNumber: 'PR-2026-0006',
        poDate: iso(-1),
        expectedDeliveryDate: iso(7),
        warehouseId: warehouses[0].id,
        stage: 'pending_approval',
        paymentTermsDays: 60,
        deliveryTerms: 'Door delivery',
        incoterm: 'Door delivery',
        currency: 'INR',
        exchangeRate: 1,
        placeOfSupply: 'Tamil Nadu',
        isInterstate: true,
        items: [mkItem('poi-005-1', 'PMP-SUB-5HP', 4, 64000)],
        schedule: [{ id: 'pos-005-1', poItemId: 'poi-005-1', qty: 4, expectedDate: iso(7), status: 'pending' }],
        amendments: [],
        freight: 3500,
        otherCharges: 0,
        discount: 0,
    },
    {
        id: 'po-006',
        number: 'PO-2026-0006',
        vendorId: 'v-007',
        prId: 'pr-008',
        prNumber: 'PR-2026-0008',
        poDate: iso(-2),
        expectedDeliveryDate: iso(26),
        warehouseId: warehouses[0].id,
        stage: 'approved',
        paymentTermsDays: 60,
        deliveryTerms: 'CIF Mumbai port',
        incoterm: 'CIF',
        currency: 'USD',
        exchangeRate: 83.4,
        placeOfSupply: 'Gujarat',
        isInterstate: false,
        items: [mkItem('poi-006-1', 'FLT-RO-MEM-4040', 20, 150)],
        schedule: [{ id: 'pos-006-1', poItemId: 'poi-006-1', qty: 20, expectedDate: iso(26), status: 'pending' }],
        amendments: [],
        freight: 12000,
        otherCharges: 4500,
        discount: 0,
        notes: 'Imported — clearing charges via CHA.',
        approvedBy: 'Aarav Mehta',
        approvedAt: iso(-2),
    },
    {
        id: 'po-007',
        number: 'PO-2026-0007',
        vendorId: 'v-004',
        poDate: iso(-30),
        expectedDeliveryDate: iso(-20),
        warehouseId: warehouses[0].id,
        stage: 'closed',
        paymentTermsDays: 30,
        deliveryTerms: 'Door delivery',
        incoterm: 'Door delivery',
        currency: 'INR',
        exchangeRate: 1,
        placeOfSupply: 'Delhi',
        isInterstate: true,
        items: [
            mkItem('poi-007-1', 'PIPE-MS-100-6M', 60, 5050, 60),
            mkItem('poi-007-2', 'PIPE-GI-50-6M', 100, 2870, 100),
        ],
        schedule: [],
        amendments: [],
        freight: 6500,
        otherCharges: 0,
        discount: 0,
        approvedBy: 'Aarav Mehta',
        approvedAt: iso(-30),
    },
    {
        id: 'po-008',
        number: 'PO-2026-0008',
        vendorId: 'v-011',
        poDate: iso(-14),
        expectedDeliveryDate: iso(-13),
        warehouseId: warehouses[0].id,
        stage: 'received',
        paymentTermsDays: 7,
        deliveryTerms: 'Pickup',
        incoterm: 'EXW',
        currency: 'INR',
        exchangeRate: 1,
        placeOfSupply: 'Gujarat',
        isInterstate: false,
        items: [mkItem('poi-008-1', 'INST-LABOR-DAY', 10, 4000, 10)],
        schedule: [],
        amendments: [],
        freight: 0,
        otherCharges: 0,
        discount: 0,
        approvedBy: 'Aarav Mehta',
        approvedAt: iso(-14),
    },
    {
        id: 'po-009',
        number: 'PO-2026-0009',
        vendorId: 'v-001',
        poDate: iso(0),
        expectedDeliveryDate: iso(14),
        warehouseId: warehouses[0].id,
        stage: 'draft',
        paymentTermsDays: 45,
        deliveryTerms: 'Door delivery',
        incoterm: 'Door delivery',
        currency: 'INR',
        exchangeRate: 1,
        placeOfSupply: 'Maharashtra',
        isInterstate: true,
        items: [mkItem('poi-009-1', 'PMP-CF-7HP', 6, 56000)],
        schedule: [{ id: 'pos-009-1', poItemId: 'poi-009-1', qty: 6, expectedDate: iso(14), status: 'pending' }],
        amendments: [],
        freight: 0,
        otherCharges: 0,
        discount: 0,
    },
    {
        id: 'po-010',
        number: 'PO-2026-0010',
        vendorId: 'v-005',
        poDate: iso(-9),
        expectedDeliveryDate: iso(12),
        warehouseId: warehouses[0].id,
        stage: 'sent',
        paymentTermsDays: 45,
        deliveryTerms: 'Door delivery',
        incoterm: 'Door delivery',
        currency: 'INR',
        exchangeRate: 1,
        placeOfSupply: 'Karnataka',
        isInterstate: true,
        items: [mkItem('poi-010-1', 'CTRL-PANEL-50A', 8, 26500)],
        schedule: [{ id: 'pos-010-1', poItemId: 'poi-010-1', qty: 8, expectedDate: iso(12), status: 'pending' }],
        amendments: [
            { id: 'poa-010-1', at: iso(-7), by: 'Rohan Iyer', summary: 'Quantity revised from 6 to 8 (added 2 panels).' },
        ],
        freight: 2200,
        otherCharges: 0,
        discount: 0,
        approvedBy: 'Aarav Mehta',
        approvedAt: iso(-9),
    },
];

export function poById(id: string): PurchaseOrder | undefined {
    return purchaseOrders.find((p) => p.id === id);
}

export function poByNumber(num: string): PurchaseOrder | undefined {
    return purchaseOrders.find((p) => p.number === num);
}

export interface POTotals {
    subtotal: number;
    discount: number;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalGst: number;
    freight: number;
    otherCharges: number;
    grandTotal: number;
    grandTotalBaseCurrency: number;
}

export function poTotals(po: PurchaseOrder): POTotals {
    let subtotal = 0;
    let totalGst = 0;
    for (const it of po.items) {
        const lineNet = it.qty * it.unitPrice * (1 - it.discountPct / 100);
        subtotal += it.qty * it.unitPrice;
        totalGst += lineNet * (it.gstPct / 100);
    }
    const taxableValue = subtotal - po.discount;
    const cgst = po.isInterstate ? 0 : totalGst / 2;
    const sgst = po.isInterstate ? 0 : totalGst / 2;
    const igst = po.isInterstate ? totalGst : 0;
    const grandTotal = taxableValue + totalGst + po.freight + po.otherCharges;
    return {
        subtotal,
        discount: po.discount,
        taxableValue,
        cgst,
        sgst,
        igst,
        totalGst,
        freight: po.freight,
        otherCharges: po.otherCharges,
        grandTotal,
        grandTotalBaseCurrency: grandTotal * po.exchangeRate,
    };
}
