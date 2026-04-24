import { FileSpreadsheet } from 'lucide-react';
import { PlaceholderPage } from '@/pages/_shared/PlaceholderPage';

export default function DocumentsPage() {
  return (
    <PlaceholderPage
      title="Documents"
      description="Centralised repository of contracts, POs, invoices and certificates."
      icon={FileSpreadsheet}
      ctaLabel="Upload"
    />
  );
}
