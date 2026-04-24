import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Copy,
    Download,
    FileArchive,
    FileImage,
    FileSpreadsheet,
    FileText,
    History,
    Lock,
    Plus,
    Share2,
    ShieldCheck,
    Upload,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Input, Select, Textarea } from '@/components/ui/FormField';
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { formatRelative } from '@/lib/format';
import {
    DOCUMENT_TYPE_LABEL,
    DOCUMENT_TYPE_TONE,
    ENTITY_TYPE_LABEL,
    ROLE_LABEL,
    SENSITIVITY_LABEL,
    SENSITIVITY_TONE,
    type DocumentEntityType,
    type DocumentRecord,
    type DocumentSensitivity,
    type DocumentType,
    type DocumentVersion,
    documents,
    documentsSummary,
    formatFileSize,
} from '@/mocks/documents';
import { userById } from '@/mocks/users';

const TYPE_OPTIONS: DocumentType[] = [
    'invoice',
    'po',
    'quotation',
    'order_confirmation',
    'delivery_challan',
    'commissioning_report',
    'warranty_certificate',
    'test_certificate',
    'datasheet',
    'drawing',
    'contract',
    'photo',
    'other',
];

const ENTITY_OPTIONS: DocumentEntityType[] = [
    'inquiry',
    'quotation',
    'order',
    'dispatch',
    'job',
    'product',
    'customer',
    'general',
];

const SENSITIVITY_OPTIONS: DocumentSensitivity[] = [
    'public',
    'internal',
    'confidential',
];

const ENTITY_LINK: Partial<Record<DocumentEntityType, (id: string) => string>> = {
    inquiry: (id) => `/inquiries/${id}`,
    quotation: (id) => `/quotations/${id}`,
    order: (id) => `/orders/${id}`,
    dispatch: (id) => `/dispatch/${id}`,
    job: (id) => `/jobs/${id}`,
    product: (id) => `/inventory/products/${id}`,
};

function FileTypeIcon({
    mime,
    className,
}: {
    mime: string;
    className?: string;
}) {
    if (mime.startsWith('image/'))
        return <FileImage className={className} aria-hidden="true" />;
    if (mime.includes('zip') || mime.includes('archive'))
        return <FileArchive className={className} aria-hidden="true" />;
    if (mime.includes('sheet') || mime.includes('excel'))
        return <FileSpreadsheet className={className} aria-hidden="true" />;
    return <FileText className={className} aria-hidden="true" />;
}

export default function DocumentsPage() {
    const { push } = useToast();
    const [search, setSearch] = useState('');
    const [type, setType] = useState<'' | DocumentType>('');
    const [entityType, setEntityType] = useState<'' | DocumentEntityType>('');
    const [sensitivity, setSensitivity] = useState<'' | DocumentSensitivity>('');
    const [uploader, setUploader] = useState('');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [drawerId, setDrawerId] = useState<string | null>(null);
    const [uploadOpen, setUploadOpen] = useState(false);

    const summary = useMemo(() => documentsSummary(), []);

    const uploaderOptions = useMemo(() => {
        const ids = new Set<string>();
        documents.forEach((d) =>
            d.versions.forEach((v) => ids.add(v.uploadedBy)),
        );
        return Array.from(ids);
    }, []);

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return documents.filter((d) => {
            if (type && d.type !== type) return false;
            if (entityType && d.entityType !== entityType) return false;
            if (sensitivity && d.sensitivity !== sensitivity) return false;
            if (uploader && !d.versions.some((v) => v.uploadedBy === uploader))
                return false;
            if (q) {
                const hay =
                    `${d.name} ${d.entityLabel ?? ''} ${d.tags.join(' ')} ${d.notes}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [search, type, entityType, sensitivity, uploader]);

    function toggleRow(id: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function toggleAll() {
        setSelected((prev) =>
            prev.size === rows.length
                ? new Set()
                : new Set(rows.map((r) => r.id)),
        );
    }

    function clearFilters() {
        setSearch('');
        setType('');
        setEntityType('');
        setSensitivity('');
        setUploader('');
    }

    const drawerDoc = drawerId
        ? documents.find((d) => d.id === drawerId) ?? null
        : null;

    const columns: DataTableColumn<DocumentRecord>[] = [
        {
            key: 'select',
            header: (
                <input
                    type="checkbox"
                    aria-label="Select all"
                    className="size-4 cursor-pointer rounded border-slate-300"
                    checked={rows.length > 0 && selected.size === rows.length}
                    onChange={toggleAll}
                />
            ),
            cell: (d) => (
                <input
                    type="checkbox"
                    aria-label={`Select ${d.name}`}
                    className="size-4 cursor-pointer rounded border-slate-300"
                    checked={selected.has(d.id)}
                    onChange={(e) => {
                        e.stopPropagation();
                        toggleRow(d.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                />
            ),
            className: 'w-10',
        },
        {
            key: 'name',
            header: 'Document',
            cell: (d) => {
                const current = d.versions[0];
                return (
                    <div className="flex items-start gap-2">
                        <FileTypeIcon
                            mime={current.mimeType}
                            className="mt-0.5 size-4 shrink-0 text-slate-400"
                        />
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-800">
                                {d.name}
                            </p>
                            <p className="truncate font-mono text-[11px] text-slate-500">
                                {current.fileName}
                            </p>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'entity',
            header: 'Linked to',
            cell: (d) => {
                if (!d.entityId || !d.entityLabel) {
                    return (
                        <span className="text-xs text-slate-400">
                            {ENTITY_TYPE_LABEL[d.entityType]}
                        </span>
                    );
                }
                const builder = ENTITY_LINK[d.entityType];
                const label = (
                    <span className="font-mono text-xs">{d.entityLabel}</span>
                );
                return (
                    <div>
                        <p className="text-[10px] uppercase text-slate-400">
                            {ENTITY_TYPE_LABEL[d.entityType]}
                        </p>
                        {builder ? (
                            <Link
                                to={builder(d.entityId)}
                                onClick={(e) => e.stopPropagation()}
                                className="text-primary hover:underline"
                            >
                                {label}
                            </Link>
                        ) : (
                            label
                        )}
                    </div>
                );
            },
        },
        {
            key: 'type',
            header: 'Type',
            cell: (d) => (
                <Badge tone={DOCUMENT_TYPE_TONE[d.type]}>
                    {DOCUMENT_TYPE_LABEL[d.type]}
                </Badge>
            ),
        },
        {
            key: 'sensitivity',
            header: 'Access',
            cell: (d) => (
                <Badge tone={SENSITIVITY_TONE[d.sensitivity]}>
                    {d.sensitivity === 'confidential' && (
                        <Lock className="mr-1 size-3" aria-hidden="true" />
                    )}
                    {SENSITIVITY_LABEL[d.sensitivity]}
                </Badge>
            ),
        },
        {
            key: 'version',
            header: 'Version',
            cell: (d) => (
                <span className="font-mono text-xs text-slate-700">
                    v{d.versions[0].version}
                    {d.versions.length > 1 && (
                        <span className="ml-1 text-slate-400">
                            ({d.versions.length})
                        </span>
                    )}
                </span>
            ),
        },
        {
            key: 'uploader',
            header: 'Uploaded by',
            cell: (d) => {
                const v = d.versions[0];
                return (
                    <div>
                        <p className="text-sm text-slate-700">
                            {userById(v.uploadedBy)?.name ?? v.uploadedBy}
                        </p>
                        <p className="text-xs text-slate-500">
                            {formatRelative(v.uploadedAt)}
                        </p>
                    </div>
                );
            },
        },
        {
            key: 'size',
            header: 'Size',
            cell: (d) => (
                <span className="tabular-nums text-xs text-slate-600">
                    {formatFileSize(d.versions[0].fileSize)}
                </span>
            ),
            className: 'text-right',
        },
    ];

    return (
        <div className="p-6 md:p-8">
            <PageHeader
                title="Documents"
                description="Central vault for invoices, quotations, certificates, drawings and site reports — versioned and access-controlled."
                actions={
                    <Button onClick={() => setUploadOpen(true)}>
                        <Upload className="size-4" aria-hidden="true" />
                        Upload document
                    </Button>
                }
            />

            <section
                aria-label="Documents summary"
                className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-4"
            >
                <Stat label="Total documents" value={String(summary.total)} />
                <Stat
                    label="Confidential"
                    value={String(summary.confidential)}
                    valueClassName={
                        summary.confidential > 0 ? 'text-red-700' : undefined
                    }
                />
                <Stat
                    label="Storage"
                    value={formatFileSize(summary.totalBytes)}
                />
                <Stat
                    label="Updated this week"
                    value={String(summary.updatedThisWeek)}
                    valueClassName={
                        summary.updatedThisWeek > 0
                            ? 'text-sky-700'
                            : undefined
                    }
                />
            </section>

            {selected.size > 0 && (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                    <span className="font-medium text-primary">
                        {selected.size} selected
                    </span>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                push({
                                    variant: 'success',
                                    title: 'Bulk download queued',
                                    description: `${selected.size} document(s) will be packaged.`,
                                });
                                setSelected(new Set());
                            }}
                        >
                            <Download className="size-4" aria-hidden="true" />
                            Bulk download
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelected(new Set())}
                        >
                            Clear
                        </Button>
                    </div>
                </div>
            )}

            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search name, entity, tag…"
                filters={
                    <>
                        <Select
                            aria-label="Document type"
                            value={type}
                            onChange={(e) =>
                                setType(e.target.value as DocumentType | '')
                            }
                            className="w-44"
                        >
                            <option value="">All types</option>
                            {TYPE_OPTIONS.map((t) => (
                                <option key={t} value={t}>
                                    {DOCUMENT_TYPE_LABEL[t]}
                                </option>
                            ))}
                        </Select>
                        <Select
                            aria-label="Entity type"
                            value={entityType}
                            onChange={(e) =>
                                setEntityType(
                                    e.target.value as DocumentEntityType | '',
                                )
                            }
                            className="w-40"
                        >
                            <option value="">All entities</option>
                            {ENTITY_OPTIONS.map((t) => (
                                <option key={t} value={t}>
                                    {ENTITY_TYPE_LABEL[t]}
                                </option>
                            ))}
                        </Select>
                        <Select
                            aria-label="Sensitivity"
                            value={sensitivity}
                            onChange={(e) =>
                                setSensitivity(
                                    e.target.value as DocumentSensitivity | '',
                                )
                            }
                            className="w-36"
                        >
                            <option value="">All access</option>
                            {SENSITIVITY_OPTIONS.map((t) => (
                                <option key={t} value={t}>
                                    {SENSITIVITY_LABEL[t]}
                                </option>
                            ))}
                        </Select>
                        <Select
                            aria-label="Uploader"
                            value={uploader}
                            onChange={(e) => setUploader(e.target.value)}
                            className="w-40"
                        >
                            <option value="">All uploaders</option>
                            {uploaderOptions.map((id) => (
                                <option key={id} value={id}>
                                    {userById(id)?.name ?? id}
                                </option>
                            ))}
                        </Select>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            disabled={
                                !search &&
                                !type &&
                                !entityType &&
                                !sensitivity &&
                                !uploader
                            }
                        >
                            Reset
                        </Button>
                    </>
                }
            />

            <DataTable<DocumentRecord>
                columns={columns}
                rows={rows}
                rowKey={(d) => d.id}
                onRowClick={(d) => setDrawerId(d.id)}
                caption="Documents"
                emptyState={
                    <div className="px-6 py-12 text-center text-sm text-slate-500">
                        No documents match the current filters.
                    </div>
                }
            />

            <p className="mt-3 text-xs text-slate-500">
                Showing {rows.length} of {documents.length} documents.
            </p>

            <Sheet
                open={drawerDoc !== null}
                onOpenChange={(o) => !o && setDrawerId(null)}
            >
                <SheetContent
                    side="right"
                    className="w-full max-w-xl sm:w-[40rem]"
                >
                    {drawerDoc && (
                        <DocumentDrawer
                            doc={drawerDoc}
                            onClose={() => setDrawerId(null)}
                            onCopyShare={() => {
                                navigator.clipboard
                                    ?.writeText(drawerDoc.shareLink)
                                    .catch(() => undefined);
                                push({
                                    variant: 'success',
                                    title: 'Link copied',
                                    description: drawerDoc.shareLink,
                                });
                            }}
                            onDownload={(v) =>
                                push({
                                    variant: 'success',
                                    title: 'Download started',
                                    description: `${v.fileName} (v${v.version})`,
                                })
                            }
                        />
                    )}
                </SheetContent>
            </Sheet>

            <UploadDocumentDialog
                open={uploadOpen}
                onOpenChange={setUploadOpen}
                onSubmit={(name) => {
                    setUploadOpen(false);
                    push({
                        variant: 'success',
                        title: 'Document uploaded',
                        description: name,
                    });
                }}
            />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Drawer                                                              */
/* ------------------------------------------------------------------ */

function DocumentDrawer({
    doc,
    onClose,
    onCopyShare,
    onDownload,
}: {
    doc: DocumentRecord;
    onClose: () => void;
    onCopyShare: () => void;
    onDownload: (v: DocumentVersion) => void;
}) {
    const current = doc.versions[0];
    return (
        <div className="flex h-full flex-col overflow-hidden">
            <header className="border-b border-slate-200 px-5 py-4">
                <div className="flex items-start gap-3 pr-8">
                    <FileTypeIcon
                        mime={current.mimeType}
                        className="mt-1 size-5 shrink-0 text-slate-400"
                    />
                    <div className="min-w-0 flex-1">
                        <h2 className="text-base font-semibold text-slate-800">
                            {doc.name}
                        </h2>
                        <p className="mt-1 flex flex-wrap gap-1.5">
                            <Badge tone={DOCUMENT_TYPE_TONE[doc.type]}>
                                {DOCUMENT_TYPE_LABEL[doc.type]}
                            </Badge>
                            <Badge tone={SENSITIVITY_TONE[doc.sensitivity]}>
                                {doc.sensitivity === 'confidential' && (
                                    <Lock
                                        className="mr-1 size-3"
                                        aria-hidden="true"
                                    />
                                )}
                                {SENSITIVITY_LABEL[doc.sensitivity]}
                            </Badge>
                            <Badge tone="neutral">
                                v{current.version} of {doc.versions.length}
                            </Badge>
                        </p>
                    </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => onDownload(current)}>
                        <Download className="size-4" aria-hidden="true" />
                        Download v{current.version}
                    </Button>
                    <Button size="sm" variant="outline" onClick={onCopyShare}>
                        <Share2 className="size-4" aria-hidden="true" />
                        Copy link
                    </Button>
                    <Button size="sm" variant="ghost" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
                <Section title="Details">
                    <dl className="grid grid-cols-2 gap-3 text-sm">
                        <Field
                            label="Linked to"
                            value={
                                doc.entityLabel
                                    ? `${ENTITY_TYPE_LABEL[doc.entityType]} · ${doc.entityLabel}`
                                    : ENTITY_TYPE_LABEL[doc.entityType]
                            }
                        />
                        <Field
                            label="Last updated"
                            value={formatRelative(doc.updatedAt)}
                        />
                        <Field
                            label="Created"
                            value={formatRelative(doc.createdAt)}
                        />
                        <Field
                            label="Share link"
                            value={doc.shareLink}
                            mono
                        />
                    </dl>
                    {doc.notes && (
                        <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                            {doc.notes}
                        </p>
                    )}
                    {doc.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                            {doc.tags.map((t) => (
                                <span
                                    key={t}
                                    className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                                >
                                    #{t}
                                </span>
                            ))}
                        </div>
                    )}
                </Section>

                <Section
                    title="Version history"
                    icon={History}
                    aside={`${doc.versions.length} version${doc.versions.length === 1 ? '' : 's'}`}
                >
                    <ol className="space-y-2">
                        {doc.versions.map((v) => (
                            <li
                                key={v.id}
                                className={cn(
                                    'rounded-lg border p-3 text-sm',
                                    v.isCurrent
                                        ? 'border-primary/30 bg-primary/5'
                                        : 'border-slate-200 bg-white',
                                )}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="flex items-center gap-2 font-mono text-xs font-semibold text-slate-700">
                                            v{v.version}
                                            {v.isCurrent && (
                                                <Badge tone="emerald">
                                                    Current
                                                </Badge>
                                            )}
                                        </p>
                                        <p className="truncate text-xs text-slate-500">
                                            {v.fileName} ·{' '}
                                            {formatFileSize(v.fileSize)}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-600">
                                            {v.note}
                                        </p>
                                        <p className="mt-1 text-[11px] text-slate-400">
                                            {userById(v.uploadedBy)?.name ??
                                                v.uploadedBy}{' '}
                                            · {formatRelative(v.uploadedAt)}
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => onDownload(v)}
                                    >
                                        <Download
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ol>
                </Section>

                <Section title="Access" icon={ShieldCheck}>
                    <ul className="overflow-hidden rounded-lg border border-slate-200">
                        {doc.access.map((a) => (
                            <li
                                key={a.role}
                                className="flex items-center justify-between border-b border-slate-100 px-3 py-2 text-sm last:border-0"
                            >
                                <span className="text-slate-700">
                                    {ROLE_LABEL[a.role]}
                                </span>
                                <span className="flex gap-1.5">
                                    <Badge
                                        tone={a.canView ? 'sky' : 'neutral'}
                                    >
                                        {a.canView ? 'View' : 'No view'}
                                    </Badge>
                                    <Badge
                                        tone={
                                            a.canDownload
                                                ? 'emerald'
                                                : 'neutral'
                                        }
                                    >
                                        {a.canDownload
                                            ? 'Download'
                                            : 'No download'}
                                    </Badge>
                                </span>
                            </li>
                        ))}
                    </ul>
                </Section>

                <Section title="Activity">
                    <ol className="space-y-2.5">
                        {doc.activity.map((a) => (
                            <li key={a.id} className="flex gap-3 text-sm">
                                <Copy
                                    className="mt-0.5 size-3.5 shrink-0 text-slate-400"
                                    aria-hidden="true"
                                />
                                <div>
                                    <p className="text-slate-700">
                                        {a.summary}
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                        {userById(a.actorId)?.name ??
                                            a.actorId}{' '}
                                        · {formatRelative(a.at)}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </Section>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Upload Dialog                                                       */
/* ------------------------------------------------------------------ */

function UploadDocumentDialog({
    open,
    onOpenChange,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    onSubmit: (name: string) => void;
}) {
    const [name, setName] = useState('');
    const [type, setType] = useState<DocumentType>('invoice');
    const [linkEnabled, setLinkEnabled] = useState(true);
    const [entityType, setEntityType] = useState<DocumentEntityType>('order');
    const [entityId, setEntityId] = useState('');
    const [sensitivity, setSensitivity] =
        useState<DocumentSensitivity>('internal');
    const [tags, setTags] = useState('');
    const [notes, setNotes] = useState('');

    const requiresEntity = linkEnabled && entityType !== 'general';
    const entityValid = !requiresEntity || entityId.trim().length >= 2;
    const canSubmit = name.trim().length >= 3 && entityValid;

    function reset() {
        setName('');
        setType('invoice');
        setLinkEnabled(true);
        setEntityType('order');
        setEntityId('');
        setSensitivity('internal');
        setTags('');
        setNotes('');
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                onOpenChange(o);
                if (!o) reset();
            }}
        >
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Upload document</DialogTitle>
                    <DialogDescription>
                        Add a new document to the vault. You can link it to an
                        inquiry, order, job or other entity.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody className="space-y-4">
                    <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
                        <Upload
                            className="mx-auto size-6 text-slate-400"
                            aria-hidden="true"
                        />
                        <p className="mt-1">
                            Drop file here or click to browse (mock)
                        </p>
                    </div>
                    <FormRow label="Title" required>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., INV-2026-014 — Tax Invoice"
                        />
                    </FormRow>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <FormRow label="Type">
                            <Select
                                value={type}
                                onChange={(e) =>
                                    setType(e.target.value as DocumentType)
                                }
                            >
                                {TYPE_OPTIONS.map((t) => (
                                    <option key={t} value={t}>
                                        {DOCUMENT_TYPE_LABEL[t]}
                                    </option>
                                ))}
                            </Select>
                        </FormRow>
                        <FormRow label="Sensitivity">
                            <Select
                                value={sensitivity}
                                onChange={(e) =>
                                    setSensitivity(
                                        e.target.value as DocumentSensitivity,
                                    )
                                }
                            >
                                {SENSITIVITY_OPTIONS.map((t) => (
                                    <option key={t} value={t}>
                                        {SENSITIVITY_LABEL[t]}
                                    </option>
                                ))}
                            </Select>
                        </FormRow>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-3">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <input
                                type="checkbox"
                                className="size-4 rounded border-slate-300"
                                checked={linkEnabled}
                                onChange={(e) =>
                                    setLinkEnabled(e.target.checked)
                                }
                            />
                            Link to an entity
                        </label>
                        {linkEnabled && (
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <FormRow label="Entity type">
                                    <Select
                                        value={entityType}
                                        onChange={(e) =>
                                            setEntityType(
                                                e.target
                                                    .value as DocumentEntityType,
                                            )
                                        }
                                    >
                                        {ENTITY_OPTIONS.map((t) => (
                                            <option key={t} value={t}>
                                                {ENTITY_TYPE_LABEL[t]}
                                            </option>
                                        ))}
                                    </Select>
                                </FormRow>
                                <FormRow
                                    label="Entity ID"
                                    required={entityType !== 'general'}
                                    error={
                                        requiresEntity && !entityValid
                                            ? 'Entity ID is required when linking'
                                            : undefined
                                    }
                                >
                                    <Input
                                        value={entityId}
                                        onChange={(e) =>
                                            setEntityId(e.target.value)
                                        }
                                        placeholder="e.g., so-001"
                                        disabled={entityType === 'general'}
                                    />
                                </FormRow>
                            </div>
                        )}
                    </div>

                    <FormRow label="Tags" hint="Comma-separated">
                        <Input
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="invoice, GST, 2026"
                        />
                    </FormRow>
                    <FormRow label="Notes">
                        <Textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Optional context for reviewers"
                        />
                    </FormRow>
                </DialogBody>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={!canSubmit}
                        onClick={() => onSubmit(name)}
                    >
                        <Plus className="size-4" aria-hidden="true" />
                        Upload
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function Stat({
    label,
    value,
    valueClassName,
}: {
    label: string;
    value: string;
    valueClassName?: string;
}) {
    return (
        <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {label}
            </p>
            <p
                className={cn(
                    'mt-1 text-base font-semibold text-slate-800',
                    valueClassName,
                )}
            >
                {value}
            </p>
        </div>
    );
}

function Section({
    title,
    icon: Icon,
    aside,
    children,
}: {
    title: string;
    icon?: typeof History;
    aside?: string;
    children: React.ReactNode;
}) {
    return (
        <section>
            <header className="mb-2 flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {Icon && (
                        <Icon
                            className="size-3.5 text-slate-400"
                            aria-hidden="true"
                        />
                    )}
                    {title}
                </h3>
                {aside && (
                    <span className="text-xs text-slate-400">{aside}</span>
                )}
            </header>
            {children}
        </section>
    );
}

function Field({
    label,
    value,
    mono,
}: {
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div>
            <dt className="text-[10px] font-semibold uppercase text-slate-400">
                {label}
            </dt>
            <dd
                className={cn(
                    'mt-0.5 break-words text-slate-700',
                    mono && 'font-mono text-xs',
                )}
            >
                {value}
            </dd>
        </div>
    );
}

function FormRow({
    label,
    required,
    hint,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    hint?: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-slate-500">
                {label}
                {required && <span className="ml-1 text-red-500">*</span>}
            </label>
            {children}
            {hint && !error && (
                <p className="text-[11px] text-slate-400">{hint}</p>
            )}
            {error && (
                <p className="text-[11px] text-red-600">{error}</p>
            )}
        </div>
    );
}
