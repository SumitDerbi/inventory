import { Users } from 'lucide-react';
import { PlaceholderPage } from '@/pages/_shared/PlaceholderPage';

export default function UsersPage() {
    return (
        <PlaceholderPage
            title="Users &amp; Roles"
            description="Manage team members, roles and permissions."
            icon={Users}
            ctaLabel="Invite user"
        />
    );
}
