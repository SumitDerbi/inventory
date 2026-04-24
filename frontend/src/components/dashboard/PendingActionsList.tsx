import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { PendingActionGroup } from '@/mocks/dashboard';

export interface PendingActionsListProps {
    groups: PendingActionGroup[];
}

export function PendingActionsList({ groups }: PendingActionsListProps) {
    return (
        <ul className="divide-y divide-slate-100">
            {groups.map((group) => {
                const Icon = group.icon;
                return (
                    <li key={group.id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
                                <Icon className="size-4" aria-hidden="true" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-slate-800">
                                    {group.label}
                                </p>
                                <p className="truncate text-xs text-slate-500">
                                    {group.items[0]?.title ?? 'No items'}
                                </p>
                            </div>
                            <Badge tone="blue" className="shrink-0">
                                {group.count}
                            </Badge>
                            <ChevronRight
                                className="size-4 shrink-0 text-slate-300"
                                aria-hidden="true"
                            />
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
