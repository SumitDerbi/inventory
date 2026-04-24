import type { BadgeProps } from '@/components/ui/Badge';

export type QuotationStatus =
    | 'draft'
    | 'pending_approval'
    | 'approved'
    | 'sent'
    | 'revision_requested'
    | 'rejected'
    | 'converted'
    | 'expired';

export const QUOTATION_STATUSES: QuotationStatus[] = [
    'draft',
    'pending_approval',
    'approved',
    'sent',
    'revision_requested',
    'rejected',
    'converted',
    'expired',
];

const STATUS_LABEL: Record<QuotationStatus, string> = {
    draft: 'Draft',
    pending_approval: 'Pending Approval',
    approved: 'Approved',
    sent: 'Sent',
    revision_requested: 'Revision Requested',
    rejected: 'Rejected',
    converted: 'Converted',
    expired: 'Expired',
};

export function statusLabel(s: QuotationStatus): string {
    return STATUS_LABEL[s];
}

const STATUS_TONE: Record<QuotationStatus, BadgeProps['tone']> = {
    draft: 'neutral',
    pending_approval: 'amber',
    approved: 'emerald',
    sent: 'blue',
    revision_requested: 'amber',
    rejected: 'red',
    converted: 'green',
    expired: 'neutral',
};

export function statusTone(s: QuotationStatus): BadgeProps['tone'] {
    return STATUS_TONE[s];
}

/** Sent, approved, or converted quotes cannot be edited in place — trigger a new version. */
export function requiresVersionBump(s: QuotationStatus): boolean {
    return ['sent', 'approved', 'converted', 'rejected', 'expired'].includes(s);
}

export function canSend(s: QuotationStatus): boolean {
    return s === 'approved' || s === 'draft';
}

export function canApprove(s: QuotationStatus): boolean {
    return s === 'pending_approval';
}

export function canReject(s: QuotationStatus): boolean {
    return s === 'pending_approval';
}

export function canConvertToOrder(s: QuotationStatus): boolean {
    return s === 'approved' || s === 'sent';
}

export function canClone(): boolean {
    return true;
}

export function isTerminal(s: QuotationStatus): boolean {
    return ['converted', 'rejected', 'expired'].includes(s);
}
