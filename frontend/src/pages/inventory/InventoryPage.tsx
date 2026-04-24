import { Package } from 'lucide-react';
import { PlaceholderPage } from '@/pages/_shared/PlaceholderPage';

export default function InventoryPage() {
  return (
    <PlaceholderPage
      title="Inventory"
      description="SKUs, stock levels and warehouse movements."
      icon={Package}
      ctaLabel="Add product"
    />
  );
}
