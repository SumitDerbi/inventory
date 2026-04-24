import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import {
    FileText,
    FileSpreadsheet,
    Hammer,
    LayoutDashboard,
    MessageSquare,
    Package,
    Settings,
    ShoppingCart,
    Truck,
    TrendingUp,
    Users,
} from 'lucide-react';

export interface NavItem {
    label: string;
    to: string;
    icon: ComponentType<LucideProps>;
    section: 'main' | 'admin';
    /** Human-readable breadcrumb label (defaults to `label`). */
    breadcrumb?: string;
}

export const NAV_ITEMS: NavItem[] = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, section: 'main' },
    { label: 'Inquiries', to: '/inquiries', icon: MessageSquare, section: 'main' },
    { label: 'Quotations', to: '/quotations', icon: FileText, section: 'main' },
    { label: 'Orders', to: '/orders', icon: ShoppingCart, section: 'main' },
    { label: 'Inventory', to: '/inventory', icon: Package, section: 'main' },
    { label: 'Dispatch', to: '/dispatch', icon: Truck, section: 'main' },
    { label: 'Jobs', to: '/jobs', icon: Hammer, section: 'main' },
    { label: 'Documents', to: '/documents', icon: FileSpreadsheet, section: 'main' },
    { label: 'Reports', to: '/reports', icon: TrendingUp, section: 'main' },
    { label: 'Users', to: '/users', icon: Users, section: 'admin' },
    { label: 'Settings', to: '/settings', icon: Settings, section: 'admin' },
];

export const NAV_BY_PATH: Record<string, NavItem> = Object.fromEntries(
    NAV_ITEMS.map((n) => [n.to, n]),
);
