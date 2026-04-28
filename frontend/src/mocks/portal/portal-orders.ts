/**
 * Portal projection of `sales-orders.ts` — internal cost / margin /
 * assignee fields are stripped via dedicated portal types.
 */
import { orders } from '../orders';
import type { OrderStage } from '@/lib/orderStatus';
import { dispatches } from '../dispatches';
import { jobs } from '../jobs';
import { currentClientUser } from './client-users';

export interface PortalOrderItem {
    id: string;
    description: string;
    specNotes: string;
    quantity: number;
    uom: string;
}

export interface PortalOrder {
    id: string;
    orderNumber: string;
    quotationNumber: string;
    projectName: string;
    siteAddress: string;
    confirmedAt: string;
    expectedDeliveryDate: string;
    stage: OrderStage;
    totalValue: number;
    readinessFlag: 'green' | 'amber' | 'red';
    items: PortalOrderItem[];
}

export interface PortalTimelineEvent {
    id: string;
    at: string;
    label: string;
    detail: string;
    kind: 'stage' | 'dispatch' | 'job' | 'document';
}

function projectOrder(o: typeof orders[number]): PortalOrder {
    return {
        id: o.id,
        orderNumber: o.orderNumber,
        quotationNumber: o.quotationNumber,
        projectName: o.projectName,
        siteAddress: o.siteAddress,
        confirmedAt: o.confirmedAt,
        expectedDeliveryDate: o.expectedDeliveryDate,
        stage: o.stage,
        totalValue: o.totalValue,
        readinessFlag: o.readinessFlag,
        items: o.items.map((i) => ({
            id: i.id,
            description: i.description,
            specNotes: i.specNotes,
            quantity: i.orderedQty,
            uom: i.uom,
        })),
    };
}

export function portalOrders(): PortalOrder[] {
    const company = currentClientUser().companyName;
    return orders
        .filter((o) => o.companyName === company)
        .map(projectOrder);
}

export function portalOrderById(id: string): PortalOrder | undefined {
    const company = currentClientUser().companyName;
    const o = orders.find((x) => x.id === id && x.companyName === company);
    return o ? projectOrder(o) : undefined;
}

export function portalOrderTimeline(orderId: string): PortalTimelineEvent[] {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return [];
    const events: PortalTimelineEvent[] = [];

    // Stage history from order.activity (filter customer-relevant)
    for (const a of order.activity) {
        if (a.type === 'stage_change' || a.type === 'readiness' || a.type === 'invoice') {
            events.push({
                id: `o-${a.id}`,
                at: a.at,
                label: a.summary,
                detail: '',
                kind: 'stage',
            });
        }
    }

    // Dispatch milestones
    for (const d of dispatches.filter((x) => x.orderIds.includes(orderId))) {
        events.push({
            id: `d-${d.id}`,
            at: d.activity[0]?.at ?? order.confirmedAt,
            label: `Dispatch ${d.challanNumber ?? d.id} — ${d.stage}`,
            detail: `${d.transporterId ? 'Transporter assigned' : ''} → ${d.destinationCity}`,
            kind: 'dispatch',
        });
    }

    // Installation jobs
    for (const j of jobs.filter((x) => x.orderId === orderId)) {
        events.push({
            id: `j-${j.id}`,
            at: j.scheduledStart,
            label: `${j.type === 'installation' ? 'Installation' : 'Service'} scheduled (${j.jobNumber})`,
            detail: `Status: ${j.status}`,
            kind: 'job',
        });
    }

    return events.sort((a, b) => a.at.localeCompare(b.at));
}
