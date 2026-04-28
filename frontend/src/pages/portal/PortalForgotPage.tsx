import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Loader2, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormField, Input } from '@/components/ui/FormField';

export default function PortalForgotPage() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        await new Promise((r) => setTimeout(r, 500));
        setSent(true);
        setSubmitting(false);
    }

    return (
        <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
                <div className="mb-8 flex items-center gap-2">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                        <Building2 className="size-5" aria-hidden="true" />
                    </span>
                    <div className="text-base font-semibold text-slate-900">Customer Portal</div>
                </div>

                {sent ? (
                    <div className="rounded-lg border border-emerald-200 bg-white p-6">
                        <div className="flex items-center gap-2 text-emerald-700">
                            <MailCheck className="size-5" />
                            <h1 className="text-lg font-semibold">Check your inbox</h1>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                            If <b>{email}</b> matches a portal account, we&apos;ve sent a reset
                            link. The link is valid for 30 minutes.
                        </p>
                        <Link
                            to="/portal/login"
                            className="mt-4 inline-block text-sm text-primary hover:underline"
                        >
                            ← Back to sign in
                        </Link>
                    </div>
                ) : (
                    <>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            Reset your password
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Enter the email address associated with your account.
                        </p>
                        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
                            <FormField label="Email" htmlFor="forgot-email" required>
                                <Input
                                    id="forgot-email"
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </FormField>
                            <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
                                {submitting ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" /> Sending…
                                    </>
                                ) : (
                                    'Send reset link'
                                )}
                            </Button>
                            <Link
                                to="/portal/login"
                                className="block text-center text-sm text-slate-500 hover:underline"
                            >
                                Back to sign in
                            </Link>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
