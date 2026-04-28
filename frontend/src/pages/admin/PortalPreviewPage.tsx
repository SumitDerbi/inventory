import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, UserCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { usePortalAuth } from '@/app/portal-context';
import {
    clientUsers,
    clientOrganizations,
    setCurrentClientUserId,
} from '@/mocks/portal/client-users';

export default function PortalPreviewPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const portalAuth = usePortalAuth();
    const [selected, setSelected] = useState(portalAuth.user?.id ?? clientUsers[0].id);

    function impersonate(openInNewTab: boolean) {
        setCurrentClientUserId(selected);
        portalAuth.switchUser(selected);
        toast.push({ title: 'Portal context switched', variant: 'success' });
        if (openInNewTab) {
            window.open('/portal', '_blank');
        } else {
            navigate('/portal');
        }
    }

    return (
        <div className="space-y-4">
            <PageHeader
                title="Portal preview"
                description="Admin-only preview of the customer portal. Switch personas to see what each client sees."
            />

            <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-800">Choose a client persona</h3>
                <ul className="grid gap-2 md:grid-cols-2">
                    {clientUsers.map((u) => {
                        const org = clientOrganizations.find((o) => o.id === u.organizationId);
                        const isActive = selected === u.id;
                        return (
                            <li key={u.id}>
                                <button
                                    type="button"
                                    onClick={() => setSelected(u.id)}
                                    className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition ${
                                        isActive
                                            ? 'border-blue-400 bg-blue-50'
                                            : 'border-slate-200 bg-white hover:border-slate-300'
                                    }`}
                                >
                                    <UserCircle2 className="mt-0.5 size-5 text-slate-400" />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="truncate font-medium text-slate-900">{u.name}</span>
                                            <Badge tone="neutral">{u.role}</Badge>
                                        </div>
                                        <div className="text-xs text-slate-500">{u.designation}</div>
                                        <div className="mt-1 text-xs text-slate-700">{org?.name}</div>
                                        <div className="text-xs text-slate-400">{u.email}</div>
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </section>

            <div className="flex flex-wrap gap-2">
                <Button variant="primary" onClick={() => impersonate(false)}>
                    Open portal as this user
                </Button>
                <Button variant="outline" onClick={() => impersonate(true)}>
                    <ExternalLink className="size-4" /> Open in new tab
                </Button>
            </div>

            <p className="text-xs text-slate-400">
                Portal previewing only changes the in-memory mock context. No data is persisted.
            </p>
        </div>
    );
}
