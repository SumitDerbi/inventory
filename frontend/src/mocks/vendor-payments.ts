import { invoiceById, vendorInvoices, invoiceTotal } from './vendor-invoices';

export type PaymentMode = 'neft' | 'rtgs' | 'cheque' | 'upi' | 'cash' | 'wire';
export type PaymentStatus = 'draft' | 'initiated' | 'cleared' | 'failed' | 'reversed';

export const PAYMENT_MODE_LABEL: Record<PaymentMode, string> = {
    neft: 'NEFT',
    rtgs: 'RTGS',
    cheque: 'Cheque',
    upi: 'UPI',
    cash: 'Cash',
    wire: 'Wire transfer',
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
    draft: 'Draft',
    initiated: 'Initiated',
    cleared: 'Cleared',
    failed: 'Failed',
    reversed: 'Reversed',
};

export const PAYMENT_STATUS_TONE: Record<
    PaymentStatus,
    'neutral' | 'amber' | 'emerald' | 'red' | 'orange'
> = {
    draft: 'neutral',
    initiated: 'amber',
    cleared: 'emerald',
    failed: 'red',
    reversed: 'orange',
};

export interface VendorPayment {
    id: string;
    number: string; // PAY-2026-0001
    vendorId: string;
    invoiceIds: string[];
    paymentDate: string;
    mode: PaymentMode;
    bankRef?: string;
    chequeNumber?: string;
    amount: number;
    tdsAmount: number;
    status: PaymentStatus;
    notes?: string;
    advanceAdjusted?: number;
}

const TODAY = Date.now();
const iso = (offsetDays: number) =>
    new Date(TODAY + offsetDays * 86_400_000).toISOString();

export const vendorPayments: VendorPayment[] = [
    {
        id: 'pay-001',
        number: 'PAY-2026-0001',
        vendorId: 'v-001',
        invoiceIds: ['vi-001'],
        paymentDate: iso(-2),
        mode: 'rtgs',
        bankRef: 'HDFC2026RTGS00112',
        amount: 555200,
        tdsAmount: 0,
        status: 'cleared',
    },
    {
        id: 'pay-002',
        number: 'PAY-2026-0002',
        vendorId: 'v-002',
        invoiceIds: ['vi-002'],
        paymentDate: iso(-1),
        mode: 'neft',
        bankRef: 'ICICI2026NEFT00091',
        amount: 250000,
        tdsAmount: 0,
        status: 'cleared',
        notes: 'Part payment against CGM/2026/0892.',
    },
    {
        id: 'pay-003',
        number: 'PAY-2026-0003',
        vendorId: 'v-011',
        invoiceIds: ['vi-004'],
        paymentDate: iso(-7),
        mode: 'upi',
        bankRef: 'UPI@axisbank/2026/4421',
        amount: 36000,
        tdsAmount: 4000,
        status: 'cleared',
        notes: 'TDS @ 10% under 194C.',
    },
    {
        id: 'pay-004',
        number: 'PAY-2026-0004',
        vendorId: 'v-009',
        invoiceIds: [],
        paymentDate: iso(-5),
        mode: 'rtgs',
        bankRef: 'HDFC2026RTGS00099',
        amount: 250000,
        tdsAmount: 0,
        status: 'cleared',
        notes: 'Advance payment against PO under negotiation.',
        advanceAdjusted: 0,
    },
    {
        id: 'pay-005',
        number: 'PAY-2026-0005',
        vendorId: 'v-004',
        invoiceIds: ['vi-003'],
        paymentDate: iso(0),
        mode: 'rtgs',
        amount: 0,
        tdsAmount: 0,
        status: 'draft',
        notes: 'Pending finance review for overdue invoice JSAW/INV/2026/00211.',
    },
    {
        id: 'pay-006',
        number: 'PAY-2026-0006',
        vendorId: 'v-006',
        invoiceIds: [],
        paymentDate: iso(-10),
        mode: 'neft',
        amount: 100000,
        tdsAmount: 0,
        status: 'cleared',
        advanceAdjusted: 100000,
        notes: 'Advance for PO-2026-0003 (Sintex tanks).',
    },
    {
        id: 'pay-007',
        number: 'PAY-2026-0007',
        vendorId: 'v-002',
        invoiceIds: [],
        paymentDate: iso(-4),
        mode: 'cheque',
        chequeNumber: 'CHQ-887622',
        amount: 75000,
        tdsAmount: 0,
        status: 'failed',
        notes: 'Cheque returned — insufficient funds reissue.',
    },
];

export function paymentById(id: string): VendorPayment | undefined {
    return vendorPayments.find((p) => p.id === id);
}

export function paymentsByVendor(vendorId: string): VendorPayment[] {
    return vendorPayments.filter((p) => p.vendorId === vendorId);
}

export function totalPaidForInvoice(invoiceId: string): number {
    return vendorPayments
        .filter((p) => p.status === 'cleared' && p.invoiceIds.includes(invoiceId))
        .reduce((s, p) => {
            // Distribute equally if multiple invoices on the payment
            const share = p.amount / Math.max(1, p.invoiceIds.length);
            return s + share;
        }, 0);
}

export function outstandingForVendor(vendorId: string): number {
    let outstanding = 0;
    for (const inv of vendorInvoices) {
        if (inv.vendorId !== vendorId) continue;
        if (['paid', 'cancelled', 'draft'].includes(inv.status)) continue;
        outstanding += invoiceTotal(inv) - totalPaidForInvoice(inv.id);
    }
    return outstanding;
}

export function summaryStrip() {
    const initiated = vendorPayments.filter((p) => p.status === 'initiated').length;
    const draft = vendorPayments.filter((p) => p.status === 'draft').length;
    const cleared = vendorPayments
        .filter((p) => p.status === 'cleared')
        .reduce((s, p) => s + p.amount, 0);
    return { initiated, draft, cleared };
}

void invoiceById;
