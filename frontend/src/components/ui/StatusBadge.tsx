import { Badge, type BadgeProps } from './Badge';
import { cn } from '@/lib/cn';

/**
 * Status badge mapping — sourced verbatim from docs/ui_spec.md
 * §Status Badge Color Map. Unknown statuses fall back to neutral.
 */
const STATUS_MAP: Record<string, BadgeProps['tone']> = {
    New: 'sky',
    'In Progress': 'blue',
    Quoted: 'violet',
    Confirmed: 'emerald',
    Converted: 'green',
    Draft: 'neutral',
    'Pending Approval': 'amber',
    Approved: 'emerald',
    Sent: 'blue',
    Dispatched: 'indigo',
    Installed: 'green',
    Cancelled: 'red',
    Lost: 'red',
    'On Hold': 'orange',
    'Low Stock': 'amber',
    'Out of Stock': 'red',
};

export interface StatusBadgeProps {
    status: string;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const tone = STATUS_MAP[status] ?? 'neutral';
    return (
        <Badge tone={tone} className={cn(className)}>
            {status}
        </Badge>
    );
}

/** Exposed for tests / storybook-lite iteration. */
// eslint-disable-next-line react-refresh/only-export-components
export const STATUS_KEYS = Object.keys(STATUS_MAP);
