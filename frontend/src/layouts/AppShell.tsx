import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { FadeIn } from '@/components/motion/FadeIn';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useLocalStorage } from '@/hooks/useLocalStorage';

/**
 * Persistent shell: sidebar (left) + topbar + routed outlet.
 * Responsive rules — see docs/ui_spec.md §App Shell:
 *   <768px  : sidebar hidden, Sheet overlay
 *   ≥768px  : desktop sidebar (collapse toggle persists to localStorage)
 */
export function AppShell() {
  const [collapsed, setCollapsed] = useLocalStorage('sidebar.collapsed', false);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === 'undefined' ? true : window.innerWidth >= 768,
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Desktop sidebar */}
      {isDesktop && (
        <div className="relative hidden h-full shrink-0 md:block">
          <Sidebar collapsed={collapsed} />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed((v) => !v)}
            className="absolute -right-3 top-6 z-10 size-6 rounded-full border border-slate-200 bg-white shadow-sm hover:bg-slate-50"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-3.5 text-slate-500" aria-hidden />
            ) : (
              <PanelLeftClose className="size-3.5 text-slate-500" aria-hidden />
            )}
          </Button>
        </div>
      )}

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-60 p-0 md:hidden"
          showCloseButton={false}
        >
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main region */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <FadeIn>
            <Outlet />
          </FadeIn>
        </main>
      </div>
    </div>
  );
}
