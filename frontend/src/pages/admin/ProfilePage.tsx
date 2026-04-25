import { useMemo, useState } from 'react';
import {
    Copy,
    Download,
    KeyRound,
    LogOut,
    Monitor,
    RefreshCw,
    Save,
    ShieldCheck,
    Smartphone,
    Tablet,
    UserRound,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FormField, Input, Textarea } from '@/components/ui/FormField';
import { PasswordInput } from '@/components/ui/PasswordInput';
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { formatRelative } from '@/lib/format';
import {
    CURRENT_USER_ID,
    ROLE_LABEL,
    ROLE_TONE,
    users,
    type MockUser,
} from '@/mocks/users';
import { activeSessions, type ActiveSession } from '@/mocks/sessions';
import {
    confirm2FA,
    disable2FA,
    enable2FA,
    getRecoveryCodes,
    regenerateRecoveryCodes,
    twoFactor,
} from '@/mocks/auth-2fa';

interface PasswordRule {
    label: string;
    test: (s: string) => boolean;
}

const RULES: PasswordRule[] = [
    { label: 'At least 8 characters', test: (s) => s.length >= 8 },
    { label: 'One uppercase letter', test: (s) => /[A-Z]/.test(s) },
    { label: 'One number', test: (s) => /\d/.test(s) },
    {
        label: 'One symbol',
        test: (s) => /[^A-Za-z0-9]/.test(s),
    },
];

export default function ProfilePage() {
    const me: MockUser =
        users.find((u) => u.id === CURRENT_USER_ID) ?? users[0];
    const { push } = useToast();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(me.name);
    const [mobile, setMobile] = useState(me.mobile ?? '');
    const [designation, setDesignation] = useState(me.designation ?? '');
    const [notes, setNotes] = useState(me.notes ?? '');
    const [sessions, setSessions] = useState<ActiveSession[]>(activeSessions);
    const [signOutAllOpen, setSignOutAllOpen] = useState(false);

    function signOutSession(id: string) {
        const target = sessions.find((s) => s.id === id);
        setSessions((curr) => curr.filter((s) => s.id !== id));
        push({
            variant: 'success',
            title: 'Signed out',
            description: `${target?.device ?? 'Session'} — ${target?.location ?? ''}`.trim(),
        });
    }

    function signOutAllOthers() {
        const removed = sessions.filter((s) => !s.current).length;
        setSessions((curr) => curr.filter((s) => s.current));
        push({
            variant: 'success',
            title: 'Signed out everywhere else',
            description: `${removed} session${removed === 1 ? '' : 's'} ended.`,
        });
        setSignOutAllOpen(false);
    }

    function handleSave() {
        push({
            variant: 'success',
            title: 'Profile updated',
            description: 'Your changes have been saved.',
        });
    }

    return (
        <div>
            <PageHeader
                title="My profile"
                description="Personal details and account security."
                actions={
                    <>
                        <Button variant="outline" onClick={() => setOpen(true)}>
                            <KeyRound className="size-4" aria-hidden="true" />
                            Change password
                        </Button>
                        <Button onClick={handleSave}>
                            <Save className="size-4" aria-hidden="true" />
                            Save
                        </Button>
                    </>
                }
            />

            <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
                <aside className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-col items-center text-center">
                        <span
                            className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary"
                            aria-hidden="true"
                        >
                            {me.name
                                .split(/\s+/)
                                .map((p) => p[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()}
                        </span>
                        <h2 className="mt-3 text-base font-semibold text-slate-800">
                            {me.name}
                        </h2>
                        <p className="text-sm text-slate-500">
                            {me.designation ?? '—'}
                        </p>
                        <Badge tone={ROLE_TONE[me.role]} className="mt-2">
                            <ShieldCheck
                                className="-ml-0.5 mr-1 size-3"
                                aria-hidden="true"
                            />
                            {ROLE_LABEL[me.role]}
                        </Badge>
                    </div>
                    <dl className="mt-5 grid gap-2 text-sm">
                        <ProfileMeta label="Email" value={me.email} />
                        <ProfileMeta label="Mobile" value={me.mobile ?? '—'} />
                        <ProfileMeta
                            label="Employee code"
                            value={me.employeeCode ?? '—'}
                        />
                        <ProfileMeta
                            label="Department"
                            value={me.department ?? '—'}
                        />
                        <ProfileMeta
                            label="Last login"
                            value={formatRelative(me.lastLoginAt)}
                        />
                    </dl>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 w-full"
                    >
                        <UserRound className="size-4" aria-hidden="true" />
                        Change profile photo
                    </Button>
                </aside>

                <section className="rounded-xl border border-slate-200 bg-white">
                    <header className="border-b border-slate-100 px-5 py-4">
                        <h2 className="text-base font-semibold text-slate-800">
                            Personal details
                        </h2>
                        <p className="text-sm text-slate-500">
                            Editable fields. Role assignments are managed by an
                            administrator.
                        </p>
                    </header>
                    <div className="grid gap-4 p-5 md:grid-cols-2">
                        <FormField label="Full name" required>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </FormField>
                        <FormField label="Email">
                            <Input value={me.email} disabled />
                        </FormField>
                        <FormField label="Mobile">
                            <Input
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                            />
                        </FormField>
                        <FormField label="Designation">
                            <Input
                                value={designation}
                                onChange={(e) => setDesignation(e.target.value)}
                            />
                        </FormField>
                        <FormField label="Notes" className="md:col-span-2">
                            <Textarea
                                rows={3}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Anything you'd like your manager to know…"
                            />
                        </FormField>
                    </div>
                </section>
            </div>

            <section className="mt-4 rounded-xl border border-slate-200 bg-white">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-slate-800">
                            Signed-in devices
                        </h2>
                        <p className="text-sm text-slate-500">
                            These devices are currently signed in to your account.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={sessions.filter((s) => !s.current).length === 0}
                        onClick={() => setSignOutAllOpen(true)}
                    >
                        <LogOut className="size-4" aria-hidden="true" />
                        Sign out everywhere else
                    </Button>
                </header>
                <ul className="divide-y divide-slate-100">
                    {sessions.map((s) => (
                        <li
                            key={s.id}
                            className="flex flex-wrap items-center gap-4 px-5 py-3"
                        >
                            <span
                                className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600"
                                aria-hidden="true"
                            >
                                <DeviceIcon device={s.device} />
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="truncate text-sm font-medium text-slate-800">
                                        {s.device} · {s.browser}
                                    </p>
                                    {s.current && (
                                        <Badge tone="green">Current</Badge>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500">
                                    {s.os} · {s.location} · {s.ip} · last active{' '}
                                    {formatRelative(s.lastSeenAt)}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={s.current}
                                onClick={() => signOutSession(s.id)}
                            >
                                <LogOut className="size-4" aria-hidden="true" />
                                Sign out
                            </Button>
                        </li>
                    ))}
                </ul>
            </section>

            <TwoFactorSection />

            <ChangePasswordDialog open={open} onOpenChange={setOpen} />
            <SignOutAllDialog
                open={signOutAllOpen}
                onOpenChange={setSignOutAllOpen}
                count={sessions.filter((s) => !s.current).length}
                onConfirm={signOutAllOthers}
            />
        </div>
    );
}

function DeviceIcon({ device }: { device: string }) {
    const d = device.toLowerCase();
    if (d.includes('iphone') || d.includes('android phone'))
        return <Smartphone className="size-5" aria-hidden="true" />;
    if (d.includes('tablet') || d.includes('ipad'))
        return <Tablet className="size-5" aria-hidden="true" />;
    return <Monitor className="size-5" aria-hidden="true" />;
}

function SignOutAllDialog({
    open,
    onOpenChange,
    count,
    onConfirm,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    count: number;
    onConfirm: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Sign out everywhere else?</DialogTitle>
                    <DialogDescription>
                        This will end {count} other session{count === 1 ? '' : 's'}.
                        You will remain signed in on this device.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={onConfirm}>
                        <LogOut className="size-4" aria-hidden="true" />
                        Sign out others
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ProfileMeta({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-2">
            <dt className="text-xs uppercase tracking-wide text-slate-400">
                {label}
            </dt>
            <dd className="truncate text-sm text-slate-700">{value}</dd>
        </div>
    );
}

function ChangePasswordDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
}) {
    const { push } = useToast();
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');

    const ruleStatus = useMemo(
        () => RULES.map((r) => ({ ...r, ok: r.test(next) })),
        [next],
    );
    const allRulesOk = ruleStatus.every((r) => r.ok);
    const matches = next.length > 0 && next === confirm;
    const canSubmit = current.length > 0 && allRulesOk && matches;

    function reset() {
        setCurrent('');
        setNext('');
        setConfirm('');
    }

    function handleSubmit() {
        if (!canSubmit) return;
        push({
            variant: 'success',
            title: 'Password changed',
            description: 'Use your new password on next sign-in.',
        });
        reset();
        onOpenChange(false);
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (!v) reset();
                onOpenChange(v);
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Change password</DialogTitle>
                    <DialogDescription>
                        Choose a strong new password and re-enter it to confirm.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody>
                    <div className="grid gap-3">
                        <FormField label="Current password" required>
                            <PasswordInput
                                value={current}
                                onChange={(e) => setCurrent(e.target.value)}
                                autoComplete="current-password"
                            />
                        </FormField>
                        <FormField label="New password" required>
                            <PasswordInput
                                value={next}
                                onChange={(e) => setNext(e.target.value)}
                                autoComplete="new-password"
                            />
                        </FormField>
                        <ul className="grid grid-cols-2 gap-1 text-xs">
                            {ruleStatus.map((r) => (
                                <li
                                    key={r.label}
                                    className={cn(
                                        'flex items-center gap-1.5',
                                        r.ok ? 'text-emerald-600' : 'text-slate-400',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'inline-flex size-3 items-center justify-center rounded-full text-[10px]',
                                            r.ok
                                                ? 'bg-emerald-100 text-emerald-600'
                                                : 'bg-slate-100 text-slate-400',
                                        )}
                                        aria-hidden="true"
                                    >
                                        {r.ok ? '✓' : '·'}
                                    </span>
                                    {r.label}
                                </li>
                            ))}
                        </ul>
                        <FormField
                            label="Confirm new password"
                            required
                            error={
                                confirm.length > 0 && !matches
                                    ? 'Passwords do not match.'
                                    : undefined
                            }
                        >
                            <PasswordInput
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                autoComplete="new-password"
                                invalid={confirm.length > 0 && !matches}
                            />
                        </FormField>
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!canSubmit}>
                        <KeyRound className="size-4" aria-hidden="true" />
                        Update password
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function TwoFactorSection() {
    const { push } = useToast();
    const [enabled, setEnabled] = useState(twoFactor.enabled);
    const [enrolledAt, setEnrolledAt] = useState(twoFactor.enrolledAt);
    const [setupOpen, setSetupOpen] = useState(false);
    const [disableOpen, setDisableOpen] = useState(false);
    const [codes, setCodes] = useState<string[]>(getRecoveryCodes());

    function handleEnabled(at: string | null) {
        setEnabled(true);
        setEnrolledAt(at);
        setCodes(getRecoveryCodes());
    }

    function handleDisable(password: string): { ok: boolean; error?: string } {
        const res = disable2FA(password);
        if (res.ok) {
            setEnabled(false);
            setEnrolledAt(null);
            setCodes([]);
            push({
                variant: 'success',
                title: 'Two-factor disabled',
                description: 'Sign-ins no longer require a code.',
            });
            setDisableOpen(false);
        }
        return res;
    }

    function handleRegenerate() {
        const next = regenerateRecoveryCodes();
        setCodes(next);
        push({
            variant: 'success',
            title: 'Recovery codes regenerated',
            description: 'Old codes are no longer valid.',
        });
    }

    return (
        <section className="mt-4 rounded-xl border border-slate-200 bg-white">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                    <h2 className="text-base font-semibold text-slate-800">
                        Two-factor authentication
                    </h2>
                    <p className="text-sm text-slate-500">
                        Add an extra step at sign-in using an authenticator app.
                    </p>
                </div>
                {enabled ? (
                    <div className="flex items-center gap-2">
                        <Badge tone="green">
                            <ShieldCheck
                                className="-ml-0.5 mr-1 size-3"
                                aria-hidden="true"
                            />
                            Enabled
                        </Badge>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDisableOpen(true)}
                        >
                            Disable
                        </Button>
                    </div>
                ) : (
                    <Button size="sm" onClick={() => setSetupOpen(true)}>
                        <ShieldCheck className="size-4" aria-hidden="true" />
                        Enable 2FA
                    </Button>
                )}
            </header>
            <div className="space-y-4 px-5 py-4 text-sm">
                {enabled ? (
                    <>
                        <p className="text-slate-600">
                            Authenticator app (TOTP) enrolled{' '}
                            {enrolledAt ? formatRelative(enrolledAt) : '—'}.
                        </p>
                        <RecoveryCodesPanel
                            codes={codes}
                            onRegenerate={handleRegenerate}
                        />
                    </>
                ) : (
                    <p className="text-slate-500">
                        2FA is currently <span className="font-medium">off</span>.
                        Enable it to protect your account from password leaks.
                    </p>
                )}
            </div>

            <Setup2FADialog
                open={setupOpen}
                onOpenChange={setSetupOpen}
                onEnabled={handleEnabled}
            />
            <Disable2FADialog
                open={disableOpen}
                onOpenChange={setDisableOpen}
                onConfirm={handleDisable}
            />
        </section>
    );
}

function RecoveryCodesPanel({
    codes,
    onRegenerate,
}: {
    codes: string[];
    onRegenerate: () => void;
}) {
    const { push } = useToast();
    function copyAll() {
        navigator.clipboard?.writeText(codes.join('\n')).then(() =>
            push({
                variant: 'success',
                title: 'Copied',
                description: 'Recovery codes copied to clipboard.',
            }),
        );
    }
    function downloadTxt() {
        const blob = new Blob([codes.join('\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'recovery-codes.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        push({
            variant: 'success',
            title: 'Downloaded',
            description: 'recovery-codes.txt saved.',
        });
    }
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-700">
                    Recovery codes
                </p>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={copyAll}>
                        <Copy className="size-4" aria-hidden="true" />
                        Copy
                    </Button>
                    <Button variant="ghost" size="sm" onClick={downloadTxt}>
                        <Download className="size-4" aria-hidden="true" />
                        Download
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onRegenerate}>
                        <RefreshCw className="size-4" aria-hidden="true" />
                        Regenerate
                    </Button>
                </div>
            </div>
            <ul className="grid grid-cols-2 gap-1 font-mono text-xs text-slate-700 sm:grid-cols-4">
                {codes.map((c) => (
                    <li
                        key={c}
                        className="rounded bg-white px-2 py-1 ring-1 ring-slate-200"
                    >
                        {c}
                    </li>
                ))}
            </ul>
            <p className="mt-2 text-xs text-slate-500">
                Each code can be used once if you lose access to your
                authenticator.
            </p>
        </div>
    );
}

function Setup2FADialog({
    open,
    onOpenChange,
    onEnabled,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onEnabled: (enrolledAt: string | null) => void;
}) {
    const { push } = useToast();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [setup, setSetup] = useState<ReturnType<typeof enable2FA> | null>(
        null,
    );
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | undefined>();

    function reset() {
        setStep(1);
        setSetup(null);
        setCode('');
        setError(undefined);
    }

    function handleOpenChange(v: boolean) {
        if (v && !setup) setSetup(enable2FA());
        if (!v) reset();
        onOpenChange(v);
    }

    function handleConfirm() {
        const res = confirm2FA(code);
        if (!res.ok) {
            setError(res.error);
            return;
        }
        setError(undefined);
        setStep(3);
        push({
            variant: 'success',
            title: 'Two-factor enabled',
            description: 'You will be asked for a code at next sign-in.',
        });
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Enable two-factor authentication</DialogTitle>
                    <DialogDescription>Step {step} of 3</DialogDescription>
                </DialogHeader>
                <DialogBody>
                    {step === 1 && setup && (
                        <div className="space-y-3">
                            <p className="text-sm text-slate-600">
                                Scan the QR code with your authenticator app
                                (Google Authenticator, Authy, 1Password, etc.).
                            </p>
                            <div className="flex flex-col items-center gap-3 sm:flex-row">
                                <QrPlaceholder value={setup.otpauth} />
                                <div className="flex-1">
                                    <p className="text-xs uppercase tracking-wide text-slate-400">
                                        Or enter this secret manually
                                    </p>
                                    <p className="break-all rounded bg-slate-100 p-2 font-mono text-sm">
                                        {setup.secret}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                        <div className="space-y-2">
                            <p className="text-sm text-slate-600">
                                Enter the 6-digit code from your authenticator
                                app to confirm setup.
                            </p>
                            <FormField
                                label="Verification code"
                                required
                                error={error}
                            >
                                <Input
                                    value={code}
                                    onChange={(e) => {
                                        setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                                        setError(undefined);
                                    }}
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    placeholder="123456"
                                />
                            </FormField>
                            <p className="text-xs text-slate-400">
                                Demo hint: use code <strong>123456</strong>.
                            </p>
                        </div>
                    )}
                    {step === 3 && setup && (
                        <div className="space-y-3">
                            <p className="text-sm text-emerald-700">
                                Two-factor authentication is now active.
                            </p>
                            <p className="text-xs text-slate-500">
                                Save these recovery codes somewhere safe. Each
                                can be used once if you lose your device.
                            </p>
                            <ul className="grid grid-cols-2 gap-1 font-mono text-xs text-slate-700 sm:grid-cols-4">
                                {setup.recoveryCodes.map((c) => (
                                    <li
                                        key={c}
                                        className="rounded bg-slate-50 px-2 py-1 ring-1 ring-slate-200"
                                    >
                                        {c}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </DialogBody>
                <DialogFooter>
                    {step === 1 && (
                        <>
                            <Button
                                variant="ghost"
                                onClick={() => handleOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={() => setStep(2)}>Next</Button>
                        </>
                    )}
                    {step === 2 && (
                        <>
                            <Button
                                variant="ghost"
                                onClick={() => setStep(1)}
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleConfirm}
                                disabled={code.length !== 6}
                            >
                                Verify & enable
                            </Button>
                        </>
                    )}
                    {step === 3 && (
                        <Button
                            onClick={() => {
                                onEnabled(twoFactor.enrolledAt);
                                handleOpenChange(false);
                            }}
                        >
                            Done
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function Disable2FADialog({
    open,
    onOpenChange,
    onConfirm,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onConfirm: (password: string) => { ok: boolean; error?: string };
}) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | undefined>();

    function reset() {
        setPassword('');
        setError(undefined);
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (!v) reset();
                onOpenChange(v);
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Disable two-factor authentication</DialogTitle>
                    <DialogDescription>
                        Confirm with your password to turn off 2FA.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody>
                    <FormField label="Password" required error={error}>
                        <PasswordInput
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError(undefined);
                            }}
                            autoComplete="current-password"
                        />
                    </FormField>
                    <p className="mt-2 text-xs text-slate-400">
                        Demo hint: use <strong>password123</strong>.
                    </p>
                </DialogBody>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => {
                            const res = onConfirm(password);
                            if (!res.ok) setError(res.error);
                        }}
                        disabled={password.length === 0}
                    >
                        Disable
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function QrPlaceholder({ value }: { value: string }) {
    // Deterministic 13x13 pattern derived from value hash. Decorative only.
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = (hash * 31 + value.charCodeAt(i)) | 0;
    }
    const size = 13;
    const cells: boolean[] = [];
    let h = hash;
    for (let i = 0; i < size * size; i++) {
        h = (h * 1103515245 + 12345) | 0;
        cells.push(((h >>> 16) & 1) === 1);
    }
    // Force finder-pattern corners
    function setBlock(r: number, c: number) {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                cells[(r + i) * size + (c + j)] = true;
            }
        }
    }
    setBlock(0, 0);
    setBlock(0, size - 3);
    setBlock(size - 3, 0);
    return (
        <svg
            viewBox={`0 0 ${size} ${size}`}
            className="size-32 rounded bg-white p-1 ring-1 ring-slate-200"
            aria-label="QR code (demo placeholder)"
        >
            {cells.map((on, i) =>
                on ? (
                    <rect
                        key={i}
                        x={i % size}
                        y={Math.floor(i / size)}
                        width={1}
                        height={1}
                        fill="#0f172a"
                    />
                ) : null,
            )}
        </svg>
    );
}
