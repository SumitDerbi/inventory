import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, MessageSquare } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/FormField';
import { portalTickets, type SupportTicket } from '@/mocks/portal/portal-tickets';
import { formatRelative } from '@/lib/format';

const STATUS_TONE: Record<SupportTicket['status'], 'amber' | 'blue' | 'emerald' | 'neutral'> = {
    open: 'amber',
    in_progress: 'blue',
    resolved: 'emerald',
    closed: 'neutral',
};
const STATUS_LABEL: Record<SupportTicket['status'], string> = {
    open: 'Open',
    in_progress: 'In progress',
    resolved: 'Resolved',
    closed: 'Closed',
};
const PRIORITY_TONE: Record<SupportTicket['priority'], 'neutral' | 'amber' | 'red'> = {
    low: 'neutral',
    medium: 'amber',
    high: 'red',
};

export default function PortalTicketsListPage() {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState<'all' | SupportTicket['status']>('all');

    const all = portalTickets();
    const filtered = all.filter((t) => {
        if (status !== 'all' && t.status !== status) return false;
        if (query) {
            const q = query.toLowerCase();
            return t.subject.toLowerCase().includes(q) || t.body.toLowerCase().includes(q);
        }
        return true;
    });

    return (
        <div className="space-y-4">
            <PageHeader
                title="Support tickets"
                description="Raise questions, requests, and feedback for our team."
                actions={
                    <Button asChild variant="primary">
                        <Link to="/portal/tickets/new"><Plus className="size-4" /> New ticket</Link>
                    </Button>
                }
            />

            <div className="flex flex-col gap-2 md:flex-row">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" />
                    <Input
                        type="search"
                        placeholder="Search tickets"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <select
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as typeof status)}
                >
                    <option value="all">All statuses</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                </select>
            </div>

            {filtered.length === 0 ? (
                <EmptyState
                    title="No tickets yet"
                    description="Raise a new ticket and our team will respond within one business day."
                    action={
                        <Button asChild variant="primary">
                            <Link to="/portal/tickets/new"><Plus className="size-4" /> New ticket</Link>
                        </Button>
                    }
                />
            ) : (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                    {filtered.map((t) => (
                        <li key={t.id}>
                            <button
                                type="button"
                                onClick={() => navigate(`/portal/tickets/${t.id}`)}
                                className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50"
                            >
                                <MessageSquare className="mt-0.5 size-4 text-slate-400" />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="truncate font-medium text-slate-900">{t.subject}</span>
                                    </div>
                                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                                        <span>{t.id.toUpperCase()}</span>
                                        <span>·</span>
                                        <span>{t.replies.length} {t.replies.length === 1 ? 'reply' : 'replies'}</span>
                                        <span>·</span>
                                        <span>Updated {formatRelative(t.lastReplyAt)}</span>
                                    </div>
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-1">
                                    <Badge tone={STATUS_TONE[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                                    <Badge tone={PRIORITY_TONE[t.priority]}>{t.priority}</Badge>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
