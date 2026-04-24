import { TrendingUp } from 'lucide-react';
import { PlaceholderPage } from '@/pages/_shared/PlaceholderPage';

export default function ReportsPage() {
  return (
    <PlaceholderPage
      title="Reports &amp; Analytics"
      description="Sales, inventory and operations reporting."
      icon={TrendingUp}
      ctaLabel="New report"
    />
  );
}
