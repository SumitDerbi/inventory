import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

/** Single skeleton block — use width/height utility classes to size. */
export function Skeleton({ className, ...rest }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200/70', className)}
      aria-hidden="true"
      {...rest}
    />
  );
}

export interface LoadingSkeletonProps {
  /** Number of skeleton rows to render. */
  rows?: number;
  /** Render as a table-style skeleton (rows of cells) instead of stacked bars. */
  variant?: 'stack' | 'table';
  className?: string;
}

export function LoadingSkeleton({
  rows = 5,
  variant = 'stack',
  className,
}: LoadingSkeletonProps) {
  if (variant === 'table') {
    return (
      <div
        className={cn('divide-y divide-slate-100', className)}
        role="status"
        aria-label="Loading"
      >
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="ml-auto h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn('space-y-3', className)}
      role="status"
      aria-label="Loading"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}
