import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/FormField';
import { ErrorAlert } from '@/components/ui/ErrorAlert';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <Flame className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold">Inventory BPA</span>
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Reset your password
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          We will email you a reset link if this account exists.
        </p>

        {submitted ? (
          <div className="mt-6 space-y-4">
            <ErrorAlert
              variant="success"
              title="Check your inbox"
              description={`If an account exists for ${email}, a reset link has been sent.`}
            />
            <Link
              to="/login"
              className="block text-center text-sm text-primary hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" variant="primary" className="w-full">
              Send reset link
            </Button>
            <Link
              to="/login"
              className="block text-center text-sm text-slate-500 hover:text-slate-700"
            >
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
