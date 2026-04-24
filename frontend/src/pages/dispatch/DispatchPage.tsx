import { Truck } from 'lucide-react';
import { PlaceholderPage } from '@/pages/_shared/PlaceholderPage';

export default function DispatchPage() {
  return (
    <PlaceholderPage
      title="Dispatch &amp; Logistics"
      description="Pick, pack, dispatch and track shipments."
      icon={Truck}
      ctaLabel="New dispatch"
    />
  );
}
