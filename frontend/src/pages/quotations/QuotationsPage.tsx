import { FileText } from 'lucide-react';
import { PlaceholderPage } from '@/pages/_shared/PlaceholderPage';

export default function QuotationsPage() {
    return (
        <PlaceholderPage
            title="Quotations"
            description="Draft, approve, send and track quotations to customers."
            icon={FileText}
            ctaLabel="New quotation"
        />
    );
}
