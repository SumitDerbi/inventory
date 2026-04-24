import { useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import {
    FormField,
    Input,
    Select,
    Textarea,
} from '@/components/ui/FormField';
import {
    INQUIRY_PRIORITIES,
    INQUIRY_STATUSES,
    INQUIRY_TYPES,
    inquiryTypeLabel,
    priorityLabel,
    statusLabel,
} from '@/lib/inquiryStatus';
import type { InquiryStatus, InquiryPriority, InquiryType } from '@/lib/inquiryStatus';
import { inquirySources } from '@/mocks/inquirySources';
import { productCategories } from '@/mocks/productCategories';
import { users } from '@/mocks/users';
import { inquiries, type Inquiry } from '@/mocks/inquiries';
import { useToast } from '@/components/ui/Toast';
import {
    inquirySchema,
    type InquiryFormValues,
} from '@/schemas/inquiry';

export interface InquiryFormDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initial?: Inquiry | null;
}

const EMPTY: InquiryFormValues = {
    sourceId: '',
    sourceReference: '',
    inquiryType: 'new_project',
    priority: 'medium',
    status: 'new',
    customerName: '',
    companyName: '',
    mobile: '',
    email: '',
    city: '',
    state: '',
    projectName: '',
    projectDescription: '',
    productCategoryId: '',
    expectedOrderDate: '',
    siteLocation: '',
    budgetRange: '',
    assignedTo: '',
    notes: '',
};

function toFormValues(i: Inquiry | null | undefined): InquiryFormValues {
    if (!i) return EMPTY;
    return {
        sourceId: i.sourceId,
        sourceReference: i.sourceReference ?? '',
        inquiryType: i.inquiryType,
        priority: i.priority,
        status: i.status,
        customerName: i.customerName,
        companyName: i.companyName ?? '',
        mobile: i.mobile,
        email: i.email ?? '',
        city: i.city ?? '',
        state: i.state ?? '',
        projectName: i.projectName ?? '',
        projectDescription: i.projectDescription ?? '',
        productCategoryId: i.productCategoryId,
        expectedOrderDate: i.expectedOrderDate
            ? i.expectedOrderDate.slice(0, 10)
            : '',
        siteLocation: i.siteLocation ?? '',
        budgetRange: i.budgetRange ?? '',
        assignedTo: i.assignedTo ?? '',
        notes: i.notes ?? '',
    };
}

export function InquiryFormDrawer({
    open,
    onOpenChange,
    initial,
}: InquiryFormDrawerProps) {
    const isEdit = Boolean(initial);
    const { push } = useToast();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<InquiryFormValues>({
        resolver: zodResolver(inquirySchema),
        defaultValues: toFormValues(initial),
    });

    useEffect(() => {
        if (open) reset(toFormValues(initial));
    }, [open, initial, reset]);

    const mobileValue = watch('mobile');
    const emailValue = watch('email');
    const dedupeMatch = (() => {
        const m = (mobileValue ?? '').replace(/\s+/g, '');
        const e = (emailValue ?? '').trim().toLowerCase();
        if (!m && !e) return null;
        return inquiries.find(
            (i) =>
                i.id !== initial?.id &&
                ((m && i.mobile.replace(/\s+/g, '') === m) ||
                    (e && i.email.toLowerCase() === e)),
        );
    })();

    const onSubmit: SubmitHandler<InquiryFormValues> = async (values) => {
        await new Promise((r) => setTimeout(r, 600));
        push({
            variant: 'success',
            title: isEdit ? 'Inquiry updated' : 'Inquiry created',
            description: `${values.customerName} — ${values.projectName || 'no project'}`,
        });
        onOpenChange(false);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full sm:w-[32rem] md:w-[38rem]"
            >
                <SheetHeader>
                    <SheetTitle>
                        {isEdit ? `Edit ${initial?.inquiryNumber}` : 'New inquiry'}
                    </SheetTitle>
                    <SheetDescription>
                        Capture the inquiry. You can refine line items and follow-ups
                        later from the detail page.
                    </SheetDescription>
                </SheetHeader>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex flex-1 flex-col overflow-hidden"
                >
                    <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
                        <Section title="Source & type">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <FormField
                                    label="Source"
                                    required
                                    error={errors.sourceId?.message}
                                >
                                    <Select
                                        invalid={Boolean(errors.sourceId)}
                                        {...register('sourceId')}
                                    >
                                        <option value="">— Select —</option>
                                        {inquirySources.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </Select>
                                </FormField>

                                <FormField label="Source reference">
                                    <Input
                                        placeholder="Dealer name, web form ID…"
                                        {...register('sourceReference')}
                                    />
                                </FormField>

                                <FormField
                                    label="Inquiry type"
                                    required
                                    error={errors.inquiryType?.message}
                                >
                                    <Select
                                        invalid={Boolean(errors.inquiryType)}
                                        {...register('inquiryType')}
                                    >
                                        {INQUIRY_TYPES.map((t) => (
                                            <option key={t} value={t}>
                                                {inquiryTypeLabel(t as InquiryType)}
                                            </option>
                                        ))}
                                    </Select>
                                </FormField>

                                <FormField
                                    label="Priority"
                                    required
                                    error={errors.priority?.message}
                                >
                                    <Select
                                        invalid={Boolean(errors.priority)}
                                        {...register('priority')}
                                    >
                                        {INQUIRY_PRIORITIES.map((p) => (
                                            <option key={p} value={p}>
                                                {priorityLabel(p as InquiryPriority)}
                                            </option>
                                        ))}
                                    </Select>
                                </FormField>
                            </div>
                        </Section>

                        <Section title="Customer">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <FormField
                                    label="Customer name"
                                    required
                                    error={errors.customerName?.message}
                                >
                                    <Input
                                        invalid={Boolean(errors.customerName)}
                                        {...register('customerName')}
                                    />
                                </FormField>
                                <FormField label="Company name">
                                    <Input {...register('companyName')} />
                                </FormField>
                                <FormField
                                    label="Mobile"
                                    required
                                    error={errors.mobile?.message}
                                >
                                    <Input
                                        invalid={Boolean(errors.mobile)}
                                        placeholder="+91 9XXXX XXXXX"
                                        {...register('mobile')}
                                    />
                                </FormField>
                                <FormField label="Email" error={errors.email?.message}>
                                    <Input
                                        type="email"
                                        invalid={Boolean(errors.email)}
                                        {...register('email')}
                                    />
                                </FormField>
                                <FormField label="City">
                                    <Input {...register('city')} />
                                </FormField>
                                <FormField label="State">
                                    <Input {...register('state')} />
                                </FormField>
                            </div>
                            {dedupeMatch && (
                                <p
                                    className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
                                    role="alert"
                                >
                                    Possible duplicate: {dedupeMatch.inquiryNumber} —{' '}
                                    {dedupeMatch.customerName}
                                </p>
                            )}
                        </Section>

                        <Section title="Project">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <FormField label="Project name">
                                    <Input {...register('projectName')} />
                                </FormField>
                                <FormField
                                    label="Product category"
                                    required
                                    error={errors.productCategoryId?.message}
                                >
                                    <Select
                                        invalid={Boolean(errors.productCategoryId)}
                                        {...register('productCategoryId')}
                                    >
                                        <option value="">— Select —</option>
                                        {productCategories.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </Select>
                                </FormField>
                                <FormField
                                    label="Project description"
                                    className="sm:col-span-2"
                                >
                                    <Textarea rows={3} {...register('projectDescription')} />
                                </FormField>
                                <FormField label="Site location" className="sm:col-span-2">
                                    <Textarea rows={2} {...register('siteLocation')} />
                                </FormField>
                            </div>
                        </Section>

                        <Section title="Commercial">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <FormField label="Expected order date">
                                    <Input type="date" {...register('expectedOrderDate')} />
                                </FormField>
                                <FormField label="Budget range">
                                    <Input
                                        placeholder="e.g. ₹2–3 L"
                                        {...register('budgetRange')}
                                    />
                                </FormField>
                            </div>
                        </Section>

                        <Section title="Assignment">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <FormField label="Assigned to">
                                    <Select {...register('assignedTo')}>
                                        <option value="">— Unassigned —</option>
                                        {users
                                            .filter((u) =>
                                                ['sales_executive', 'sales_manager'].includes(
                                                    u.role,
                                                ),
                                            )
                                            .map((u) => (
                                                <option key={u.id} value={u.id}>
                                                    {u.name}
                                                </option>
                                            ))}
                                    </Select>
                                </FormField>
                                <FormField label="Status" error={errors.status?.message}>
                                    <Select
                                        invalid={Boolean(errors.status)}
                                        {...register('status')}
                                    >
                                        {INQUIRY_STATUSES.map((s) => (
                                            <option key={s} value={s}>
                                                {statusLabel(s as InquiryStatus)}
                                            </option>
                                        ))}
                                    </Select>
                                </FormField>
                                <FormField label="Notes" className="sm:col-span-2">
                                    <Textarea rows={3} {...register('notes')} />
                                </FormField>
                            </div>
                        </Section>
                    </div>

                    <SheetFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && (
                                <Loader2
                                    className="size-4 animate-spin"
                                    aria-hidden="true"
                                />
                            )}
                            {isEdit ? 'Save changes' : 'Create inquiry'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {title}
            </h3>
            {children}
        </section>
    );
}
