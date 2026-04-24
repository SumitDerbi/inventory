import { useMemo, useState } from 'react';
import {
    Link,
    Navigate,
    useNavigate,
    useParams,
} from 'react-router-dom';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    ArrowLeft,
    ArrowRight,
    CalendarClock,
    CheckCircle2,
    ChevronRight,
    FileText,
    Mail,
    MessageSquare,
    MoreHorizontal,
    Paperclip,
    Pencil,
    Phone,
    Plus,
    Upload,
    UserPlus,
    Users,
    Video,
    XCircle,
    type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import {
    FormField,
    Input,
    Select,
    Textarea,
} from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { formatINR, formatRelative } from '@/lib/format';
import {
    canConvertToQuotation,
    canMarkLost,
    inquiryTypeLabel,
    priorityLabel,
    statusLabel,
} from '@/lib/inquiryStatus';
import {
    type FollowUpType,
    type InquiryActivity,
    type InquiryAttachment,
    type InquiryFollowUp,
    type InquiryLineItem,
    inquiryById,
} from '@/mocks/inquiries';
import { sourceById } from '@/mocks/inquirySources';
import { categoryById } from '@/mocks/productCategories';
import { userById, users } from '@/mocks/users';
import { followUpSchema, type FollowUpFormValues } from '@/schemas/inquiry';
import { InquiryFormDrawer } from './InquiryFormDrawer';
import { MarkLostDialog } from './MarkLostDialog';
import { ConvertToQuotationDialog } from './ConvertToQuotationDialog';

type TabKey = 'overview' | 'requirements' | 'follow-ups' | 'activity' | 'attachments';

const TABS: Array<{ key: TabKey; label: string; count?: (n: number) => string }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'requirements', label: 'Requirements' },
    { key: 'follow-ups', label: 'Follow-ups' },
    { key: 'activity', label: 'Activity' },
    { key: 'attachments', label: 'Attachments' },
];

const DATE_FMT = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
});

function fmtDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    return DATE_FMT.format(new Date(iso));
}

function fmtDateTime(iso: string | null | undefined): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

const FOLLOW_UP_ICON: Record<FollowUpType, LucideIcon> = {
    call: Phone,
    email: Mail,
    visit: Users,
    whatsapp: MessageSquare,
    meeting: Video,
};

const FOLLOW_UP_LABEL: Record<FollowUpType, string> = {
    call: 'Call',
    email: 'Email',
    visit: 'Site visit',
    whatsapp: 'WhatsApp',
    meeting: 'Meeting',
};

export default function InquiryDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const inquiry = inquiryById(id ?? '');

    const [tab, setTab] = useState<TabKey>('overview');
    const [editOpen, setEditOpen] = useState(false);
    const [convertOpen, setConvertOpen] = useState(false);
    const [lostOpen, setLostOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const [followUpOpen, setFollowUpOpen] = useState(false);
    const [addRowOpen, setAddRowOpen] = useState(false);

    if (!inquiry) {
        return <Navigate to="/inquiries" replace />;
    }

    const totalEstimated = inquiry.lineItems.reduce(
        (sum, li) => sum + li.estimatedValue,
        0,
    );

    return (
        <div className="p-6 md:p-8">
            <button
                type="button"
                onClick={() => navigate('/inquiries')}
                className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
            >
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                Back to inquiries
            </button>

            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-xl font-semibold text-slate-800 md:text-2xl">
                            {inquiry.inquiryNumber}
                        </h1>
                        <StatusBadge status={statusLabel(inquiry.status)} />
                        <PriorityBadge priority={priorityLabel(inquiry.priority)} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                        {inquiry.customerName}
                        {inquiry.companyName ? ` · ${inquiry.companyName}` : ''} ·
                        Created {formatRelative(inquiry.createdAt)}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setEditOpen(true)}>
                        <Pencil className="size-4" aria-hidden="true" />
                        Edit
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                Actions
                                <MoreHorizontal className="size-4" aria-hidden="true" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                                <Pencil className="size-4" aria-hidden="true" />
                                Edit inquiry
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setAssignOpen(true)}>
                                <UserPlus className="size-4" aria-hidden="true" />
                                Reassign
                            </DropdownMenuItem>
                            {canConvertToQuotation(inquiry.status) && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onSelect={() => setConvertOpen(true)}
                                    >
                                        <ArrowRight className="size-4" aria-hidden="true" />
                                        Convert to quotation
                                    </DropdownMenuItem>
                                </>
                            )}
                            {canMarkLost(inquiry.status) && (
                                <DropdownMenuItem
                                    destructive
                                    onSelect={() => setLostOpen(true)}
                                >
                                    <XCircle className="size-4" aria-hidden="true" />
                                    Mark as lost
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Tabs */}
            <div
                role="tablist"
                aria-label="Inquiry sections"
                className="mb-4 flex flex-wrap gap-1 border-b border-slate-200"
            >
                {TABS.map((t) => {
                    const count =
                        t.key === 'requirements'
                            ? inquiry.lineItems.length
                            : t.key === 'follow-ups'
                                ? inquiry.followUps.length
                                : t.key === 'activity'
                                    ? inquiry.activity.length
                                    : t.key === 'attachments'
                                        ? inquiry.attachments.length
                                        : null;
                    return (
                        <button
                            key={t.key}
                            type="button"
                            role="tab"
                            aria-selected={tab === t.key}
                            tabIndex={tab === t.key ? 0 : -1}
                            onClick={() => setTab(t.key)}
                            className={cn(
                                'relative flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors',
                                tab === t.key
                                    ? 'text-primary'
                                    : 'text-slate-500 hover:text-slate-700',
                            )}
                        >
                            {t.label}
                            {count !== null && count > 0 && (
                                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                                    {count}
                                </span>
                            )}
                            {tab === t.key && (
                                <span
                                    aria-hidden="true"
                                    className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary"
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab panels */}
            {tab === 'overview' && (
                <OverviewTab
                    inquiry={inquiry}
                    totalEstimated={totalEstimated}
                />
            )}

            {tab === 'requirements' && (
                <RequirementsTab
                    items={inquiry.lineItems}
                    totalEstimated={totalEstimated}
                    onAdd={() => setAddRowOpen(true)}
                />
            )}

            {tab === 'follow-ups' && (
                <FollowUpsTab
                    items={inquiry.followUps}
                    onAdd={() => setFollowUpOpen(true)}
                />
            )}

            {tab === 'activity' && <ActivityTab items={inquiry.activity} />}

            {tab === 'attachments' && (
                <AttachmentsTab items={inquiry.attachments} />
            )}

            {/* Drawers + dialogs */}
            <InquiryFormDrawer
                open={editOpen}
                onOpenChange={setEditOpen}
                initial={inquiry}
            />
            <ConvertToQuotationDialog
                open={convertOpen}
                onOpenChange={setConvertOpen}
                inquiryNumber={inquiry.inquiryNumber}
                inquiryId={inquiry.id}
            />
            <MarkLostDialog
                open={lostOpen}
                onOpenChange={setLostOpen}
                inquiryNumber={inquiry.inquiryNumber}
            />
            <AssignDialog
                open={assignOpen}
                onOpenChange={setAssignOpen}
                inquiry={inquiry}
            />
            <FollowUpDialog
                open={followUpOpen}
                onOpenChange={setFollowUpOpen}
                inquiryNumber={inquiry.inquiryNumber}
            />
            <AddLineItemDialog
                open={addRowOpen}
                onOpenChange={setAddRowOpen}
            />
        </div>
    );
}

/* ----------------------------- Overview ----------------------------- */

function OverviewTab({
    inquiry,
    totalEstimated,
}: {
    inquiry: NonNullable<ReturnType<typeof inquiryById>>;
    totalEstimated: number;
}) {
    const sourceName = sourceById(inquiry.sourceId)?.name ?? '—';
    const categoryName = categoryById(inquiry.productCategoryId)?.name ?? '—';
    const assigned = userById(inquiry.assignedTo);

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="Customer">
                <DefList>
                    <DefItem label="Name" value={inquiry.customerName} />
                    <DefItem label="Company" value={inquiry.companyName || '—'} />
                    <DefItem label="Mobile" value={inquiry.mobile} />
                    <DefItem label="Email" value={inquiry.email || '—'} />
                    <DefItem label="City" value={inquiry.city || '—'} />
                    <DefItem label="State" value={inquiry.state || '—'} />
                </DefList>
            </Card>

            <Card title="Project">
                <DefList>
                    <DefItem label="Project name" value={inquiry.projectName || '—'} />
                    <DefItem label="Product category" value={categoryName} />
                    <DefItem
                        label="Description"
                        value={inquiry.projectDescription || '—'}
                    />
                    <DefItem
                        label="Site location"
                        value={inquiry.siteLocation || '—'}
                    />
                </DefList>
            </Card>

            <Card title="Commercial">
                <DefList>
                    <DefItem
                        label="Total estimated value"
                        value={formatINR(totalEstimated)}
                    />
                    <DefItem
                        label="Budget range"
                        value={inquiry.budgetRange || '—'}
                    />
                    <DefItem
                        label="Expected order date"
                        value={fmtDate(inquiry.expectedOrderDate)}
                    />
                </DefList>
            </Card>

            <Card title="Source & assignment">
                <DefList>
                    <DefItem label="Source" value={sourceName} />
                    <DefItem
                        label="Source reference"
                        value={inquiry.sourceReference || '—'}
                    />
                    <DefItem
                        label="Inquiry type"
                        value={inquiryTypeLabel(inquiry.inquiryType)}
                    />
                    <DefItem
                        label="Assigned to"
                        value={assigned?.name ?? 'Unassigned'}
                    />
                </DefList>
            </Card>

            {inquiry.status === 'lost' && inquiry.lostReason && (
                <Card title="Lost reason" className="lg:col-span-2 border-red-200">
                    <p className="text-sm text-red-700">{inquiry.lostReason}</p>
                </Card>
            )}

            {inquiry.notes && (
                <Card title="Internal notes" className="lg:col-span-2">
                    <p className="whitespace-pre-line text-sm text-slate-600">
                        {inquiry.notes}
                    </p>
                </Card>
            )}
        </div>
    );
}

/* --------------------------- Requirements --------------------------- */

function RequirementsTab({
    items,
    totalEstimated,
    onAdd,
}: {
    items: InquiryLineItem[];
    totalEstimated: number;
    onAdd: () => void;
}) {
    return (
        <Card
            title={`Requested products (${items.length})`}
            actions={
                <Button size="sm" onClick={onAdd}>
                    <Plus className="size-4" aria-hidden="true" />
                    Add row
                </Button>
            }
        >
            {items.length === 0 ? (
                <EmptyState
                    title="No line items yet"
                    description="Add products and quantities the customer is asking for."
                />
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-3 py-2 text-left font-semibold">Product</th>
                                <th className="px-3 py-2 text-left font-semibold">Category</th>
                                <th className="px-3 py-2 text-left font-semibold">Spec notes</th>
                                <th className="px-3 py-2 text-right font-semibold">Qty</th>
                                <th className="px-3 py-2 text-left font-semibold">Unit</th>
                                <th className="px-3 py-2 text-right font-semibold">Est. value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((it) => (
                                <tr
                                    key={it.id}
                                    className="border-t border-slate-100 align-top"
                                >
                                    <td className="px-3 py-2 font-medium text-slate-800">
                                        {it.productDescription}
                                    </td>
                                    <td className="px-3 py-2 text-slate-600">
                                        {it.category || '—'}
                                    </td>
                                    <td className="px-3 py-2 text-slate-500">
                                        {it.specificationNotes || '—'}
                                    </td>
                                    <td className="px-3 py-2 text-right">{it.quantity}</td>
                                    <td className="px-3 py-2 text-slate-600">{it.unit}</td>
                                    <td className="px-3 py-2 text-right font-medium text-slate-800">
                                        {it.estimatedValue
                                            ? formatINR(it.estimatedValue)
                                            : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-slate-200 bg-slate-50/60">
                                <td
                                    colSpan={5}
                                    className="px-3 py-2 text-right text-xs uppercase tracking-wide text-slate-500"
                                >
                                    Total estimated
                                </td>
                                <td className="px-3 py-2 text-right font-semibold text-slate-800">
                                    {formatINR(totalEstimated)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </Card>
    );
}

/* ---------------------------- Follow-ups ---------------------------- */

function FollowUpsTab({
    items,
    onAdd,
}: {
    items: InquiryFollowUp[];
    onAdd: () => void;
}) {
    const sorted = useMemo(
        () =>
            [...items].sort(
                (a, b) =>
                    new Date(b.scheduledAt).getTime() -
                    new Date(a.scheduledAt).getTime(),
            ),
        [items],
    );

    return (
        <Card
            title={`Follow-ups (${items.length})`}
            actions={
                <Button size="sm" onClick={onAdd}>
                    <Plus className="size-4" aria-hidden="true" />
                    Schedule follow-up
                </Button>
            }
        >
            {items.length === 0 ? (
                <EmptyState
                    title="No follow-ups scheduled"
                    description="Schedule a call, email, visit or meeting to keep this inquiry moving."
                />
            ) : (
                <ul className="divide-y divide-slate-100">
                    {sorted.map((f) => {
                        const Icon = FOLLOW_UP_ICON[f.followUpType];
                        const owner = userById(f.assignedTo);
                        return (
                            <li
                                key={f.id}
                                className="flex items-start gap-3 py-3"
                            >
                                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
                                    <Icon className="size-4" aria-hidden="true" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-medium text-slate-800">
                                            {FOLLOW_UP_LABEL[f.followUpType]}
                                        </p>
                                        <Badge tone={followUpToneFor(f.status)}>
                                            {f.status}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        Scheduled {fmtDateTime(f.scheduledAt)} ·{' '}
                                        {owner?.name ?? 'Unassigned'}
                                    </p>
                                    {f.outcome && (
                                        <p className="mt-1 text-sm text-slate-600">
                                            {f.outcome}
                                        </p>
                                    )}
                                </div>
                                {f.status === 'pending' && (
                                    <CheckCircle2
                                        className="size-4 text-slate-300"
                                        aria-hidden="true"
                                    />
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </Card>
    );
}

function followUpToneFor(s: InquiryFollowUp['status']) {
    if (s === 'completed') return 'green' as const;
    if (s === 'pending') return 'amber' as const;
    if (s === 'missed') return 'red' as const;
    return 'neutral' as const;
}

/* ----------------------------- Activity ----------------------------- */

const ACTIVITY_LABEL: Record<InquiryActivity['actionType'], string> = {
    created: 'Inquiry created',
    status_changed: 'Status changed',
    assigned: 'Assigned',
    note_added: 'Note added',
    follow_up_added: 'Follow-up scheduled',
    attachment_added: 'Attachment added',
    email_sent: 'Email sent',
    converted: 'Converted',
};

const ACTIVITY_ICON: Record<InquiryActivity['actionType'], LucideIcon> = {
    created: Plus,
    status_changed: ChevronRight,
    assigned: UserPlus,
    note_added: MessageSquare,
    follow_up_added: CalendarClock,
    attachment_added: Paperclip,
    email_sent: Mail,
    converted: ArrowRight,
};

function ActivityTab({ items }: { items: InquiryActivity[] }) {
    const sorted = useMemo(
        () =>
            [...items].sort(
                (a, b) =>
                    new Date(b.performedAt).getTime() -
                    new Date(a.performedAt).getTime(),
            ),
        [items],
    );

    if (sorted.length === 0) {
        return (
            <EmptyState
                title="No activity yet"
                description="System and user actions will appear here."
            />
        );
    }

    return (
        <Card title={`Activity timeline (${sorted.length})`}>
            <ol className="relative ml-3 space-y-5 border-l border-slate-200 pl-5">
                {sorted.map((a) => {
                    const Icon = ACTIVITY_ICON[a.actionType];
                    const actor = userById(a.performedBy);
                    return (
                        <li key={a.id} className="relative">
                            <span className="absolute -left-[30px] grid size-6 place-items-center rounded-full border border-slate-200 bg-white text-slate-500">
                                <Icon className="size-3" aria-hidden="true" />
                            </span>
                            <p className="text-sm font-medium text-slate-800">
                                {ACTIVITY_LABEL[a.actionType]}
                                {a.oldValue && a.newValue && (
                                    <span className="font-normal text-slate-500">
                                        {' '}
                                        — {a.oldValue} → {a.newValue}
                                    </span>
                                )}
                                {!a.oldValue && a.newValue && (
                                    <span className="font-normal text-slate-500">
                                        {' '}
                                        — {a.newValue}
                                    </span>
                                )}
                            </p>
                            {a.remarks && (
                                <p className="mt-0.5 text-sm text-slate-600">{a.remarks}</p>
                            )}
                            <p className="mt-0.5 text-xs text-slate-400">
                                {actor?.name ?? 'System'} · {fmtDateTime(a.performedAt)}
                            </p>
                        </li>
                    );
                })}
            </ol>
        </Card>
    );
}

/* ---------------------------- Attachments --------------------------- */

function AttachmentsTab({ items }: { items: InquiryAttachment[] }) {
    const { push } = useToast();
    return (
        <div className="space-y-4">
            <div
                onClick={() =>
                    push({ variant: 'info', title: 'Drop zone', description: 'File picker would open here.' })
                }
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        push({
                            variant: 'info',
                            title: 'Drop zone',
                            description: 'File picker would open here.',
                        });
                    }
                }}
                role="button"
                tabIndex={0}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500 hover:border-primary hover:text-primary"
            >
                <Upload className="size-6" aria-hidden="true" />
                <p className="font-medium">Drop files here or click to browse</p>
                <p className="text-xs text-slate-400">PDF, images, DWG up to 10 MB.</p>
            </div>

            <Card title={`Files (${items.length})`}>
                {items.length === 0 ? (
                    <EmptyState
                        title="No attachments"
                        description="Upload RFQs, drawings or photos related to this inquiry."
                    />
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {items.map((a) => (
                            <li
                                key={a.id}
                                className="flex items-center gap-3 py-3"
                            >
                                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
                                    <FileText className="size-4" aria-hidden="true" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-slate-800">
                                        {a.name}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        v{a.version} · {Math.round(a.sizeKb)} KB ·{' '}
                                        {userById(a.uploadedBy)?.name ?? 'Unknown'} ·{' '}
                                        {formatRelative(a.uploadedAt)}
                                    </p>
                                </div>
                                <Link
                                    to="#"
                                    onClick={(e) => e.preventDefault()}
                                    className="text-xs font-medium text-primary hover:underline"
                                >
                                    Download
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    );
}

/* ---------------------------- Sub dialogs --------------------------- */

function AssignDialog({
    open,
    onOpenChange,
    inquiry,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    inquiry: NonNullable<ReturnType<typeof inquiryById>>;
}) {
    const { push } = useToast();
    const [value, setValue] = useState(inquiry.assignedTo ?? '');
    const salesUsers = users.filter((u) =>
        ['sales_executive', 'sales_manager'].includes(u.role),
    );
    function handleSave() {
        push({
            variant: 'success',
            title: 'Inquiry reassigned',
            description: `${inquiry.inquiryNumber} → ${userById(value)?.name ?? 'Unassigned'}`,
        });
        onOpenChange(false);
    }
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reassign inquiry</DialogTitle>
                </DialogHeader>
                <DialogBody>
                    <FormField label="Assigned to">
                        <Select
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                        >
                            <option value="">— Unassigned —</option>
                            {salesUsers.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name}
                                </option>
                            ))}
                        </Select>
                    </FormField>
                </DialogBody>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleSave}>
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function FollowUpDialog({
    open,
    onOpenChange,
    inquiryNumber,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    inquiryNumber: string;
}) {
    const { push } = useToast();
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FollowUpFormValues>({
        resolver: zodResolver(followUpSchema),
        defaultValues: {
            followUpType: 'call',
            scheduledAt: '',
            assignedTo: '',
            outcome: '',
        },
    });

    const onSubmit: SubmitHandler<FollowUpFormValues> = async (values) => {
        await new Promise((r) => setTimeout(r, 300));
        push({
            variant: 'success',
            title: 'Follow-up scheduled',
            description: `${FOLLOW_UP_LABEL[values.followUpType]} for ${inquiryNumber}`,
        });
        reset();
        onOpenChange(false);
    };

    const salesUsers = users.filter((u) =>
        ['sales_executive', 'sales_manager'].includes(u.role),
    );

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                onOpenChange(o);
                if (!o) reset();
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Schedule a follow-up</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <DialogBody className="space-y-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <FormField label="Type" required>
                                <Select {...register('followUpType')}>
                                    {(['call', 'email', 'visit', 'whatsapp', 'meeting'] as FollowUpType[]).map(
                                        (t) => (
                                            <option key={t} value={t}>
                                                {FOLLOW_UP_LABEL[t]}
                                            </option>
                                        ),
                                    )}
                                </Select>
                            </FormField>
                            <FormField
                                label="Date & time"
                                required
                                error={errors.scheduledAt?.message}
                            >
                                <Input
                                    type="datetime-local"
                                    invalid={Boolean(errors.scheduledAt)}
                                    {...register('scheduledAt')}
                                />
                            </FormField>
                            <FormField
                                label="Assigned to"
                                required
                                error={errors.assignedTo?.message}
                                className="sm:col-span-2"
                            >
                                <Select
                                    invalid={Boolean(errors.assignedTo)}
                                    {...register('assignedTo')}
                                >
                                    <option value="">— Select —</option>
                                    {salesUsers.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name}
                                        </option>
                                    ))}
                                </Select>
                            </FormField>
                            <FormField label="Notes" className="sm:col-span-2">
                                <Textarea rows={3} {...register('outcome')} />
                            </FormField>
                        </div>
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
                        <Button type="submit" disabled={isSubmitting}>
                            Schedule
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function AddLineItemDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { push } = useToast();
    const [desc, setDesc] = useState('');
    const [qty, setQty] = useState('1');
    const [unit, setUnit] = useState('pcs');

    function handleAdd() {
        if (!desc.trim()) return;
        push({
            variant: 'success',
            title: 'Line item added',
            description: `${desc} (${qty} ${unit})`,
        });
        setDesc('');
        setQty('1');
        setUnit('pcs');
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add line item</DialogTitle>
                </DialogHeader>
                <DialogBody className="space-y-3">
                    <FormField label="Product description" required>
                        <Input
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            placeholder="e.g. Centrifugal pump 5 HP"
                        />
                    </FormField>
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Quantity" required>
                            <Input
                                type="number"
                                min={1}
                                value={qty}
                                onChange={(e) => setQty(e.target.value)}
                            />
                        </FormField>
                        <FormField label="Unit">
                            <Input
                                value={unit}
                                onChange={(e) => setUnit(e.target.value)}
                            />
                        </FormField>
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleAdd} disabled={!desc.trim()}>
                        Add
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ----------------------------- Helpers ----------------------------- */

function Card({
    title,
    children,
    className,
    actions,
}: {
    title?: string;
    children: React.ReactNode;
    className?: string;
    actions?: React.ReactNode;
}) {
    return (
        <section
            className={cn(
                'rounded-xl border border-slate-200 bg-white p-4',
                className,
            )}
        >
            {(title || actions) && (
                <header className="mb-3 flex items-center justify-between gap-3">
                    {title && (
                        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
                    )}
                    {actions}
                </header>
            )}
            {children}
        </section>
    );
}

function DefList({ children }: { children: React.ReactNode }) {
    return (
        <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
            {children}
        </dl>
    );
}

function DefItem({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {label}
            </dt>
            <dd className="text-slate-700">{value}</dd>
        </>
    );
}
