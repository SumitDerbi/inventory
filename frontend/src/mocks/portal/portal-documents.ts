/**
 * Portal projection of `documents.ts` — only `sensitivity === 'public'`
 * AND the linked entity belongs to the current org.
 */
import { documents } from '../documents';
import type { DocumentRecord, DocumentType, DocumentEntityType } from '../documents';
import { orders } from '../orders';
import { quotations } from '../quotations';
import { dispatches } from '../dispatches';
import { jobs } from '../jobs';
import { customers } from '../customers';
import { currentClientUser } from './client-users';

export interface PortalDocument {
    id: string;
    name: string;
    type: DocumentType;
    entityType: DocumentEntityType;
    entityLabel: string | null;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
    notes: string;
}

function entityBelongsToCurrentOrg(d: DocumentRecord): boolean {
    if (!d.entityId) return false;
    const company = currentClientUser().companyName;
    const customerId = currentClientUser().customerId;
    switch (d.entityType) {
        case 'order':
            return orders.some((o) => o.id === d.entityId && o.companyName === company);
        case 'quotation':
            return quotations.some((q) => q.id === d.entityId && q.companyName === company);
        case 'dispatch':
            return dispatches.some((x) => x.id === d.entityId && x.customerCompany === company);
        case 'job':
            return jobs.some((j) => j.id === d.entityId && j.customerCompany === company);
        case 'customer':
            return customers.some((c) => c.id === d.entityId && c.id === customerId);
        case 'inquiry':
        case 'product':
        case 'general':
        default:
            return false;
    }
}

function project(d: DocumentRecord): PortalDocument {
    const cur = d.versions.find((v) => v.isCurrent) ?? d.versions[0];
    return {
        id: d.id,
        name: d.name,
        type: d.type,
        entityType: d.entityType,
        entityLabel: d.entityLabel,
        fileName: cur.fileName,
        fileSize: cur.fileSize,
        mimeType: cur.mimeType,
        uploadedAt: cur.uploadedAt,
        notes: d.notes,
    };
}

export function portalDocuments(): PortalDocument[] {
    return documents
        .filter((d) => d.sensitivity === 'public' && entityBelongsToCurrentOrg(d))
        .map(project)
        .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export function portalDocumentById(id: string): PortalDocument | undefined {
    const d = documents.find((x) => x.id === id);
    if (!d) return undefined;
    if (d.sensitivity !== 'public' || !entityBelongsToCurrentOrg(d)) return undefined;
    return project(d);
}

/** Mock signed URL — Phase 3 will generate a 15-minute pre-signed link. */
export function signedDownloadUrl(docId: string): string {
    return `https://files.example/portal/${docId}?expires=${Date.now() + 15 * 60 * 1000}`;
}
