import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { FormField, Input } from '@/components/ui/FormField';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { AuthLayout } from '@/layouts/AuthLayout';
import { useAuth } from '@/app/auth-context';
import { loginSchema, type LoginValues } from './schema';

interface LocationState {
    from?: string;
}

export default function LoginPage() {
    const { signIn } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as LocationState | null)?.from ?? '/dashboard';
    const [formError, setFormError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
        mode: 'onBlur',
    });

    async function onSubmit(values: LoginValues) {
        setFormError(null);
        try {
            await signIn(values.email, values.password);
            navigate(from, { replace: true });
        } catch (err) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            const message =
                status === 401
                    ? 'Invalid email or password.'
                    : (err as Error).message || 'Unable to sign in. Please try again.';
            setFormError(message);
        }
    }

    return (
        <AuthLayout>
            <h1 className="text-2xl font-semibold text-slate-900">
                Sign in to your account
            </h1>
            <p className="mt-1 text-sm text-slate-500">
                Enter your credentials to continue.
            </p>

            {formError && (
                <div className="mt-6">
                    <ErrorAlert title="Sign-in failed" description={formError} />
                </div>
            )}

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-6 space-y-4"
                noValidate
            >
                <FormField
                    label="Email"
                    htmlFor="login-email"
                    required
                    error={errors.email?.message}
                >
                    <Input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@company.com"
                        invalid={Boolean(errors.email)}
                        {...register('email')}
                    />
                </FormField>

                <FormField
                    label="Password"
                    htmlFor="login-password"
                    required
                    error={errors.password?.message}
                >
                    <PasswordInput
                        id="login-password"
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        invalid={Boolean(errors.password)}
                        {...register('password')}
                    />
                </FormField>

                <div className="flex justify-end">
                    <Link
                        to="/forgot-password"
                        className="text-sm text-primary hover:underline"
                    >
                        Forgot password?
                    </Link>
                </div>

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
                            Signing in…
                        </>
                    ) : (
                        'Sign in'
                    )}
                </Button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-400">
                Demo build — any valid-format credentials will grant access.
            </p>
        </AuthLayout>
    );
}
