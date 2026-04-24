import { Hammer } from 'lucide-react';
import { PlaceholderPage } from '@/pages/_shared/PlaceholderPage';

export default function JobsPage() {
  return (
    <PlaceholderPage
      title="Engineer &amp; Installation Jobs"
      description="On-site installation, commissioning and service visits."
      icon={Hammer}
      ctaLabel="New job"
    />
  );
}
