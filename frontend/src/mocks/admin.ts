import type { UserRole } from './users';

/* ------------------------------------------------------------------ */
/* Roles & permissions                                                 */
/* ------------------------------------------------------------------ */

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve';

export const PERMISSION_ACTIONS: PermissionAction[] = [
    'view',
    'create',
    'edit',
    'delete',
    'approve',
];

export type PermissionModule =
    | 'inquiries'
    | 'quotations'
    | 'orders'
    | 'inventory'
    | 'dispatch'
    | 'jobs'
    | 'documents'
    | 'reports'
    | 'users'
    | 'settings';

export const PERMISSION_MODULES: PermissionModule[] = [
    'inquiries',
    'quotations',
    'orders',
    'inventory',
    'dispatch',
    'jobs',
    'documents',
    'reports',
    'users',
    'settings',
];

export const PERMISSION_MODULE_LABEL: Record<PermissionModule, string> = {
    inquiries: 'Inquiries',
    quotations: 'Quotations',
    orders: 'Orders',
    inventory: 'Inventory',
    dispatch: 'Dispatch',
    jobs: 'Jobs',
    documents: 'Documents',
    reports: 'Reports',
    users: 'Users',
    settings: 'Settings',
};

export type PermissionMatrix = Record<
    PermissionModule,
    Record<PermissionAction, boolean>
>;

export interface RoleDef {
    id: UserRole;
    name: string;
    description: string;
    userCount: number;
    permissions: PermissionMatrix;
}

const allTrue = (): Record<PermissionAction, boolean> => ({
    view: true,
    create: true,
    edit: true,
    delete: true,
    approve: true,
});

const noAccess = (): Record<PermissionAction, boolean> => ({
    view: false,
    create: false,
    edit: false,
    delete: false,
    approve: false,
});

const viewOnly = (): Record<PermissionAction, boolean> => ({
    view: true,
    create: false,
    edit: false,
    delete: false,
    approve: false,
});

const editOnly = (): Record<PermissionAction, boolean> => ({
    view: true,
    create: true,
    edit: true,
    delete: false,
    approve: false,
});

function buildMatrix(
    overrides: Partial<Record<PermissionModule, Record<PermissionAction, boolean>>>,
    base: () => Record<PermissionAction, boolean> = noAccess,
): PermissionMatrix {
    const result = {} as PermissionMatrix;
    PERMISSION_MODULES.forEach((m) => {
        result[m] = overrides[m] ?? base();
    });
    return result;
}

export const ROLES: RoleDef[] = [
    {
        id: 'admin',
        name: 'Administrator',
        description: 'Full access across modules including user and settings.',
        userCount: 1,
        permissions: buildMatrix({}, allTrue),
    },
    {
        id: 'sales_manager',
        name: 'Sales Manager',
        description:
            'Owns sales pipeline; approves quotations and orders, views all reports.',
        userCount: 1,
        permissions: buildMatrix({
            inquiries: allTrue(),
            quotations: allTrue(),
            orders: allTrue(),
            inventory: viewOnly(),
            dispatch: editOnly(),
            jobs: viewOnly(),
            documents: editOnly(),
            reports: viewOnly(),
            users: viewOnly(),
            settings: noAccess(),
        }),
    },
    {
        id: 'sales_executive',
        name: 'Sales Executive',
        description: 'Creates inquiries, quotations and orders. No approvals.',
        userCount: 3,
        permissions: buildMatrix({
            inquiries: editOnly(),
            quotations: editOnly(),
            orders: editOnly(),
            inventory: viewOnly(),
            documents: editOnly(),
            reports: viewOnly(),
        }),
    },
    {
        id: 'inventory',
        name: 'Inventory',
        description: 'Manages stock, warehouses, reservations and adjustments.',
        userCount: 1,
        permissions: buildMatrix({
            inventory: allTrue(),
            orders: viewOnly(),
            dispatch: viewOnly(),
            documents: editOnly(),
            reports: viewOnly(),
        }),
    },
    {
        id: 'dispatch',
        name: 'Dispatch',
        description: 'Plans, dispatches and tracks shipments end-to-end.',
        userCount: 1,
        permissions: buildMatrix({
            orders: viewOnly(),
            dispatch: allTrue(),
            inventory: viewOnly(),
            documents: editOnly(),
            reports: viewOnly(),
        }),
    },
    {
        id: 'engineer',
        name: 'Engineer',
        description: 'Field service — own job cards, observations and reports.',
        userCount: 3,
        permissions: buildMatrix({
            jobs: editOnly(),
            documents: viewOnly(),
        }),
    },
    {
        id: 'accounts',
        name: 'Accounts',
        description: 'Approves discounts, manages numbering series and tax rules.',
        userCount: 1,
        permissions: buildMatrix({
            quotations: { ...editOnly(), approve: true },
            orders: { ...editOnly(), approve: true },
            documents: editOnly(),
            reports: viewOnly(),
            settings: editOnly(),
        }),
    },
];

export function roleById(id: UserRole): RoleDef | undefined {
    return ROLES.find((r) => r.id === id);
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export interface CompanyProfile {
    legalName: string;
    tradeName: string;
    gstin: string;
    pan: string;
    cin: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    phone: string;
    email: string;
    website: string;
}

export const companyProfile: CompanyProfile = {
    legalName: 'Pneumatica Industries Pvt Ltd',
    tradeName: 'Pneumatica',
    gstin: '27ABCDE1234F1Z5',
    pan: 'ABCDE1234F',
    cin: 'U29299MH2010PTC209123',
    addressLine1: 'Plot 14, MIDC Industrial Area',
    addressLine2: 'Phase II, Mahape',
    city: 'Navi Mumbai',
    state: 'Maharashtra',
    pincode: '400710',
    country: 'India',
    phone: '+91 22 4017 8800',
    email: 'sales@pneumatica.in',
    website: 'https://pneumatica.in',
};

export type SeriesEntity =
    | 'inquiry'
    | 'quotation'
    | 'order'
    | 'dispatch'
    | 'invoice'
    | 'job';

export interface NumberingSeries {
    id: SeriesEntity;
    label: string;
    prefix: string;
    pattern: string;
    nextNumber: number;
    fyReset: boolean;
    example: string;
}

export const numberingSeries: NumberingSeries[] = [
    {
        id: 'inquiry',
        label: 'Inquiry',
        prefix: 'INQ',
        pattern: '{prefix}-{fy}-{seq:05}',
        nextNumber: 412,
        fyReset: true,
        example: 'INQ-2526-00412',
    },
    {
        id: 'quotation',
        label: 'Quotation',
        prefix: 'QT',
        pattern: '{prefix}-{fy}-{seq:05}',
        nextNumber: 188,
        fyReset: true,
        example: 'QT-2526-00188',
    },
    {
        id: 'order',
        label: 'Sales Order',
        prefix: 'SO',
        pattern: '{prefix}-{fy}-{seq:05}',
        nextNumber: 96,
        fyReset: true,
        example: 'SO-2526-00096',
    },
    {
        id: 'dispatch',
        label: 'Dispatch',
        prefix: 'DSP',
        pattern: '{prefix}-{seq:06}',
        nextNumber: 1421,
        fyReset: false,
        example: 'DSP-001421',
    },
    {
        id: 'invoice',
        label: 'Tax Invoice',
        prefix: 'INV',
        pattern: '{prefix}/{fy}/{seq:05}',
        nextNumber: 312,
        fyReset: true,
        example: 'INV/2526/00312',
    },
    {
        id: 'job',
        label: 'Job Card',
        prefix: 'JC',
        pattern: '{prefix}-{seq:05}',
        nextNumber: 287,
        fyReset: false,
        example: 'JC-00287',
    },
];

export interface TaxRule {
    id: string;
    code: string;
    label: string;
    cgst: number;
    sgst: number;
    igst: number;
    appliesTo: string;
    active: boolean;
}

export const taxRules: TaxRule[] = [
    {
        id: 'tx-1',
        code: 'GST18',
        label: 'GST 18% (Standard)',
        cgst: 9,
        sgst: 9,
        igst: 18,
        appliesTo: 'Most goods & services',
        active: true,
    },
    {
        id: 'tx-2',
        code: 'GST12',
        label: 'GST 12%',
        cgst: 6,
        sgst: 6,
        igst: 12,
        appliesTo: 'Spares & accessories',
        active: true,
    },
    {
        id: 'tx-3',
        code: 'GST5',
        label: 'GST 5%',
        cgst: 2.5,
        sgst: 2.5,
        igst: 5,
        appliesTo: 'Specified industrial inputs',
        active: true,
    },
    {
        id: 'tx-4',
        code: 'GST28',
        label: 'GST 28%',
        cgst: 14,
        sgst: 14,
        igst: 28,
        appliesTo: 'Luxury / sin items',
        active: false,
    },
    {
        id: 'tx-5',
        code: 'EXEMPT',
        label: 'Exempt',
        cgst: 0,
        sgst: 0,
        igst: 0,
        appliesTo: 'SEZ / export with LUT',
        active: true,
    },
];

export interface PaymentTerm {
    id: string;
    code: string;
    label: string;
    netDays: number;
    description: string;
    active: boolean;
}

export const paymentTerms: PaymentTerm[] = [
    {
        id: 'pt-1',
        code: 'NET30',
        label: 'Net 30',
        netDays: 30,
        description: 'Payment due within 30 days of invoice.',
        active: true,
    },
    {
        id: 'pt-2',
        code: 'NET45',
        label: 'Net 45',
        netDays: 45,
        description: 'Payment due within 45 days of invoice.',
        active: true,
    },
    {
        id: 'pt-3',
        code: 'ADV50',
        label: '50% Advance',
        netDays: 0,
        description: '50% advance with PO; balance against PI.',
        active: true,
    },
    {
        id: 'pt-4',
        code: 'COD',
        label: 'Cash on Delivery',
        netDays: 0,
        description: 'Cash / cheque against delivery.',
        active: true,
    },
    {
        id: 'pt-5',
        code: 'LC30',
        label: 'LC at sight',
        netDays: 0,
        description: 'Letter of credit at sight, confirmed.',
        active: false,
    },
];

export type EmailTemplateKey =
    | 'quotation_send'
    | 'order_confirmation'
    | 'dispatch_notification'
    | 'job_completion'
    | 'invoice';

export interface EmailTemplate {
    id: EmailTemplateKey;
    label: string;
    subject: string;
    body: string;
    variables: string[];
}

export const emailTemplates: EmailTemplate[] = [
    {
        id: 'quotation_send',
        label: 'Quotation — share with customer',
        subject: 'Quotation {quotation_no} from {company_name}',
        body:
            'Dear {customer_first_name},\n\nPlease find attached our quotation {quotation_no} for {project_name}, valid until {valid_until}.\n\nLet us know if you have any questions.\n\nRegards,\n{owner_name}\n{company_name}',
        variables: [
            'customer_first_name',
            'quotation_no',
            'project_name',
            'valid_until',
            'owner_name',
            'company_name',
        ],
    },
    {
        id: 'order_confirmation',
        label: 'Order — confirmation',
        subject: 'Order {order_no} confirmed',
        body:
            'Hello {customer_first_name},\n\nWe confirm receipt of your purchase order against {order_no}. Estimated readiness: {ready_by}.\n\nThanks,\n{owner_name}',
        variables: ['customer_first_name', 'order_no', 'ready_by', 'owner_name'],
    },
    {
        id: 'dispatch_notification',
        label: 'Dispatch — shipment notification',
        subject: 'Shipment {dispatch_no} dispatched — LR {lr_no}',
        body:
            'Hi {customer_first_name},\n\nYour order {order_no} has been dispatched via {transporter} (LR {lr_no}). Expected delivery: {eta}.\n\nTracking: {tracking_url}',
        variables: [
            'customer_first_name',
            'dispatch_no',
            'order_no',
            'transporter',
            'lr_no',
            'eta',
            'tracking_url',
        ],
    },
    {
        id: 'job_completion',
        label: 'Job — completion report',
        subject: 'Service report {job_no} — completed',
        body:
            'Dear {customer_first_name},\n\nPlease find attached the service completion report for {job_no} performed at {site}.\n\n— {engineer_name}',
        variables: [
            'customer_first_name',
            'job_no',
            'site',
            'engineer_name',
        ],
    },
    {
        id: 'invoice',
        label: 'Invoice — share with customer',
        subject: 'Invoice {invoice_no} — {company_name}',
        body:
            'Dear {customer_first_name},\n\nPlease find attached invoice {invoice_no} dated {invoice_date} amounting to {amount}.\n\nPayment terms: {payment_terms}.\n\nRegards,\nAccounts',
        variables: [
            'customer_first_name',
            'invoice_no',
            'invoice_date',
            'amount',
            'payment_terms',
        ],
    },
];

export type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'in_app';

export interface NotificationChannelConfig {
    channel: NotificationChannel;
    label: string;
    enabled: boolean;
    detail: string;
}

export const notificationChannels: NotificationChannelConfig[] = [
    {
        channel: 'email',
        label: 'Email (SMTP)',
        enabled: true,
        detail: 'smtp.firm.in:587 — alerts@pneumatica.in',
    },
    {
        channel: 'sms',
        label: 'SMS',
        enabled: true,
        detail: 'Provider: MSG91 · DLT TID 1107…',
    },
    {
        channel: 'whatsapp',
        label: 'WhatsApp',
        enabled: false,
        detail: 'Cloud API · Templates pending approval',
    },
    {
        channel: 'in_app',
        label: 'In-app & push',
        enabled: true,
        detail: 'Bell icon + browser push (Firebase)',
    },
];

export interface IntegrationConfig {
    id: string;
    name: string;
    category: 'accounting' | 'communications' | 'storage' | 'logistics' | 'payments';
    status: 'connected' | 'available' | 'error';
    description: string;
    detail?: string;
}

export const integrations: IntegrationConfig[] = [
    {
        id: 'tally',
        name: 'Tally Prime',
        category: 'accounting',
        status: 'connected',
        description: 'Sync invoices, payments and ledgers.',
        detail: 'Last synced 14 minutes ago',
    },
    {
        id: 'zoho_books',
        name: 'Zoho Books',
        category: 'accounting',
        status: 'available',
        description: 'Alternative GST-ready accounting platform.',
    },
    {
        id: 'msg91',
        name: 'MSG91 SMS',
        category: 'communications',
        status: 'connected',
        description: 'Transactional SMS with DLT compliance.',
        detail: 'Sender ID: PNEUMA',
    },
    {
        id: 'whatsapp_cloud',
        name: 'WhatsApp Cloud API',
        category: 'communications',
        status: 'error',
        description: 'Customer notifications + 2-way support.',
        detail: 'Template review pending since 3 days',
    },
    {
        id: 's3',
        name: 'AWS S3',
        category: 'storage',
        status: 'connected',
        description: 'Document & image archive.',
        detail: 'Bucket: pneumatica-docs',
    },
    {
        id: 'shiprocket',
        name: 'Shiprocket',
        category: 'logistics',
        status: 'available',
        description: 'Aggregator for partial / small shipments.',
    },
    {
        id: 'razorpay',
        name: 'Razorpay',
        category: 'payments',
        status: 'connected',
        description: 'Payment links and customer collections.',
        detail: 'Live keys configured',
    },
];

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export type NotificationKind =
    | 'inquiry'
    | 'quotation'
    | 'order'
    | 'dispatch'
    | 'job'
    | 'inventory'
    | 'system';

export interface NotificationItem {
    id: string;
    kind: NotificationKind;
    title: string;
    body: string;
    createdAt: string;
    read: boolean;
    href?: string;
}

export const NOTIFICATION_KIND_LABEL: Record<NotificationKind, string> = {
    inquiry: 'Inquiries',
    quotation: 'Quotations',
    order: 'Orders',
    dispatch: 'Dispatch',
    job: 'Jobs',
    inventory: 'Inventory',
    system: 'System',
};

export const NOTIFICATION_KIND_TONE: Record<
    NotificationKind,
    'sky' | 'violet' | 'blue' | 'emerald' | 'amber' | 'orange' | 'neutral'
> = {
    inquiry: 'sky',
    quotation: 'violet',
    order: 'blue',
    dispatch: 'emerald',
    job: 'amber',
    inventory: 'orange',
    system: 'neutral',
};

export const notifications: NotificationItem[] = [
    {
        id: 'n-1',
        kind: 'inquiry',
        title: 'New inquiry from Tata Realty',
        body: 'INQ-2526-00412 captured by Aarav Mehta — value ₹4.2 L.',
        createdAt: '2026-04-25T08:18:00Z',
        read: false,
        href: '/inquiries',
    },
    {
        id: 'n-2',
        kind: 'quotation',
        title: 'Quotation QT-2526-00187 approved',
        body: 'Discount approval cleared by Rohan Iyer.',
        createdAt: '2026-04-25T07:42:00Z',
        read: false,
        href: '/quotations',
    },
    {
        id: 'n-3',
        kind: 'inventory',
        title: 'Low stock alert: 3 SKUs',
        body: 'AC-FRL-100, AC-FRL-200 and SOL-V3 below reorder point.',
        createdAt: '2026-04-25T06:00:00Z',
        read: false,
        href: '/inventory/reorder',
    },
    {
        id: 'n-4',
        kind: 'dispatch',
        title: 'Dispatch DSP-001418 marked delivered',
        body: 'POD pending upload from transporter VRL.',
        createdAt: '2026-04-24T19:11:00Z',
        read: true,
        href: '/dispatch',
    },
    {
        id: 'n-5',
        kind: 'order',
        title: 'Order SO-2526-00094 awaiting approval',
        body: 'Discount > 12%; needs Sales Manager sign-off.',
        createdAt: '2026-04-24T16:25:00Z',
        read: false,
        href: '/orders',
    },
    {
        id: 'n-6',
        kind: 'job',
        title: 'Job JC-00284 completed',
        body: 'Engineer Manish Patel filed completion report.',
        createdAt: '2026-04-24T14:08:00Z',
        read: true,
        href: '/jobs',
    },
    {
        id: 'n-7',
        kind: 'system',
        title: 'Tally sync succeeded',
        body: '14 invoices and 8 payments synced.',
        createdAt: '2026-04-24T13:00:00Z',
        read: true,
    },
    {
        id: 'n-8',
        kind: 'quotation',
        title: 'Quotation revision requested',
        body: 'Customer Larsen & Toubro asked for v3 with revised BOM.',
        createdAt: '2026-04-24T11:15:00Z',
        read: true,
        href: '/quotations',
    },
    {
        id: 'n-9',
        kind: 'dispatch',
        title: 'POD uploaded for DSP-001416',
        body: 'Captured by transporter Safexpress.',
        createdAt: '2026-04-24T09:32:00Z',
        read: true,
        href: '/dispatch',
    },
    {
        id: 'n-10',
        kind: 'inventory',
        title: 'Stock adjustment posted',
        body: '12 line items written-off after physical count.',
        createdAt: '2026-04-23T18:44:00Z',
        read: true,
        href: '/inventory/adjustments',
    },
    {
        id: 'n-11',
        kind: 'system',
        title: 'New user invited',
        body: 'Neha Gupta added as Accounts Manager.',
        createdAt: '2026-04-23T11:01:00Z',
        read: true,
        href: '/users',
    },
    {
        id: 'n-12',
        kind: 'inquiry',
        title: 'Inquiry idle 7+ days',
        body: 'INQ-2526-00388 has had no activity since 17 Apr.',
        createdAt: '2026-04-23T08:00:00Z',
        read: true,
        href: '/inquiries',
    },
];

export function notificationsSummary() {
    return {
        total: notifications.length,
        unread: notifications.filter((n) => !n.read).length,
    };
}

/* ------------------------------------------------------------------ */
/* Numbering preview helper                                            */
/* ------------------------------------------------------------------ */

export function previewSeries(
    pattern: string,
    prefix: string,
    seq: number,
    fy = '2526',
): string {
    return pattern
        .replace(/\{prefix\}/g, prefix)
        .replace(/\{fy\}/g, fy)
        .replace(/\{seq:(\d+)\}/g, (_, n) => String(seq).padStart(Number(n), '0'))
        .replace(/\{seq\}/g, String(seq));
}
