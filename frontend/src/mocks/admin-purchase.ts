export interface ApprovalRule {
    id: string;
    name: string;
    description: string;
    condition:
        | { kind: 'amount'; gteINR: number }
        | { kind: 'category'; category: string }
        | { kind: 'vendor'; vendorId: string };
    levels: Array<{ level: number; role: string; slaHours: number }>;
    enabled: boolean;
}

export interface ToleranceConfig {
    /** Quantity tolerance percentage (over/short receipt). */
    qtyPct: number;
    /** Quantity tolerance absolute units (whichever applies first). */
    qtyUnits: number;
    /** Price tolerance percentage between PO and invoice. */
    pricePct: number;
    /** Allow negative variance (receive less than PO). */
    allowNegative: boolean;
    /** Auto-close PO once tolerance band is met. */
    autoCloseOnTolerance: boolean;
}

export const approvalRules: ApprovalRule[] = [
    {
        id: 'apr-1',
        name: 'PO above ₹5L — single approver',
        description: 'Any purchase order with grand total above ₹5,00,000 needs Procurement Lead sign-off.',
        condition: { kind: 'amount', gteINR: 500_000 },
        levels: [{ level: 1, role: 'Procurement Lead', slaHours: 24 }],
        enabled: true,
    },
    {
        id: 'apr-2',
        name: 'PO above ₹25L — two-step',
        description: 'Procurement Lead then Finance Director for high-value POs.',
        condition: { kind: 'amount', gteINR: 2_500_000 },
        levels: [
            { level: 1, role: 'Procurement Lead', slaHours: 24 },
            { level: 2, role: 'Finance Director', slaHours: 48 },
        ],
        enabled: true,
    },
    {
        id: 'apr-3',
        name: 'Capex category',
        description: 'All capital-equipment POs route through CFO.',
        condition: { kind: 'category', category: 'Capex' },
        levels: [
            { level: 1, role: 'Procurement Lead', slaHours: 24 },
            { level: 2, role: 'CFO', slaHours: 72 },
        ],
        enabled: true,
    },
    {
        id: 'apr-4',
        name: 'Restricted vendor',
        description: 'Vendors flagged on watch-list need compliance approval.',
        condition: { kind: 'vendor', vendorId: 'v-007' },
        levels: [{ level: 1, role: 'Compliance Officer', slaHours: 48 }],
        enabled: false,
    },
];

export const toleranceDefault: ToleranceConfig = {
    qtyPct: 5,
    qtyUnits: 10,
    pricePct: 2,
    allowNegative: true,
    autoCloseOnTolerance: true,
};
