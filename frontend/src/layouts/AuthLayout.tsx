import type { ReactNode } from 'react';
import { Flame, ShieldCheck, Sparkles, Workflow } from 'lucide-react';

export interface AuthLayoutProps {
    children: ReactNode;
}

/**
 * Two-pane authentication layout.
 * - Mobile (< lg): branding hidden, form fills viewport.
 * - Desktop (≥ lg): branding on the left (gradient), form on the right.
 */
export function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="flex min-h-screen bg-bg">
            {/* Branding panel */}
            <aside
                aria-hidden="true"
                className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-slate-800 to-blue-900 p-10 text-slate-100 lg:flex"
            >
                <div>
                    <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-lg bg-white/10 text-white">
                            <Flame className="size-5" />
                        </span>
                        <span className="text-lg font-semibold">Inventory BPA</span>
                    </div>
                    <h2 className="mt-16 max-w-md text-3xl font-semibold leading-tight text-white">
                        Run your entire order-to-dispatch flow from one place.
                    </h2>
                    <p className="mt-3 max-w-md text-sm text-slate-300">
                        Inquiries, quotations, inventory, dispatch and installation
                        jobs — wired together with live dashboards and documents.
                    </p>

                    <ul className="mt-10 space-y-4 text-sm text-slate-200">
                        <Feature icon={<Workflow className="size-4" />}>
                            End-to-end workflow from inquiry to installation
                        </Feature>
                        <Feature icon={<ShieldCheck className="size-4" />}>
                            Role-based access for sales, ops and admin
                        </Feature>
                        <Feature icon={<Sparkles className="size-4" />}>
                            Real-time dashboards &amp; document repository
                        </Feature>
                    </ul>
                </div>

                <p className="text-xs text-slate-400">
                    © {new Date().getFullYear()} Inventory BPA · v0.1.0
                </p>
            </aside>

            {/* Form panel */}
            <main className="flex w-full flex-col justify-center px-4 py-10 sm:px-8 lg:w-1/2 lg:px-16">
                <div className="mx-auto w-full max-w-md">
                    <div className="mb-8 flex items-center gap-2 lg:hidden">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
                            <Flame className="size-5" aria-hidden="true" />
                        </span>
                        <span className="text-lg font-semibold text-slate-800">
                            Inventory BPA
                        </span>
                    </div>
                    {children}
                </div>
            </main>
        </div>
    );
}

function Feature({
    icon,
    children,
}: {
    icon: ReactNode;
    children: ReactNode;
}) {
    return (
        <li className="flex items-start gap-3">
            <span className="mt-0.5 flex size-6 items-center justify-center rounded-md bg-white/10 text-white">
                {icon}
            </span>
            <span>{children}</span>
        </li>
    );
}
