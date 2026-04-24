import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { RevenueLineChart } from '@/components/charts/RevenueLineChart';
import { InquiryFunnelChart } from '@/components/charts/InquiryFunnelChart';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { PendingActionsList } from '@/components/dashboard/PendingActionsList';
import {
    funnelStages,
    kpis,
    pendingActions,
    recentActivity,
    revenueTrend,
} from '@/mocks/dashboard';

export default function DashboardPage() {
    return (
        <div className="p-6 md:p-8">
            <PageHeader
                title="Executive Dashboard"
                description="High-level view across inquiries, sales, inventory and fulfilment."
                actions={
                    <Button variant="outline">
                        <Download className="size-4" aria-hidden="true" />
                        Export
                    </Button>
                }
            />

            {/* Row 1 — KPI cards with staggered mount animation */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {kpis.map((kpi, idx) => (
                    <motion.div
                        key={kpi.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.25,
                            delay: idx * 0.05,
                            ease: 'easeOut',
                        }}
                    >
                        <StatCard
                            label={kpi.label}
                            value={kpi.value}
                            delta={kpi.delta}
                            deltaLabel={kpi.deltaLabel}
                            icon={kpi.icon}
                            tone={kpi.tone}
                        />
                    </motion.div>
                ))}
            </div>

            {/* Row 2 — Revenue trend (7/12) + Inquiry funnel (5/12) */}
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
                <section
                    aria-labelledby="revenue-title"
                    className="card lg:col-span-7"
                >
                    <header className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 id="revenue-title" className="card-title">
                                Revenue vs. cost
                            </h2>
                            <p className="text-xs text-slate-400">Last 6 months</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                            <LegendDot color="#2563EB" label="Revenue" />
                            <LegendDot color="#94A3B8" label="Cost" dashed />
                        </div>
                    </header>
                    <RevenueLineChart data={revenueTrend} />
                </section>

                <section
                    aria-labelledby="funnel-title"
                    className="card lg:col-span-5"
                >
                    <header className="mb-4">
                        <h2 id="funnel-title" className="card-title">
                            Inquiry funnel
                        </h2>
                        <p className="text-xs text-slate-400">This month</p>
                    </header>
                    <InquiryFunnelChart stages={funnelStages} />
                </section>
            </div>

            {/* Row 3 — Activity feed (7/12) + Pending actions (5/12) */}
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
                <section
                    aria-labelledby="activity-title"
                    className="card lg:col-span-7"
                >
                    <header className="mb-4 flex items-center justify-between">
                        <h2 id="activity-title" className="card-title">
                            Recent activity
                        </h2>
                        <button
                            type="button"
                            className="text-xs font-medium text-primary hover:underline"
                        >
                            View all
                        </button>
                    </header>
                    <RecentActivityFeed items={recentActivity} />
                </section>

                <section
                    aria-labelledby="pending-title"
                    className="card lg:col-span-5"
                >
                    <header className="mb-4">
                        <h2 id="pending-title" className="card-title">
                            Pending actions
                        </h2>
                        <p className="text-xs text-slate-400">
                            Items awaiting you across modules
                        </p>
                    </header>
                    <PendingActionsList groups={pendingActions} />
                </section>
            </div>
        </div>
    );
}

function LegendDot({
    color,
    label,
    dashed,
}: {
    color: string;
    label: string;
    dashed?: boolean;
}) {
    return (
        <span className="flex items-center gap-1.5">
            <span
                aria-hidden="true"
                className="inline-block h-0.5 w-5"
                style={{
                    backgroundColor: dashed ? 'transparent' : color,
                    borderTop: dashed ? `2px dashed ${color}` : undefined,
                }}
            />
            {label}
        </span>
    );
}
