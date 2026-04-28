import type { ReactNode } from 'react';
import { Activity } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from './Sheet';
import { Button } from './Button';
import { formatRelative } from '@/lib/format';

export interface AuditEntry {
    id: string;
    at: string | Date;
    actor: string;
    action: string;
    detail?: string;
    icon?: ReactNode;
}

export interface AuditDrawerProps {
    open: boolean;
    onOpenChange: (next: boolean) => void;
    title?: string;
    description?: string;
    entries: AuditEntry[];
}

export function AuditDrawer({
    open,
    onOpenChange,
    title = 'Activity log',
    description = 'Audit trail of all actions taken on this record.',
    entries,
}: AuditDrawerProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[420px] max-w-[92vw]" side="right">
                <SheetHeader>
                    <SheetTitle>{title}</SheetTitle>
                    <SheetDescription>{description}</SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-5 py-4">
                    {entries.length === 0 ? (
                        <p className="text-sm text-slate-500">No activity recorded yet.</p>
                    ) : (
                        <ol className="relative ml-2 space-y-4 border-l border-slate-200 pl-4">
                            {entries.map((e) => (
                                <li key={e.id} className="relative">
                                    <span className="absolute -left-[21px] top-1 inline-flex size-3 items-center justify-center rounded-full bg-blue-500 ring-4 ring-white">
                                        <span className="sr-only">Event</span>
                                    </span>
                                    <p className="text-sm font-medium text-slate-800">{e.action}</p>
                                    {e.detail && <p className="text-xs text-slate-600">{e.detail}</p>}
                                    <p className="mt-0.5 text-xs text-slate-400">
                                        {e.actor} · {formatRelative(e.at)}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

/** Convenience trigger button that ships with the icon. */
export function AuditTriggerButton({ onClick }: { onClick: () => void }) {
    return (
        <Button variant="outline" size="sm" onClick={onClick} aria-label="View activity">
            <Activity className="mr-1.5 size-4" aria-hidden="true" />
            Activity
        </Button>
    );
}
