import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Select } from '@/components/ui/FormField';
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { FormField, Input, Textarea } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { formatCompactINR } from '@/lib/format';
import {
    vendors,
    VENDOR_CATEGORIES,
    VENDOR_STATUS_LABEL,
    VENDOR_STATUS_TONE,
    VENDOR_TIER_TONE,
    vendorPerformanceTone,
    type Vendor,
} from '@/mocks/vendors';

export default function VendorsListPage() {
    const navigate = useNavigate();
    const { push } = useToast();
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [status, setStatus] = useState<'' | Vendor['status']>('');
    const [tier, setTier] = useState<'' | Vendor['tier']>('');
    const [open, setOpen] = useState(false);

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return vendors.filter((v) => {
            if (category && v.category !== category) return false;
            if (status && v.status !== status) return false;
            if (tier && v.tier !== tier) return false;
            if (q) {
                const hay = `${v.code} ${v.name} ${v.legalName} ${v.gstin} ${v.category}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [search, category, status, tier]);

    const columns: DataTableColumn<Vendor>[] = [
        {
            key: 'code',
            header: 'Code',
            cell: (v) => (
                <div>
                    <p className="font-mono text-sm font-semibold text-slate-800">{v.code}</p>
                    <p className="text-xs text-slate-500">{v.gstin}</p>
                </div>
            ),
        },
        {
            key: 'name',
            header: 'Vendor',
            cell: (v) => (
                <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">{v.name}</p>
                    <p className="truncate text-xs text-slate-500">{v.address}</p>
                </div>
            ),
        },
        {
            key: 'category',
            header: 'Category',
            cell: (v) => <span className="text-sm text-slate-700">{v.category}</span>,
        },
        {
            key: 'tier',
            header: 'Tier',
            cell: (v) => <Badge tone={VENDOR_TIER_TONE[v.tier]}>Tier {v.tier}</Badge>,
        },
        {
            key: 'status',
            header: 'Status',
            cell: (v) => (
                <Badge tone={VENDOR_STATUS_TONE[v.status]}>{VENDOR_STATUS_LABEL[v.status]}</Badge>
            ),
        },
        {
            key: 'onTime',
            header: 'On-time',
            align: 'right',
            cell: (v) => {
                const tone = vendorPerformanceTone(v.performance.onTimePct);
                const cls =
                    tone === 'emerald'
                        ? 'text-emerald-700'
                        : tone === 'amber'
                            ? 'text-amber-700'
                            : 'text-red-600';
                return <span className={`text-sm font-medium ${cls}`}>{v.performance.onTimePct}%</span>;
            },
        },
        {
            key: 'spend',
            header: 'Spend YTD',
            align: 'right',
            cell: (v) => (
                <span className="text-sm text-slate-700">
                    {formatCompactINR(v.performance.spendYTD)}
                </span>
            ),
        },
        {
            key: 'po',
            header: 'POs',
            align: 'right',
            cell: (v) => <span className="text-sm text-slate-700">{v.performance.poCount}</span>,
        },
    ];

    return (
        <>
            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search vendor name, code, GSTIN…"
                filters={
                    <>
                        <Select
                            aria-label="Category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-36"
                        >
                            <option value="">All categories</option>
                            {VENDOR_CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </Select>
                        <Select
                            aria-label="Status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as Vendor['status'] | '')}
                            className="w-32"
                        >
                            <option value="">All statuses</option>
                            <option value="active">Active</option>
                            <option value="on_hold">On hold</option>
                            <option value="blocked">Blocked</option>
                        </Select>
                        <Select
                            aria-label="Tier"
                            value={tier}
                            onChange={(e) => setTier(e.target.value as Vendor['tier'] | '')}
                            className="w-28"
                        >
                            <option value="">All tiers</option>
                            <option value="A">Tier A</option>
                            <option value="B">Tier B</option>
                            <option value="C">Tier C</option>
                        </Select>
                    </>
                }
                actions={
                    <Button size="sm" onClick={() => setOpen(true)}>
                        <Plus className="size-4" aria-hidden="true" />
                        New vendor
                    </Button>
                }
            />

            <DataTable
                columns={columns}
                rows={rows}
                rowKey={(v) => v.id}
                onRowClick={(v) => navigate(`/purchase/vendors/${v.id}`)}
                emptyState={
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
                        No vendors match this filter.
                    </div>
                }
            />

            <p className="mt-3 text-xs text-slate-500">
                Showing {rows.length} of {vendors.length} vendors.
            </p>

            <NewVendorDialog
                open={open}
                onOpenChange={setOpen}
                onSubmit={(name) => {
                    setOpen(false);
                    push({
                        variant: 'success',
                        title: 'Vendor onboarding initiated',
                        description: `${name} — pending compliance verification.`,
                    });
                }}
            />
        </>
    );
}

function NewVendorDialog({
    open,
    onOpenChange,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onSubmit: (name: string) => void;
}) {
    const [name, setName] = useState('');
    const [gstin, setGstin] = useState('');
    const [category, setCategory] = useState(VENDOR_CATEGORIES[0] ?? '');
    const [terms, setTerms] = useState('30');
    const [notes, setNotes] = useState('');
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>New vendor</DialogTitle>
                </DialogHeader>
                <DialogBody className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormField label="Vendor name" required className="sm:col-span-2">
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Kirloskar Pumps Pvt Ltd"
                        />
                    </FormField>
                    <FormField label="GSTIN" required>
                        <Input
                            value={gstin}
                            onChange={(e) => setGstin(e.target.value.toUpperCase())}
                            placeholder="27ABCDE1234F1Z5"
                            maxLength={15}
                        />
                    </FormField>
                    <FormField label="Category">
                        <Select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            {VENDOR_CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </Select>
                    </FormField>
                    <FormField label="Payment terms (days)">
                        <Input
                            type="number"
                            value={terms}
                            onChange={(e) => setTerms(e.target.value)}
                            min={0}
                        />
                    </FormField>
                    <FormField label="Notes" className="sm:col-span-2">
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </FormField>
                </DialogBody>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        disabled={!name.trim() || !gstin.trim()}
                        onClick={() => onSubmit(name.trim())}
                    >
                        Save vendor
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
