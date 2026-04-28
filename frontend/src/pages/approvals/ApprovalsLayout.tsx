import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/cn';

const tabs = [
    { to: '/approvals', label: 'Inbox', end: true },
    { to: '/approvals/history', label: 'History', end: false },
];

export default function ApprovalsLayout() {
    return (
        <div className="space-y-4">
            <nav className="flex gap-1 border-b border-slate-200" aria-label="Approvals sections">
                {tabs.map((t) => (
                    <NavLink
                        key={t.to}
                        to={t.to}
                        end={t.end}
                        className={({ isActive }) =>
                            cn(
                                'relative px-3 py-2 text-sm font-medium transition-colors',
                                isActive ? 'text-primary' : 'text-slate-500 hover:text-slate-700',
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {t.label}
                                {isActive && (
                                    <span aria-hidden className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>
            <Outlet />
        </div>
    );
}
