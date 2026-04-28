import { useState } from 'react';
import {
    Bell,
    FileText,
    PackageOpen,
    Wrench,
    FolderOpen,
    LifeBuoy,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
    portalNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    type PortalNotificationKind,
} from '@/mocks/portal/portal-notifications';
import { formatRelative } from '@/lib/format';

const KIND_ICON: Record<PortalNotificationKind, typeof Bell> = {
    'quotation.sent': FileText,
    'order.shipped': PackageOpen,
    'job.scheduled': Wrench,
    'document.uploaded': FolderOpen,
    'ticket.replied': LifeBuoy,
};

export default function PortalNotificationsPage() {
    const [, force] = useState(0);
    const list = portalNotifications();
    const unreadCount = list.filter((n) => !n.read).length;

    function handleClick(id: string) {
        markNotificationRead(id);
        force((n) => n + 1);
    }

    function markAll() {
        markAllNotificationsRead();
        force((n) => n + 1);
    }

    return (
        <div className="space-y-4">
            <PageHeader
                title="Notifications"
                actions={
                    unreadCount > 0 ? (
                        <Button size="sm" variant="outline" onClick={markAll}>
                            Mark all as read
                        </Button>
                    ) : null
                }
            />

            {list.length === 0 ? (
                <EmptyState title="You're all caught up" />
            ) : (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                    {list.map((n) => {
                        const Icon = KIND_ICON[n.kind] ?? Bell;
                        return (
                            <li key={n.id}>
                                <Link
                                    to={n.link}
                                    onClick={() => handleClick(n.id)}
                                    className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 ${
                                        !n.read ? 'bg-blue-50/40' : ''
                                    }`}
                                >
                                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                                        <Icon className="size-4" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="truncate text-sm font-medium text-slate-900">{n.title}</span>
                                            {!n.read && <span className="size-2 shrink-0 rounded-full bg-blue-500" />}
                                        </div>
                                        <div className="truncate text-xs text-slate-500">{n.body}</div>
                                    </div>
                                    <span className="shrink-0 text-xs text-slate-400">{formatRelative(n.createdAt)}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
