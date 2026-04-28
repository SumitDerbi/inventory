import { quotations } from './quotations';
import { orders } from './orders';
import { purchaseRequisitions } from './purchase-requisitions';
import { purchaseOrders } from './purchase-orders';
import { vendorInvoices } from './vendor-invoices';
import { purchaseReturns } from './purchase-returns';
import { CURRENT_USER_ID, users, type UserRole } from './users';

export type ApprovalKind =
    | 'quotation'
    | 'so_amendment'
    | 'pr'
    | 'po'
    | 'vendor_invoice'
    | 'purchase_return';

export const APPROVAL_KIND_LABEL: Record<ApprovalKind, string> = {
    quotation: 'Quotation',
    so_amendment: 'SO Amendment',
    pr: 'Purchase Requisition',
    po: 'Purchase Order',
    vendor_invoice: 'Vendor Invoice',
    purchase_return: 'Purchase Return',
};

export const APPROVAL_KIND_TONE: Record<ApprovalKind, 'blue' | 'violet' | 'sky' | 'amber' | 'orange' | 'indigo'> = {
    quotation: 'blue',
    so_amendment: 'violet',
    pr: 'sky',
    po: 'indigo',
    vendor_invoice: 'amber',
    purchase_return: 'orange',
};

export type SLAStatus = 'on_track' | 'due_soon' | 'breached';
export type ApprovalDecision = 'approved' | 'rejected';
export type ApprovalPriority = 'normal' | 'high' | 'urgent';

export interface ApprovalRequest {
    id: string;
    kind: ApprovalKind;
    entityId: string;
    entityLabel: string;
    entityLink: string;
    submittedById: string;
    submittedByName: string;
    submittedAt: string;
    level: number;
    levelOf: number;
    levelRole: UserRole;
    levelRoleLabel: string;
    amount: number;
    agingHours: number;
    slaStatus: SLAStatus;
    priority: ApprovalPriority;
    summary: string;
    requiredActionLabel: string;
}

export interface ApprovalHistoryEntry {
    id: string;
    kind: ApprovalKind;
    entityLabel: string;
    entityLink: string;
    decision: ApprovalDecision;
    decidedAt: string;
    decidedById: string;
    decidedByName: string;
    amount: number;
    comment?: string;
}

const NOW = Date.now();
const HOUR = 3600 * 1000;

function userName(id: string): string {
    return users.find((u) => u.id === id)?.name ?? id;
}

function classifySla(agingHours: number): SLAStatus {
    if (agingHours >= 48) return 'breached';
    if (agingHours >= 24) return 'due_soon';
    return 'on_track';
}

function priorityFor(amount: number, agingHours: number): ApprovalPriority {
    if (agingHours >= 48 || amount >= 1_000_000) return 'urgent';
    if (agingHours >= 24 || amount >= 250_000) return 'high';
    return 'normal';
}

// -------- Mutable removal sets (so approve/reject can hide rows without
//   mutating the underlying source data permanently). --------
const _resolvedIds = new Set<string>();
const _history: ApprovalHistoryEntry[] = [
    {
        id: 'hist-001',
        kind: 'po',
        entityLabel: 'PO-2026-0007',
        entityLink: '/purchase/orders/po-007',
        decision: 'approved',
        decidedAt: new Date(NOW - 36 * HOUR).toISOString(),
        decidedById: CURRENT_USER_ID,
        decidedByName: userName(CURRENT_USER_ID),
        amount: 425000,
        comment: 'Within budget — proceed.',
    },
    {
        id: 'hist-002',
        kind: 'quotation',
        entityLabel: 'Q-2026-005',
        entityLink: '/quotations/qt-005',
        decision: 'rejected',
        decidedAt: new Date(NOW - 5 * 24 * HOUR).toISOString(),
        decidedById: CURRENT_USER_ID,
        decidedByName: userName(CURRENT_USER_ID),
        amount: 312000,
        comment: 'Margin too thin; rework discount.',
    },
    {
        id: 'hist-003',
        kind: 'pr',
        entityLabel: 'PR-2026-0002',
        entityLink: '/purchase/requisitions/pr-002',
        decision: 'approved',
        decidedAt: new Date(NOW - 14 * 24 * HOUR).toISOString(),
        decidedById: CURRENT_USER_ID,
        decidedByName: userName(CURRENT_USER_ID),
        amount: 702000,
        comment: undefined,
    },
];

// ----------------------------------------------------------------------
// Derivation
// ----------------------------------------------------------------------

function deriveQuotationApprovals(): ApprovalRequest[] {
    const out: ApprovalRequest[] = [];
    for (const q of quotations) {
        const v = q.versions.find((vv) => vv.version === q.currentVersion);
        if (!v) continue;
        if (v.status !== 'pending_approval') continue;
        const pending = v.approvals.find((a) => a.status === 'pending');
        if (!pending) continue;
        const total = v.lineItems.reduce(
            (s, li) => s + li.quantity * li.listPrice * (1 - li.discountPercent / 100) * (1 + li.taxRate / 100),
            0,
        );
        const submittedAt = v.createdAt;
        const agingHours = Math.max(0, (NOW - new Date(submittedAt).getTime()) / HOUR);
        const id = `appr-q-${q.id}-${pending.id}`;
        if (_resolvedIds.has(id)) continue;
        out.push({
            id,
            kind: 'quotation',
            entityId: q.id,
            entityLabel: q.quotationNumber,
            entityLink: `/quotations/${q.id}`,
            submittedById: v.createdBy,
            submittedByName: userName(v.createdBy),
            submittedAt,
            level: pending.order,
            levelOf: v.approvals.length,
            levelRole: roleSlugFor(pending.role),
            levelRoleLabel: pending.role,
            amount: Math.round(total + (v.freight ?? 0) + (v.installationCharge ?? 0)),
            agingHours,
            slaStatus: classifySla(agingHours),
            priority: priorityFor(total, agingHours),
            summary: `${q.companyName} — ${q.projectName}`,
            requiredActionLabel: `Approve quotation v${v.version}`,
        });
    }
    return out;
}

function deriveSoApprovals(): ApprovalRequest[] {
    const out: ApprovalRequest[] = [];
    for (const so of orders) {
        if (!so.pendingApproval) continue;
        const submittedAt = so.pendingApproval.requestedAt;
        const agingHours = Math.max(0, (NOW - new Date(submittedAt).getTime()) / HOUR);
        const id = `appr-so-${so.id}`;
        if (_resolvedIds.has(id)) continue;
        out.push({
            id,
            kind: 'so_amendment',
            entityId: so.id,
            entityLabel: so.orderNumber,
            entityLink: `/orders/${so.id}`,
            submittedById: so.pendingApproval.requestedBy,
            submittedByName: userName(so.pendingApproval.requestedBy),
            submittedAt,
            level: 1,
            levelOf: 1,
            levelRole: 'sales_manager',
            levelRoleLabel: 'Sales Manager',
            amount: so.totalValue,
            agingHours,
            slaStatus: classifySla(agingHours),
            priority: priorityFor(so.totalValue, agingHours),
            summary: `${so.pendingApproval.type === 'amendment' ? 'Amendment' : 'Cancellation'} — ${so.pendingApproval.reason}`,
            requiredActionLabel: `Approve ${so.pendingApproval.type}`,
        });
    }
    return out;
}

function derivePrApprovals(): ApprovalRequest[] {
    const out: ApprovalRequest[] = [];
    for (const pr of purchaseRequisitions) {
        if (pr.status !== 'submitted') continue;
        const pending = pr.approvalChain.find((a) => a.decision === 'pending');
        if (!pending) continue;
        const total = pr.items.reduce((s, it) => s + it.qty * it.estimatedRate, 0);
        const agingHours = Math.max(0, (NOW - new Date(pr.raisedAt).getTime()) / HOUR);
        const id = `appr-pr-${pr.id}-${pending.id}`;
        if (_resolvedIds.has(id)) continue;
        const stepIdx = pr.approvalChain.findIndex((a) => a.id === pending.id);
        out.push({
            id,
            kind: 'pr',
            entityId: pr.id,
            entityLabel: pr.number,
            entityLink: `/purchase/requisitions/${pr.id}`,
            submittedById: pr.raisedBy,
            submittedByName: userName(pr.raisedBy),
            submittedAt: pr.raisedAt,
            level: stepIdx + 1,
            levelOf: pr.approvalChain.length,
            levelRole: roleSlugFor(pending.role),
            levelRoleLabel: pending.role,
            amount: total,
            agingHours,
            slaStatus: classifySla(agingHours),
            priority: priorityFor(total, agingHours),
            summary: `${pr.department} — ${pr.items.length} item(s)${pr.sourceRef ? ' · ' + pr.sourceRef : ''}`,
            requiredActionLabel: `Approve PR (level ${stepIdx + 1})`,
        });
    }
    return out;
}

function derivePoApprovals(): ApprovalRequest[] {
    const out: ApprovalRequest[] = [];
    for (const po of purchaseOrders) {
        if (po.stage !== 'pending_approval') continue;
        const total = po.items.reduce((s, it) => {
            const gross = it.qty * it.unitPrice * (1 - it.discountPct / 100);
            return s + gross * (1 + it.gstPct / 100);
        }, (po.freight ?? 0) + (po.otherCharges ?? 0) - (po.discount ?? 0));
        const agingHours = Math.max(0, (NOW - new Date(po.poDate).getTime()) / HOUR);
        const id = `appr-po-${po.id}`;
        if (_resolvedIds.has(id)) continue;
        out.push({
            id,
            kind: 'po',
            entityId: po.id,
            entityLabel: po.number,
            entityLink: `/purchase/orders/${po.id}`,
            submittedById: 'u-5',
            submittedByName: userName('u-5'),
            submittedAt: po.poDate,
            level: 1,
            levelOf: 1,
            levelRole: 'inventory',
            levelRoleLabel: 'Purchase Manager',
            amount: Math.round(total),
            agingHours,
            slaStatus: classifySla(agingHours),
            priority: priorityFor(total, agingHours),
            summary: `${po.items.length} line(s) · ${po.incoterm}${po.prNumber ? ' · ' + po.prNumber : ''}`,
            requiredActionLabel: 'Approve PO',
        });
    }
    return out;
}

function deriveVendorInvoiceApprovals(): ApprovalRequest[] {
    const out: ApprovalRequest[] = [];
    for (const vi of vendorInvoices) {
        if (vi.status !== 'matched' && vi.status !== 'mismatch') continue;
        const total = vi.items.reduce((s, it) => {
            const gross = it.qty * it.unitPrice * (1 - it.discountPct / 100);
            return s + gross * (1 + it.gstPct / 100);
        }, (vi.freight ?? 0) + (vi.otherCharges ?? 0));
        const agingHours = Math.max(0, (NOW - new Date(vi.receivedDate).getTime()) / HOUR);
        const id = `appr-vi-${vi.id}`;
        if (_resolvedIds.has(id)) continue;
        out.push({
            id,
            kind: 'vendor_invoice',
            entityId: vi.id,
            entityLabel: vi.internalRef,
            entityLink: `/purchase/invoices/${vi.id}`,
            submittedById: 'u-11',
            submittedByName: userName('u-11'),
            submittedAt: vi.receivedDate,
            level: 1,
            levelOf: 1,
            levelRole: 'accounts',
            levelRoleLabel: 'Accounts',
            amount: Math.round(total),
            agingHours,
            slaStatus: classifySla(agingHours),
            priority: vi.status === 'mismatch' ? 'urgent' : priorityFor(total, agingHours),
            summary:
                vi.status === 'mismatch'
                    ? `Variance vs PO — ${vi.variances?.length ?? 0} line(s)`
                    : `3-way matched · ${vi.poNumber ?? '—'}`,
            requiredActionLabel: vi.status === 'mismatch' ? 'Resolve mismatch' : 'Approve for payment',
        });
    }
    return out;
}

function derivePurchaseReturnApprovals(): ApprovalRequest[] {
    const out: ApprovalRequest[] = [];
    for (const pr of purchaseReturns) {
        if (pr.status !== 'draft') continue;
        const total = pr.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
        const agingHours = Math.max(0, (NOW - new Date(pr.raisedAt).getTime()) / HOUR);
        const id = `appr-prt-${pr.id}`;
        if (_resolvedIds.has(id)) continue;
        out.push({
            id,
            kind: 'purchase_return',
            entityId: pr.id,
            entityLabel: pr.number,
            entityLink: `/purchase/returns/${pr.id}`,
            submittedById: 'u-5',
            submittedByName: userName('u-5'),
            submittedAt: pr.raisedAt,
            level: 1,
            levelOf: 1,
            levelRole: 'inventory',
            levelRoleLabel: 'Purchase Manager',
            amount: Math.round(total),
            agingHours,
            slaStatus: classifySla(agingHours),
            priority: priorityFor(total, agingHours),
            summary: `${pr.items.length} item(s) · ${pr.reason.replace(/_/g, ' ')}${pr.poNumber ? ' · ' + pr.poNumber : ''}`,
            requiredActionLabel: 'Approve return',
        });
    }
    return out;
}

function roleSlugFor(label: string): UserRole {
    const k = label.toLowerCase();
    if (k.includes('director')) return 'admin';
    if (k.includes('finance')) return 'accounts';
    if (k.includes('account')) return 'accounts';
    if (k.includes('purchase')) return 'inventory';
    if (k.includes('inventory')) return 'inventory';
    if (k.includes('sales')) return 'sales_manager';
    return 'sales_manager';
}

export function approvalsAll(): ApprovalRequest[] {
    return [
        ...deriveQuotationApprovals(),
        ...deriveSoApprovals(),
        ...derivePrApprovals(),
        ...derivePoApprovals(),
        ...deriveVendorInvoiceApprovals(),
        ...derivePurchaseReturnApprovals(),
    ].sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
}

export function approvalsForRole(role: UserRole): ApprovalRequest[] {
    return approvalsAll().filter((r) => r.levelRole === role);
}

export function approvalsForUser(userId: string): ApprovalRequest[] {
    const u = users.find((x) => x.id === userId);
    if (!u) return [];
    return approvalsForRole(u.role);
}

export interface ApprovalKpis {
    awaitingMe: number;
    dueSoon: number;
    breached: number;
    totalValuePending: number;
    byKind: Record<ApprovalKind, number>;
}

export function approvalKpis(role?: UserRole): ApprovalKpis {
    const rows = role ? approvalsForRole(role) : approvalsAll();
    const byKind: Record<ApprovalKind, number> = {
        quotation: 0,
        so_amendment: 0,
        pr: 0,
        po: 0,
        vendor_invoice: 0,
        purchase_return: 0,
    };
    let dueSoon = 0;
    let breached = 0;
    let total = 0;
    for (const r of rows) {
        byKind[r.kind] += 1;
        total += r.amount;
        if (r.slaStatus === 'due_soon') dueSoon += 1;
        if (r.slaStatus === 'breached') breached += 1;
    }
    return {
        awaitingMe: rows.length,
        dueSoon,
        breached,
        totalValuePending: total,
        byKind,
    };
}

export function approveMock(id: string, comment?: string): ApprovalHistoryEntry | null {
    const row = approvalsAll().find((r) => r.id === id);
    if (!row) return null;
    _resolvedIds.add(id);
    const entry: ApprovalHistoryEntry = {
        id: `hist-${Date.now()}-${id}`,
        kind: row.kind,
        entityLabel: row.entityLabel,
        entityLink: row.entityLink,
        decision: 'approved',
        decidedAt: new Date().toISOString(),
        decidedById: CURRENT_USER_ID,
        decidedByName: userName(CURRENT_USER_ID),
        amount: row.amount,
        comment,
    };
    _history.unshift(entry);
    return entry;
}

export function rejectMock(id: string, reason: string): ApprovalHistoryEntry | null {
    const row = approvalsAll().find((r) => r.id === id);
    if (!row) return null;
    _resolvedIds.add(id);
    const entry: ApprovalHistoryEntry = {
        id: `hist-${Date.now()}-${id}`,
        kind: row.kind,
        entityLabel: row.entityLabel,
        entityLink: row.entityLink,
        decision: 'rejected',
        decidedAt: new Date().toISOString(),
        decidedById: CURRENT_USER_ID,
        decidedByName: userName(CURRENT_USER_ID),
        amount: row.amount,
        comment: reason,
    };
    _history.unshift(entry);
    return entry;
}

export function approvalHistoryForUser(userId: string = CURRENT_USER_ID): ApprovalHistoryEntry[] {
    return _history.filter((h) => h.decidedById === userId);
}

export const REJECT_REASONS: string[] = [
    'Pricing exceeds approved range',
    'Insufficient justification',
    'Budget unavailable',
    'Compliance concerns',
    'Duplicate request',
    'Other',
];
