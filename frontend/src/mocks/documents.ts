/**
 * Document repository mocks (Step 12).
 *
 * Centralised vault: invoices, quotations, POs, certificates, drawings,
 * test reports, signed-off commissioning reports and more, each linked
 * to a parent entity (inquiry / quotation / order / job / product /
 * dispatch / customer / generic).
 */

const today = Date.now();
const iso = (offsetDays: number, hour = 10, minute = 0): string => {
    const d = new Date(today + offsetDays * 86_400_000);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
};

export type DocumentType =
    | 'invoice'
    | 'po'
    | 'quotation'
    | 'order_confirmation'
    | 'delivery_challan'
    | 'commissioning_report'
    | 'warranty_certificate'
    | 'test_certificate'
    | 'datasheet'
    | 'drawing'
    | 'contract'
    | 'photo'
    | 'other';

export type DocumentEntityType =
    | 'inquiry'
    | 'quotation'
    | 'order'
    | 'dispatch'
    | 'job'
    | 'product'
    | 'customer'
    | 'general';

export type DocumentSensitivity = 'public' | 'internal' | 'confidential';

export interface DocumentVersion {
    id: string;
    version: number; // 1, 2, 3 …
    fileName: string;
    fileSize: number; // bytes
    mimeType: string;
    uploadedBy: string; // userId
    uploadedAt: string; // ISO
    note: string;
    isCurrent: boolean;
}

export interface DocumentAccessRule {
    role: 'admin' | 'sales' | 'accounts' | 'inventory' | 'dispatch' | 'engineer' | 'customer';
    canView: boolean;
    canDownload: boolean;
}

export interface DocumentActivity {
    id: string;
    at: string;
    actorId: string;
    action:
    | 'uploaded'
    | 'replaced'
    | 'downloaded'
    | 'shared'
    | 'access_changed'
    | 'tagged';
    summary: string;
}

export interface DocumentRecord {
    id: string;
    name: string; // human-readable title
    type: DocumentType;
    sensitivity: DocumentSensitivity;
    tags: string[];
    entityType: DocumentEntityType;
    entityId: string | null;
    entityLabel: string | null; // e.g. "SO-2026-001"
    notes: string;
    versions: DocumentVersion[]; // newest first
    access: DocumentAccessRule[];
    activity: DocumentActivity[];
    shareLink: string;
    createdAt: string;
    updatedAt: string;
}

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
    invoice: 'Invoice',
    po: 'Purchase Order',
    quotation: 'Quotation',
    order_confirmation: 'Order Confirmation',
    delivery_challan: 'Delivery Challan',
    commissioning_report: 'Commissioning Report',
    warranty_certificate: 'Warranty Certificate',
    test_certificate: 'Test Certificate',
    datasheet: 'Datasheet',
    drawing: 'Drawing',
    contract: 'Contract',
    photo: 'Photo',
    other: 'Other',
};

export const DOCUMENT_TYPE_TONE: Record<
    DocumentType,
    'neutral' | 'blue' | 'sky' | 'violet' | 'emerald' | 'green' | 'amber' | 'orange' | 'red' | 'indigo'
> = {
    invoice: 'amber',
    po: 'sky',
    quotation: 'violet',
    order_confirmation: 'blue',
    delivery_challan: 'indigo',
    commissioning_report: 'emerald',
    warranty_certificate: 'green',
    test_certificate: 'emerald',
    datasheet: 'neutral',
    drawing: 'neutral',
    contract: 'orange',
    photo: 'sky',
    other: 'neutral',
};

export const ENTITY_TYPE_LABEL: Record<DocumentEntityType, string> = {
    inquiry: 'Inquiry',
    quotation: 'Quotation',
    order: 'Sales Order',
    dispatch: 'Dispatch',
    job: 'Job',
    product: 'Product',
    customer: 'Customer',
    general: 'General',
};

export const SENSITIVITY_LABEL: Record<DocumentSensitivity, string> = {
    public: 'Public',
    internal: 'Internal',
    confidential: 'Confidential',
};

export const SENSITIVITY_TONE: Record<
    DocumentSensitivity,
    'neutral' | 'sky' | 'red'
> = {
    public: 'neutral',
    internal: 'sky',
    confidential: 'red',
};

const ROLES: DocumentAccessRule['role'][] = [
    'admin',
    'sales',
    'accounts',
    'inventory',
    'dispatch',
    'engineer',
    'customer',
];

function defaultAccess(sensitivity: DocumentSensitivity): DocumentAccessRule[] {
    if (sensitivity === 'confidential') {
        return ROLES.map((role) => ({
            role,
            canView: role === 'admin' || role === 'accounts',
            canDownload: role === 'admin' || role === 'accounts',
        }));
    }
    if (sensitivity === 'internal') {
        return ROLES.map((role) => ({
            role,
            canView: role !== 'customer',
            canDownload: role !== 'customer' && role !== 'engineer',
        }));
    }
    return ROLES.map((role) => ({ role, canView: true, canDownload: true }));
}

function shareLink(id: string): string {
    return `https://app.example.com/share/${id}`;
}

interface SeedSpec {
    id: string;
    name: string;
    type: DocumentType;
    sensitivity: DocumentSensitivity;
    entityType: DocumentEntityType;
    entityId: string | null;
    entityLabel: string | null;
    tags: string[];
    notes: string;
    versions: Array<{
        version: number;
        fileName: string;
        fileSize: number;
        mimeType: string;
        uploadedBy: string;
        offsetDays: number;
        note: string;
    }>;
}

const SEEDS: SeedSpec[] = [
    {
        id: 'doc-001',
        name: 'SO-2026-001 — Order Confirmation',
        type: 'order_confirmation',
        sensitivity: 'internal',
        entityType: 'order',
        entityId: 'so-001',
        entityLabel: 'SO-2026-001',
        tags: ['ETP', 'Patel Engineering', 'confirmed'],
        notes: 'Generated from quotation Q-2026-001 v3 after customer approval.',
        versions: [
            {
                version: 1,
                fileName: 'SO-2026-001-v1.pdf',
                fileSize: 184_320,
                mimeType: 'application/pdf',
                uploadedBy: 'u-2',
                offsetDays: -14,
                note: 'Initial confirmation issued.',
            },
        ],
    },
    {
        id: 'doc-002',
        name: 'INV-2026-001 — Tax Invoice',
        type: 'invoice',
        sensitivity: 'confidential',
        entityType: 'order',
        entityId: 'so-001',
        entityLabel: 'SO-2026-001',
        tags: ['invoice', 'GST', 'tax'],
        notes: '50% advance invoice raised against SO-2026-001.',
        versions: [
            {
                version: 2,
                fileName: 'INV-2026-001-revised.pdf',
                fileSize: 212_480,
                mimeType: 'application/pdf',
                uploadedBy: 'u-3',
                offsetDays: -10,
                note: 'Corrected GSTIN typo and re-issued.',
            },
            {
                version: 1,
                fileName: 'INV-2026-001.pdf',
                fileSize: 211_900,
                mimeType: 'application/pdf',
                uploadedBy: 'u-3',
                offsetDays: -12,
                note: 'Initial advance invoice.',
            },
        ],
    },
    {
        id: 'doc-003',
        name: 'Patel Engineering — Customer PO #PE-887',
        type: 'po',
        sensitivity: 'internal',
        entityType: 'order',
        entityId: 'so-001',
        entityLabel: 'SO-2026-001',
        tags: ['customer-PO', 'ETP'],
        notes: 'Customer-issued purchase order received via email.',
        versions: [
            {
                version: 1,
                fileName: 'PE-887-customer-po.pdf',
                fileSize: 152_064,
                mimeType: 'application/pdf',
                uploadedBy: 'u-1',
                offsetDays: -16,
                note: 'Received from Mr. Patel.',
            },
        ],
    },
    {
        id: 'doc-004',
        name: 'Q-2026-001 v3 — Final Quotation',
        type: 'quotation',
        sensitivity: 'internal',
        entityType: 'quotation',
        entityId: 'qt-001',
        entityLabel: 'Q-2026-001',
        tags: ['quotation', 'v3', 'approved'],
        notes: 'Final approved version (v3). Earlier revisions retained as separate versions.',
        versions: [
            {
                version: 3,
                fileName: 'Q-2026-001-v3.pdf',
                fileSize: 198_400,
                mimeType: 'application/pdf',
                uploadedBy: 'u-2',
                offsetDays: -16,
                note: 'Customer-approved final.',
            },
            {
                version: 2,
                fileName: 'Q-2026-001-v2.pdf',
                fileSize: 191_488,
                mimeType: 'application/pdf',
                uploadedBy: 'u-2',
                offsetDays: -22,
                note: 'Revised pricing on auto-coupling.',
            },
            {
                version: 1,
                fileName: 'Q-2026-001-v1.pdf',
                fileSize: 188_416,
                mimeType: 'application/pdf',
                uploadedBy: 'u-2',
                offsetDays: -28,
                note: 'Initial offer.',
            },
        ],
    },
    {
        id: 'doc-005',
        name: 'SO-2026-001 — Delivery Challan #DC-1042',
        type: 'delivery_challan',
        sensitivity: 'internal',
        entityType: 'dispatch',
        entityId: 'dis-001',
        entityLabel: 'DIS-2026-001',
        tags: ['challan', 'dispatch'],
        notes: 'Delivery challan for first batch of 4 pumps.',
        versions: [
            {
                version: 1,
                fileName: 'DC-1042.pdf',
                fileSize: 98_304,
                mimeType: 'application/pdf',
                uploadedBy: 'u-7',
                offsetDays: -6,
                note: 'Generated at gate-out.',
            },
        ],
    },
    {
        id: 'doc-006',
        name: 'GreenLeaf Pharma — Commissioning Report',
        type: 'commissioning_report',
        sensitivity: 'internal',
        entityType: 'job',
        entityId: 'job-004',
        entityLabel: 'JOB-2026-004',
        tags: ['commissioning', 'signed'],
        notes: 'Signed commissioning report with customer acknowledgment.',
        versions: [
            {
                version: 1,
                fileName: 'JOB-2026-004-commissioning-signed.pdf',
                fileSize: 412_672,
                mimeType: 'application/pdf',
                uploadedBy: 'u-8',
                offsetDays: -3,
                note: 'Customer signed by Neha Verma on site.',
            },
        ],
    },
    {
        id: 'doc-007',
        name: 'Surat Textile — Warranty Certificate',
        type: 'warranty_certificate',
        sensitivity: 'public',
        entityType: 'job',
        entityId: 'job-005',
        entityLabel: 'JOB-2026-005',
        tags: ['warranty', '24-months'],
        notes: 'Auto-generated 24-month warranty post sign-off.',
        versions: [
            {
                version: 1,
                fileName: 'WARR-JOB-005.pdf',
                fileSize: 132_096,
                mimeType: 'application/pdf',
                uploadedBy: 'u-1',
                offsetDays: -2,
                note: 'Issued on commissioning sign-off.',
            },
        ],
    },
    {
        id: 'doc-008',
        name: 'CI Pump Set — Hydrostatic Test Certificate',
        type: 'test_certificate',
        sensitivity: 'public',
        entityType: 'product',
        entityId: 'p-001',
        entityLabel: 'P-001 (CI Pump 5HP)',
        tags: ['hydrostatic', 'factory'],
        notes: 'Factory hydrostatic pressure test report.',
        versions: [
            {
                version: 1,
                fileName: 'TC-P-001-hydro.pdf',
                fileSize: 256_000,
                mimeType: 'application/pdf',
                uploadedBy: 'u-6',
                offsetDays: -45,
                note: 'Tested at 1.5× working pressure for 30 min.',
            },
        ],
    },
    {
        id: 'doc-009',
        name: 'CI Pump 5HP — Technical Datasheet',
        type: 'datasheet',
        sensitivity: 'public',
        entityType: 'product',
        entityId: 'p-001',
        entityLabel: 'P-001 (CI Pump 5HP)',
        tags: ['catalogue', 'public'],
        notes: 'Datasheet shared with customers and distributors.',
        versions: [
            {
                version: 2,
                fileName: 'P-001-datasheet-v2.pdf',
                fileSize: 884_736,
                mimeType: 'application/pdf',
                uploadedBy: 'u-1',
                offsetDays: -90,
                note: 'Updated curves and motor specifications.',
            },
            {
                version: 1,
                fileName: 'P-001-datasheet.pdf',
                fileSize: 870_400,
                mimeType: 'application/pdf',
                uploadedBy: 'u-1',
                offsetDays: -200,
                note: 'Initial release.',
            },
        ],
    },
    {
        id: 'doc-010',
        name: 'ETP Skid — General Arrangement Drawing',
        type: 'drawing',
        sensitivity: 'internal',
        entityType: 'order',
        entityId: 'so-001',
        entityLabel: 'SO-2026-001',
        tags: ['GA-drawing', 'skid'],
        notes: 'Approved GA for skid layout.',
        versions: [
            {
                version: 1,
                fileName: 'SO-001-GA-rev0.pdf',
                fileSize: 1_536_000,
                mimeType: 'application/pdf',
                uploadedBy: 'u-2',
                offsetDays: -18,
                note: 'Approved by client engineer.',
            },
        ],
    },
    {
        id: 'doc-011',
        name: 'AMC Contract — Vapi Industrial Park',
        type: 'contract',
        sensitivity: 'confidential',
        entityType: 'customer',
        entityId: 'cust-vapi',
        entityLabel: 'Vapi Industrial Park',
        tags: ['AMC', '2026', 'contract'],
        notes: 'Annual maintenance contract; renewal due Mar 2027.',
        versions: [
            {
                version: 1,
                fileName: 'AMC-Vapi-2026.pdf',
                fileSize: 624_640,
                mimeType: 'application/pdf',
                uploadedBy: 'u-1',
                offsetDays: -120,
                note: 'Counter-signed copy from customer.',
            },
        ],
    },
    {
        id: 'doc-012',
        name: 'Site Photos — Pump Base Concreting',
        type: 'photo',
        sensitivity: 'internal',
        entityType: 'job',
        entityId: 'job-001',
        entityLabel: 'JOB-2026-001',
        tags: ['site', 'civil', 'photos'],
        notes: 'Bundled site photos from civil readiness inspection.',
        versions: [
            {
                version: 1,
                fileName: 'JOB-001-site-photos.zip',
                fileSize: 4_823_040,
                mimeType: 'application/zip',
                uploadedBy: 'u-8',
                offsetDays: -4,
                note: '12 photos from site visit.',
            },
        ],
    },
    {
        id: 'doc-013',
        name: 'INQ-2026-002 — Customer Specs',
        type: 'other',
        sensitivity: 'internal',
        entityType: 'inquiry',
        entityId: 'inq-002',
        entityLabel: 'INQ-2026-002',
        tags: ['specs', 'customer-input'],
        notes: 'Specification sheet shared by customer over email.',
        versions: [
            {
                version: 1,
                fileName: 'inq-002-specs.docx',
                fileSize: 76_800,
                mimeType:
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                uploadedBy: 'u-1',
                offsetDays: -8,
                note: 'Received from Sunita Reddy.',
            },
        ],
    },
    {
        id: 'doc-014',
        name: 'GST Filing — March 2026',
        type: 'invoice',
        sensitivity: 'confidential',
        entityType: 'general',
        entityId: null,
        entityLabel: null,
        tags: ['GST', 'compliance'],
        notes: 'Compliance pack for March 2026 filings.',
        versions: [
            {
                version: 1,
                fileName: 'gst-march-2026.zip',
                fileSize: 2_097_152,
                mimeType: 'application/zip',
                uploadedBy: 'u-3',
                offsetDays: -25,
                note: 'Submitted to CA on schedule.',
            },
        ],
    },
];

export const documents: DocumentRecord[] = SEEDS.map((spec) => {
    const versions: DocumentVersion[] = spec.versions
        .slice()
        .sort((a, b) => b.version - a.version)
        .map((v, idx) => ({
            id: `${spec.id}-v${v.version}`,
            version: v.version,
            fileName: v.fileName,
            fileSize: v.fileSize,
            mimeType: v.mimeType,
            uploadedBy: v.uploadedBy,
            uploadedAt: iso(v.offsetDays),
            note: v.note,
            isCurrent: idx === 0,
        }));
    const current = versions[0];
    const oldest = versions[versions.length - 1];

    const activity: DocumentActivity[] = versions
        .map((v) => ({
            id: `${spec.id}-act-${v.version}`,
            at: v.uploadedAt,
            actorId: v.uploadedBy,
            action: (v.version === 1 ? 'uploaded' : 'replaced') as DocumentActivity['action'],
            summary:
                v.version === 1
                    ? `Initial upload (${v.fileName})`
                    : `Replaced with v${v.version} (${v.fileName})`,
        }))
        .sort((a, b) => b.at.localeCompare(a.at));

    return {
        id: spec.id,
        name: spec.name,
        type: spec.type,
        sensitivity: spec.sensitivity,
        tags: spec.tags,
        entityType: spec.entityType,
        entityId: spec.entityId,
        entityLabel: spec.entityLabel,
        notes: spec.notes,
        versions,
        access: defaultAccess(spec.sensitivity),
        activity,
        shareLink: shareLink(spec.id),
        createdAt: oldest.uploadedAt,
        updatedAt: current.uploadedAt,
    };
});

export function documentById(id: string): DocumentRecord | undefined {
    return documents.find((d) => d.id === id);
}

export function documentsForEntity(
    entityType: DocumentEntityType,
    entityId: string,
): DocumentRecord[] {
    return documents.filter(
        (d) => d.entityType === entityType && d.entityId === entityId,
    );
}

export function documentsSummary() {
    const total = documents.length;
    const confidential = documents.filter(
        (d) => d.sensitivity === 'confidential',
    ).length;
    const totalBytes = documents.reduce(
        (acc, d) => acc + d.versions.reduce((a, v) => a + v.fileSize, 0),
        0,
    );
    const updatedThisWeek = documents.filter(
        (d) => Date.parse(d.updatedAt) >= today - 7 * 86_400_000,
    ).length;
    return { total, confidential, totalBytes, updatedThisWeek };
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export const ROLE_LABEL: Record<DocumentAccessRule['role'], string> = {
    admin: 'Admin',
    sales: 'Sales',
    accounts: 'Accounts',
    inventory: 'Inventory',
    dispatch: 'Dispatch',
    engineer: 'Engineers',
    customer: 'Customer Portal',
};
