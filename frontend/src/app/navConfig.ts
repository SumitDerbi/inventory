import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import {
    Building2,
    Eye,
    FileText,
    FileSpreadsheet,
    Hammer,
    LayoutDashboard,
    MessageSquare,
    Package,
    Receipt,
    Settings,
    ShoppingBag,
    ShoppingCart,
    Truck,
    TrendingUp,
    Users,
} from 'lucide-react';

export interface NavItem {
    label: string;
    to: string;
    icon: ComponentType<LucideProps>;
    section: 'main' | 'masters' | 'admin';
    /** Human-readable breadcrumb label (defaults to `label`). */
    breadcrumb?: string;
}

export const NAV_ITEMS: NavItem[] = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, section: 'main' },
    { label: 'Inquiries', to: '/inquiries', icon: MessageSquare, section: 'main' },
    { label: 'Quotations', to: '/quotations', icon: FileText, section: 'main' },
    { label: 'Orders', to: '/orders', icon: ShoppingCart, section: 'main' },
    { label: 'Invoices', to: '/sales/invoices', icon: Receipt, section: 'main' },
    { label: 'Customers', to: '/customers', icon: Building2, section: 'masters' },
    { label: 'Inventory', to: '/inventory', icon: Package, section: 'main' },
    { label: 'Purchase', to: '/purchase', icon: ShoppingBag, section: 'main' },
    { label: 'Dispatch', to: '/dispatch', icon: Truck, section: 'main' },
    { label: 'Jobs', to: '/jobs', icon: Hammer, section: 'main' },
    { label: 'Documents', to: '/documents', icon: FileSpreadsheet, section: 'main' },
    { label: 'Reports', to: '/reports', icon: TrendingUp, section: 'main' },
    { label: 'Users', to: '/users', icon: Users, section: 'admin' },
    { label: 'Portal preview', to: '/portal-preview', icon: Eye, section: 'admin' },
    { label: 'Settings', to: '/settings', icon: Settings, section: 'admin' },
];

export const NAV_BY_PATH: Record<string, NavItem> = Object.fromEntries(
    NAV_ITEMS.map((n) => [n.to, n]),
);
