/**
 * Portal-only — support tickets raised by client users.
 * Mutable in-memory store; resets on full reload.
 */
import { currentClientUser } from './client-users';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface TicketReply {
    id: string;
    at: string;
    fromName: string;
    /** 'customer' = client side, 'support' = staff side. */
    side: 'customer' | 'support';
    body: string;
}

export interface SupportTicket {
    id: string;
    organizationId: string;
    raisedByName: string;
    subject: string;
    body: string;
    status: TicketStatus;
    priority: TicketPriority;
    createdAt: string;
    lastReplyAt: string;
    replies: TicketReply[];
    attachments: { id: string; name: string }[];
}

const today = Date.now();
const iso = (offsetDays: number, hour = 11): string => {
    const d = new Date(today + offsetDays * 86_400_000);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
};

export const tickets: SupportTicket[] = [
    {
        id: 'tk-001',
        organizationId: 'org-001',
        raisedByName: 'Rajesh Patel',
        subject: 'Need additional spec sheets for SO-2026-001 pumps',
        body: 'Could you please share the centrifugal pump performance curves for the order placed last month?',
        status: 'open',
        priority: 'medium',
        createdAt: iso(-1),
        lastReplyAt: iso(-1),
        replies: [],
        attachments: [],
    },
    {
        id: 'tk-002',
        organizationId: 'org-001',
        raisedByName: 'Sandeep Mehta',
        subject: 'Invoice format request — GST breakup separately',
        body: 'Our internal audit needs CGST/SGST printed in separate columns on invoices going forward.',
        status: 'in_progress',
        priority: 'low',
        createdAt: iso(-4),
        lastReplyAt: iso(-2),
        replies: [
            {
                id: 'r-001',
                at: iso(-2),
                fromName: 'Support — Priya',
                side: 'support',
                body: 'Noted. Updating the invoice template; effective next month.',
            },
        ],
        attachments: [],
    },
    {
        id: 'tk-003',
        organizationId: 'org-002',
        raisedByName: 'Neha Verma',
        subject: 'Installation date clash — please reschedule J-1024',
        body: 'Site civil works are running 4 days late. Please move installation to next Monday.',
        status: 'resolved',
        priority: 'high',
        createdAt: iso(-6),
        lastReplyAt: iso(-5),
        replies: [
            {
                id: 'r-002',
                at: iso(-5),
                fromName: 'Support — Arjun',
                side: 'support',
                body: 'Rescheduled. Engineer Manish will reach site Monday at 10 AM.',
            },
        ],
        attachments: [],
    },
    {
        id: 'tk-004',
        organizationId: 'org-002',
        raisedByName: 'Site Engineer',
        subject: 'Need warranty certificate for delivered pumps',
        body: 'Three pumps delivered last week — please share warranty certificates for our records.',
        status: 'open',
        priority: 'medium',
        createdAt: iso(-2),
        lastReplyAt: iso(-2),
        replies: [],
        attachments: [],
    },
    {
        id: 'tk-005',
        organizationId: 'org-003',
        raisedByName: 'Anil Joshi',
        subject: 'Quotation Q-2026-005 — discount possible?',
        body: 'Volumes are larger than initially indicated. Can we revisit pricing?',
        status: 'open',
        priority: 'high',
        createdAt: iso(0, 9),
        lastReplyAt: iso(0, 9),
        replies: [],
        attachments: [],
    },
    {
        id: 'tk-006',
        organizationId: 'org-003',
        raisedByName: 'Priya Sharma',
        subject: 'Updated PO copy attached',
        body: 'Please find attached the revised customer PO with corrected billing address.',
        status: 'closed',
        priority: 'low',
        createdAt: iso(-12),
        lastReplyAt: iso(-10),
        replies: [
            {
                id: 'r-003',
                at: iso(-11),
                fromName: 'Support — Priya',
                side: 'support',
                body: 'Received and updated in our system.',
            },
            {
                id: 'r-004',
                at: iso(-10),
                fromName: 'Priya Sharma',
                side: 'customer',
                body: 'Thanks, all good.',
            },
        ],
        attachments: [{ id: 'a-001', name: 'PO-revised.pdf' }],
    },
    {
        id: 'tk-007',
        organizationId: 'org-001',
        raisedByName: 'Rajesh Patel',
        subject: 'AMC renewal query',
        body: 'Our AMC expires in 6 weeks — please share renewal proposal.',
        status: 'in_progress',
        priority: 'medium',
        createdAt: iso(-3),
        lastReplyAt: iso(-1, 16),
        replies: [
            {
                id: 'r-005',
                at: iso(-1, 16),
                fromName: 'Support — Aman',
                side: 'support',
                body: 'Working with the team to put together the proposal. Will share by end of week.',
            },
        ],
        attachments: [],
    },
    {
        id: 'tk-008',
        organizationId: 'org-002',
        raisedByName: 'Neha Verma',
        subject: 'Engineer feedback — excellent service',
        body: 'Just wanted to call out engineer Manish for an excellent commissioning visit yesterday.',
        status: 'closed',
        priority: 'low',
        createdAt: iso(-8),
        lastReplyAt: iso(-7),
        replies: [
            {
                id: 'r-006',
                at: iso(-7),
                fromName: 'Support — Priya',
                side: 'support',
                body: 'Thank you so much! Passing the feedback on to Manish and the team.',
            },
        ],
        attachments: [],
    },
];

export function portalTickets(): SupportTicket[] {
    const orgId = currentClientUser().organizationId;
    return tickets
        .filter((t) => t.organizationId === orgId)
        .sort((a, b) => b.lastReplyAt.localeCompare(a.lastReplyAt));
}

export function portalTicketById(id: string): SupportTicket | undefined {
    const orgId = currentClientUser().organizationId;
    return tickets.find((t) => t.id === id && t.organizationId === orgId);
}

export function createPortalTicket(input: {
    subject: string;
    body: string;
    priority: TicketPriority;
}): SupportTicket {
    const user = currentClientUser();
    const t: SupportTicket = {
        id: `tk-${Math.floor(Math.random() * 9000 + 1000)}`,
        organizationId: user.organizationId,
        raisedByName: user.name,
        subject: input.subject,
        body: input.body,
        status: 'open',
        priority: input.priority,
        createdAt: new Date().toISOString(),
        lastReplyAt: new Date().toISOString(),
        replies: [],
        attachments: [],
    };
    tickets.unshift(t);
    return t;
}

export function replyPortalTicket(id: string, body: string): SupportTicket | undefined {
    const t = portalTicketById(id);
    if (!t) return undefined;
    t.replies.push({
        id: `r-${Date.now()}`,
        at: new Date().toISOString(),
        fromName: currentClientUser().name,
        side: 'customer',
        body,
    });
    t.lastReplyAt = new Date().toISOString();
    if (t.status === 'closed' || t.status === 'resolved') t.status = 'open';
    return t;
}
