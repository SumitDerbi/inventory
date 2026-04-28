import { Bell, ChevronRight, KeyRound, LogOut, Menu, Plus, Search, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { GlobalSearch } from '@/components/ui/GlobalSearch';
import { NAV_BY_PATH } from '@/app/navConfig';
import { useAuth } from '@/app/auth-context';
import { formatRelative } from '@/lib/format';
import { notifications, notificationsSummary } from '@/mocks/admin';

export interface TopbarProps {
    onOpenSidebar: () => void;
}

export function Topbar({ onOpenSidebar }: TopbarProps) {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const crumbs = buildBreadcrumb(location.pathname);
    const summary = notificationsSummary();
    const recentNotifications = notifications.slice(0, 5);
    const [searchOpen, setSearchOpen] = useState(false);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setSearchOpen((v) => !v);
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    return (
        <header className="flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4">
            <Button
                variant="ghost"
                size="icon"
                onClick={onOpenSidebar}
                className="md:hidden"
                aria-label="Open navigation"
            >
                <Menu className="size-5" aria-hidden="true" />
            </Button>

            <nav
                aria-label="Breadcrumb"
                className="hidden min-w-0 flex-1 items-center gap-1 text-sm md:flex"
            >
                {crumbs.map((c, i) => (
                    <span key={`${c.label}-${i}`} className="flex items-center gap-1">
                        {c.to && i < crumbs.length - 1 ? (
                            <Link to={c.to} className="text-slate-500 hover:text-slate-800">
                                {c.label}
                            </Link>
                        ) : (
                            <span
                                className={
                                    i === crumbs.length - 1
                                        ? 'font-medium text-slate-800'
                                        : 'text-slate-500'
                                }
                            >
                                {c.label}
                            </span>
                        )}
                        {i < crumbs.length - 1 && (
                            <ChevronRight
                                className="size-3 text-slate-300"
                                aria-hidden="true"
                            />
                        )}
                    </span>
                ))}
            </nav>

            <div className="ml-auto flex items-center gap-1">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="hidden md:inline-flex" aria-label="Quick create">
                            <Plus className="size-4" aria-hidden="true" />
                            <span className="text-xs">New</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Quick create</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => navigate('/inquiries')}>Inquiry</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => navigate('/quotations')}>Quotation</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => navigate('/orders')}>Sales order</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Procurement</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => navigate('/purchase/requisitions')}>Purchase requisition</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => navigate('/purchase')}>Purchase order</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => navigate('/purchase/grns')}>GRN</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => navigate('/purchase/invoices')}>Vendor invoice</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => navigate('/purchase/payments')}>Payment</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => navigate('/purchase/vendors')}>Vendor</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <button
                    type="button"
                    onClick={() => setSearchOpen(true)}
                    aria-label="Open search"
                    className="hidden h-9 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700 sm:flex"
                >
                    <Search className="size-4" aria-hidden="true" />
                    <span className="hidden md:inline">Search…</span>
                    <kbd className="ml-2 hidden rounded border border-slate-200 bg-white px-1 font-mono text-[10px] text-slate-400 md:inline">
                        Ctrl K
                    </kbd>
                </button>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open search"
                    className="sm:hidden"
                    onClick={() => setSearchOpen(true)}
                >
                    <Search className="size-5" aria-hidden="true" />
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Notifications"
                            className="relative"
                        >
                            <Bell className="size-5" aria-hidden="true" />
                            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                                {summary.unread}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                        <DropdownMenuLabel className="flex items-center justify-between">
                            <span>Notifications</span>
                            <span className="text-xs font-normal text-slate-400">
                                {summary.unread} unread
                            </span>
                        </DropdownMenuLabel>
                        {recentNotifications.map((n) => (
                            <DropdownMenuItem
                                key={n.id}
                                className="flex-col items-start gap-0.5"
                                onSelect={() => navigate(n.href ?? '/notifications')}
                            >
                                <span className="font-medium">{n.title}</span>
                                <span className="text-xs text-slate-400">
                                    {formatRelative(n.createdAt)}
                                </span>
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onSelect={() => navigate('/notifications')}
                        >
                            View all notifications
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="User menu"
                            className="rounded-full"
                        >
                            <span
                                className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                                aria-hidden="true"
                            >
                                {initials(user?.name)}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                            <div className="flex flex-col normal-case tracking-normal">
                                <span className="truncate text-sm font-semibold text-slate-800">
                                    {user?.name ?? 'Guest'}
                                </span>
                                <span className="truncate text-xs font-normal text-slate-400">
                                    {user?.email ?? '—'}
                                </span>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => navigate('/profile')}>
                            <User className="size-4" aria-hidden="true" /> Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => navigate('/profile')}>
                            <KeyRound className="size-4" aria-hidden="true" /> Change password
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            destructive
                            onSelect={() => {
                                signOut();
                                navigate('/login', { replace: true });
                            }}
                        >
                            <LogOut className="size-4" aria-hidden="true" /> Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
        </header>
    );
}

interface Crumb {
    label: string;
    to?: string;
}

function buildBreadcrumb(pathname: string): Crumb[] {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return [{ label: 'Home' }];
    const crumbs: Crumb[] = [{ label: 'Home', to: '/dashboard' }];
    let acc = '';
    segments.forEach((seg) => {
        acc += `/${seg}`;
        const known = NAV_BY_PATH[acc];
        crumbs.push({
            label: known?.breadcrumb ?? known?.label ?? humanize(seg),
            to: known ? acc : undefined,
        });
    });
    return crumbs;
}

function humanize(segment: string) {
    return segment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

function initials(name?: string) {
    if (!name) return '?';
    return name
        .split(/\s+/)
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}
