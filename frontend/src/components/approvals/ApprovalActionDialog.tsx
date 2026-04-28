import { useState } from 'react';
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { FormField, Select, Textarea } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import {
    APPROVAL_KIND_LABEL,
    REJECT_REASONS,
    approveMock,
    rejectMock,
    type ApprovalRequest,
} from '@/mocks/approvals';

export type ApprovalDialogMode = 'approve' | 'reject';

export interface ApprovalActionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: ApprovalDialogMode;
    /** Single row (most common). */
    request?: ApprovalRequest;
    /** Bulk action — pass requests; dialog will call mock once per id. */
    bulkRequests?: ApprovalRequest[];
    onCompleted?: () => void;
}

export function ApprovalActionDialog(props: ApprovalActionDialogProps) {
    if (!props.open) return null;
    return <ApprovalActionDialogInner {...props} />;
}

function ApprovalActionDialogInner({
    open,
    onOpenChange,
    mode,
    request,
    bulkRequests,
    onCompleted,
}: ApprovalActionDialogProps) {
    const toast = useToast();
    const items = bulkRequests ?? (request ? [request] : []);
    const isBulk = !!bulkRequests && bulkRequests.length > 1;

    const [comment, setComment] = useState('');
    const [reasonCode, setReasonCode] = useState(REJECT_REASONS[0]);
    const [reasonNote, setReasonNote] = useState('');

    if (items.length === 0) return null;

    function submit() {
        if (mode === 'reject' && !reasonNote.trim() && reasonCode === 'Other') {
            toast.push({
                title: 'Provide a rejection note when reason is "Other".',
                variant: 'error',
            });
            return;
        }
        let n = 0;
        for (const r of items) {
            if (mode === 'approve') {
                const ok = approveMock(r.id, comment.trim() || undefined);
                if (ok) n += 1;
            } else {
                const reasonText = `${reasonCode}${reasonNote.trim() ? ' — ' + reasonNote.trim() : ''}`;
                const ok = rejectMock(r.id, reasonText);
                if (ok) n += 1;
            }
        }
        toast.push({
            title:
                mode === 'approve'
                    ? `Approved ${n} request${n === 1 ? '' : 's'}`
                    : `Rejected ${n} request${n === 1 ? '' : 's'}`,
            variant: 'success',
        });
        onCompleted?.();
        onOpenChange(false);
    }

    const title = isBulk
        ? `${mode === 'approve' ? 'Bulk approve' : 'Bulk reject'} (${items.length})`
        : mode === 'approve'
            ? `Approve ${items[0]!.entityLabel}`
            : `Reject ${items[0]!.entityLabel}`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <DialogBody className="space-y-4">
                    {isBulk ? (
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                            <p className="mb-2 text-xs font-medium text-slate-700">
                                {mode === 'approve' ? 'Approving' : 'Rejecting'} the following:
                            </p>
                            <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-slate-600">
                                {items.map((r) => (
                                    <li key={r.id}>
                                        <span className="font-mono">{r.entityLabel}</span> · {APPROVAL_KIND_LABEL[r.kind]} · {r.summary}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-700">
                            {APPROVAL_KIND_LABEL[items[0]!.kind]} · {items[0]!.summary}
                        </p>
                    )}

                    {mode === 'approve' ? (
                        <FormField label="Comment (optional)">
                            <Textarea
                                rows={3}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Any note for the audit log…"
                            />
                        </FormField>
                    ) : (
                        <>
                            <FormField label="Rejection reason" required>
                                <Select value={reasonCode} onChange={(e) => setReasonCode(e.target.value)}>
                                    {REJECT_REASONS.map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </Select>
                            </FormField>
                            <FormField
                                label="Additional note"
                                required={reasonCode === 'Other'}
                            >
                                <Textarea
                                    rows={3}
                                    value={reasonNote}
                                    onChange={(e) => setReasonNote(e.target.value)}
                                    placeholder="Explain the rejection so the requester can take action."
                                />
                            </FormField>
                        </>
                    )}
                </DialogBody>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        variant={mode === 'approve' ? 'primary' : 'danger'}
                        onClick={submit}
                    >
                        {mode === 'approve' ? 'Approve' : 'Reject'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
