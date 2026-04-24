import type { ReactNode } from 'react';
import { EmptyState } from './EmptyState';
import { LoadingSkeleton } from './LoadingSkeleton';
import { cn } from '@/lib/cn';

export interface DataTableColumn<Row> {
    /** Unique key, typically a field name. */
    key: string;
    header: ReactNode;
    /** Cell renderer — receives the row. */
    cell: (row: Row) => ReactNode;
    /** Optional width helper class (e.g. `w-40`, `w-[20%]`). */
    className?: string;
    /** Right-align numeric columns. */
    align?: 'left' | 'right' | 'center';
}

export interface DataTableProps<Row> {
    columns: DataTableColumn<Row>[];
    rows: Row[];
    /** Unique row key accessor. */
    rowKey: (row: Row, index: number) => string | number;
    isLoading?: boolean;
    /** Rendered when `rows` is empty and not loading. */
    emptyState?: ReactNode;
    /** Click handler (keyboard-accessible) on rows. */
    onRowClick?: (row: Row) => void;
    /** Classes for the outer wrapper. */
    className?: string;
    /** Caption for screen readers. */
    caption?: string;
    /** Sticky header when scrolled inside a fixed-height container. */
    stickyHeader?: boolean;
}

const ALIGN_CLASS: Record<
    NonNullable<DataTableColumn<unknown>['align']>,
    string
> = {
    left: 'text-left',
    right: 'text-right',
    center: 'text-center',
};

export function DataTable<Row>({
    columns,
    rows,
    rowKey,
    isLoading = false,
    emptyState,
    onRowClick,
    className,
    caption,
    stickyHeader = true,
}: DataTableProps<Row>) {
    if (isLoading) {
        return (
            <div
                className={cn(
                    'overflow-hidden rounded-xl border border-slate-200 bg-white',
                    className,
                )}
            >
                <LoadingSkeleton variant="table" rows={6} />
            </div>
        );
    }

    if (!rows.length) {
        return (
            <div className={cn(className)}>
                {emptyState ?? (
                    <EmptyState
                        title="No records yet"
                        description="Records matching your filters will appear here."
                    />
                )}
            </div>
        );
    }

    return (
        <div
            className={cn(
                'overflow-hidden rounded-xl border border-slate-200 bg-white',
                className,
            )}
        >
            <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0 text-sm">
                    {caption && <caption className="sr-only">{caption}</caption>}
                    <thead
                        className={cn(
                            'bg-slate-50 text-xs uppercase tracking-wide text-slate-500',
                            stickyHeader && 'sticky top-0 z-10',
                        )}
                    >
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    scope="col"
                                    className={cn(
                                        'border-b border-slate-200 px-4 py-3 font-semibold',
                                        ALIGN_CLASS[col.align ?? 'left'],
                                        col.className,
                                    )}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => {
                            const key = rowKey(row, index);
                            const clickable = Boolean(onRowClick);
                            return (
                                <tr
                                    key={key}
                                    className={cn(
                                        'transition-colors even:bg-slate-50/40',
                                        clickable &&
                                        'cursor-pointer hover:bg-blue-50 focus-visible:bg-blue-50',
                                    )}
                                    onClick={clickable ? () => onRowClick?.(row) : undefined}
                                    onKeyDown={
                                        clickable
                                            ? (e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    onRowClick?.(row);
                                                }
                                            }
                                            : undefined
                                    }
                                    tabIndex={clickable ? 0 : undefined}
                                    role={clickable ? 'button' : undefined}
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={col.key}
                                            className={cn(
                                                'border-b border-slate-100 px-4 py-3 text-slate-700',
                                                ALIGN_CLASS[col.align ?? 'left'],
                                                col.className,
                                            )}
                                        >
                                            {col.cell(row)}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
