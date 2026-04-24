import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Bell,
    Boxes,
    CheckCheck,
    ClipboardList,
    FileBarChart,
    Settings as SettingsIcon,
    ShoppingCart,
    Truck,
    Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/ui/FilterBar';
import { Select } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { formatRelative } from '@/lib/format';
import {
    NOTIFICATION_KIND_LABEL,
    NOTIFICATION_KIND_TONE,
    notifications,
    notificationsSummary,
    type NotificationItem,
    type NotificationKind,
} from '@/mocks/admin';

const KIND_ICON: Record<NotificationKind, LucideIcon> = {
    inquiry: ClipboardList,
    quotation: FileBarChart,
    order: ShoppingCart,
    dispatch: Truck,
    job: Wrench,
    inventory: Boxes,
    system: SettingsIcon,
};

const KIND_ICON_CLASS: Record<NotificationKind, string> = {
    inquiry: 'bg-sky-100 text-sky-700',
    quotation: 'bg-violet-100 text-violet-700',
    order: 'bg-blue-100 text-blue-700',
    dispatch: 'bg-emerald-100 text-emerald-700',
    job: 'bg-amber-100 text-amber-700',
    inventory: 'bg-orange-100 text-orange-700',
    system: 'bg-slate-100 text-slate-600',
};

type ReadFilter = 'all' | 'unread' | 'read';

export default function NotificationCenterPage() {
    const { push } = useToast();
    const [search, setSearch] = useState('');
    const [kindFilter, setKindFilter] = useState<NotificationKind | 'all'>(
        'all',
    );
    const [readFilter, setReadFilter] = useState<ReadFilter>('all');

    const summary = useMemo(() => notificationsSummary(), []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return notifications.filter((n) => {
            if (kindFilter !== 'all' && n.kind !== kindFilter) return false;
            if (readFilter === 'unread' && n.read) return false;
            if (readFilter === 'read' && !n.read) return false;
            if (!q) return true;
            return (
                n.title.toLowerCase().includes(q) ||
                n.body.toLowerCase().includes(q)
            );
        });
    }, [search, kindFilter, readFilter]);

    function handleMarkAll() {
        push({
            variant: 'success',
            title: 'All caught up',
            description: 'Marked every notification as read.',
        });
    }

    return (
        <div>
            <PageHeader
                title="Notifications"
                description="Activity from across modules — inquiries, quotations, orders, jobs and system events."
                actions={
                    <Button onClick={handleMarkAll} disabled={summary.unread === 0}>
                        <CheckCheck className="size-4" aria-hidden="true" />
                        Mark all read
                    </Button>
                }
            />

            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                <SummaryStat label="Total" value={summary.total} />
                <SummaryStat
                    label="Unread"
                    value={summary.unread}
                    tone="red"
                />
                <SummaryStat
                    label="This week"
                    value={notifications.length}
                    tone="sky"
                />
            </div>

            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search notifications…"
                filters={
                    <>
                        <Select
                            aria-label="Module"
                            value={kindFilter}
                            onChange={(e) =>
                                setKindFilter(
                                    e.target.value as NotificationKind | 'all',
                                )
                            }
                            className="w-44"
                        >
                            <option value="all">All modules</option>
                            {(
                                Object.keys(
                                    NOTIFICATION_KIND_LABEL,
                                ) as NotificationKind[]
                            ).map((k) => (
                                <option key={k} value={k}>
                                    {NOTIFICATION_KIND_LABEL[k]}
                                </option>
                            ))}
                        </Select>
                        <Select
                            aria-label="Read state"
                            value={readFilter}
                            onChange={(e) =>
                                setReadFilter(e.target.value as ReadFilter)
                            }
                            className="w-36"
                        >
                            <option value="all">All</option>
                            <option value="unread">Unread</option>
                            <option value="read">Read</option>
                        </Select>
                    </>
                }
            />

            {filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
                    <Bell
                        className="mx-auto size-8 text-slate-300"
                        aria-hidden="true"
                    />
                    <p className="mt-2 text-sm font-medium text-slate-700">
                        No notifications match these filters.
                    </p>
                    <p className="text-xs text-slate-400">
                        Try clearing the search or changing the module filter.
                    </p>
                </div>
            ) : (
                <ul className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {filtered.map((n, idx) => (
                        <NotificationRow
                            key={n.id}
                            item={n}
                            divider={idx < filtered.length - 1}
                        />
                    ))}
                </ul>
            )}
        </div>
    );
}

function NotificationRow({
    item,
    divider,
}: {
    item: NotificationItem;
    divider: boolean;
}) {
    const Icon = KIND_ICON[item.kind];
    const Wrapper: typeof Link | 'div' = item.href ? Link : 'div';

    const content = (
        <div className="flex items-start gap-3 px-5 py-4">
            <span
                className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-lg',
                    KIND_ICON_CLASS[item.kind],
                )}
                aria-hidden="true"
            >
                <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-800">
                        {item.title}
                    </span>
                    <Badge tone={NOTIFICATION_KIND_TONE[item.kind]}>
                        {NOTIFICATION_KIND_LABEL[item.kind]}
                    </Badge>
                    {!item.read && (
                        <span
                            className="inline-block size-2 rounded-full bg-red-500"
                            aria-label="Unread"
                        />
                    )}
                </div>
                <p className="mt-0.5 text-sm text-slate-500">{item.body}</p>
            </div>
            <span className="shrink-0 text-xs text-slate-400">
                {formatRelative(item.createdAt)}
            </span>
        </div>
    );

    if (Wrapper === Link && item.href) {
        return (
            <li className={cn(divider && 'border-b border-slate-100')}>
                <Link
                    to={item.href}
                    className="block transition hover:bg-slate-50"
                >
                    {content}
                </Link>
            </li>
        );
    }

    return (
        <li className={cn(divider && 'border-b border-slate-100')}>
            {content}
        </li>
    );
}

function SummaryStat({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone?: 'red' | 'sky';
}) {
    const toneClass =
        tone === 'red'
            ? 'text-red-700'
            : tone === 'sky'
              ? 'text-sky-700'
              : 'text-slate-800';
    return (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-slate-400">
                {label}
            </div>
            <div className={`mt-1 text-2xl font-semibold ${toneClass}`}>
                {value}
            </div>
        </div>
    );
}
