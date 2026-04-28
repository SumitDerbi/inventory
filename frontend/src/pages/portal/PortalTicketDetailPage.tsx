import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Paperclip, Send } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Textarea } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import {
    portalTicketById,
    replyPortalTicket,
    type SupportTicket,
} from '@/mocks/portal/portal-tickets';
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

export default function PortalTicketDetailPage() {
    const { id = '' } = useParams<{ id: string }>();
    const toast = useToast();
    const [ticket, setTicket] = useState(() => portalTicketById(id));
    const [reply, setReply] = useState('');

    if (!ticket) {
        return (
            <EmptyState
                title="Ticket not found"
                action={
                    <Button asChild variant="primary" size="sm">
                        <Link to="/portal/tickets"><ArrowLeft className="size-4" /> Back</Link>
                    </Button>
                }
            />
        );
    }

    function send() {
        if (reply.trim().length < 2) return;
        const updated = replyPortalTicket(ticket!.id, reply.trim());
        if (updated) setTicket({ ...updated });
        setReply('');
        toast.push({ title: 'Reply sent', variant: 'success' });
    }

    return (
        <div className="space-y-4">
            <Button asChild variant="ghost" size="sm" className="-ml-2">
                <Link to="/portal/tickets"><ArrowLeft className="size-4" /> All tickets</Link>
            </Button>

            <PageHeader
                title={ticket.subject}
                description={`${ticket.id.toUpperCase()} · raised ${formatRelative(ticket.createdAt)} by ${ticket.raisedByName}`}
                actions={<Badge tone={STATUS_TONE[ticket.status]}>{STATUS_LABEL[ticket.status]}</Badge>}
            />

            <div className="space-y-3">
                {/* Original message */}
                <article className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900">{ticket.raisedByName}</span>
                        <span className="text-xs text-slate-400">{formatRelative(ticket.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-slate-700">{ticket.body}</p>
                    {ticket.attachments.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {ticket.attachments.map((a) => (
                                <span key={a.id} className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-600">
                                    <Paperclip className="size-3" /> {a.name}
                                </span>
                            ))}
                        </div>
                    )}
                </article>

                {/* Replies */}
                {ticket.replies.map((r) => {
                    const isCustomer = r.side === 'customer';
                    return (
                        <article
                            key={r.id}
                            className={`rounded-xl border p-4 ${
                                isCustomer ? 'ml-4 border-blue-100 bg-blue-50' : 'mr-4 border-slate-200 bg-white'
                            }`}
                        >
                            <div className="mb-1 flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-900">{r.fromName}</span>
                                <span className="text-xs text-slate-400">{formatRelative(r.at)}</span>
                            </div>
                            <p className="whitespace-pre-wrap text-sm text-slate-700">{r.body}</p>
                        </article>
                    );
                })}
            </div>

            {/* Reply box */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
                <Textarea
                    rows={3}
                    placeholder="Write a reply…"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                />
                <div className="mt-2 flex justify-end">
                    <Button variant="primary" size="sm" onClick={send} disabled={reply.trim().length < 2}>
                        <Send className="size-3.5" /> Send reply
                    </Button>
                </div>
            </div>
        </div>
    );
}
