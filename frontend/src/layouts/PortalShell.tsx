import { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    Home,
    PackageOpen,
    FileText,
    Truck,
    Wrench,
    FolderOpen,
    LifeBuoy,
    Bell,
    UserCircle,
    LogOut,
    Menu,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { usePortalAuth } from '@/app/portal-context';
import {
    currentOrganization,
} from '@/mocks/portal/client-users';
import { unreadNotificationCount } from '@/mocks/portal/portal-notifications';

interface PortalNavItem {
    to: string;
    label: string;
    icon: typeof Home;
    primary?: boolean;
}

const PRIMARY_NAV: PortalNavItem[] = [
    { to: '/portal', label: 'Home', icon: Home, primary: true },
    { to: '/portal/orders', label: 'Orders', icon: PackageOpen, primary: true },
    { to: '/portal/quotations', label: 'Quotes', icon: FileText, primary: true },
    { to: '/portal/dispatches', label: 'Dispatches', icon: Truck },
    { to: '/portal/jobs', label: 'Jobs', icon: Wrench },
    { to: '/portal/documents', label: 'Documents', icon: FolderOpen, primary: true },
    { to: '/portal/tickets', label: 'Support', icon: LifeBuoy, primary: true },
];

/**
 * Portal shell — distinct from the staff `AppShell`. No left sidebar:
 * desktop uses a top nav strip; mobile uses a bottom-tab nav for
 * primary destinations + a hamburger sheet for the rest.
 */
export function PortalShell() {
    const { user, signOut } = usePortalAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const org = currentOrganization();
    const unread = unreadNotificationCount();

    const handleSignOut = () => {
        signOut();
        navigate('/portal/login', { replace: true });
    };

    return (
        <div data-theme="portal" className="flex min-h-screen flex-col bg-slate-50">
            {/* Top nav */}
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
                <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
                    <button
                        type="button"
                        className="md:hidden"
                        onClick={() => setMobileNavOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu className="size-5 text-slate-600" />
                    </button>
                    <NavLink to="/portal" className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-md bg-blue-600 font-semibold text-white">
                            {org.name.charAt(0)}
                        </div>
                        <div className="hidden md:block">
                            <div className="text-sm font-semibold text-slate-900">Customer Portal</div>
                            <div className="text-xs text-slate-500">{org.name}</div>
                        </div>
                    </NavLink>

                    <nav className="ml-6 hidden flex-1 items-center gap-1 md:flex">
                        {PRIMARY_NAV.map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.to === '/portal'}
                                    className={({ isActive }) =>
                                        `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                                            isActive
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                        }`
                                    }
                                >
                                    <Icon className="size-4" />
                                    {item.label}
                                </NavLink>
                            );
                        })}
                    </nav>

                    <div className="ml-auto flex items-center gap-2">
                        <NavLink
                            to="/portal/notifications"
                            className="relative flex size-9 items-center justify-center rounded-md hover:bg-slate-100"
                            aria-label="Notifications"
                        >
                            <Bell className="size-4 text-slate-600" />
                            {unread > 0 && (
                                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                                    {unread}
                                </span>
                            )}
                        </NavLink>
                        <NavLink
                            to="/portal/profile"
                            className="hidden md:flex items-center gap-2 rounded-md px-2 py-1 hover:bg-slate-100"
                        >
                            <UserCircle className="size-5 text-slate-500" />
                            <div className="text-left">
                                <div className="text-xs font-medium text-slate-900">{user?.name}</div>
                                <div className="text-[11px] text-slate-500">{user?.designation}</div>
                            </div>
                        </NavLink>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleSignOut}
                            aria-label="Sign out"
                        >
                            <LogOut className="size-4" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Mobile nav sheet */}
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetContent side="left" className="w-72 p-0">
                    <div className="flex items-center justify-between border-b border-slate-200 p-4">
                        <div>
                            <div className="text-sm font-semibold text-slate-900">{org.name}</div>
                            <div className="text-xs text-slate-500">{user?.name}</div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setMobileNavOpen(false)}
                            aria-label="Close"
                        >
                            <X className="size-5 text-slate-500" />
                        </button>
                    </div>
                    <nav className="flex flex-col p-2">
                        {PRIMARY_NAV.map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.to === '/portal'}
                                    onClick={() => setMobileNavOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm ${
                                            isActive
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'text-slate-700 hover:bg-slate-50'
                                        }`
                                    }
                                >
                                    <Icon className="size-4" />
                                    {item.label}
                                </NavLink>
                            );
                        })}
                        <NavLink
                            to="/portal/profile"
                            onClick={() => setMobileNavOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm ${
                                    isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                                }`
                            }
                        >
                            <UserCircle className="size-4" />
                            Profile
                        </NavLink>
                    </nav>
                </SheetContent>
            </Sheet>

            {/* Routed content */}
            <main className="flex-1 pb-20 md:pb-6">
                <div className="mx-auto max-w-6xl p-4 md:p-6">
                    <Outlet key={location.pathname} />
                </div>
            </main>

            {/* Mobile bottom-tab nav */}
            <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white shadow-[0_-1px_2px_rgba(0,0,0,0.04)] md:hidden">
                <div className="grid grid-cols-5">
                    {PRIMARY_NAV.filter((i) => i.primary).map((item) => {
                        const Icon = item.icon;
                        const showBadge = item.to === '/portal/tickets';
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.to === '/portal'}
                                className={({ isActive }) =>
                                    `relative flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] ${
                                        isActive ? 'text-blue-700' : 'text-slate-500'
                                    }`
                                }
                            >
                                <Icon className="size-5" />
                                {item.label}
                                {showBadge && unread > 0 && (
                                    <Badge
                                        tone="amber"
                                        className="absolute right-3 top-1 px-1 py-0 text-[9px]"
                                    >
                                        {unread}
                                    </Badge>
                                )}
                            </NavLink>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}

export default PortalShell;
