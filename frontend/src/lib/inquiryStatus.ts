import type { BadgeProps } from '@/components/ui/Badge';

export type InquiryStatus =
    | 'new'
    | 'in_progress'
    | 'quoted'
    | 'converted'
    | 'lost'
    | 'on_hold';

export type InquiryPriority = 'high' | 'medium' | 'low';

export type InquiryType = 'new_project' | 'spare_parts' | 'amc' | 'service' | 'other';

export const INQUIRY_STATUSES: InquiryStatus[] = [
    'new',
    'in_progress',
    'quoted',
    'converted',
    'lost',
    'on_hold',
];

export const INQUIRY_PRIORITIES: InquiryPriority[] = ['high', 'medium', 'low'];

export const INQUIRY_TYPES: InquiryType[] = [
    'new_project',
    'spare_parts',
    'amc',
    'service',
    'other',
];

const STATUS_LABEL: Record<InquiryStatus, string> = {
    new: 'New',
    in_progress: 'In Progress',
    quoted: 'Quoted',
    converted: 'Converted',
    lost: 'Lost',
    on_hold: 'On Hold',
};

const STATUS_TONE: Record<InquiryStatus, BadgeProps['tone']> = {
    new: 'sky',
    in_progress: 'blue',
    quoted: 'violet',
    converted: 'green',
    lost: 'red',
    on_hold: 'orange',
};

const PRIORITY_LABEL: Record<InquiryPriority, string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
};

const PRIORITY_TONE: Record<InquiryPriority, BadgeProps['tone']> = {
    high: 'red',
    medium: 'amber',
    low: 'neutral',
};

const TYPE_LABEL: Record<InquiryType, string> = {
    new_project: 'New Project',
    spare_parts: 'Spare Parts',
    amc: 'AMC',
    service: 'Service',
    other: 'Other',
};

export function statusLabel(status: InquiryStatus): string {
    return STATUS_LABEL[status];
}

export function statusTone(status: InquiryStatus): BadgeProps['tone'] {
    return STATUS_TONE[status];
}

export function priorityLabel(priority: InquiryPriority): string {
    return PRIORITY_LABEL[priority];
}

export function priorityTone(priority: InquiryPriority): BadgeProps['tone'] {
    return PRIORITY_TONE[priority];
}

export function inquiryTypeLabel(type: InquiryType): string {
    return TYPE_LABEL[type];
}

/** Status transition predicates used by detail-page action menu. */
export function canConvertToQuotation(status: InquiryStatus): boolean {
    return status === 'new' || status === 'in_progress' || status === 'quoted';
}

export function canMarkLost(status: InquiryStatus): boolean {
    return status !== 'lost' && status !== 'converted';
}
