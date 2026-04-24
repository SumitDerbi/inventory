import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumb?: BreadcrumbItem[];
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav
            aria-label="Breadcrumb"
            className="mb-2 flex items-center gap-1 text-xs text-slate-400"
          >
            {breadcrumb.map((item, idx) => (
              <span key={`${item.label}-${idx}`} className="flex items-center gap-1">
                {item.href ? (
                  <a
                    href={item.href}
                    className="hover:text-slate-600 hover:underline"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span className="text-slate-500">{item.label}</span>
                )}
                {idx < breadcrumb.length - 1 && (
                  <ChevronRight
                    className="size-3 text-slate-300"
                    aria-hidden="true"
                  />
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="page-title truncate">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  );
}
