import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Preset tone — falls back to neutral slate when omitted. */
  tone?:
    | 'neutral'
    | 'blue'
    | 'sky'
    | 'violet'
    | 'emerald'
    | 'green'
    | 'amber'
    | 'orange'
    | 'red'
    | 'indigo'
    | 'urgent';
  children: ReactNode;
}

const TONE_CLASSES: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'bg-slate-100 text-slate-600',
  blue: 'bg-blue-100 text-blue-700',
  sky: 'bg-sky-100 text-sky-700',
  violet: 'bg-violet-100 text-violet-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-700',
  orange: 'bg-orange-100 text-orange-700',
  red: 'bg-red-100 text-red-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  urgent: 'bg-red-600 text-white',
};

/**
 * Minimal badge primitive. All status/priority maps derive from this.
 * Classes mirror the pill spec in docs/ui_spec.md §Spacing & Radius.
 */
export function Badge({
  tone = 'neutral',
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        TONE_CLASSES[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
