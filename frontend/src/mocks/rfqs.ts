import { products } from './products';

export type RFQStatus = 'draft' | 'sent' | 'quotes_received' | 'awarded' | 'closed' | 'cancelled';

export const RFQ_STATUS_LABEL: Record<RFQStatus, string> = {
    draft: 'Draft',
    sent: 'Sent',
    quotes_received: 'Quotes received',
    awarded: 'Awarded',
    closed: 'Closed',
    cancelled: 'Cancelled',
};

export const RFQ_STATUS_TONE: Record<
    RFQStatus,
    'neutral' | 'sky' | 'blue' | 'emerald' | 'green' | 'red'
> = {
    draft: 'neutral',
    sent: 'sky',
    quotes_received: 'blue',
    awarded: 'emerald',
    closed: 'green',
    cancelled: 'red',
};

export interface RFQItem {
    id: string;
    productId: string;
    sku: string;
    description: string;
    qty: number;
    uom: string;
    targetRate?: number;
}

export interface VendorQuote {
    id: string;
    vendorId: string;
    submittedAt: string | null;
    leadDays: number;
    paymentTermsDays: number;
    validUntil: string;
    notes?: string;
    items: Array<{
        rfqItemId: string;
        unitPrice: number;
        gstPct: number;
        discountPct: number;
        leadDays: number;
        notes?: string;
    }>;
}

export interface RFQ {
    id: string;
    number: string; // RFQ-2026-0001
    prId: string;
    prNumber: string;
    raisedAt: string;
    closingDate: string;
    status: RFQStatus;
    invitedVendorIds: string[];
    items: RFQItem[];
    quotes: VendorQuote[];
    awardedQuoteId?: string;
    awardSplit?: Array<{ vendorId: string; rfqItemId: string; qty: number }>; // for split awards
    notes?: string;
}

const TODAY = Date.now();
const iso = (offsetDays: number) =>
    new Date(TODAY + offsetDays * 86_400_000).toISOString();

const mkRFQItem = (
    id: string,
    sku: string,
    qty: number,
    targetRate?: number,
): RFQItem => {
    const p = products.find((x) => x.sku === sku);
    return {
        id,
        productId: p?.id ?? 'p-1',
        sku,
        description: p?.name ?? sku,
        qty,
        uom: p?.uom ?? 'pcs',
        targetRate,
    };
};

export const rfqs: RFQ[] = [
    {
        id: 'rfq-001',
        number: 'RFQ-2026-0001',
        prId: 'pr-003',
        prNumber: 'PR-2026-0003',
        raisedAt: iso(-11),
        closingDate: iso(-2),
        status: 'quotes_received',
        invitedVendorIds: ['v-003', 'v-004', 'v-011'],
        items: [
            mkRFQItem('rqi-001-1', 'VLV-BTF-100', 30, 7600),
            mkRFQItem('rqi-001-2', 'VLV-BTF-150', 20, 11000),
            mkRFQItem('rqi-001-3', 'VLV-GT-50', 60, 3500),
        ],
        quotes: [
            {
                id: 'vq-001-1',
                vendorId: 'v-003',
                submittedAt: iso(-6),
                leadDays: 14,
                paymentTermsDays: 60,
                validUntil: iso(20),
                items: [
                    { rfqItemId: 'rqi-001-1', unitPrice: 7400, gstPct: 18, discountPct: 0, leadDays: 14 },
                    { rfqItemId: 'rqi-001-2', unitPrice: 10800, gstPct: 18, discountPct: 0, leadDays: 14 },
                    { rfqItemId: 'rqi-001-3', unitPrice: 3450, gstPct: 18, discountPct: 0, leadDays: 14 },
                ],
            },
            {
                id: 'vq-001-2',
                vendorId: 'v-004',
                submittedAt: iso(-5),
                leadDays: 10,
                paymentTermsDays: 30,
                validUntil: iso(25),
                notes: 'Bulk discount available on Butterfly 100.',
                items: [
                    { rfqItemId: 'rqi-001-1', unitPrice: 7250, gstPct: 18, discountPct: 2, leadDays: 10 },
                    { rfqItemId: 'rqi-001-2', unitPrice: 11200, gstPct: 18, discountPct: 0, leadDays: 10 },
                    { rfqItemId: 'rqi-001-3', unitPrice: 3600, gstPct: 18, discountPct: 0, leadDays: 10 },
                ],
            },
            {
                id: 'vq-001-3',
                vendorId: 'v-011',
                submittedAt: iso(-4),
                leadDays: 4,
                paymentTermsDays: 7,
                validUntil: iso(15),
                items: [
                    { rfqItemId: 'rqi-001-1', unitPrice: 7800, gstPct: 18, discountPct: 0, leadDays: 4 },
                    { rfqItemId: 'rqi-001-2', unitPrice: 11500, gstPct: 18, discountPct: 0, leadDays: 4 },
                    { rfqItemId: 'rqi-001-3', unitPrice: 3400, gstPct: 18, discountPct: 0, leadDays: 4 },
                ],
            },
        ],
        notes: 'Comparison ready — pending award decision.',
    },
    {
        id: 'rfq-002',
        number: 'RFQ-2026-0002',
        prId: 'pr-005',
        prNumber: 'PR-2026-0005',
        raisedAt: iso(-6),
        closingDate: iso(2),
        status: 'sent',
        invitedVendorIds: ['v-004', 'v-011'],
        items: [
            mkRFQItem('rqi-002-1', 'PIPE-MS-100-6M', 60, 5100),
            mkRFQItem('rqi-002-2', 'PIPE-GI-50-6M', 100, 2900),
        ],
        quotes: [
            {
                id: 'vq-002-1',
                vendorId: 'v-004',
                submittedAt: iso(-3),
                leadDays: 8,
                paymentTermsDays: 30,
                validUntil: iso(20),
                items: [
                    { rfqItemId: 'rqi-002-1', unitPrice: 5050, gstPct: 18, discountPct: 0, leadDays: 8 },
                    { rfqItemId: 'rqi-002-2', unitPrice: 2870, gstPct: 18, discountPct: 0, leadDays: 8 },
                ],
            },
        ],
    },
    {
        id: 'rfq-003',
        number: 'RFQ-2026-0003',
        prId: 'pr-004',
        prNumber: 'PR-2026-0004',
        raisedAt: iso(-8),
        closingDate: iso(-1),
        status: 'awarded',
        invitedVendorIds: ['v-006', 'v-007'],
        items: [
            mkRFQItem('rqi-003-1', 'TNK-FRP-10KL', 2, 132000),
            mkRFQItem('rqi-003-2', 'FLT-SAND-24', 4, 51000),
            mkRFQItem('rqi-003-3', 'FLT-CARB-24', 4, 56000),
        ],
        quotes: [
            {
                id: 'vq-003-1',
                vendorId: 'v-006',
                submittedAt: iso(-5),
                leadDays: 7,
                paymentTermsDays: 30,
                validUntil: iso(25),
                items: [
                    { rfqItemId: 'rqi-003-1', unitPrice: 130000, gstPct: 18, discountPct: 0, leadDays: 7 },
                    { rfqItemId: 'rqi-003-2', unitPrice: 52000, gstPct: 18, discountPct: 0, leadDays: 7 },
                    { rfqItemId: 'rqi-003-3', unitPrice: 57000, gstPct: 18, discountPct: 0, leadDays: 7 },
                ],
            },
            {
                id: 'vq-003-2',
                vendorId: 'v-007',
                submittedAt: iso(-4),
                leadDays: 28,
                paymentTermsDays: 60,
                validUntil: iso(30),
                items: [
                    { rfqItemId: 'rqi-003-1', unitPrice: 128000, gstPct: 18, discountPct: 0, leadDays: 28 },
                    { rfqItemId: 'rqi-003-2', unitPrice: 50500, gstPct: 18, discountPct: 0, leadDays: 28 },
                    { rfqItemId: 'rqi-003-3', unitPrice: 55500, gstPct: 18, discountPct: 0, leadDays: 28 },
                ],
            },
        ],
        awardedQuoteId: 'vq-003-1',
    },
    {
        id: 'rfq-004',
        number: 'RFQ-2026-0004',
        prId: 'pr-001',
        prNumber: 'PR-2026-0001',
        raisedAt: iso(-21),
        closingDate: iso(-15),
        status: 'closed',
        invitedVendorIds: ['v-001', 'v-009'],
        items: [
            mkRFQItem('rqi-004-1', 'PMP-CF-5HP', 8),
            mkRFQItem('rqi-004-2', 'PMP-CF-7HP', 4),
        ],
        quotes: [
            {
                id: 'vq-004-1',
                vendorId: 'v-001',
                submittedAt: iso(-18),
                leadDays: 12,
                paymentTermsDays: 45,
                validUntil: iso(-5),
                items: [
                    { rfqItemId: 'rqi-004-1', unitPrice: 41500, gstPct: 18, discountPct: 0, leadDays: 12 },
                    { rfqItemId: 'rqi-004-2', unitPrice: 55800, gstPct: 18, discountPct: 0, leadDays: 12 },
                ],
            },
        ],
        awardedQuoteId: 'vq-004-1',
    },
    {
        id: 'rfq-005',
        number: 'RFQ-2026-0005',
        prId: 'pr-002',
        prNumber: 'PR-2026-0002',
        raisedAt: iso(-17),
        closingDate: iso(-12),
        status: 'closed',
        invitedVendorIds: ['v-002', 'v-005'],
        items: [
            mkRFQItem('rqi-005-1', 'MTR-3P-15HP', 6),
            mkRFQItem('rqi-005-2', 'CTRL-VFD-15HP', 6),
        ],
        quotes: [
            {
                id: 'vq-005-1',
                vendorId: 'v-002',
                submittedAt: iso(-14),
                leadDays: 14,
                paymentTermsDays: 30,
                validUntil: iso(-5),
                items: [
                    { rfqItemId: 'rqi-005-1', unitPrice: 76000, gstPct: 18, discountPct: 0, leadDays: 14 },
                    { rfqItemId: 'rqi-005-2', unitPrice: 41500, gstPct: 18, discountPct: 0, leadDays: 14 },
                ],
            },
            {
                id: 'vq-005-2',
                vendorId: 'v-005',
                submittedAt: iso(-13),
                leadDays: 21,
                paymentTermsDays: 45,
                validUntil: iso(-3),
                items: [
                    { rfqItemId: 'rqi-005-1', unitPrice: 78000, gstPct: 18, discountPct: 0, leadDays: 21 },
                    { rfqItemId: 'rqi-005-2', unitPrice: 41000, gstPct: 18, discountPct: 0, leadDays: 21 },
                ],
            },
        ],
        awardedQuoteId: 'vq-005-1',
    },
    {
        id: 'rfq-006',
        number: 'RFQ-2026-0006',
        prId: 'pr-008',
        prNumber: 'PR-2026-0008',
        raisedAt: iso(-3),
        closingDate: iso(7),
        status: 'draft',
        invitedVendorIds: ['v-007'],
        items: [mkRFQItem('rqi-006-1', 'FLT-RO-MEM-4040', 20)],
        quotes: [],
    },
];

export function rfqById(id: string): RFQ | undefined {
    return rfqs.find((r) => r.id === id);
}

export interface QuoteLineSummary {
    rfqItemId: string;
    bestVendorId: string | null;
    bestUnitPrice: number | null;
    fastestVendorId: string | null;
    fastestLeadDays: number | null;
}

export function compareQuotes(rfq: RFQ): QuoteLineSummary[] {
    return rfq.items.map((it) => {
        const lines = rfq.quotes
            .map((q) => ({
                vendorId: q.vendorId,
                line: q.items.find((qi) => qi.rfqItemId === it.id),
            }))
            .filter((x) => x.line) as Array<{
                vendorId: string;
                line: NonNullable<VendorQuote['items'][number]>;
            }>;
        if (!lines.length) {
            return { rfqItemId: it.id, bestVendorId: null, bestUnitPrice: null, fastestVendorId: null, fastestLeadDays: null };
        }
        const best = lines.reduce((a, b) => (a.line.unitPrice <= b.line.unitPrice ? a : b));
        const fastest = lines.reduce((a, b) => (a.line.leadDays <= b.line.leadDays ? a : b));
        return {
            rfqItemId: it.id,
            bestVendorId: best.vendorId,
            bestUnitPrice: best.line.unitPrice,
            fastestVendorId: fastest.vendorId,
            fastestLeadDays: fastest.line.leadDays,
        };
    });
}
