import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Input } from './FormField';
import { cn } from '@/lib/cn';

export interface FilterBarProps {
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
    /** Slot for filter controls (Select dropdowns, date pickers, etc.). */
    filters?: ReactNode;
    /** Right-aligned slot for export/action buttons. */
    actions?: ReactNode;
    className?: string;
}

/**
 * Standard toolbar above every list page.
 * Layout: [search] [filters…]                     [actions]
 */
export function FilterBar({
    searchValue,
    onSearchChange,
    searchPlaceholder = 'Search…',
    filters,
    actions,
    className,
}: FilterBarProps) {
    return (
        <div
            className={cn(
                'mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 md:flex-row md:items-center',
                className,
            )}
        >
            <div className="relative flex-1 min-w-0 md:max-w-sm">
                <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                />
                <Input
                    type="search"
                    value={searchValue ?? ''}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="pl-9"
                    aria-label="Search"
                />
            </div>
            {filters && (
                <div className="flex flex-wrap items-center gap-2">{filters}</div>
            )}
            {actions && (
                <div className="flex flex-wrap items-center gap-2 md:ml-auto">
                    {actions}
                </div>
            )}
        </div>
    );
}
