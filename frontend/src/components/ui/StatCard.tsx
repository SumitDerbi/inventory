import type { ComponentType, ReactNode } from 'react';
import type { LucideProps } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export type StatTone = 'blue' | 'violet' | 'amber' | 'emerald' | 'red' | 'slate';

export interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ComponentType<LucideProps>;
  tone?: StatTone;
  /** Positive number = up trend, negative = down trend, 0 = flat. */
  delta?: number;
  /** Formatted label below delta (e.g. "vs. last month"). */
  deltaLabel?: string;
  className?: string;
}

const TONE_ICON_BG: Record<StatTone, string> = {
  blue: 'bg-blue-50 text-blue-600',
  violet: 'bg-violet-50 text-violet-600',
  amber: 'bg-amber-50 text-amber-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  red: 'bg-red-50 text-red-600',
  slate: 'bg-slate-100 text-slate-600',
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'blue',
  delta,
  deltaLabel,
  className,
}: StatCardProps) {
  const hasDelta = typeof delta === 'number' && !Number.isNaN(delta);
  const isUp = hasDelta && delta > 0;
  const isDown = hasDelta && delta < 0;

  return (
    <div className={cn('card flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <p className="card-title">{label}</p>
        <p className="stat-number mt-2">{value}</p>
        {hasDelta && (
          <p
            className={cn(
              'mt-2 flex items-center gap-1 text-xs font-medium',
              isUp && 'text-emerald-600',
              isDown && 'text-red-600',
              !isUp && !isDown && 'text-slate-500',
            )}
          >
            {isUp && <ArrowUpRight className="size-3" aria-hidden="true" />}
            {isDown && <ArrowDownRight className="size-3" aria-hidden="true" />}
            <span>
              {isUp && '+'}
              {delta}%
            </span>
            {deltaLabel && (
              <span className="text-slate-400 font-normal">
                &middot; {deltaLabel}
              </span>
            )}
          </p>
        )}
      </div>
      {Icon && (
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg',
            TONE_ICON_BG[tone],
          )}
          aria-hidden="true"
        >
          <Icon className="size-5" />
        </span>
      )}
    </div>
  );
}
