import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/ui/FilterBar';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Select, FormField, Input, Textarea } from '@/components/ui/FormField';
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
import { formatRelative } from '@/lib/format';
import {
    adjustments,
    ADJUSTMENT_REASONS,
    inventoryProducts,
    inventoryProductById,
    type StockAdjustment,
} from '@/mocks/inventory';
import { warehouses, warehouseById } from '@/mocks/warehouses';
import { users, userById } from '@/mocks/users';

const REASON_TONE: Record<
    StockAdjustment['reasonCode'],
    'red' | 'amber' | 'blue' | 'violet' | 'emerald' | 'neutral'
> = {
    damaged: 'red',
    recount: 'blue',
    theft: 'red',
    correction: 'violet',
    returned: 'emerald',
    expired: 'amber',
};

export default function AdjustmentsPage() {
    const [warehouseFilter, setWarehouseFilter] = useState('');
    const [reasonFilter, setReasonFilter] = useState('');
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return adjustments.filter((a) => {
            if (warehouseFilter && a.warehouseId !== warehouseFilter) return false;
            if (reasonFilter && a.reasonCode !== reasonFilter) return false;
            if (q) {
                const p = inventoryProductById(a.productId);
                const hay = `${p?.sku ?? ''} ${p?.name ?? ''} ${a.remark}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [warehouseFilter, reasonFilter, search]);

    const columns: DataTableColumn<StockAdjustment>[] = [
        {
            key: 'at',
            header: 'When',
            cell: (a) => (
                <span className="text-xs text-slate-500">{formatRelative(a.at)}</span>
            ),
        },
        {
            key: 'product',
            header: 'Product',
            cell: (a) => {
                const p = inventoryProductById(a.productId);
                return (
                    <div>
                        <p className="font-medium text-slate-800">{p?.name ?? '—'}</p>
                        <p className="font-mono text-xs text-slate-500">{p?.sku}</p>
                    </div>
                );
            },
        },
        {
            key: 'warehouse',
            header: 'Warehouse',
            cell: (a) => warehouseById(a.warehouseId)?.code ?? '—',
        },
        {
            key: 'qty',
            header: 'Qty',
            align: 'right',
            cell: (a) => (
                <span
                    className={
                        a.qty >= 0
                            ? 'font-semibold text-emerald-700'
                            : 'font-semibold text-red-600'
                    }
                >
                    {a.qty > 0 ? `+${a.qty}` : a.qty}
                </span>
            ),
        },
        {
            key: 'reason',
            header: 'Reason',
            cell: (a) => (
                <Badge tone={REASON_TONE[a.reasonCode]}>
                    {ADJUSTMENT_REASONS.find((r) => r.value === a.reasonCode)?.label ??
                        a.reasonCode}
                </Badge>
            ),
        },
        {
            key: 'remark',
            header: 'Remark',
            cell: (a) => (
                <span className="text-sm text-slate-600">{a.remark}</span>
            ),
        },
        {
            key: 'authorised',
            header: 'Authorised by',
            cell: (a) => userById(a.authorisedBy)?.name ?? '—',
        },
    ];

    return (
        <>
            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search SKU, product, remark…"
                filters={
                    <>
                        <Select
                            aria-label="Warehouse"
                            value={warehouseFilter}
                            onChange={(e) => setWarehouseFilter(e.target.value)}
                            className="w-40"
                        >
                            <option value="">All warehouses</option>
                            {warehouses.map((w) => (
                                <option key={w.id} value={w.id}>
                                    {w.code}
                                </option>
                            ))}
                        </Select>
                        <Select
                            aria-label="Reason"
                            value={reasonFilter}
                            onChange={(e) => setReasonFilter(e.target.value)}
                            className="w-44"
                        >
                            <option value="">All reasons</option>
                            {ADJUSTMENT_REASONS.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </Select>
                    </>
                }
                actions={
                    <Button size="sm" onClick={() => setOpen(true)}>
                        <Plus className="size-4" aria-hidden="true" />
                        New adjustment
                    </Button>
                }
            />

            <DataTable<StockAdjustment>
                columns={columns}
                rows={rows}
                rowKey={(a) => a.id}
                caption="Stock adjustments"
                emptyState={
                    <div className="px-6 py-12 text-center text-sm text-slate-500">
                        No adjustments match the current filters.
                    </div>
                }
            />

            <AdjustmentDialog open={open} onOpenChange={setOpen} />
        </>
    );
}

function AdjustmentDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
}) {
    const { push } = useToast();
    const [warehouseId, setWarehouseId] = useState('wh-ho');
    const [productId, setProductId] = useState(inventoryProducts[0]?.id ?? '');
    const [direction, setDirection] = useState<'add' | 'subtract'>('subtract');
    const [qty, setQty] = useState('1');
    const [reasonCode, setReasonCode] =
        useState<StockAdjustment['reasonCode']>('damaged');
    const [authorisedBy, setAuthorisedBy] = useState(
        users.find((u) => u.role === 'sales_manager')?.id ??
        users[0]?.id ??
        '',
    );
    const [remark, setRemark] = useState('');

    function reset() {
        setQty('1');
        setRemark('');
        setDirection('subtract');
        setReasonCode('damaged');
    }

    const qtyNum = Math.abs(Number(qty) || 0);
    const canSubmit =
        qtyNum > 0 && !!warehouseId && !!productId && !!authorisedBy && !!remark.trim();

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
                    <DialogTitle>New stock adjustment</DialogTitle>
                    <DialogDescription>
                        Adjustments create an immutable ledger entry and require a reason
                        code plus authoriser.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <FormField label="Warehouse" required>
                            <Select
                                value={warehouseId}
                                onChange={(e) => setWarehouseId(e.target.value)}
                            >
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>
                                        {w.code} — {w.name}
                                    </option>
                                ))}
                            </Select>
                        </FormField>
                        <FormField label="Product" required>
                            <Select
                                value={productId}
                                onChange={(e) => setProductId(e.target.value)}
                            >
                                {inventoryProducts.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.sku} — {p.name}
                                    </option>
                                ))}
                            </Select>
                        </FormField>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <FormField label="Direction" required>
                            <Select
                                value={direction}
                                onChange={(e) =>
                                    setDirection(e.target.value as 'add' | 'subtract')
                                }
                            >
                                <option value="add">Add (+)</option>
                                <option value="subtract">Subtract (−)</option>
                            </Select>
                        </FormField>
                        <FormField label="Quantity" required>
                            <Input
                                type="number"
                                min={1}
                                value={qty}
                                onChange={(e) => setQty(e.target.value)}
                            />
                        </FormField>
                        <FormField label="Reason code" required>
                            <Select
                                value={reasonCode}
                                onChange={(e) =>
                                    setReasonCode(
                                        e.target.value as StockAdjustment['reasonCode'],
                                    )
                                }
                            >
                                {ADJUSTMENT_REASONS.map((r) => (
                                    <option key={r.value} value={r.value}>
                                        {r.label}
                                    </option>
                                ))}
                            </Select>
                        </FormField>
                    </div>
                    <FormField label="Authorised by" required>
                        <Select
                            value={authorisedBy}
                            onChange={(e) => setAuthorisedBy(e.target.value)}
                        >
                            {users
                                .filter((u) =>
                                    ['sales_manager', 'admin', 'inventory'].includes(u.role),
                                )
                                .map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} — {u.role}
                                    </option>
                                ))}
                        </Select>
                    </FormField>
                    <FormField label="Remark" required>
                        <Textarea
                            rows={3}
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                            placeholder="Brief explanation for audit trail…"
                        />
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
                    <Button
                        type="button"
                        disabled={!canSubmit}
                        onClick={() => {
                            push({
                                variant: 'success',
                                title: 'Adjustment recorded',
                                description: `${direction === 'add' ? '+' : '−'}${qtyNum} in ${warehouseById(warehouseId)?.code}`,
                            });
                            onOpenChange(false);
                        }}
                    >
                        Record adjustment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
