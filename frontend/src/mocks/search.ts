import { inquiries } from './inquiries';
import { quotations } from './quotations';
import { orders } from './orders';
import { jobs } from './jobs';
import { documents } from './documents';
import { customers } from './customers';
import { vendors } from './vendors';
import { purchaseRequisitions } from './purchase-requisitions';
import { rfqs } from './rfqs';
import { purchaseOrders } from './purchase-orders';
import { grns } from './grns';
import { vendorInvoices } from './vendor-invoices';
import { vendorPayments } from './vendor-payments';
import { purchaseReturns } from './purchase-returns';

export type SearchResultType =
    | 'inquiry'
    | 'quotation'
    | 'order'
    | 'job'
    | 'document'
    | 'customer'
    | 'vendor'
    | 'pr'
    | 'rfq'
    | 'po'
    | 'grn'
    | 'vendor_invoice'
    | 'vendor_payment'
    | 'purchase_return';

export interface SearchResult {
    id: string;
    type: SearchResultType;
    title: string;
    subtitle: string;
    href: string;
    matchedField: string;
    score: number;
}

const TYPE_ORDER: SearchResultType[] = [
    'inquiry',
    'quotation',
    'order',
    'job',
    'document',
    'customer',
    'vendor',
    'pr',
    'rfq',
    'po',
    'grn',
    'vendor_invoice',
    'vendor_payment',
    'purchase_return',
];

export const SEARCH_TYPE_LABEL: Record<SearchResultType, string> = {
    inquiry: 'Inquiries',
    quotation: 'Quotations',
    order: 'Orders',
    job: 'Jobs',
    document: 'Documents',
    customer: 'Customers',
    vendor: 'Vendors',
    pr: 'Purchase requisitions',
    rfq: 'RFQs',
    po: 'Purchase orders',
    grn: 'GRNs',
    vendor_invoice: 'Vendor invoices',
    vendor_payment: 'Payments',
    purchase_return: 'Returns',
};

function score(haystack: string, needle: string): { hit: boolean; score: number } {
    const h = haystack.toLowerCase();
    const n = needle.toLowerCase();
    if (!n) return { hit: false, score: 0 };
    if (h.startsWith(n)) return { hit: true, score: 1 };
    if (h.includes(n)) return { hit: true, score: 0.5 };
    return { hit: false, score: 0 };
}

function pick(
    fields: Array<{ field: string; value: string }>,
    q: string,
): { field: string; score: number } | null {
    let best: { field: string; score: number } | null = null;
    for (const f of fields) {
        const r = score(f.value, q);
        if (r.hit && (!best || r.score > best.score)) {
            best = { field: f.field, score: r.score };
        }
    }
    return best;
}

export function searchAll(q: string, limit = 8): SearchResult[] {
    const trimmed = q.trim();
    if (trimmed.length < 2) return [];
    const out: SearchResult[] = [];

    // Inquiries
    for (const i of inquiries) {
        const m = pick(
            [
                { field: 'number', value: i.inquiryNumber },
                { field: 'customer', value: i.customerName },
                { field: 'company', value: i.companyName },
                { field: 'project', value: i.projectName },
                { field: 'mobile', value: i.mobile },
                { field: 'email', value: i.email },
            ],
            trimmed,
        );
        if (m) {
            out.push({
                id: i.id,
                type: 'inquiry',
                title: `${i.inquiryNumber} — ${i.customerName}`,
                subtitle: `${i.companyName} · ${i.projectName}`,
                href: `/inquiries/${i.id}`,
                matchedField: m.field,
                score: m.score,
            });
        }
    }

    // Quotations
    for (const qt of quotations) {
        const m = pick(
            [
                { field: 'number', value: qt.quotationNumber },
                { field: 'customer', value: qt.customerName },
                { field: 'company', value: qt.companyName },
                { field: 'project', value: qt.projectName },
            ],
            trimmed,
        );
        if (m) {
            out.push({
                id: qt.id,
                type: 'quotation',
                title: `${qt.quotationNumber} — ${qt.customerName}`,
                subtitle: `${qt.companyName} · v${qt.currentVersion}`,
                href: `/quotations/${qt.id}`,
                matchedField: m.field,
                score: m.score,
            });
        }
    }

    // Orders
    for (const o of orders) {
        const m = pick(
            [
                { field: 'number', value: o.orderNumber },
                { field: 'quotation', value: o.quotationNumber },
                { field: 'customer', value: o.customerName },
                { field: 'company', value: o.companyName },
                { field: 'project', value: o.projectName },
            ],
            trimmed,
        );
        if (m) {
            out.push({
                id: o.id,
                type: 'order',
                title: `${o.orderNumber} — ${o.customerName}`,
                subtitle: `${o.companyName} · ${o.stage}`,
                href: `/orders/${o.id}`,
                matchedField: m.field,
                score: m.score,
            });
        }
    }

    // Jobs
    for (const j of jobs) {
        const m = pick(
            [
                { field: 'number', value: j.jobNumber },
                { field: 'order', value: j.orderNumber },
                { field: 'customer', value: j.customerName },
                { field: 'company', value: j.customerCompany },
                { field: 'site', value: j.siteCity },
            ],
            trimmed,
        );
        if (m) {
            out.push({
                id: j.id,
                type: 'job',
                title: `${j.jobNumber} — ${j.customerName}`,
                subtitle: `${j.customerCompany} · ${j.siteCity}`,
                href: `/jobs/${j.id}`,
                matchedField: m.field,
                score: m.score,
            });
        }
    }

    // Documents
    for (const d of documents) {
        const m = pick(
            [
                { field: 'name', value: d.name },
                { field: 'entity', value: d.entityLabel ?? '' },
                { field: 'tag', value: d.tags.join(' ') },
            ],
            trimmed,
        );
        if (m) {
            out.push({
                id: d.id,
                type: 'document',
                title: d.name,
                subtitle: `${d.type} · ${d.entityLabel ?? '—'}`,
                href: `/documents?id=${d.id}`,
                matchedField: m.field,
                score: m.score,
            });
        }
    }

    // Customers
    for (const c of customers) {
        if (c.status === 'merged') continue;
        const m = pick(
            [
                { field: 'name', value: c.name },
                { field: 'legal', value: c.legalName ?? '' },
                { field: 'gst', value: c.gstNumber ?? '' },
                { field: 'phone', value: c.primaryContact.phone },
                { field: 'email', value: c.primaryContact.email },
            ],
            trimmed,
        );
        if (m) {
            out.push({
                id: c.id,
                type: 'customer',
                title: c.name,
                subtitle: c.legalName ?? c.primaryContact.phone,
                href: `/customers/${c.id}`,
                matchedField: m.field,
                score: m.score,
            });
        }
    }

    // Vendors
    for (const v of vendors) {
        const m = pick(
            [
                { field: 'code', value: v.code },
                { field: 'name', value: v.name },
                { field: 'legal', value: v.legalName },
                { field: 'gstin', value: v.gstin },
                { field: 'pan', value: v.pan },
            ],
            trimmed,
        );
        if (m) {
            out.push({
                id: v.id,
                type: 'vendor',
                title: `${v.code} — ${v.name}`,
                subtitle: `${v.category} · ${v.placeOfSupply}`,
                href: `/purchase/vendors/${v.id}`,
                matchedField: m.field,
                score: m.score,
            });
        }
    }

    // Purchase requisitions
    for (const p of purchaseRequisitions) {
        const m = pick(
            [
                { field: 'number', value: p.number },
                { field: 'department', value: p.department },
                { field: 'sourceRef', value: p.sourceRef ?? '' },
            ],
            trimmed,
        );
        if (m) {
            out.push({
                id: p.id,
                type: 'pr',
                title: `${p.number} — ${p.department}`,
                subtitle: `${p.source}${p.sourceRef ? ` · ${p.sourceRef}` : ''}`,
                href: `/purchase/requisitions/${p.id}`,
                matchedField: m.field,
                score: m.score,
            });
        }
    }

    // RFQs
    for (const r of rfqs) {
        const m = pick(
            [
                { field: 'number', value: r.number },
                { field: 'pr', value: r.prNumber },
            ],
            trimmed,
        );
        if (m) {
            out.push({
                id: r.id,
                type: 'rfq',
                title: r.number,
                subtitle: `Linked PR ${r.prNumber}`,
                href: `/purchase/rfqs/${r.id}`,
                matchedField: m.field,
                score: m.score,
            });
        }
    }

    // Purchase orders
    for (const p of purchaseOrders) {
        const m = pick(
            [
                { field: 'number', value: p.number },
                { field: 'prRef', value: p.prNumber ?? '' },
            ],
            trimmed,
        );
        if (m) {
            out.push({
                id: p.id,
                type: 'po',
                title: p.number,
                subtitle: `${p.stage}${p.prNumber ? ` · ${p.prNumber}` : ''}`,
                href: `/purchase/orders/${p.id}`,
                matchedField: m.field,
                score: m.score,
            });
        }
    }

    // GRNs
    for (const g of grns) {
        const m = pick(
            [
                { field: 'number', value: g.number },
                { field: 'po', value: g.poNumber },
                { field: 'invoiceRef', value: g.invoiceRef ?? '' },
            ],
            trimmed,
        );
        if (m) {
            out.push({
                id: g.id,
                type: 'grn',
                title: g.number,
                subtitle: `${g.poNumber} · ${g.stage}`,
                href: `/purchase/grns/${g.id}`,
                matchedField: m.field,
                score: m.score,
            });
        }
    }

    // Vendor invoices
    for (const i of vendorInvoices) {
        const m = pick(
            [
                { field: 'number', value: i.number },
                { field: 'ref', value: i.internalRef },
            ],
            trimmed,
        );
        if (m) {
            out.push({
                id: i.id,
                type: 'vendor_invoice',
                title: `${i.internalRef} — ${i.number}`,
                subtitle: i.status,
                href: `/purchase/invoices/${i.id}`,
                matchedField: m.field,
                score: m.score,
            });
        }
    }

    // Vendor payments
    for (const p of vendorPayments) {
        const m = pick([{ field: 'number', value: p.number }, { field: 'ref', value: p.transactionRef ?? '' }], trimmed);
        if (m) {
            out.push({
                id: p.id,
                type: 'vendor_payment',
                title: p.number,
                subtitle: `${p.mode} · ${p.status}`,
                href: `/purchase/payments`,
                matchedField: m.field,
                score: m.score,
            });
        }
    }

    // Purchase returns
    for (const r of purchaseReturns) {
        const m = pick(
            [
                { field: 'number', value: r.number },
                { field: 'grn', value: r.grnNumber ?? '' },
                { field: 'debitNote', value: r.debitNoteRef ?? '' },
            ],
            trimmed,
        );
        if (m) {
            out.push({
                id: r.id,
                type: 'purchase_return',
                title: r.number,
                subtitle: `${r.reason}${r.grnNumber ? ` · ${r.grnNumber}` : ''}`,
                href: `/purchase/returns/${r.id}`,
                matchedField: m.field,
                score: m.score,
            });
        }
    }

    // Sort: score desc, then by type order, then by title
    out.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const ta = TYPE_ORDER.indexOf(a.type);
        const tb = TYPE_ORDER.indexOf(b.type);
        if (ta !== tb) return ta - tb;
        return a.title.localeCompare(b.title);
    });

    // Cap per type to keep palette readable
    const perType = new Map<SearchResultType, number>();
    const capped: SearchResult[] = [];
    for (const r of out) {
        const c = perType.get(r.type) ?? 0;
        if (c >= limit) continue;
        perType.set(r.type, c + 1);
        capped.push(r);
    }
    return capped;
}

export function groupResults(
    results: SearchResult[],
): Array<{ type: SearchResultType; rows: SearchResult[] }> {
    const groups = new Map<SearchResultType, SearchResult[]>();
    for (const r of results) {
        const arr = groups.get(r.type) ?? [];
        arr.push(r);
        groups.set(r.type, arr);
    }
    return TYPE_ORDER.filter((t) => groups.has(t)).map((t) => ({
        type: t,
        rows: groups.get(t)!,
    }));
}
