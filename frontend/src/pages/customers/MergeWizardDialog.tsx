import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, GitMerge } from 'lucide-react';
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
    DEFAULT_MERGE_CHOICES,
    mergeCustomers,
    previewMerge,
    type Customer,
    type MergeFieldChoices,
    type MergePreview,
} from '@/mocks/customers';

interface MergeWizardDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    customers: Customer[];
    onMerged: (targetId: string) => void;
}

type Step = 1 | 2 | 3;

export function MergeWizardDialog({
    open,
    onOpenChange,
    customers,
    onMerged,
}: MergeWizardDialogProps) {
    const [step, setStep] = useState<Step>(1);
    const [sourceId, setSourceId] = useState<string>('');
    const [targetId, setTargetId] = useState<string>('');
    const [choices, setChoices] = useState<MergeFieldChoices>(
        DEFAULT_MERGE_CHOICES,
    );
    const [confirmed, setConfirmed] = useState(false);

    useEffect(() => {
        if (open && customers.length === 2) {
            // Default: keep the older record (created first) as target.
            const sorted = [...customers].sort(
                (a, b) =>
                    new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime(),
            );
            setTargetId(sorted[0].id);
            setSourceId(sorted[1].id);
            setStep(1);
            setChoices(DEFAULT_MERGE_CHOICES);
            setConfirmed(false);
        }
    }, [open, customers]);

    const source = customers.find((c) => c.id === sourceId);
    const target = customers.find((c) => c.id === targetId);

    const preview: MergePreview | null = useMemo(() => {
        if (!source || !target) return null;
        return previewMerge(source.id, target.id);
    }, [source, target]);

    function swap() {
        const s = sourceId;
        setSourceId(targetId);
        setTargetId(s);
    }

    function setChoice(field: keyof MergeFieldChoices, value: string) {
        setChoices((c) => ({ ...c, [field]: value as never }));
    }

    function handleConfirm() {
        if (!source || !target) return;
        const merged = mergeCustomers(source.id, target.id, choices);
        if (merged) onMerged(merged.id);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Merge customers</DialogTitle>
                    <DialogDescription>Step {step} of 3</DialogDescription>
                </DialogHeader>
                <DialogBody>
                    {step === 1 && source && target && (
                        <div className="space-y-3">
                            <p className="text-sm text-slate-600">
                                The <strong>source</strong> record will be marked
                                as merged. The <strong>target</strong> record
                                survives and absorbs related data.
                            </p>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr]">
                                <RecordCard label="Source" customer={source} />
                                <div className="flex items-center justify-center">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={swap}
                                        title="Swap source and target"
                                    >
                                        <ArrowLeftRight
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                        Swap
                                    </Button>
                                </div>
                                <RecordCard label="Target" customer={target} />
                            </div>
                        </div>
                    )}

                    {step === 2 && source && target && preview && (
                        <div className="space-y-3">
                            <p className="text-sm text-slate-600">
                                Resolve conflicting fields. Defaults keep target
                                values.
                            </p>
                            {preview.conflicts.length === 0 ? (
                                <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                                    No conflicts detected. You can proceed.
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {preview.conflicts.map((c) => (
                                        <li
                                            key={c.field}
                                            className="rounded-lg border border-slate-200 p-3"
                                        >
                                            <p className="text-xs font-semibold uppercase text-slate-400">
                                                {c.label}
                                            </p>
                                            <div className="mt-1 grid gap-2 sm:grid-cols-2">
                                                <ChoiceOption
                                                    name={c.field}
                                                    value="source"
                                                    label="Source"
                                                    text={c.sourceValue}
                                                    checked={
                                                        choices[c.field] ===
                                                        'source'
                                                    }
                                                    onChange={() =>
                                                        setChoice(
                                                            c.field,
                                                            'source',
                                                        )
                                                    }
                                                />
                                                <ChoiceOption
                                                    name={c.field}
                                                    value="target"
                                                    label="Target"
                                                    text={c.targetValue}
                                                    checked={
                                                        choices[c.field] ===
                                                        'target'
                                                    }
                                                    onChange={() =>
                                                        setChoice(
                                                            c.field,
                                                            'target',
                                                        )
                                                    }
                                                />
                                                {c.multi && (
                                                    <ChoiceOption
                                                        name={c.field}
                                                        value="both"
                                                        label="Keep both"
                                                        text="Combine without duplicates"
                                                        checked={
                                                            choices[c.field] ===
                                                            'both'
                                                        }
                                                        onChange={() =>
                                                            setChoice(
                                                                c.field,
                                                                'both',
                                                            )
                                                        }
                                                    />
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {step === 3 && source && target && preview && (
                        <div className="space-y-3">
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                <p className="font-medium">This cannot be undone.</p>
                                <p>
                                    <strong>{source.name}</strong> will be
                                    archived and redirected to{' '}
                                    <strong>{target.name}</strong>.
                                </p>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-3 text-sm">
                                <p className="font-medium text-slate-700">
                                    Records that will move
                                </p>
                                <ul className="mt-1 grid grid-cols-2 gap-1 text-slate-600 sm:grid-cols-3">
                                    <li>{preview.impact.inquiries} inquiries</li>
                                    <li>
                                        {preview.impact.quotations} quotations
                                    </li>
                                    <li>{preview.impact.orders} orders</li>
                                    <li>{preview.impact.jobs} jobs</li>
                                    <li>
                                        {preview.impact.documents} documents
                                    </li>
                                </ul>
                            </div>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    className="size-4 rounded border-slate-300"
                                    checked={confirmed}
                                    onChange={(e) =>
                                        setConfirmed(e.target.checked)
                                    }
                                />
                                I understand this action is permanent.
                            </label>
                        </div>
                    )}
                </DialogBody>
                <DialogFooter>
                    {step === 1 ? (
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                    ) : (
                        <Button
                            variant="ghost"
                            onClick={() =>
                                setStep((s) => (s === 3 ? 2 : 1) as Step)
                            }
                        >
                            Back
                        </Button>
                    )}
                    {step < 3 ? (
                        <Button
                            onClick={() =>
                                setStep((s) => (s === 1 ? 2 : 3) as Step)
                            }
                            disabled={!source || !target}
                        >
                            Next
                        </Button>
                    ) : (
                        <Button
                            variant="danger"
                            onClick={handleConfirm}
                            disabled={!confirmed}
                        >
                            <GitMerge className="size-4" aria-hidden="true" />
                            Merge customers
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function RecordCard({ label, customer }: { label: string; customer: Customer }) {
    return (
        <div className="rounded-lg border border-slate-200 p-3 text-sm">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-400">
                    {label}
                </span>
                <Badge tone={label === 'Target' ? 'green' : 'amber'}>
                    {label === 'Target' ? 'Survives' : 'Archived'}
                </Badge>
            </div>
            <p className="mt-1 font-medium text-slate-800">{customer.name}</p>
            {customer.legalName && (
                <p className="text-xs text-slate-500">{customer.legalName}</p>
            )}
            <dl className="mt-2 space-y-0.5 text-xs text-slate-600">
                <div>GST: {customer.gstNumber ?? '—'}</div>
                <div>Phone: {customer.primaryContact.phone}</div>
                <div>Email: {customer.primaryContact.email}</div>
                <div>Orders: {customer.totalOrders}</div>
            </dl>
        </div>
    );
}

function ChoiceOption({
    name,
    value,
    label,
    text,
    checked,
    onChange,
}: {
    name: string;
    value: string;
    label: string;
    text: string;
    checked: boolean;
    onChange: () => void;
}) {
    return (
        <label
            className={`flex cursor-pointer items-start gap-2 rounded-md border p-2 text-sm ${checked
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
        >
            <input
                type="radio"
                name={name}
                value={value}
                checked={checked}
                onChange={onChange}
                className="mt-0.5 size-4"
            />
            <span>
                <span className="block text-xs font-medium text-slate-500">
                    {label}
                </span>
                <span className="text-slate-800">{text}</span>
            </span>
        </label>
    );
}
