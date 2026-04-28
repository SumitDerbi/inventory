import { purchaseOrders } from './purchase-orders';
import { grns } from './grns';

export type InvoiceStatus =
    | 'draft'
    | 'pending_match'
    | 'matched'
    | 'mismatch'
    | 'approved'
    | 'paid'
    | 'partially_paid'
    | 'overdue'
    | 'cancelled';

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
    draft: 'Draft',
    pending_match: 'Pending match',
    matched: 'Matched',
    mismatch: 'Mismatch',
    approved: 'Approved',
    paid: 'Paid',
    partially_paid: 'Partially paid',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
};

export const INVOICE_STATUS_TONE: Record<
    InvoiceStatus,
    'neutral' | 'amber' | 'sky' | 'red' | 'blue' | 'emerald' | 'green' | 'orange'
> = {
    draft: 'neutral',
    pending_match: 'amber',
    matched: 'sky',
    mismatch: 'red',
    approved: 'blue',
    paid: 'emerald',
    partially_paid: 'amber',
    overdue: 'orange',
    cancelled: 'red',
};

export interface VendorInvoiceItem {
    id: string;
    poItemId?: string;
    grnItemId?: string;
    productId: string;
    sku: string;
    description: string;
    qty: number;
    unitPrice: number;
    discountPct: number;
    gstPct: number;
    uom: string;
    poUnitPrice?: number; // for variance check
    grnAcceptedQty?: number;
}

export interface MatchVariance {
    field: 'qty' | 'unitPrice' | 'lineTotal';
    invoiceItemId: string;
    invoiceValue: number;
    expectedValue: number;
    variance: number;
}

export interface VendorInvoice {
    id: string;
    number: string; // INV-2026-0001 (vendor's number)
    internalRef: string; // VI-2026-0001
    vendorId: string;
    poId?: string;
    poNumber?: string;
    grnIds: string[];
    invoiceDate: string;
    receivedDate: string;
    dueDate: string;
    status: InvoiceStatus;
    currency: 'INR' | 'USD' | 'EUR';
    exchangeRate: number;
    items: VendorInvoiceItem[];
    freight: number;
    otherCharges: number;
    tdsPct: number;
    notes?: string;
    matchOverride?: { by: string; at: string; reason: string };
    variances?: MatchVariance[];
    paidAmount: number;
}

const TODAY = Date.now();
const iso = (offsetDays: number) =>
    new Date(TODAY + offsetDays * 86_400_000).toISOString();

const itemFromPO = (
    id: string,
    poItemId: string,
    qty: number,
    unitPrice: number,
    grnAccepted = qty,
): VendorInvoiceItem => {
    const po = purchaseOrders.find((o) => o.items.some((i) => i.id === poItemId));
    const it = po?.items.find((i) => i.id === poItemId);
    return {
        id,
        poItemId,
        productId: it?.productId ?? 'p-1',
        sku: it?.sku ?? '',
        description: it?.description ?? '',
        qty,
        unitPrice,
        discountPct: 0,
        gstPct: it?.gstPct ?? 18,
        uom: it?.uom ?? 'pcs',
        poUnitPrice: it?.unitPrice,
        grnAcceptedQty: grnAccepted,
    };
};

export const vendorInvoices: VendorInvoice[] = [
    {
        id: 'vi-001',
        number: 'KIRL/2026/2231',
        internalRef: 'VI-2026-0001',
        vendorId: 'v-001',
        poId: 'po-001',
        poNumber: 'PO-2026-0001',
        grnIds: ['grn-001'],
        invoiceDate: iso(-7),
        receivedDate: iso(-6),
        dueDate: iso(38),
        status: 'paid',
        currency: 'INR',
        exchangeRate: 1,
        items: [
            itemFromPO('vii-001-1', 'poi-001-1', 8, 41500),
            itemFromPO('vii-001-2', 'poi-001-2', 4, 55800),
        ],
        freight: 0,
        otherCharges: 0,
        tdsPct: 0,
        paidAmount: 0,
    },
    {
        id: 'vi-002',
        number: 'CGM/2026/0892',
        internalRef: 'VI-2026-0002',
        vendorId: 'v-002',
        poId: 'po-002',
        poNumber: 'PO-2026-0002',
        grnIds: ['grn-002'],
        invoiceDate: iso(-3),
        receivedDate: iso(-2),
        dueDate: iso(27),
        status: 'partially_paid',
        currency: 'INR',
        exchangeRate: 1,
        items: [
            itemFromPO('vii-002-1', 'poi-002-1', 4, 76000),
            itemFromPO('vii-002-2', 'poi-002-2', 4, 41500),
        ],
        freight: 4500,
        otherCharges: 0,
        tdsPct: 0,
        paidAmount: 0,
    },
    {
        id: 'vi-003',
        number: 'JSAW/INV/2026/00211',
        internalRef: 'VI-2026-0003',
        vendorId: 'v-004',
        poId: 'po-007',
        poNumber: 'PO-2026-0007',
        grnIds: ['grn-003'],
        invoiceDate: iso(-21),
        receivedDate: iso(-20),
        dueDate: iso(9),
        status: 'overdue',
        currency: 'INR',
        exchangeRate: 1,
        items: [
            itemFromPO('vii-003-1', 'poi-007-1', 60, 5050),
            itemFromPO('vii-003-2', 'poi-007-2', 100, 2870),
        ],
        freight: 6500,
        otherCharges: 0,
        tdsPct: 0,
        paidAmount: 0,
    },
    {
        id: 'vi-004',
        number: 'LH-INV-554',
        internalRef: 'VI-2026-0004',
        vendorId: 'v-011',
        poId: 'po-008',
        poNumber: 'PO-2026-0008',
        grnIds: ['grn-004'],
        invoiceDate: iso(-13),
        receivedDate: iso(-12),
        dueDate: iso(-5),
        status: 'paid',
        currency: 'INR',
        exchangeRate: 1,
        items: [itemFromPO('vii-004-1', 'poi-008-1', 10, 4000)],
        freight: 0,
        otherCharges: 0,
        tdsPct: 10,
        paidAmount: 0,
    },
    {
        id: 'vi-005',
        number: 'AC-2026-115',
        internalRef: 'VI-2026-0005',
        vendorId: 'v-008',
        poId: 'po-004',
        poNumber: 'PO-2026-0004',
        grnIds: ['grn-006'],
        invoiceDate: iso(0),
        receivedDate: iso(0),
        dueDate: iso(15),
        status: 'mismatch',
        currency: 'INR',
        exchangeRate: 1,
        items: [
            { ...itemFromPO('vii-005-1', 'poi-004-1', 200, 1180, 195) },
        ],
        freight: 1500,
        otherCharges: 0,
        tdsPct: 0,
        notes: 'Vendor billed full 200 bags @ ₹1,180 — but PO rate is ₹1,100 and GRN accepted 195.',
        variances: [
            { field: 'unitPrice', invoiceItemId: 'vii-005-1', invoiceValue: 1180, expectedValue: 1100, variance: 80 },
            { field: 'qty', invoiceItemId: 'vii-005-1', invoiceValue: 200, expectedValue: 195, variance: 5 },
        ],
        paidAmount: 0,
    },
    {
        id: 'vi-006',
        number: 'CGM/2026/0915',
        internalRef: 'VI-2026-0006',
        vendorId: 'v-002',
        poId: 'po-002',
        poNumber: 'PO-2026-0002',
        grnIds: ['grn-005'],
        invoiceDate: iso(-1),
        receivedDate: iso(-1),
        dueDate: iso(29),
        status: 'pending_match',
        currency: 'INR',
        exchangeRate: 1,
        items: [
            itemFromPO('vii-006-1', 'poi-002-1', 2, 76000, 0),
            itemFromPO('vii-006-2', 'poi-002-2', 2, 41500, 0),
        ],
        freight: 0,
        otherCharges: 0,
        tdsPct: 0,
        notes: 'Awaiting GRN-005 QC completion before 3-way match.',
        paidAmount: 0,
    },
    {
        id: 'vi-007',
        number: 'KIRL/2026/2580',
        internalRef: 'VI-2026-0007',
        vendorId: 'v-001',
        invoiceDate: iso(-2),
        receivedDate: iso(-1),
        dueDate: iso(43),
        status: 'matched',
        currency: 'INR',
        exchangeRate: 1,
        items: [
            { id: 'vii-007-1', productId: 'p-1', sku: 'PMP-CF-5HP', description: 'Centrifugal Pump 5 HP', qty: 4, unitPrice: 41500, discountPct: 0, gstPct: 18, uom: 'pcs' },
        ],
        freight: 0,
        otherCharges: 0,
        tdsPct: 0,
        grnIds: [],
        notes: 'Independent invoice — being matched to PO-2026-0009 in draft.',
        paidAmount: 0,
    },
];

export function invoiceById(id: string): VendorInvoice | undefined {
    return vendorInvoices.find((v) => v.id === id);
}

export function invoiceLineTotal(it: VendorInvoiceItem): number {
    const net = it.qty * it.unitPrice * (1 - it.discountPct / 100);
    return net + net * (it.gstPct / 100);
}

export function invoiceTotal(inv: VendorInvoice): number {
    const sub = inv.items.reduce((s, it) => s + invoiceLineTotal(it), 0);
    return sub + inv.freight + inv.otherCharges;
}

export function invoiceTds(inv: VendorInvoice): number {
    if (!inv.tdsPct) return 0;
    const taxable = inv.items.reduce(
        (s, it) => s + it.qty * it.unitPrice * (1 - it.discountPct / 100),
        0,
    );
    return taxable * (inv.tdsPct / 100);
}

export function invoiceOutstanding(inv: VendorInvoice): number {
    return Math.max(0, invoiceTotal(inv) - invoiceTds(inv) - inv.paidAmount);
}

export interface AgingBuckets {
    current: number;
    d0_30: number;
    d31_60: number;
    d61_90: number;
    d90_plus: number;
    total: number;
}

export function payableAging(now = new Date()): AgingBuckets {
    const buckets: AgingBuckets = { current: 0, d0_30: 0, d31_60: 0, d61_90: 0, d90_plus: 0, total: 0 };
    for (const inv of vendorInvoices) {
        if (['paid', 'cancelled', 'draft'].includes(inv.status)) continue;
        const due = new Date(inv.dueDate);
        const days = Math.floor((now.getTime() - due.getTime()) / 86_400_000);
        const out = invoiceOutstanding(inv);
        buckets.total += out;
        if (days < 0) buckets.current += out;
        else if (days <= 30) buckets.d0_30 += out;
        else if (days <= 60) buckets.d31_60 += out;
        else if (days <= 90) buckets.d61_90 += out;
        else buckets.d90_plus += out;
    }
    return buckets;
}

void grns;
