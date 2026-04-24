import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, TriangleAlert } from 'lucide-react';
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
import { FormField, Textarea } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { lostReasonSchema, type LostReasonFormValues } from '@/schemas/inquiry';

export interface MarkLostDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    inquiryNumber: string;
    onConfirmed?: () => void;
}

export function MarkLostDialog({
    open,
    onOpenChange,
    inquiryNumber,
    onConfirmed,
}: MarkLostDialogProps) {
    const { push } = useToast();
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<LostReasonFormValues>({
        resolver: zodResolver(lostReasonSchema),
        defaultValues: { lostReason: '' },
    });

    const onSubmit: SubmitHandler<LostReasonFormValues> = async () => {
        await new Promise((r) => setTimeout(r, 400));
        push({
            variant: 'success',
            title: 'Inquiry marked as lost',
            description: inquiryNumber,
        });
        reset({ lostReason: '' });
        onOpenChange(false);
        onConfirmed?.();
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                onOpenChange(o);
                if (!o) reset({ lostReason: '' });
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <span className="grid size-8 place-items-center rounded-full bg-red-50 text-red-600">
                            <TriangleAlert className="size-4" aria-hidden="true" />
                        </span>
                        <DialogTitle>Mark inquiry as lost</DialogTitle>
                    </div>
                    <DialogDescription>
                        Lost reason will be recorded against {inquiryNumber} for
                        analytics. This action can be reverted from the activity log.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <DialogBody>
                        <FormField
                            label="Lost reason"
                            required
                            error={errors.lostReason?.message}
                        >
                            <Textarea
                                rows={4}
                                placeholder="e.g. competitor price, timeline mismatch…"
                                invalid={Boolean(errors.lostReason)}
                                {...register('lostReason')}
                            />
                        </FormField>
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" variant="danger" disabled={isSubmitting}>
                            {isSubmitting && (
                                <Loader2
                                    className="size-4 animate-spin"
                                    aria-hidden="true"
                                />
                            )}
                            Mark lost
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
