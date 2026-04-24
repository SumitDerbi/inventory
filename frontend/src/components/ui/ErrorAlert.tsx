import type { ReactNode } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/cn';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

export interface ErrorAlertProps {
  title: string;
  description?: ReactNode;
  variant?: AlertVariant;
  action?: ReactNode;
  className?: string;
}

const VARIANT_STYLES: Record<
  AlertVariant,
  { container: string; icon: string; Icon: typeof Info }
> = {
  info: {
    container: 'border-sky-200 bg-sky-50 text-sky-800',
    icon: 'text-sky-500',
    Icon: Info,
  },
  success: {
    container: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: 'text-emerald-500',
    Icon: CheckCircle2,
  },
  warning: {
    container: 'border-amber-200 bg-amber-50 text-amber-800',
    icon: 'text-amber-500',
    Icon: AlertTriangle,
  },
  danger: {
    container: 'border-red-200 bg-red-50 text-red-800',
    icon: 'text-red-500',
    Icon: AlertCircle,
  },
};

/**
 * Inline alert used for errors, warnings, and informational banners.
 * Named ErrorAlert per plan spec; supports all 4 tones via `variant`.
 */
export function ErrorAlert({
  title,
  description,
  variant = 'danger',
  action,
  className,
}: ErrorAlertProps) {
  const { container, icon, Icon } = VARIANT_STYLES[variant];
  return (
    <div
      role="alert"
      className={cn('flex gap-3 rounded-lg border px-4 py-3', container, className)}
    >
      <Icon className={cn('mt-0.5 size-5 shrink-0', icon)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        {description && (
          <div className="mt-1 text-sm opacity-90">{description}</div>
        )}
      </div>
      {action && <div className="shrink-0 self-start">{action}</div>}
    </div>
  );
}
