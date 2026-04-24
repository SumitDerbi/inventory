import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { FormField, Input } from '@/components/ui/FormField';
import { AuthLayout } from '@/layouts/AuthLayout';
import {
    forgotPasswordSchema,
    type ForgotPasswordValues,
} from './schema';

export default function ForgotPasswordPage() {
    const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: '' },
        mode: 'onBlur',
    });

    async function onSubmit(values: ForgotPasswordValues) {
        await new Promise<void>((resolve) => setTimeout(resolve, 900));
        setSubmittedEmail(values.email);
    }

    return (
        <AuthLayout>
            <h1 className="text-2xl font-semibold text-slate-900">
                Reset your password
            </h1>
            <p className="mt-1 text-sm text-slate-500">
                We will email you a reset link if this account exists.
            </p>

            {submittedEmail ? (
                <div className="mt-6 space-y-4">
                    <ErrorAlert
                        variant="success"
                        title="Check your inbox"
                        description={`If an account exists for ${submittedEmail}, a reset link has been sent. The link will expire in 30 minutes.`}
                    />
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                        <ArrowLeft className="size-4" aria-hidden="true" />
                        Back to sign in
                    </Link>
                </div>
            ) : (
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="mt-6 space-y-4"
                    noValidate
                >
                    <FormField
                        label="Email"
                        htmlFor="forgot-email"
                        required
                        error={errors.email?.message}
                        helper="We'll send a reset link if this email is registered."
                    >
                        <Input
                            id="forgot-email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@company.com"
                            invalid={Boolean(errors.email)}
                            {...register('email')}
                        />
                    </FormField>

                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2
                                    className="size-4 animate-spin"
                                    aria-hidden="true"
                                />
                                Sending link…
                            </>
                        ) : (
                            'Send reset link'
                        )}
                    </Button>

                    <Link
                        to="/login"
                        className="flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-slate-700"
                    >
                        <ArrowLeft className="size-4" aria-hidden="true" />
                        Back to sign in
                    </Link>
                </form>
            )}
        </AuthLayout>
    );
}
