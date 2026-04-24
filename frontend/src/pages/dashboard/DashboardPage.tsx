import { Activity, IndianRupee, ShoppingCart, TriangleAlert } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatINR } from '@/lib/format';

export default function DashboardPage() {
  return (
    <div className="p-6 md:p-8">
      <PageHeader
        title="Executive Dashboard"
        description="High-level view across inquiries, sales, inventory and fulfilment."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Inquiries (MTD)"
          value="128"
          delta={12}
          deltaLabel="vs. last month"
          icon={Activity}
          tone="blue"
        />
        <StatCard
          label="Revenue"
          value={formatINR(4580000)}
          delta={-4}
          deltaLabel="vs. last month"
          icon={IndianRupee}
          tone="emerald"
        />
        <StatCard
          label="Orders"
          value="47"
          delta={0}
          icon={ShoppingCart}
          tone="violet"
        />
        <StatCard
          label="Low-stock SKUs"
          value="6"
          icon={TriangleAlert}
          tone="amber"
        />
      </div>

      <section className="mt-8">
        <EmptyState
          title="Charts &amp; activity feed coming soon"
          description="Dashboard widgets (sales funnel, top customers, ageing) will be wired up in Step 05."
        />
      </section>
    </div>
  );
}
