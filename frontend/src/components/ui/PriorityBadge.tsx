import { Badge, type BadgeProps } from './Badge';
import { cn } from '@/lib/cn';

const PRIORITY_MAP: Record<string, BadgeProps['tone']> = {
  High: 'red',
  Medium: 'amber',
  Low: 'neutral',
  Urgent: 'urgent',
  Normal: 'neutral',
};

export interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const tone = PRIORITY_MAP[priority] ?? 'neutral';
  return (
    <Badge tone={tone} className={cn(className)}>
      {priority}
    </Badge>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const PRIORITY_KEYS = Object.keys(PRIORITY_MAP);
