import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import {
    FileSpreadsheet,
    FileText,
    MessageSquare,
    Package,
    ShoppingCart,
    Truck,
} from 'lucide-react';
import type { ActivityItem, ActivityType } from '@/mocks/dashboard';
import { formatRelative } from '@/lib/format';
import { cn } from '@/lib/cn';

const TYPE_META: Record<
    ActivityType,
    { icon: ComponentType<LucideProps>; className: string }
> = {
    inquiry: { icon: MessageSquare, className: 'bg-blue-50 text-blue-600' },
    quotation: { icon: FileText, className: 'bg-violet-50 text-violet-600' },
    order: { icon: ShoppingCart, className: 'bg-emerald-50 text-emerald-600' },
    dispatch: { icon: Truck, className: 'bg-sky-50 text-sky-600' },
    inventory: { icon: Package, className: 'bg-amber-50 text-amber-600' },
    document: {
        icon: FileSpreadsheet,
        className: 'bg-slate-100 text-slate-600',
    },
};

export interface RecentActivityFeedProps {
    items: ActivityItem[];
}

export function RecentActivityFeed({ items }: RecentActivityFeedProps) {
    return (
        <ul className="max-h-80 space-y-4 overflow-y-auto pr-1">
            {items.map((item) => {
                const { icon: Icon, className } = TYPE_META[item.type];
                return (
                    <li key={item.id} className="flex gap-3">
                        <span
                            className={cn(
                                'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full',
                                className,
                            )}
                            aria-hidden="true"
                        >
                            <Icon className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-800">
                                {item.title}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                                {item.description}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-400">
                                {item.actor} · {formatRelative(item.timestamp)}
                            </p>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
