import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Loader2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { FormField, Input } from '@/components/ui/FormField';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { usePortalAuth } from '@/app/portal-context';
import {
    clientUsers,
    clientOrganizations,
    DEFAULT_PORTAL_USER_ID,
} from '@/mocks/portal/client-users';

interface LocationState {
    from?: string;
}

/**
 * Portal sign-in screen — Phase 1 stub: any well-formed credentials
 * are accepted, and a demo "Sign in as" picker maps to one of the
 * mock client users.
 */
export default function PortalLoginPage() {
    const { signIn } = usePortalAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as LocationState | null)?.from ?? '/portal';

    const [email, setEmail] = useState('rajesh@patel-eng.com');
    const [password, setPassword] = useState('demo1234');
    const [demoUserId, setDemoUserId] = useState(DEFAULT_PORTAL_USER_ID);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email || !password) {
            setFormError('Email and password are required.');
            return;
        }
        setSubmitting(true);
        await new Promise((r) => setTimeout(r, 600));
        signIn(demoUserId);
        navigate(from, { replace: true });
    }

    return (
        <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
                <div className="mb-8 flex items-center gap-2">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                        <Building2 className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                        <div className="text-base font-semibold text-slate-900">Customer Portal</div>
                        <div className="text-xs text-slate-500">Inventory BPA</div>
                    </div>
                </div>
                <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Track your orders, quotes, dispatches and installation jobs.
                </p>

                {formError && (
                    <div className="mt-6">
                        <ErrorAlert title="Sign-in failed" description={formError} />
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
                    <FormField label="Email" htmlFor="portal-email" required>
                        <Input
                            id="portal-email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@company.com"
                        />
                    </FormField>

                    <FormField label="Password" htmlFor="portal-password" required>
                        <PasswordInput
                            id="portal-password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </FormField>

                    <FormField
                        label="Demo: Sign in as"
                        htmlFor="portal-demo-user"
                        helper="Phase 1 demo — pick any user. Phase 3 will derive identity from email."
                    >
                        <select
                            id="portal-demo-user"
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={demoUserId}
                            onChange={(e) => setDemoUserId(e.target.value)}
                        >
                            {clientUsers.map((u) => {
                                const org = clientOrganizations.find((o) => o.id === u.organizationId);
                                return (
                                    <option key={u.id} value={u.id}>
                                        {u.name} — {org?.name}
                                    </option>
                                );
                            })}
                        </select>
                    </FormField>

                    <div className="flex justify-end">
                        <Link
                            to="/portal/forgot"
                            className="text-sm text-primary hover:underline"
                        >
                            Forgot password?
                        </Link>
                    </div>

                    <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
                        {submitting ? (
                            <>
                                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                                Signing in…
                            </>
                        ) : (
                            'Sign in'
                        )}
                    </Button>
                </form>

                <p className="mt-8 text-center text-xs text-slate-400">
                    Having trouble? Email <a href="mailto:support@example.com" className="underline">support@example.com</a>
                </p>
            </div>
        </div>
    );
}
