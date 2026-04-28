/**
 * Customer (sales) invoices — shared mock used by:
 *   - /sales/invoices (standalone module)
 *   - SalesOrder detail "Invoices" sub-tab
 *
 * Direct invoices have salesOrderId === null (e.g., AMC fees, walk-in spares).
 */

import { customers } from './customers';
import { orders } from './orders';

export type CustomerInvoiceStatus =
    | 'draft'
    | 'sent'
    | 'partially_paid'
    | 'paid'
    | 'overdue'
    | 'cancelled';

export interface CustomerInvoiceLine {
    id: string;
    productCode?: string;
    description: string;
    hsn?: string;
    quantity: number;
    uom: string;
    unitPrice: number;
    discountPct: number;
    taxRate: number; // GST %
}

export interface CustomerInvoicePayment {
    id: string;
    receivedAt: string;
    mode: 'NEFT' | 'RTGS' | 'UPI' | 'Cheque' | 'Cash';
    reference: string;
    amount: number;
    notes?: string;
}

export interface CustomerInvoice {
    id: string;
    invoiceNumber: string;
    customerId: string;
    customerName: string; // legalName
    salesOrderId: string | null;
    salesOrderNumber: string | null;
    invoiceDate: string;
    dueDate: string;
    placeOfSupply: string;
    currency: 'INR';
    lineItems: CustomerInvoiceLine[];
    subtotal: number;
    discount: number;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    freight: number;
    roundOff: number;
    grandTotal: number;
    paidAmount: number;
    balance: number;
    status: CustomerInvoiceStatus;
    paymentTerms: string;
    eInvoiceIrn?: string;
    eWayBill?: string;
    notes?: string;
    payments: CustomerInvoicePayment[];
    createdAt: string;
}

export const INVOICE_STATUS_LABEL: Record<CustomerInvoiceStatus, string> = {
    draft: 'Draft',
    sent: 'Sent',
    partially_paid: 'Partially paid',
    paid: 'Paid',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
};

export const INVOICE_STATUS_TONE: Record<
    CustomerInvoiceStatus,
    'neutral' | 'blue' | 'amber' | 'emerald' | 'red'
> = {
    draft: 'neutral',
    sent: 'blue',
    partially_paid: 'amber',
    paid: 'emerald',
    overdue: 'red',
    cancelled: 'neutral',
};

const today = Date.now();
const iso = (offsetDays: number): string =>
    new Date(today + offsetDays * 86400000).toISOString();

function customerIdByCompanyName(name: string): string {
    const c = customers.find((cu) => cu.legalName === name || cu.name === name);
    return c?.id ?? customers[0].id;
}

function buildLines(specs: Array<Partial<CustomerInvoiceLine> & { description: string; quantity: number; unitPrice: number }>): CustomerInvoiceLine[] {
    return specs.map((s, i) => ({
        id: `line-${i + 1}`,
        productCode: s.productCode,
        description: s.description,
        hsn: s.hsn ?? '8413',
        quantity: s.quantity,
        uom: s.uom ?? 'nos',
        unitPrice: s.unitPrice,
        discountPct: s.discountPct ?? 0,
        taxRate: s.taxRate ?? 18,
    }));
}

function totalize(
    lines: CustomerInvoiceLine[],
    opts: { freight?: number; placeOfSupply: string; intraState: boolean },
): Pick<
    CustomerInvoice,
    'subtotal' | 'discount' | 'taxableValue' | 'cgst' | 'sgst' | 'igst' | 'freight' | 'roundOff' | 'grandTotal'
> {
    let subtotal = 0;
    let discount = 0;
    let taxableValue = 0;
    let totalTax = 0;
    for (const li of lines) {
        const gross = li.quantity * li.unitPrice;
        const lineDiscount = (gross * li.discountPct) / 100;
        const taxable = gross - lineDiscount;
        const tax = (taxable * li.taxRate) / 100;
        subtotal += gross;
        discount += lineDiscount;
        taxableValue += taxable;
        totalTax += tax;
    }
    const cgst = opts.intraState ? totalTax / 2 : 0;
    const sgst = opts.intraState ? totalTax / 2 : 0;
    const igst = opts.intraState ? 0 : totalTax;
    const freight = opts.freight ?? 0;
    const rawTotal = taxableValue + totalTax + freight;
    const grandTotal = Math.round(rawTotal);
    const roundOff = grandTotal - rawTotal;
    return {
        subtotal: Math.round(subtotal),
        discount: Math.round(discount),
        taxableValue: Math.round(taxableValue),
        cgst: Math.round(cgst),
        sgst: Math.round(sgst),
        igst: Math.round(igst),
        freight,
        roundOff: Math.round(roundOff * 100) / 100,
        grandTotal,
    };
}

function build(
    spec: {
        id: string;
        invoiceNumber: string;
        companyName: string;
        salesOrderId: string | null;
        invoiceOffsetDays: number;
        dueOffsetDays: number;
        placeOfSupply: string;
        intraState: boolean;
        lines: Parameters<typeof buildLines>[0];
        freight?: number;
        status: CustomerInvoiceStatus;
        paidPct?: number;
        paymentTerms?: string;
        eInvoiceIrn?: string;
        eWayBill?: string;
        notes?: string;
    },
): CustomerInvoice {
    const lines = buildLines(spec.lines);
    const totals = totalize(lines, { freight: spec.freight, placeOfSupply: spec.placeOfSupply, intraState: spec.intraState });
    const so = spec.salesOrderId ? orders.find((o) => o.id === spec.salesOrderId) : null;
    const paidPct = spec.paidPct ?? (spec.status === 'paid' ? 1 : spec.status === 'partially_paid' ? 0.5 : 0);
    const paidAmount = Math.round(totals.grandTotal * paidPct);
    const balance = totals.grandTotal - paidAmount;
    const payments: CustomerInvoicePayment[] = [];
    if (paidAmount > 0) {
        payments.push({
            id: `pay-${spec.id}-1`,
            receivedAt: iso(spec.invoiceOffsetDays + 5),
            mode: 'NEFT',
            reference: `UTR${Math.floor(Math.random() * 1e9).toString().padStart(9, '0')}`,
            amount: paidAmount,
        });
    }
    return {
        id: spec.id,
        invoiceNumber: spec.invoiceNumber,
        customerId: customerIdByCompanyName(spec.companyName),
        customerName: spec.companyName,
        salesOrderId: spec.salesOrderId,
        salesOrderNumber: so?.orderNumber ?? null,
        invoiceDate: iso(spec.invoiceOffsetDays),
        dueDate: iso(spec.dueOffsetDays),
        placeOfSupply: spec.placeOfSupply,
        currency: 'INR',
        lineItems: lines,
        ...totals,
        paidAmount,
        balance,
        status: spec.status,
        paymentTerms: spec.paymentTerms ?? 'Net 30',
        eInvoiceIrn: spec.eInvoiceIrn,
        eWayBill: spec.eWayBill,
        notes: spec.notes,
        payments,
        createdAt: iso(spec.invoiceOffsetDays),
    };
}

const _store: CustomerInvoice[] = [
    build({
        id: 'inv-001',
        invoiceNumber: 'INV-2026-001',
        companyName: 'Patel Engineering Ltd.',
        salesOrderId: 'so-001',
        invoiceOffsetDays: -45,
        dueOffsetDays: -15,
        placeOfSupply: 'Gujarat',
        intraState: true,
        status: 'paid',
        paymentTerms: 'Net 30',
        eInvoiceIrn: 'IRN-PEL-001',
        eWayBill: 'EWB-401234567890',
        lines: [
            { description: 'Centrifugal Pump 7.5 HP', quantity: 4, unitPrice: 42500, hsn: '8413' },
            { description: 'VFD Drive 15 HP', quantity: 2, unitPrice: 65000, hsn: '8504' },
            { description: 'Sand Filter 24" Dia', quantity: 1, unitPrice: 78000, hsn: '8421' },
        ],
        freight: 4500,
    }),
    build({
        id: 'inv-002',
        invoiceNumber: 'INV-2026-002',
        companyName: 'Patel Engineering Ltd.',
        salesOrderId: 'so-001',
        invoiceOffsetDays: -10,
        dueOffsetDays: 20,
        placeOfSupply: 'Gujarat',
        intraState: true,
        status: 'partially_paid',
        paidPct: 0.4,
        lines: [
            { description: 'Sand Filter 24" Dia (balance)', quantity: 1, unitPrice: 78000, hsn: '8421' },
            { description: 'Commissioning & Training', quantity: 1, unitPrice: 35000, hsn: '9954', taxRate: 18 },
        ],
    }),
    build({
        id: 'inv-003',
        invoiceNumber: 'INV-2026-003',
        companyName: 'AquaPure Systems',
        salesOrderId: 'so-002',
        invoiceOffsetDays: -22,
        dueOffsetDays: 8,
        placeOfSupply: 'Maharashtra',
        intraState: false,
        status: 'sent',
        lines: [
            { description: 'Submersible Pump 5 HP', quantity: 6, unitPrice: 28500 },
            { description: 'Pressure Switch', quantity: 6, unitPrice: 1200 },
        ],
        freight: 2500,
    }),
    build({
        id: 'inv-004',
        invoiceNumber: 'INV-2026-004',
        companyName: 'Surat Textile Mills',
        salesOrderId: 'so-003',
        invoiceOffsetDays: -18,
        dueOffsetDays: 12,
        placeOfSupply: 'Gujarat',
        intraState: true,
        status: 'sent',
        lines: [{ description: 'Boiler Feed Pump 25 HP', quantity: 1, unitPrice: 425000 }],
        freight: 8500,
    }),
    build({
        id: 'inv-005',
        invoiceNumber: 'INV-2026-005',
        companyName: 'GreenLeaf Pharma',
        salesOrderId: 'so-004',
        invoiceOffsetDays: -32,
        dueOffsetDays: -2,
        placeOfSupply: 'Gujarat',
        intraState: true,
        status: 'overdue',
        lines: [
            { description: 'Cooling Tower Fill Pack', quantity: 4, unitPrice: 95000, hsn: '8419' },
            { description: 'Circulation Pump 20 HP', quantity: 2, unitPrice: 185000 },
        ],
        freight: 12000,
    }),
    build({
        id: 'inv-006',
        invoiceNumber: 'INV-2026-006',
        companyName: 'Kochi Ports',
        salesOrderId: 'so-005',
        invoiceOffsetDays: -5,
        dueOffsetDays: 25,
        placeOfSupply: 'Kerala',
        intraState: false,
        status: 'sent',
        lines: [{ description: 'Dewatering Pump Set 50 HP', quantity: 5, unitPrice: 250000 }],
        freight: 25000,
    }),
    build({
        id: 'inv-007',
        invoiceNumber: 'INV-2026-007',
        companyName: 'Zenith Chemicals',
        salesOrderId: 'so-006',
        invoiceOffsetDays: -8,
        dueOffsetDays: 22,
        placeOfSupply: 'Gujarat',
        intraState: true,
        status: 'draft',
        lines: [
            { description: 'Chemical Transfer Pump (PP)', quantity: 3, unitPrice: 165000 },
            { description: 'Diaphragm Valve 2"', quantity: 6, unitPrice: 8500 },
        ],
    }),
    build({
        id: 'inv-008',
        invoiceNumber: 'INV-2026-008',
        companyName: 'Bhuj Irrigation Co-op',
        salesOrderId: 'so-007',
        invoiceOffsetDays: -38,
        dueOffsetDays: -8,
        placeOfSupply: 'Gujarat',
        intraState: true,
        status: 'paid',
        lines: [{ description: 'Borewell Submersible 10 HP', quantity: 6, unitPrice: 58000 }],
    }),
    build({
        id: 'inv-009',
        invoiceNumber: 'INV-2026-009',
        companyName: 'SunRise Hotels',
        salesOrderId: 'so-008',
        invoiceOffsetDays: -2,
        dueOffsetDays: 28,
        placeOfSupply: 'Rajasthan',
        intraState: false,
        status: 'sent',
        lines: [
            { description: 'STP Aeration Blower', quantity: 2, unitPrice: 285000 },
            { description: 'Sludge Transfer Pump', quantity: 2, unitPrice: 95000 },
        ],
        freight: 15000,
    }),
    build({
        id: 'inv-010',
        invoiceNumber: 'INV-2026-010',
        companyName: 'FreshMilk Dairy',
        salesOrderId: 'so-012',
        invoiceOffsetDays: -50,
        dueOffsetDays: -20,
        placeOfSupply: 'Maharashtra',
        intraState: false,
        status: 'paid',
        lines: [{ description: 'Sanitary Centrifugal Pump', quantity: 4, unitPrice: 65000 }],
    }),
    build({
        id: 'inv-011',
        invoiceNumber: 'INV-2026-011',
        companyName: 'Eastern Steel Works',
        salesOrderId: 'so-014',
        invoiceOffsetDays: -12,
        dueOffsetDays: 18,
        placeOfSupply: 'West Bengal',
        intraState: false,
        status: 'partially_paid',
        paidPct: 0.6,
        lines: [
            { description: 'Slurry Pump (CrMo)', quantity: 2, unitPrice: 215000 },
            { description: 'Mechanical Seal Spare', quantity: 4, unitPrice: 12500 },
        ],
    }),
    build({
        id: 'inv-012',
        invoiceNumber: 'INV-2026-012',
        companyName: 'Cygnus Hospitals',
        salesOrderId: 'so-017',
        invoiceOffsetDays: -1,
        dueOffsetDays: 29,
        placeOfSupply: 'Delhi',
        intraState: false,
        status: 'sent',
        lines: [
            { description: 'RO Plant 2000 LPH', quantity: 1, unitPrice: 875000, hsn: '8421' },
            { description: 'UV Sterilizer', quantity: 1, unitPrice: 125000 },
        ],
        freight: 18500,
    }),
    build({
        id: 'inv-013',
        invoiceNumber: 'INV-2026-013',
        companyName: 'GlobeTrans Logistics',
        salesOrderId: 'so-016',
        invoiceOffsetDays: -25,
        dueOffsetDays: 5,
        placeOfSupply: 'Maharashtra',
        intraState: false,
        status: 'partially_paid',
        paidPct: 0.3,
        lines: [{ description: 'Fuel Transfer Pump', quantity: 4, unitPrice: 78000 }],
    }),
    build({
        id: 'inv-014',
        invoiceNumber: 'INV-2026-014',
        companyName: 'Saraswati Polymers',
        salesOrderId: 'so-015',
        invoiceOffsetDays: -7,
        dueOffsetDays: 23,
        placeOfSupply: 'Madhya Pradesh',
        intraState: false,
        status: 'sent',
        lines: [{ description: 'Chiller Circulation Pump 15 HP', quantity: 3, unitPrice: 135000 }],
    }),
    // Direct invoices — no SO
    build({
        id: 'inv-015',
        invoiceNumber: 'INV-2026-015',
        companyName: 'Patel Engineering Ltd.',
        salesOrderId: null,
        invoiceOffsetDays: -3,
        dueOffsetDays: 27,
        placeOfSupply: 'Gujarat',
        intraState: true,
        status: 'sent',
        paymentTerms: 'Net 30',
        notes: 'Annual maintenance contract — Year 2 of 3.',
        lines: [{ description: 'AMC — ETP Phase II (Quarterly visit + spares)', quantity: 1, unitPrice: 185000, hsn: '9987', taxRate: 18 }],
    }),
    build({
        id: 'inv-016',
        invoiceNumber: 'INV-2026-016',
        companyName: 'GreenLeaf Pharma',
        salesOrderId: null,
        invoiceOffsetDays: -15,
        dueOffsetDays: 15,
        placeOfSupply: 'Gujarat',
        intraState: true,
        status: 'paid',
        notes: 'Spares — walk-in counter sale.',
        lines: [
            { description: 'Mechanical Seal — Pump 20 HP', quantity: 2, unitPrice: 8500 },
            { description: 'O-Ring Kit', quantity: 4, unitPrice: 1250 },
        ],
    }),
    build({
        id: 'inv-017',
        invoiceNumber: 'INV-2026-017',
        companyName: 'Zenith Chemicals',
        salesOrderId: null,
        invoiceOffsetDays: -42,
        dueOffsetDays: -12,
        placeOfSupply: 'Gujarat',
        intraState: true,
        status: 'overdue',
        notes: 'Site service visit — emergency repair.',
        lines: [{ description: 'Engineer site visit + travel + diagnostics', quantity: 1, unitPrice: 32000, hsn: '9987' }],
    }),
    build({
        id: 'inv-018',
        invoiceNumber: 'INV-2026-018',
        companyName: 'BluePeak Resorts',
        salesOrderId: null,
        invoiceOffsetDays: -60,
        dueOffsetDays: -30,
        placeOfSupply: 'Goa',
        intraState: false,
        status: 'cancelled',
        notes: 'Cancelled — duplicate of INV-2026-014 issued by mistake.',
        lines: [{ description: 'Pool filter media replacement', quantity: 2, unitPrice: 45000 }],
    }),
];

export function customerInvoicesAll(): CustomerInvoice[] {
    return _store.slice();
}

export function customerInvoiceById(id: string): CustomerInvoice | undefined {
    return _store.find((i) => i.id === id);
}

export function invoicesForCustomer(customerId: string): CustomerInvoice[] {
    return _store.filter((i) => i.customerId === customerId);
}

export function invoicesForOrder(orderId: string): CustomerInvoice[] {
    return _store.filter((i) => i.salesOrderId === orderId);
}

export function outstandingForCustomer(customerId: string): number {
    return _store
        .filter((i) => i.customerId === customerId && i.status !== 'cancelled' && i.status !== 'draft')
        .reduce((sum, i) => sum + i.balance, 0);
}

export interface AgingBuckets {
    bucket_0_30: number;
    bucket_31_60: number;
    bucket_61_90: number;
    bucket_90_plus: number;
    total: number;
}

export function agingBuckets(): AgingBuckets {
    const now = Date.now();
    const buckets: AgingBuckets = {
        bucket_0_30: 0,
        bucket_31_60: 0,
        bucket_61_90: 0,
        bucket_90_plus: 0,
        total: 0,
    };
    for (const i of _store) {
        if (i.status === 'cancelled' || i.status === 'paid' || i.status === 'draft') continue;
        if (i.balance <= 0) continue;
        const ageDays = Math.max(0, Math.floor((now - new Date(i.dueDate).getTime()) / 86400000));
        if (ageDays <= 30) buckets.bucket_0_30 += i.balance;
        else if (ageDays <= 60) buckets.bucket_31_60 += i.balance;
        else if (ageDays <= 90) buckets.bucket_61_90 += i.balance;
        else buckets.bucket_90_plus += i.balance;
        buckets.total += i.balance;
    }
    return buckets;
}

/**
 * KPIs for the standalone list and SO sub-tab summary strip.
 */
export interface InvoiceKPIs {
    outstanding: number;
    overdue: number;
    paidThisMonth: number;
    avgDsoDays: number;
}

export function invoiceKPIs(rows: CustomerInvoice[] = _store): InvoiceKPIs {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    let outstanding = 0;
    let overdue = 0;
    let paidThisMonth = 0;
    let dsoSum = 0;
    let dsoCount = 0;
    for (const i of rows) {
        if (i.status !== 'cancelled' && i.status !== 'draft') outstanding += i.balance;
        if (i.status === 'overdue') overdue += i.balance;
        for (const p of i.payments) {
            if (new Date(p.receivedAt).getTime() >= monthStart) paidThisMonth += p.amount;
            const days = (new Date(p.receivedAt).getTime() - new Date(i.invoiceDate).getTime()) / 86400000;
            if (days >= 0) {
                dsoSum += days;
                dsoCount += 1;
            }
        }
    }
    return {
        outstanding,
        overdue,
        paidThisMonth,
        avgDsoDays: dsoCount === 0 ? 0 : Math.round(dsoSum / dsoCount),
    };
}

/* ---------- Mutations (mock) ---------- */

export function createCustomerInvoice(draft: Omit<CustomerInvoice, 'id' | 'createdAt'>): CustomerInvoice {
    const id = `inv-${(_store.length + 1).toString().padStart(3, '0')}`;
    const inv: CustomerInvoice = { ...draft, id, createdAt: new Date().toISOString() };
    _store.unshift(inv);
    return inv;
}

export function updateInvoiceStatus(id: string, status: CustomerInvoiceStatus): CustomerInvoice | undefined {
    const inv = _store.find((i) => i.id === id);
    if (!inv) return;
    inv.status = status;
    if (status === 'paid') {
        inv.paidAmount = inv.grandTotal;
        inv.balance = 0;
    }
    return inv;
}
