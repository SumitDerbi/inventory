import { products } from './products';
import { warehouses } from './warehouses';
import { purchaseOrders, poById } from './purchase-orders';

export type GRNStage = 'draft' | 'received' | 'qc_pending' | 'qc_complete' | 'posted' | 'cancelled';

export const GRN_STAGE_LABEL: Record<GRNStage, string> = {
    draft: 'Draft',
    received: 'Received',
    qc_pending: 'QC pending',
    qc_complete: 'QC complete',
    posted: 'Posted to stock',
    cancelled: 'Cancelled',
};

export const GRN_STAGE_TONE: Record<
    GRNStage,
    'neutral' | 'amber' | 'sky' | 'blue' | 'emerald' | 'green' | 'red'
> = {
    draft: 'neutral',
    received: 'sky',
    qc_pending: 'amber',
    qc_complete: 'blue',
    posted: 'emerald',
    cancelled: 'red',
};

export type QCDecision = 'pending' | 'accept' | 'reject' | 'hold';

export const QC_DECISION_LABEL: Record<QCDecision, string> = {
    pending: 'Pending',
    accept: 'Accept',
    reject: 'Reject',
    hold: 'Hold',
};

export const QC_DECISION_TONE: Record<QCDecision, 'neutral' | 'emerald' | 'red' | 'amber'> = {
    pending: 'neutral',
    accept: 'emerald',
    reject: 'red',
    hold: 'amber',
};

export interface GRNItem {
    id: string;
    poItemId: string;
    productId: string;
    sku: string;
    description: string;
    orderedQty: number;
    previouslyReceivedQty: number;
    receivedQty: number;
    acceptedQty: number;
    rejectedQty: number;
    onHoldQty: number;
    qcDecision: QCDecision;
    qcRemarks?: string;
    batchNumber?: string;
    expiryDate?: string;
    uom: string;
}

export interface GRN {
    id: string;
    number: string; // GRN-2026-0001
    poId: string;
    poNumber: string;
    vendorId: string;
    receivedAt: string;
    receivedBy: string;
    warehouseId: string;
    stage: GRNStage;
    invoiceRef?: string; // Vendor's delivery note / invoice ref provided at gate
    vehicleNumber?: string;
    notes?: string;
    items: GRNItem[];
    isDirect?: boolean; // direct GRN without PO
}

const TODAY = Date.now();
const iso = (offsetDays: number) =>
    new Date(TODAY + offsetDays * 86_400_000).toISOString();

const lookupBySku = (sku: string) => products.find((p) => p.sku === sku);

const grnItemFromPO = (
    id: string,
    poItemId: string,
    receivedQty: number,
    accepted = receivedQty,
    rejected = 0,
    onHold = 0,
    qc: QCDecision = 'accept',
    prev = 0,
): GRNItem => {
    const po = purchaseOrders.find((o) => o.items.some((i) => i.id === poItemId));
    const it = po?.items.find((i) => i.id === poItemId);
    return {
        id,
        poItemId,
        productId: it?.productId ?? 'p-1',
        sku: it?.sku ?? '',
        description: it?.description ?? '',
        orderedQty: it?.qty ?? 0,
        previouslyReceivedQty: prev,
        receivedQty,
        acceptedQty: accepted,
        rejectedQty: rejected,
        onHoldQty: onHold,
        qcDecision: qc,
        uom: it?.uom ?? 'pcs',
    };
};

export const grns: GRN[] = [
    {
        id: 'grn-001',
        number: 'GRN-2026-0001',
        poId: 'po-001',
        poNumber: 'PO-2026-0001',
        vendorId: 'v-001',
        receivedAt: iso(-7),
        receivedBy: 'u-5',
        warehouseId: warehouses[0].id,
        stage: 'posted',
        invoiceRef: 'KIRL/2026/2231',
        vehicleNumber: 'MH-12-AB-4421',
        items: [
            grnItemFromPO('grni-001-1', 'poi-001-1', 8, 8),
            grnItemFromPO('grni-001-2', 'poi-001-2', 4, 4),
        ],
    },
    {
        id: 'grn-002',
        number: 'GRN-2026-0002',
        poId: 'po-002',
        poNumber: 'PO-2026-0002',
        vendorId: 'v-002',
        receivedAt: iso(-3),
        receivedBy: 'u-5',
        warehouseId: warehouses[0].id,
        stage: 'posted',
        invoiceRef: 'CGM/2026/0892',
        vehicleNumber: 'MH-04-XY-9911',
        items: [
            grnItemFromPO('grni-002-1', 'poi-002-1', 4, 4),
            grnItemFromPO('grni-002-2', 'poi-002-2', 4, 4),
        ],
    },
    {
        id: 'grn-003',
        number: 'GRN-2026-0003',
        poId: 'po-007',
        poNumber: 'PO-2026-0007',
        vendorId: 'v-004',
        receivedAt: iso(-21),
        receivedBy: 'u-5',
        warehouseId: warehouses[0].id,
        stage: 'posted',
        invoiceRef: 'JSAW/INV/2026/00211',
        items: [
            grnItemFromPO('grni-003-1', 'poi-007-1', 60, 60),
            grnItemFromPO('grni-003-2', 'poi-007-2', 100, 100),
        ],
    },
    {
        id: 'grn-004',
        number: 'GRN-2026-0004',
        poId: 'po-008',
        poNumber: 'PO-2026-0008',
        vendorId: 'v-011',
        receivedAt: iso(-13),
        receivedBy: 'u-5',
        warehouseId: warehouses[0].id,
        stage: 'posted',
        invoiceRef: 'LH-INV-554',
        items: [grnItemFromPO('grni-004-1', 'poi-008-1', 10, 10)],
    },
    {
        id: 'grn-005',
        number: 'GRN-2026-0005',
        poId: 'po-002',
        poNumber: 'PO-2026-0002',
        vendorId: 'v-002',
        receivedAt: iso(-1),
        receivedBy: 'u-5',
        warehouseId: warehouses[0].id,
        stage: 'qc_pending',
        invoiceRef: 'CGM/2026/0915',
        vehicleNumber: 'MH-04-XY-7702',
        notes: 'Awaiting QC sign-off on motor coil tests.',
        items: [
            { ...grnItemFromPO('grni-005-1', 'poi-002-1', 2, 0, 0, 0, 'pending', 4), qcDecision: 'pending' },
            { ...grnItemFromPO('grni-005-2', 'poi-002-2', 2, 0, 0, 0, 'pending', 4), qcDecision: 'pending' },
        ],
    },
    {
        id: 'grn-006',
        number: 'GRN-2026-0006',
        poId: 'po-004',
        poNumber: 'PO-2026-0004',
        vendorId: 'v-008',
        receivedAt: iso(0),
        receivedBy: 'u-5',
        warehouseId: warehouses[0].id,
        stage: 'qc_complete',
        invoiceRef: 'AC-2026-115',
        notes: '5 bags damaged in transit — flagged for return.',
        items: [
            grnItemFromPO('grni-006-1', 'poi-004-1', 200, 195, 5, 0, 'accept'),
        ],
    },
    {
        id: 'grn-007',
        number: 'GRN-2026-0007',
        poId: 'po-010',
        poNumber: 'PO-2026-0010',
        vendorId: 'v-005',
        receivedAt: iso(-2),
        receivedBy: 'u-5',
        warehouseId: warehouses[0].id,
        stage: 'received',
        invoiceRef: 'SE/IN/2026/9921',
        items: [
            { ...grnItemFromPO('grni-007-1', 'poi-010-1', 8, 0, 0, 0, 'pending'), qcDecision: 'pending' },
        ],
    },
    {
        id: 'grn-008',
        number: 'GRN-2026-0008',
        poId: 'po-001',
        poNumber: 'PO-2026-0001',
        vendorId: 'v-001',
        receivedAt: iso(-30),
        receivedBy: 'u-5',
        warehouseId: warehouses[0].id,
        stage: 'posted',
        invoiceRef: 'KIRL/2026/1881',
        items: [grnItemFromPO('grni-008-1', 'poi-001-1', 0, 0)],
        notes: 'Reference closed GRN — empty for legacy data.',
    },
];

// Direct GRN without PO (rare emergency case)
const direct: GRN = {
    id: 'grn-d-001',
    number: 'GRN-DIR-2026-0001',
    poId: '',
    poNumber: '',
    vendorId: 'v-011',
    receivedAt: iso(-5),
    receivedBy: 'u-5',
    warehouseId: warehouses[0].id,
    stage: 'qc_complete',
    isDirect: true,
    invoiceRef: 'LH-CASH-221',
    notes: 'Emergency cash purchase — fasteners.',
    items: [
        {
            id: 'grni-d-1',
            poItemId: '',
            productId: lookupBySku('PIPE-GI-50-6M')?.id ?? 'p-1',
            sku: 'PIPE-GI-50-6M',
            description: lookupBySku('PIPE-GI-50-6M')?.name ?? 'GI Pipe',
            orderedQty: 0,
            previouslyReceivedQty: 0,
            receivedQty: 5,
            acceptedQty: 5,
            rejectedQty: 0,
            onHoldQty: 0,
            qcDecision: 'accept',
            uom: 'nos',
        },
    ],
};
grns.push(direct);

export function grnById(id: string): GRN | undefined {
    return grns.find((g) => g.id === id);
}

export function grnsByPo(poId: string): GRN[] {
    return grns.filter((g) => g.poId === poId);
}

export function grnSummary() {
    const total = grns.length;
    const qcPending = grns.filter((g) => g.stage === 'qc_pending').length;
    const awaitingPost = grns.filter((g) => g.stage === 'qc_complete').length;
    const posted = grns.filter((g) => g.stage === 'posted').length;
    return { total, qcPending, awaitingPost, posted };
}

export function grnItemPostable(item: GRNItem): boolean {
    return item.qcDecision !== 'pending';
}

export function grnPostable(grn: GRN): boolean {
    return grn.items.every(grnItemPostable);
}

// silence unused
void poById;
