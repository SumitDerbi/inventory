import type { AuditEntry } from '@/components/ui/AuditDrawer';

const ACTORS = ['Priya Sharma', 'Rahul Kumar', 'System', 'Anita Desai', 'Vikram Singh'];

/**
 * Deterministic mock activity log keyed by record id. Pure function — same id
 * always returns the same entries so the drawer is stable across renders.
 */
export function mockActivity(recordId: string, kind: string): AuditEntry[] {
    const seed = recordId.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
    const base = Date.now() - 1000 * 60 * 60 * 24 * 7;
    const events: Array<[string, string]> = [
        [`${kind} created`, 'Initial draft saved'],
        [`${kind} edited`, 'Items + terms updated'],
        [`${kind} submitted`, 'Sent for approval'],
        [`${kind} approved`, 'Approval level 1 cleared'],
        [`${kind} sent`, 'Notification dispatched'],
    ];
    return events.map(([action, detail], idx) => ({
        id: `${recordId}-act-${idx}`,
        at: new Date(base + idx * 1000 * 60 * 60 * 6 + seed * 1000),
        actor: ACTORS[(seed + idx) % ACTORS.length],
        action,
        detail,
    }));
}
