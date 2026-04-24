import { Settings } from 'lucide-react';
import { PlaceholderPage } from '@/pages/_shared/PlaceholderPage';

export default function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      description="Application preferences, company profile and integrations."
      icon={Settings}
      ctaLabel="Edit settings"
    />
  );
}
