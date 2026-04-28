import { products } from './products';
import { warehouses } from './warehouses';

export type PRStatus =
    | 'draft'
    | 'submitted'
    | 'approved'
    | 'rejected'
    | 'rfq_issued'
    | 'po_raised'
    | 'closed'
    | 'cancelled';

export const PR_STATUSES: PRStatus[] = [
    'draft',
    'submitted',
    'approved',
    'rejected',
    'rfq_issued',
    'po_raised',
    'closed',
    'cancelled',
];

export const PR_STATUS_LABEL: Record<PRStatus, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    approved: 'Approved',
    rejected: 'Rejected',
    rfq_issued: 'RFQ issued',
    po_raised: 'PO raised',
    closed: 'Closed',
    cancelled: 'Cancelled',
};

export const PR_STATUS_TONE: Record<
    PRStatus,
    'neutral' | 'amber' | 'sky' | 'blue' | 'emerald' | 'green' | 'red'
> = {
    draft: 'neutral',
    submitted: 'amber',
    approved: 'sky',
    rejected: 'red',
    rfq_issued: 'blue',
    po_raised: 'emerald',
    closed: 'green',
    cancelled: 'red',
};

export type PRSource = 'manual' | 'reorder' | 'sales_order' | 'project';

export interface PurchaseRequisitionItem {
    id: string;
    productId: string;
    sku: string;
    description: string;
    qty: number;
    uom: string;
    estimatedRate: number;
    requiredBy: string; // ISO date
    notes?: string;
}

export interface PurchaseRequisition {
    id: string;
    number: string; // PR-2026-0001
    raisedAt: string;
    raisedBy: string; // user id
    department: string;
    warehouseId: string;
    requiredBy: string;
    source: PRSource;
    sourceRef?: string; // SO number / reorder code
    status: PRStatus;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    notes?: string;
    items: PurchaseRequisitionItem[];
    approvalChain: Array<{
        id: string;
        approverName: string;
        role: string;
        decidedAt: string | null;
        decision: 'pending' | 'approved' | 'rejected';
        comment?: string;
    }>;
}

const TODAY = Date.now();
const iso = (offsetDays: number) =>
    new Date(TODAY + offsetDays * 86_400_000).toISOString();

const mkItem = (
    id: string,
    productSku: string,
    qty: number,
    rate: number,
    requiredOffset = 14,
    notes?: string,
): PurchaseRequisitionItem => {
    const p = products.find((x) => x.sku === productSku);
    return {
        id,
        productId: p?.id ?? 'p-1',
        sku: productSku,
        description: p?.name ?? productSku,
        qty,
        uom: p?.uom ?? 'pcs',
        estimatedRate: rate,
        requiredBy: iso(requiredOffset),
        notes,
    };
};

export const purchaseRequisitions: PurchaseRequisition[] = [
    {
        id: 'pr-001',
        number: 'PR-2026-0001',
        raisedAt: iso(-22),
        raisedBy: 'u-5',
        department: 'Inventory',
        warehouseId: warehouses[0].id,
        requiredBy: iso(7),
        source: 'reorder',
        sourceRef: 'REORDER-2026-04',
        status: 'po_raised',
        priority: 'normal',
        items: [
            mkItem('pri-001-1', 'PMP-CF-5HP', 8, 42000, 14),
            mkItem('pri-001-2', 'PMP-CF-7HP', 4, 56000, 14),
        ],
        approvalChain: [
            { id: 'pra-001-1', approverName: 'Rohan Iyer', role: 'Inventory Manager', decidedAt: iso(-21), decision: 'approved', comment: 'Stock below ROL.' },
            { id: 'pra-001-2', approverName: 'Aarav Mehta', role: 'Finance', decidedAt: iso(-20), decision: 'approved' },
        ],
    },
    {
        id: 'pr-002',
        number: 'PR-2026-0002',
        raisedAt: iso(-18),
        raisedBy: 'u-3',
        department: 'Sales',
        warehouseId: warehouses[0].id,
        requiredBy: iso(5),
        source: 'sales_order',
        sourceRef: 'SO-2026-008',
        status: 'po_raised',
        priority: 'high',
        notes: 'Required for Patel Engineering project.',
        items: [
            mkItem('pri-002-1', 'MTR-3P-15HP', 6, 76000, 10),
            mkItem('pri-002-2', 'CTRL-VFD-15HP', 6, 41000, 10),
        ],
        approvalChain: [
            { id: 'pra-002-1', approverName: 'Rohan Iyer', role: 'Sales Manager', decidedAt: iso(-17), decision: 'approved' },
            { id: 'pra-002-2', approverName: 'Aarav Mehta', role: 'Finance', decidedAt: iso(-17), decision: 'approved' },
        ],
    },
    {
        id: 'pr-003',
        number: 'PR-2026-0003',
        raisedAt: iso(-12),
        raisedBy: 'u-5',
        department: 'Inventory',
        warehouseId: warehouses[1].id,
        requiredBy: iso(10),
        source: 'reorder',
        sourceRef: 'REORDER-2026-05',
        status: 'rfq_issued',
        priority: 'normal',
        items: [
            mkItem('pri-003-1', 'VLV-BTF-100', 30, 7600, 14),
            mkItem('pri-003-2', 'VLV-BTF-150', 20, 11000, 14),
            mkItem('pri-003-3', 'VLV-GT-50', 60, 3500, 14),
        ],
        approvalChain: [
            { id: 'pra-003-1', approverName: 'Rohan Iyer', role: 'Inventory Manager', decidedAt: iso(-11), decision: 'approved' },
        ],
    },
    {
        id: 'pr-004',
        number: 'PR-2026-0004',
        raisedAt: iso(-10),
        raisedBy: 'u-3',
        department: 'Sales',
        warehouseId: warehouses[2].id,
        requiredBy: iso(20),
        source: 'project',
        sourceRef: 'PRJ-RAJKOT-WTP',
        status: 'approved',
        priority: 'high',
        items: [
            mkItem('pri-004-1', 'TNK-FRP-10KL', 2, 132000, 25),
            mkItem('pri-004-2', 'FLT-SAND-24', 4, 51000, 25),
            mkItem('pri-004-3', 'FLT-CARB-24', 4, 56000, 25),
        ],
        approvalChain: [
            { id: 'pra-004-1', approverName: 'Rohan Iyer', role: 'Sales Manager', decidedAt: iso(-9), decision: 'approved' },
            { id: 'pra-004-2', approverName: 'Aarav Mehta', role: 'Finance', decidedAt: iso(-9), decision: 'approved' },
        ],
    },
    {
        id: 'pr-005',
        number: 'PR-2026-0005',
        raisedAt: iso(-7),
        raisedBy: 'u-5',
        department: 'Inventory',
        warehouseId: warehouses[0].id,
        requiredBy: iso(14),
        source: 'reorder',
        sourceRef: 'REORDER-2026-06',
        status: 'submitted',
        priority: 'normal',
        items: [
            mkItem('pri-005-1', 'PIPE-MS-100-6M', 60, 5100, 14),
            mkItem('pri-005-2', 'PIPE-GI-50-6M', 100, 2900, 14),
        ],
        approvalChain: [
            { id: 'pra-005-1', approverName: 'Rohan Iyer', role: 'Inventory Manager', decidedAt: null, decision: 'pending' },
        ],
    },
    {
        id: 'pr-006',
        number: 'PR-2026-0006',
        raisedAt: iso(-6),
        raisedBy: 'u-3',
        department: 'Sales',
        warehouseId: warehouses[0].id,
        requiredBy: iso(8),
        source: 'sales_order',
        sourceRef: 'SO-2026-012',
        status: 'submitted',
        priority: 'urgent',
        notes: 'Customer commit date 12-May; expedite.',
        items: [
            mkItem('pri-006-1', 'PMP-SUB-5HP', 4, 64000, 8),
        ],
        approvalChain: [
            { id: 'pra-006-1', approverName: 'Rohan Iyer', role: 'Sales Manager', decidedAt: null, decision: 'pending' },
        ],
    },
    {
        id: 'pr-007',
        number: 'PR-2026-0007',
        raisedAt: iso(-5),
        raisedBy: 'u-5',
        department: 'Inventory',
        warehouseId: warehouses[0].id,
        requiredBy: iso(20),
        source: 'manual',
        status: 'draft',
        priority: 'low',
        items: [
            mkItem('pri-007-1', 'CHEM-ALUM-50KG', 200, 1100, 20),
        ],
        approvalChain: [],
    },
    {
        id: 'pr-008',
        number: 'PR-2026-0008',
        raisedAt: iso(-4),
        raisedBy: 'u-3',
        department: 'Service',
        warehouseId: warehouses[0].id,
        requiredBy: iso(12),
        source: 'manual',
        status: 'approved',
        priority: 'normal',
        items: [
            mkItem('pri-008-1', 'FLT-RO-MEM-4040', 20, 12500, 12),
        ],
        approvalChain: [
            { id: 'pra-008-1', approverName: 'Rohan Iyer', role: 'Operations Head', decidedAt: iso(-3), decision: 'approved' },
        ],
    },
    {
        id: 'pr-009',
        number: 'PR-2026-0009',
        raisedAt: iso(-3),
        raisedBy: 'u-5',
        department: 'Inventory',
        warehouseId: warehouses[0].id,
        requiredBy: iso(15),
        source: 'reorder',
        sourceRef: 'REORDER-2026-07',
        status: 'approved',
        priority: 'normal',
        items: [
            mkItem('pri-009-1', 'CTRL-PANEL-50A', 8, 26000, 15),
        ],
        approvalChain: [
            { id: 'pra-009-1', approverName: 'Rohan Iyer', role: 'Inventory Manager', decidedAt: iso(-2), decision: 'approved' },
        ],
    },
    {
        id: 'pr-010',
        number: 'PR-2026-0010',
        raisedAt: iso(-26),
        raisedBy: 'u-5',
        department: 'Inventory',
        warehouseId: warehouses[0].id,
        requiredBy: iso(-12),
        source: 'reorder',
        sourceRef: 'REORDER-2026-03',
        status: 'closed',
        priority: 'normal',
        items: [
            mkItem('pri-010-1', 'PMP-CF-5HP', 6, 42000, -12),
        ],
        approvalChain: [
            { id: 'pra-010-1', approverName: 'Rohan Iyer', role: 'Inventory Manager', decidedAt: iso(-25), decision: 'approved' },
        ],
    },
    {
        id: 'pr-011',
        number: 'PR-2026-0011',
        raisedAt: iso(-15),
        raisedBy: 'u-3',
        department: 'Sales',
        warehouseId: warehouses[1].id,
        requiredBy: iso(2),
        source: 'sales_order',
        sourceRef: 'SO-2026-006',
        status: 'rejected',
        priority: 'high',
        notes: 'Rejected — request margin review with vendor.',
        items: [
            mkItem('pri-011-1', 'TNK-HDPE-5KL', 4, 64000, 2),
        ],
        approvalChain: [
            { id: 'pra-011-1', approverName: 'Aarav Mehta', role: 'Finance', decidedAt: iso(-14), decision: 'rejected', comment: 'Estimated rate exceeds approved margin.' },
        ],
    },
    {
        id: 'pr-012',
        number: 'PR-2026-0012',
        raisedAt: iso(-2),
        raisedBy: 'u-5',
        department: 'Inventory',
        warehouseId: warehouses[0].id,
        requiredBy: iso(11),
        source: 'reorder',
        sourceRef: 'REORDER-2026-08',
        status: 'submitted',
        priority: 'normal',
        items: [
            mkItem('pri-012-1', 'MTR-3P-10HP', 5, 54000, 11),
        ],
        approvalChain: [
            { id: 'pra-012-1', approverName: 'Rohan Iyer', role: 'Inventory Manager', decidedAt: null, decision: 'pending' },
        ],
    },
];

export function prById(id: string): PurchaseRequisition | undefined {
    return purchaseRequisitions.find((p) => p.id === id);
}

export function prByNumber(num: string): PurchaseRequisition | undefined {
    return purchaseRequisitions.find((p) => p.number === num);
}

export function prItemValue(item: PurchaseRequisitionItem): number {
    return item.qty * item.estimatedRate;
}

export function prTotal(pr: PurchaseRequisition): number {
    return pr.items.reduce((s, it) => s + prItemValue(it), 0);
}
