import { useNavigate } from 'react-router-dom';
import { LogOut, User, Building2, Mail, Phone, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePortalAuth } from '@/app/portal-context';
import { currentOrganization } from '@/mocks/portal/client-users';

export default function PortalProfilePage() {
    const { user, signOut } = usePortalAuth();
    const navigate = useNavigate();
    const org = currentOrganization();

    function handleSignOut() {
        signOut();
        navigate('/portal/login', { replace: true });
    }

    return (
        <div className="space-y-6">
            <PageHeader title="Profile" description="Your account details and organisation." />

            <section className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                    <span className="flex size-12 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                        <User className="size-6" />
                    </span>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">{user?.name}</h2>
                        <p className="text-sm text-slate-500">{user?.designation}</p>
                    </div>
                    <span className="ml-auto"><Badge tone="emerald">Active</Badge></span>
                </div>
                <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                    <div>
                        <dt className="text-xs text-slate-400 flex items-center gap-1"><Mail className="size-3" /> Email</dt>
                        <dd className="text-slate-900">{user?.email}</dd>
                    </div>
                    <div>
                        <dt className="text-xs text-slate-400 flex items-center gap-1"><Phone className="size-3" /> Mobile</dt>
                        <dd className="text-slate-900">{user?.mobile}</dd>
                    </div>
                    <div>
                        <dt className="text-xs text-slate-400 flex items-center gap-1"><ShieldCheck className="size-3" /> Role</dt>
                        <dd className="text-slate-900 capitalize">{user?.role}</dd>
                    </div>
                </dl>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Building2 className="size-4" /> Organisation
                </h3>
                <dl className="grid gap-3 text-sm md:grid-cols-2">
                    <div>
                        <dt className="text-xs text-slate-400">Legal name</dt>
                        <dd className="text-slate-900">{org.legalName}</dd>
                    </div>
                    <div>
                        <dt className="text-xs text-slate-400">GST number</dt>
                        <dd className="text-slate-900">{org.gstNumber ?? '—'}</dd>
                    </div>
                    <div className="md:col-span-2">
                        <dt className="text-xs text-slate-400">Address</dt>
                        <dd className="text-slate-900">{org.address}</dd>
                    </div>
                    <div>
                        <dt className="text-xs text-slate-400">Primary contact</dt>
                        <dd className="text-slate-900">{org.primaryContact}</dd>
                    </div>
                </dl>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-800">Security</h3>
                <p className="text-sm text-slate-500">
                    Phase 3 will let you change your password, manage trusted devices and enable 2FA from this screen.
                </p>
            </section>

            <Button variant="danger" onClick={handleSignOut}>
                <LogOut className="size-4" /> Sign out
            </Button>
        </div>
    );
}
