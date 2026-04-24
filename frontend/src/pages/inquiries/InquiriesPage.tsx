import { MessageSquare } from 'lucide-react';
import { PlaceholderPage } from '@/pages/_shared/PlaceholderPage';

export default function InquiriesPage() {
    return (
        <PlaceholderPage
            title="Inquiries"
            description="Intake, triage and convert customer inquiries to quotations."
            icon={MessageSquare}
            ctaLabel="New inquiry"
        />
    );
}
