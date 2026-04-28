import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Building2, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { PasswordInput } from '@/components/ui/PasswordInput';

export default function PortalResetPage() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }
        setSubmitting(true);
        await new Promise((r) => setTimeout(r, 500));
        setDone(true);
        setSubmitting(false);
        setTimeout(() => navigate('/portal/login', { replace: true }), 1500);
    }

    return (
        <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
                <div className="mb-8 flex items-center gap-2">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                        <Building2 className="size-5" />
                    </span>
                    <div className="text-base font-semibold text-slate-900">Customer Portal</div>
                </div>
                {done ? (
                    <div className="rounded-lg border border-emerald-200 bg-white p-6">
                        <div className="flex items-center gap-2 text-emerald-700">
                            <CheckCircle2 className="size-5" />
                            <h1 className="text-lg font-semibold">Password reset</h1>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">Redirecting to sign-in…</p>
                    </div>
                ) : (
                    <>
                        <h1 className="text-2xl font-semibold text-slate-900">Set a new password</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Token: <code className="text-xs">{token ?? '—'}</code>
                        </p>
                        {error && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
                        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
                            <FormField label="New password" htmlFor="rp-pw" required>
                                <PasswordInput id="rp-pw" value={password} onChange={(e) => setPassword(e.target.value)} />
                            </FormField>
                            <FormField label="Confirm password" htmlFor="rp-pw2" required>
                                <PasswordInput id="rp-pw2" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                            </FormField>
                            <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
                                {submitting ? (<><Loader2 className="size-4 animate-spin" /> Saving…</>) : 'Update password'}
                            </Button>
                            <Link to="/portal/login" className="block text-center text-sm text-slate-500 hover:underline">
                                Back to sign in
                            </Link>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
