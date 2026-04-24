import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
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
import { useToast } from '@/components/ui/Toast';

export interface ConvertToQuotationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    inquiryNumber: string;
    inquiryId: string;
}

export function ConvertToQuotationDialog({
    open,
    onOpenChange,
    inquiryNumber,
    inquiryId,
}: ConvertToQuotationDialogProps) {
    const { push } = useToast();
    const navigate = useNavigate();

    function handleConfirm() {
        const quotationId = `Q-2026-${String(
            Math.floor(Math.random() * 900) + 100,
        )}`;
        push({
            variant: 'success',
            title: 'Quotation created',
            description: `${quotationId} draft created from ${inquiryNumber}.`,
        });
        onOpenChange(false);
        // Static-UI: just navigate to the quotations list with hash for now.
        navigate(`/quotations#${quotationId}-from-${inquiryId}`);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <span className="grid size-8 place-items-center rounded-full bg-violet-50 text-violet-600">
                            <ArrowRight className="size-4" aria-hidden="true" />
                        </span>
                        <DialogTitle>Convert to quotation</DialogTitle>
                    </div>
                    <DialogDescription>
                        We&rsquo;ll create a draft quotation pre-filled from{' '}
                        {inquiryNumber}. You can edit line items and pricing before
                        sending.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                        <li>Customer details copied from the inquiry.</li>
                        <li>Line items become quotation rows; you can adjust pricing.</li>
                        <li>Inquiry status will move to <strong>Quoted</strong>.</li>
                    </ul>
                </DialogBody>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleConfirm}>
                        Create quotation
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
