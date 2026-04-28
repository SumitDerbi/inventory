import { products } from './products';

export type ReturnReason =
    | 'damaged'
    | 'wrong_item'
    | 'quality_failure'
    | 'short_supply'
    | 'over_supply'
    | 'expired';

export const RETURN_REASON_LABEL: Record<ReturnReason, string> = {
    damaged: 'Damaged',
    wrong_item: 'Wrong item',
    quality_failure: 'Quality failure',
    short_supply: 'Short supply',
    over_supply: 'Over supply',
    expired: 'Expired',
};

export type ReturnStatus = 'draft' | 'approved' | 'shipped' | 'credit_received' | 'closed' | 'cancelled';

export const RETURN_STATUS_LABEL: Record<ReturnStatus, string> = {
    draft: 'Draft',
    approved: 'Approved',
    shipped: 'Shipped',
    credit_received: 'Credit received',
    closed: 'Closed',
    cancelled: 'Cancelled',
};

export const RETURN_STATUS_TONE: Record<
    ReturnStatus,
    'neutral' | 'sky' | 'blue' | 'emerald' | 'green' | 'red'
> = {
    draft: 'neutral',
    approved: 'sky',
    shipped: 'blue',
    credit_received: 'emerald',
    closed: 'green',
    cancelled: 'red',
};

export interface ReturnItem {
    id: string;
    productId: string;
    sku: string;
    description: string;
    qty: number;
    uom: string;
    unitPrice: number;
    reason: ReturnReason;
    notes?: string;
}

export interface PurchaseReturn {
    id: string;
    number: string; // PRT-2026-0001
    vendorId: string;
    poId?: string;
    poNumber?: string;
    grnId?: string;
    grnNumber?: string;
    debitNoteRef?: string;
    creditNoteRef?: string;
    raisedAt: string;
    status: ReturnStatus;
    reason: ReturnReason;
    items: ReturnItem[];
    notes?: string;
}

const TODAY = Date.now();
const iso = (offsetDays: number) =>
    new Date(TODAY + offsetDays * 86_400_000).toISOString();

const lookup = (sku: string) => products.find((p) => p.sku === sku);

export const purchaseReturns: PurchaseReturn[] = [
    {
        id: 'prt-001',
        number: 'PRT-2026-0001',
        vendorId: 'v-008',
        poId: 'po-004',
        poNumber: 'PO-2026-0004',
        grnId: 'grn-006',
        grnNumber: 'GRN-2026-0006',
        debitNoteRef: 'DN-2026-0001',
        raisedAt: iso(0),
        status: 'approved',
        reason: 'damaged',
        items: [
            {
                id: 'pri-001-1',
                productId: lookup('CHEM-ALUM-50KG')?.id ?? 'p-18',
                sku: 'CHEM-ALUM-50KG',
                description: 'Alum (50 kg bag)',
                qty: 5,
                uom: 'bags',
                unitPrice: 1100,
                reason: 'damaged',
                notes: '5 bags torn during transit.',
            },
        ],
        notes: 'Vendor agreed to credit note; replacement requested.',
    },
    {
        id: 'prt-002',
        number: 'PRT-2026-0002',
        vendorId: 'v-002',
        poId: 'po-002',
        poNumber: 'PO-2026-0002',
        grnId: 'grn-002',
        debitNoteRef: 'DN-2026-0002',
        creditNoteRef: 'CGM/CN/2026/0042',
        raisedAt: iso(-2),
        status: 'credit_received',
        reason: 'quality_failure',
        items: [
            {
                id: 'pri-002-1',
                productId: lookup('MTR-3P-15HP')?.id ?? 'p-5',
                sku: 'MTR-3P-15HP',
                description: 'Induction Motor 15 HP',
                qty: 1,
                uom: 'pcs',
                unitPrice: 76000,
                reason: 'quality_failure',
                notes: 'Coil insulation failed Megger test.',
            },
        ],
    },
    {
        id: 'prt-003',
        number: 'PRT-2026-0003',
        vendorId: 'v-011',
        grnId: 'grn-d-001',
        debitNoteRef: 'DN-2026-0003',
        raisedAt: iso(-3),
        status: 'shipped',
        reason: 'wrong_item',
        items: [
            {
                id: 'pri-003-1',
                productId: lookup('PIPE-GI-50-6M')?.id ?? 'p-10',
                sku: 'PIPE-GI-50-6M',
                description: 'GI Pipe 50 mm × 6 m',
                qty: 2,
                uom: 'nos',
                unitPrice: 3100,
                reason: 'wrong_item',
                notes: 'Wrong class supplied (Class A vs Class B).',
            },
        ],
    },
    {
        id: 'prt-004',
        number: 'PRT-2026-0004',
        vendorId: 'v-007',
        poId: 'po-006',
        poNumber: 'PO-2026-0006',
        debitNoteRef: 'DN-2026-0004',
        raisedAt: iso(-1),
        status: 'draft',
        reason: 'expired',
        items: [
            {
                id: 'pri-004-1',
                productId: lookup('FLT-RO-MEM-4040')?.id ?? 'p-17',
                sku: 'FLT-RO-MEM-4040',
                description: 'RO Membrane 4040',
                qty: 2,
                uom: 'pcs',
                unitPrice: 12500,
                reason: 'expired',
                notes: 'Manufacturing date older than acceptance window.',
            },
        ],
    },
    {
        id: 'prt-005',
        number: 'PRT-2026-0005',
        vendorId: 'v-001',
        poId: 'po-001',
        poNumber: 'PO-2026-0001',
        grnId: 'grn-001',
        creditNoteRef: 'KIRL/CN/2026/0009',
        raisedAt: iso(-15),
        status: 'closed',
        reason: 'short_supply',
        items: [
            {
                id: 'pri-005-1',
                productId: lookup('PMP-CF-5HP')?.id ?? 'p-1',
                sku: 'PMP-CF-5HP',
                description: 'Centrifugal Pump 5 HP',
                qty: 1,
                uom: 'pcs',
                unitPrice: 41500,
                reason: 'short_supply',
            },
        ],
    },
];

export function returnById(id: string): PurchaseReturn | undefined {
    return purchaseReturns.find((r) => r.id === id);
}

export function returnsByVendor(vendorId: string): PurchaseReturn[] {
    return purchaseReturns.filter((r) => r.vendorId === vendorId);
}

export function returnTotal(r: PurchaseReturn): number {
    return r.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
}
