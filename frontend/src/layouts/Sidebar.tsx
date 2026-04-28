import { Flame, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '@/app/navConfig';
import { useAuth } from '@/app/auth-context';
import { approvalKpis } from '@/mocks/approvals';
import { cn } from '@/lib/cn';

export interface SidebarProps {
    /** `true` renders the icon-only rail (desktop collapsed). */
    collapsed?: boolean;
    /** Called when a nav item is clicked (used by mobile Sheet to auto-close). */
    onNavigate?: () => void;
    /** Called when the logout button is pressed. */
    onSignOut?: () => void;
}

export function Sidebar({
    collapsed = false,
    onNavigate,
    onSignOut,
}: SidebarProps) {
    const { user, signOut } = useAuth();
    const workspace = NAV_ITEMS.filter((n) => n.section === 'workspace');
    const main = NAV_ITEMS.filter((n) => n.section === 'main');
    const masters = NAV_ITEMS.filter((n) => n.section === 'masters');
    const admin = NAV_ITEMS.filter((n) => n.section === 'admin');
    const awaitingCount = approvalKpis().awaitingMe;

    return (
        <aside
            className={cn(
                'flex h-full flex-col bg-slate-800 text-slate-100',
                collapsed ? 'w-16' : 'w-60',
            )}
        >
            {/* Brand */}
            <div
                className={cn(
                    'flex h-16 items-center gap-2 border-b border-slate-700 px-4',
                    collapsed && 'justify-center px-0',
                )}
            >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
                    <Flame className="size-5" aria-hidden="true" />
                </span>
                {!collapsed && (
                    <span className="truncate font-semibold">Inventory BPA</span>
                )}
            </div>

            {/* Nav */}
            <nav
                className="flex-1 overflow-y-auto py-3"
                aria-label="Primary navigation"
            >
                <ul className="space-y-0.5">
                    {workspace.map((item) => (
                        <NavItemRow
                            key={item.to}
                            item={item}
                            collapsed={collapsed}
                            onNavigate={onNavigate}
                            badge={item.to === '/approvals' && awaitingCount > 0 ? awaitingCount : undefined}
                        />
                    ))}
                </ul>

                {workspace.length > 0 && <SectionDivider label="Sales & Ops" collapsed={collapsed} />}

                <ul className="space-y-0.5">
                    {main.map((item) => (
                        <NavItemRow
                            key={item.to}
                            item={item}
                            collapsed={collapsed}
                            onNavigate={onNavigate}
                        />
                    ))}
                </ul>

                {masters.length > 0 && (
                    <>
                        <SectionDivider label="Masters" collapsed={collapsed} />
                        <ul className="space-y-0.5">
                            {masters.map((item) => (
                                <NavItemRow
                                    key={item.to}
                                    item={item}
                                    collapsed={collapsed}
                                    onNavigate={onNavigate}
                                />
                            ))}
                        </ul>
                    </>
                )}

                <SectionDivider label="Admin" collapsed={collapsed} />

                <ul className="space-y-0.5">
                    {admin.map((item) => (
                        <NavItemRow
                            key={item.to}
                            item={item}
                            collapsed={collapsed}
                            onNavigate={onNavigate}
                        />
                    ))}
                </ul>
            </nav>

            {/* User card */}
            <div
                className={cn(
                    'border-t border-slate-700 p-3',
                    collapsed && 'flex justify-center',
                )}
            >
                {collapsed ? (
                    <button
                        type="button"
                        onClick={() => {
                            signOut();
                            onSignOut?.();
                        }}
                        className="flex size-9 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white"
                        aria-label="Sign out"
                    >
                        <LogOut className="size-4" aria-hidden="true" />
                    </button>
                ) : (
                    <div className="flex items-center gap-3">
                        <span
                            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-medium text-white"
                            aria-hidden="true"
                        >
                            {initials(user?.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white">
                                {user?.name ?? 'Guest'}
                            </p>
                            <p className="truncate text-xs capitalize text-slate-400">
                                {user?.role ?? '—'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                signOut();
                                onSignOut?.();
                            }}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white"
                            aria-label="Sign out"
                        >
                            <LogOut className="size-4" aria-hidden="true" />
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}

function NavItemRow({
    item,
    collapsed,
    onNavigate,
    badge,
}: {
    item: (typeof NAV_ITEMS)[number];
    collapsed: boolean;
    onNavigate?: () => void;
    badge?: number;
}) {
    const Icon = item.icon;
    return (
        <li className="mx-2">
            <NavLink
                to={item.to}
                onClick={() => onNavigate?.()}
                className={({ isActive }) =>
                    cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                            ? 'bg-primary text-white'
                            : 'text-slate-300 hover:bg-slate-700 hover:text-white',
                        collapsed && 'justify-center px-2',
                    )
                }
                title={collapsed ? item.label : undefined}
            >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && badge !== undefined && (
                    <span className="ml-auto inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-semibold text-white">
                        {badge}
                    </span>
                )}
                {collapsed && badge !== undefined && (
                    <span className="absolute -mt-4 ml-4 inline-flex h-2 w-2 rounded-full bg-amber-400" aria-hidden="true" />
                )}
            </NavLink>
        </li>
    );
}

function SectionDivider({
    label,
    collapsed,
}: {
    label: string;
    collapsed: boolean;
}) {
    if (collapsed) {
        return <div className="my-3 mx-4 h-px bg-slate-700" aria-hidden="true" />;
    }
    return (
        <div className="mt-4 mb-1 px-5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            {label}
        </div>
    );
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
