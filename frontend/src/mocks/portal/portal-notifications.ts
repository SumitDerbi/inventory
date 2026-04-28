/**
 * Portal-only notifications.
 */
import { currentClientUser } from './client-users';

export type PortalNotificationKind =
    | 'quotation.sent'
    | 'order.shipped'
    | 'job.scheduled'
    | 'document.uploaded'
    | 'ticket.replied';

export interface PortalNotification {
    id: string;
    organizationId: string;
    kind: PortalNotificationKind;
    title: string;
    body: string;
    link: string;
    read: boolean;
    createdAt: string;
}

const today = Date.now();
const iso = (offsetHours: number): string =>
    new Date(today - offsetHours * 3_600_000).toISOString();

export const notifications: PortalNotification[] = [
    { id: 'pn-001', organizationId: 'org-001', kind: 'quotation.sent', title: 'New quotation Q-2026-001', body: 'Sales team has shared a fresh quotation for ETP Phase II.', link: '/portal/quotations/qt-001', read: false, createdAt: iso(2) },
    { id: 'pn-002', organizationId: 'org-001', kind: 'order.shipped', title: 'SO-2026-001 dispatched', body: 'Challan CH-2026-001 — vehicle GJ-01-AB-4521 departed Ahmedabad.', link: '/portal/orders/so-001', read: false, createdAt: iso(8) },
    { id: 'pn-003', organizationId: 'org-001', kind: 'document.uploaded', title: 'Test certificate available', body: 'Hydrostatic test report uploaded for SO-2026-001.', link: '/portal/documents', read: true, createdAt: iso(30) },
    { id: 'pn-004', organizationId: 'org-001', kind: 'ticket.replied', title: 'Reply on ticket TK-002', body: 'Support team has updated your invoice format request.', link: '/portal/tickets/tk-002', read: true, createdAt: iso(50) },
    { id: 'pn-005', organizationId: 'org-002', kind: 'job.scheduled', title: 'Installation rescheduled', body: 'Job J-1024 moved to next Monday 10 AM.', link: '/portal/jobs', read: false, createdAt: iso(5) },
    { id: 'pn-006', organizationId: 'org-002', kind: 'order.shipped', title: 'SO-2026-004 delivered', body: 'POD signed by site engineer.', link: '/portal/orders/so-004', read: true, createdAt: iso(120) },
    { id: 'pn-007', organizationId: 'org-002', kind: 'document.uploaded', title: 'Drawing revision uploaded', body: 'Cooling tower revamp — drawing v2.', link: '/portal/documents', read: true, createdAt: iso(140) },
    { id: 'pn-008', organizationId: 'org-002', kind: 'quotation.sent', title: 'Quotation Q-2026-006', body: 'Quotation for Cooling tower revamp shared.', link: '/portal/quotations', read: true, createdAt: iso(200) },
    { id: 'pn-009', organizationId: 'org-003', kind: 'order.shipped', title: 'SO-2026-003 delivered', body: 'Boiler feed water pumps received at site.', link: '/portal/orders/so-003', read: false, createdAt: iso(12) },
    { id: 'pn-010', organizationId: 'org-003', kind: 'ticket.replied', title: 'New reply on TK-005', body: 'Sales team has responded to your discount query.', link: '/portal/tickets/tk-005', read: false, createdAt: iso(20) },
    { id: 'pn-011', organizationId: 'org-003', kind: 'document.uploaded', title: 'Commissioning report ready', body: 'Signed-off commissioning report uploaded.', link: '/portal/documents', read: true, createdAt: iso(180) },
    { id: 'pn-012', organizationId: 'org-003', kind: 'job.scheduled', title: 'Service visit scheduled', body: 'Quarterly service visit planned for next Wednesday.', link: '/portal/jobs', read: true, createdAt: iso(220) },
];

export function portalNotifications(): PortalNotification[] {
    const orgId = currentClientUser().organizationId;
    return notifications
        .filter((n) => n.organizationId === orgId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function unreadNotificationCount(): number {
    return portalNotifications().filter((n) => !n.read).length;
}

export function markNotificationRead(id: string): void {
    const n = notifications.find((x) => x.id === id);
    if (n) n.read = true;
}

export function markAllNotificationsRead(): void {
    const orgId = currentClientUser().organizationId;
    for (const n of notifications) {
        if (n.organizationId === orgId) n.read = true;
    }
}
