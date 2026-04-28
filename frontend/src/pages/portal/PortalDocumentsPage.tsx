import { useState } from 'react';
import { Search, Download, FileText } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import {
    portalDocuments,
    signedDownloadUrl,
    type PortalDocument,
} from '@/mocks/portal/portal-documents';
import {
    DOCUMENT_TYPE_LABEL,
    ENTITY_TYPE_LABEL,
} from '@/mocks/documents';

function formatBytes(b: number): string {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PortalDocumentsPage() {
    const toast = useToast();
    const [query, setQuery] = useState('');
    const [type, setType] = useState<string>('all');

    const all = portalDocuments();
    const filtered = all.filter((d) => {
        if (type !== 'all' && d.type !== type) return false;
        if (query) {
            const q = query.toLowerCase();
            return d.name.toLowerCase().includes(q) || d.fileName.toLowerCase().includes(q);
        }
        return true;
    });

    function handleDownload(d: PortalDocument) {
        const url = signedDownloadUrl(d.id);
        toast.push({
            title: 'Generating secure link',
            description: `${d.fileName} — link valid for 15 minutes.`,
            variant: 'success',
        });
        // In Phase 1 we don't actually navigate to a real URL.
        console.info('[portal] signed download URL:', url);
    }

    const columns: DataTableColumn<PortalDocument>[] = [
        {
            key: 'name',
            header: 'Document',
            cell: (d) => (
                <div className="flex items-center gap-2">
                    <FileText className="size-4 text-slate-400" />
                    <div className="min-w-0">
                        <div className="truncate font-medium text-slate-900">{d.name}</div>
                        <div className="truncate text-xs text-slate-500">{d.fileName}</div>
                    </div>
                </div>
            ),
        },
        { key: 'type', header: 'Type', cell: (d) => <Badge tone="blue">{DOCUMENT_TYPE_LABEL[d.type]}</Badge> },
        {
            key: 'linked',
            header: 'Linked to',
            cell: (d) => (
                <div className="text-xs text-slate-600">
                    <div>{ENTITY_TYPE_LABEL[d.entityType]}</div>
                    {d.entityLabel && <div className="text-slate-400">{d.entityLabel}</div>}
                </div>
            ),
        },
        {
            key: 'date',
            header: 'Uploaded',
            cell: (d) =>
                new Date(d.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        },
        { key: 'size', header: 'Size', align: 'right', cell: (d) => formatBytes(d.fileSize) },
        {
            key: 'dl',
            header: '',
            align: 'right',
            cell: (d) => (
                <Button size="sm" variant="outline" onClick={() => handleDownload(d)}>
                    <Download className="size-3.5" /> Download
                </Button>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <PageHeader
                title="Documents"
                description="Public documents for your organisation — quotations, invoices, certificates, drawings."
            />

            <div className="flex flex-col gap-2 md:flex-row">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" />
                    <Input
                        type="search"
                        placeholder="Search documents"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <select
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                >
                    <option value="all">All types</option>
                    {Object.entries(DOCUMENT_TYPE_LABEL).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                    ))}
                </select>
            </div>

            <DataTable columns={columns} rows={filtered} rowKey={(d) => d.id} />
        </div>
    );
}
