/**
 * Portal projection of `quotations.ts`.
 * Hides cost / margin columns; only `sent | revised | approved | rejected` statuses surface.
 */
import { quotations } from '../quotations';
import {
    statusLabel as quotationStatusLabel,
    statusTone as quotationStatusTone,
    type QuotationStatus,
} from '@/lib/quotationStatus';
import { currentClientUser } from './client-users';

export interface PortalQuotationLine {
    id: string;
    description: string;
    specNotes: string;
    quantity: number;
    uom: string;
    unitPrice: number;
    taxRate: number;
    lineTotal: number;
}

export interface PortalQuotation {
    id: string;
    quotationNumber: string;
    projectName: string;
    status: QuotationStatus;
    statusLabel: string;
    sentAt: string;
    validUntil: string;
    paymentTerms: string;
    deliveryPeriod: string;
    warranty: string;
    grandTotal: number;
    lines: PortalQuotationLine[];
    termsBody: string;
}

const PORTAL_VISIBLE: ReadonlyArray<QuotationStatus> = [
    'sent',
    'revision_requested',
    'approved',
    'rejected',
];

function projectQuotation(q: typeof quotations[number]): PortalQuotation {
    const v = q.versions[q.currentVersion - 1];
    const lines: PortalQuotationLine[] = v.lineItems.map((li) => {
        const net =
            li.quantity * li.listPrice * (1 - li.discountPercent / 100);
        const tax = net * (li.taxRate / 100);
        return {
            id: li.id,
            description: li.description,
            specNotes: li.specNotes,
            quantity: li.quantity,
            uom: li.uom,
            unitPrice: li.listPrice * (1 - li.discountPercent / 100),
            taxRate: li.taxRate,
            lineTotal: net + tax,
        };
    });
    return {
        id: q.id,
        quotationNumber: q.quotationNumber,
        projectName: q.projectName,
        status: v.status,
        statusLabel: quotationStatusLabel(v.status),
        sentAt: v.createdAt,
        validUntil: v.validUntil,
        paymentTerms: v.paymentTerms,
        deliveryPeriod: v.deliveryPeriod,
        warranty: v.warranty,
        grandTotal: lines.reduce((s, l) => s + l.lineTotal, 0) + v.freight + v.installationCharge,
        lines,
        termsBody: v.termsBody,
    };
}

export function portalQuotations(): PortalQuotation[] {
    const company = currentClientUser().companyName;
    return quotations
        .filter((q) => q.companyName === company)
        .map(projectQuotation)
        .filter((p) => PORTAL_VISIBLE.includes(p.status));
}

export function portalQuotationById(id: string): PortalQuotation | undefined {
    const company = currentClientUser().companyName;
    const q = quotations.find((x) => x.id === id && x.companyName === company);
    if (!q) return undefined;
    const projected = projectQuotation(q);
    return PORTAL_VISIBLE.includes(projected.status) ? projected : undefined;
}

export function canApprovePortalQuote(q: PortalQuotation): boolean {
    if (q.status !== 'sent' && q.status !== 'revision_requested') return false;
    return new Date(q.validUntil).getTime() >= Date.now();
}

export { quotationStatusTone };

/**
 * Mock approve / reject — flips the underlying quotation version status
 * and appends a synthetic communication entry. Returns the updated
 * portal projection so the caller can re-render.
 */
export function approvePortalQuote(
    id: string,
    by: { name: string; designation: string },
): PortalQuotation | undefined {
    const q = quotations.find((x) => x.id === id);
    if (!q) return undefined;
    const v = q.versions[q.currentVersion - 1];
    v.status = 'approved';
    v.communications.push({
        id: `${q.id}-portal-approve-${Date.now()}`,
        type: 'acknowledgement',
        subject: 'Quotation approved via portal',
        body: `Approved by ${by.name} (${by.designation}).`,
        fromName: by.name,
        toName: 'Sales Team',
        at: new Date().toISOString(),
    });
    return portalQuotationById(id);
}

export function rejectPortalQuote(
    id: string,
    reason: string,
    by: { name: string; designation: string },
): PortalQuotation | undefined {
    const q = quotations.find((x) => x.id === id);
    if (!q) return undefined;
    const v = q.versions[q.currentVersion - 1];
    v.status = 'rejected';
    v.communications.push({
        id: `${q.id}-portal-reject-${Date.now()}`,
        type: 'revision_request',
        subject: 'Quotation rejected via portal',
        body: `Rejected by ${by.name} (${by.designation}). Reason: ${reason}`,
        fromName: by.name,
        toName: 'Sales Team',
        at: new Date().toISOString(),
    });
    return portalQuotationById(id);
}
