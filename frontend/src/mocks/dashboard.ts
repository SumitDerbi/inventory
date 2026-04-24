import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import {
    Activity,
    FileText,
    IndianRupee,
    MessageSquare,
    Package,
    ShoppingCart,
    Truck,
    TriangleAlert,
} from 'lucide-react';
import type { StatTone } from '@/components/ui/StatCard';

/* ------------------------------------------------------------------ */
/* KPI cards                                                            */
/* ------------------------------------------------------------------ */

export interface DashboardKpi {
    id: string;
    label: string;
    value: string;
    rawValue: number;
    delta: number;
    deltaLabel: string;
    tone: StatTone;
    icon: ComponentType<LucideProps>;
}

export const kpis: DashboardKpi[] = [
    {
        id: 'inquiries',
        label: 'Inquiries (MTD)',
        value: '128',
        rawValue: 128,
        delta: 12,
        deltaLabel: 'vs. last month',
        tone: 'blue',
        icon: Activity,
    },
    {
        id: 'revenue',
        label: 'Revenue (MTD)',
        value: '₹45.8 L',
        rawValue: 4_580_000,
        delta: -4,
        deltaLabel: 'vs. last month',
        tone: 'emerald',
        icon: IndianRupee,
    },
    {
        id: 'orders',
        label: 'Open orders',
        value: '47',
        rawValue: 47,
        delta: 8,
        deltaLabel: 'vs. last week',
        tone: 'violet',
        icon: ShoppingCart,
    },
    {
        id: 'low-stock',
        label: 'Low-stock SKUs',
        value: '6',
        rawValue: 6,
        delta: 2,
        deltaLabel: 'vs. last week',
        tone: 'amber',
        icon: TriangleAlert,
    },
];

/* ------------------------------------------------------------------ */
/* Revenue trend (6 months)                                             */
/* ------------------------------------------------------------------ */

export interface RevenuePoint {
    month: string;
    revenue: number;
    cost: number;
}

export const revenueTrend: RevenuePoint[] = [
    { month: 'Nov', revenue: 2_800_000, cost: 1_900_000 },
    { month: 'Dec', revenue: 3_450_000, cost: 2_200_000 },
    { month: 'Jan', revenue: 3_100_000, cost: 2_100_000 },
    { month: 'Feb', revenue: 4_200_000, cost: 2_700_000 },
    { month: 'Mar', revenue: 4_780_000, cost: 2_900_000 },
    { month: 'Apr', revenue: 4_580_000, cost: 3_050_000 },
];

/* ------------------------------------------------------------------ */
/* Inquiry funnel                                                       */
/* ------------------------------------------------------------------ */

export interface FunnelStage {
    id: string;
    label: string;
    value: number;
    color: string;
}

export const funnelStages: FunnelStage[] = [
    { id: 'new', label: 'New', value: 128, color: '#2563EB' },
    { id: 'in-progress', label: 'In Progress', value: 94, color: '#7C3AED' },
    { id: 'quoted', label: 'Quoted', value: 61, color: '#F59E0B' },
    { id: 'won', label: 'Won', value: 38, color: '#059669' },
    { id: 'lost', label: 'Lost', value: 14, color: '#DC2626' },
];

/* ------------------------------------------------------------------ */
/* Recent activity                                                      */
/* ------------------------------------------------------------------ */

export type ActivityType =
    | 'inquiry'
    | 'quotation'
    | 'order'
    | 'dispatch'
    | 'inventory'
    | 'document';

export interface ActivityItem {
    id: string;
    type: ActivityType;
    title: string;
    description: string;
    actor: string;
    timestamp: string; // ISO
}

const now = Date.now();
const minutes = (n: number) => new Date(now - n * 60_000).toISOString();
const hours = (n: number) => minutes(n * 60);
const days = (n: number) => hours(n * 24);

export const recentActivity: ActivityItem[] = [
    {
        id: 'a1',
        type: 'inquiry',
        title: 'New inquiry from Tata Realty',
        description: 'INQ-2041 · Modular panels, Mumbai',
        actor: 'Priya Sharma',
        timestamp: minutes(2),
    },
    {
        id: 'a2',
        type: 'quotation',
        title: 'Quotation QT-00041 approved',
        description: '₹12,40,000 · 60-day validity',
        actor: 'Arjun Mehta',
        timestamp: hours(1),
    },
    {
        id: 'a3',
        type: 'order',
        title: 'Order SO-0087 confirmed',
        description: 'Godrej Interio · Delhi NCR',
        actor: 'Priya Sharma',
        timestamp: hours(3),
    },
    {
        id: 'a4',
        type: 'inventory',
        title: 'Low-stock alert: 3 SKUs',
        description: 'Aluminium frames · Reorder level breached',
        actor: 'System',
        timestamp: hours(5),
    },
    {
        id: 'a5',
        type: 'dispatch',
        title: 'Dispatch DSP-0124 shipped',
        description: 'Blue Dart · AWB 8821 4411',
        actor: 'Rahul Nair',
        timestamp: hours(9),
    },
    {
        id: 'a6',
        type: 'document',
        title: 'PO uploaded for SO-0085',
        description: 'L&T Constructions · 4 pages',
        actor: 'Meera Iyer',
        timestamp: hours(14),
    },
    {
        id: 'a7',
        type: 'quotation',
        title: 'Quotation QT-00040 sent',
        description: 'Brigade Enterprises · Bengaluru',
        actor: 'Arjun Mehta',
        timestamp: days(1),
    },
    {
        id: 'a8',
        type: 'inquiry',
        title: 'Inquiry INQ-2038 assigned',
        description: 'Sobha Developers · Chennai',
        actor: 'Priya Sharma',
        timestamp: days(1),
    },
    {
        id: 'a9',
        type: 'order',
        title: 'Order SO-0086 delivered',
        description: 'Prestige Group · Bengaluru',
        actor: 'Rahul Nair',
        timestamp: days(2),
    },
    {
        id: 'a10',
        type: 'inventory',
        title: 'Stock adjustment posted',
        description: 'Warehouse A · 48 units received',
        actor: 'Meera Iyer',
        timestamp: days(2),
    },
    {
        id: 'a11',
        type: 'quotation',
        title: 'Quotation QT-00039 revised',
        description: 'DLF Ltd · version 3',
        actor: 'Arjun Mehta',
        timestamp: days(3),
    },
    {
        id: 'a12',
        type: 'dispatch',
        title: 'Dispatch DSP-0122 delivered',
        description: 'Mahindra Lifespaces · Pune',
        actor: 'Rahul Nair',
        timestamp: days(4),
    },
];

/* ------------------------------------------------------------------ */
/* Pending actions                                                      */
/* ------------------------------------------------------------------ */

export interface PendingActionGroup {
    id: string;
    label: string;
    count: number;
    icon: ComponentType<LucideProps>;
    items: { id: string; title: string; meta: string }[];
}

export const pendingActions: PendingActionGroup[] = [
    {
        id: 'quotation-approvals',
        label: 'Quotations awaiting approval',
        count: 5,
        icon: FileText,
        items: [
            { id: 'q1', title: 'QT-00042 · Lodha Group', meta: '₹18.4 L · 2 days' },
            { id: 'q2', title: 'QT-00043 · DLF Ltd', meta: '₹9.2 L · 1 day' },
            { id: 'q3', title: 'QT-00044 · Sobha Developers', meta: '₹6.8 L · 4 h' },
        ],
    },
    {
        id: 'dispatch',
        label: 'Dispatches pending pickup',
        count: 3,
        icon: Truck,
        items: [
            { id: 'd1', title: 'DSP-0125 · Blue Dart', meta: 'Ready · 3 pallets' },
            { id: 'd2', title: 'DSP-0126 · Safexpress', meta: 'Ready · 1 pallet' },
            { id: 'd3', title: 'DSP-0127 · Gati', meta: 'Staging · 2 pallets' },
        ],
    },
    {
        id: 'inquiries',
        label: 'Unassigned inquiries',
        count: 4,
        icon: MessageSquare,
        items: [
            { id: 'i1', title: 'INQ-2041 · Tata Realty', meta: 'Mumbai · 2 min' },
            { id: 'i2', title: 'INQ-2040 · Brigade Enterprises', meta: 'Bengaluru · 1 h' },
        ],
    },
    {
        id: 'inventory',
        label: 'Low-stock SKUs',
        count: 6,
        icon: Package,
        items: [
            { id: 's1', title: 'Aluminium Frame 4×6', meta: 'Qty 12 · Reorder 50' },
            { id: 's2', title: 'MDF Board 18mm', meta: 'Qty 3 · Reorder 25' },
            { id: 's3', title: 'Hinge HX-220', meta: 'Qty 40 · Reorder 100' },
        ],
    },
];
