import { useMemo, useState } from 'react';
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
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { transporters, transporterById } from '@/mocks/transporters';
import { vehicles, type Vehicle } from '@/mocks/vehicles';

const STATUS_TONE: Record<Vehicle['status'], 'emerald' | 'blue' | 'amber'> = {
    available: 'emerald',
    in_transit: 'blue',
    maintenance: 'amber',
};

const STATUS_LABEL: Record<Vehicle['status'], string> = {
    available: 'Available',
    in_transit: 'In transit',
    maintenance: 'Maintenance',
};

export default function VehiclesPage() {
    const { push } = useToast();
    const [search, setSearch] = useState('');
    const [transporterId, setTransporterId] = useState('');
    const [status, setStatus] = useState<'' | Vehicle['status']>('');
    const [open, setOpen] = useState(false);

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return vehicles.filter((v) => {
            if (transporterId && v.transporterId !== transporterId) return false;
            if (status && v.status !== status) return false;
            if (q) {
                const hay = `${v.registration} ${v.typeLabel} ${v.driverName}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [search, transporterId, status]);

    const columns: DataTableColumn<Vehicle>[] = [
        {
            key: 'reg',
            header: 'Registration',
            cell: (v) => (
                <span className="font-mono text-sm font-semibold text-slate-800">
                    {v.registration}
                </span>
            ),
        },
        {
            key: 'type',
            header: 'Type',
            cell: (v) => (
                <span className="text-slate-700">{v.typeLabel}</span>
            ),
        },
        {
            key: 'capacity',
            header: 'Capacity',
            align: 'right',
            cell: (v) => (
                <span className="tabular-nums text-slate-700">
                    {v.capacityKg} kg
                    <span className="ml-1 text-xs text-slate-400">
                        / {v.capacityCft} cft
                    </span>
                </span>
            ),
        },
        {
            key: 'transporter',
            header: 'Transporter',
            cell: (v) => transporterById(v.transporterId)?.name ?? '—',
        },
        {
            key: 'driver',
            header: 'Driver',
            cell: (v) => (
                <div>
                    <p className="text-sm text-slate-700">{v.driverName}</p>
                    <p className="font-mono text-xs text-slate-500">
                        {v.driverPhone}
                    </p>
                </div>
            ),
        },
        {
            key: 'licence',
            header: 'Licence',
            cell: (v) => (
                <span className="font-mono text-xs text-slate-500">
                    {v.licenceNumber}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            cell: (v) => (
                <Badge tone={STATUS_TONE[v.status]}>{STATUS_LABEL[v.status]}</Badge>
            ),
        },
    ];

    return (
        <>
            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search registration, driver…"
                filters={
                    <>
                        <Select
                            aria-label="Transporter"
                            value={transporterId}
                            onChange={(e) => setTransporterId(e.target.value)}
                            className="w-44"
                        >
                            <option value="">All transporters</option>
                            {transporters.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </Select>
                        <Select
                            aria-label="Status"
                            value={status}
                            onChange={(e) =>
                                setStatus(e.target.value as Vehicle['status'] | '')
                            }
                            className="w-36"
                        >
                            <option value="">All status</option>
                            <option value="available">Available</option>
                            <option value="in_transit">In transit</option>
                            <option value="maintenance">Maintenance</option>
                        </Select>
                    </>
                }
                actions={
                    <Button size="sm" onClick={() => setOpen(true)}>
                        <Plus className="size-4" aria-hidden="true" />
                        New vehicle
                    </Button>
                }
            />

            <DataTable<Vehicle>
                columns={columns}
                rows={rows}
                rowKey={(v) => v.id}
                caption="Vehicles"
                emptyState={
                    <div className="px-6 py-12 text-center text-sm text-slate-500">
                        No vehicles match the current filters.
                    </div>
                }
            />

            <p className="mt-3 text-xs text-slate-500">
                Showing {rows.length} of {vehicles.length} vehicles.
            </p>

            <VehicleDialog
                open={open}
                onOpenChange={setOpen}
                onSubmit={(reg) => {
                    setOpen(false);
                    push({
                        variant: 'success',
                        title: 'Vehicle added',
                        description: reg,
                    });
                }}
            />
        </>
    );
}

function VehicleDialog({
    open,
    onOpenChange,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    onSubmit: (registration: string) => void;
}) {
    const [registration, setRegistration] = useState('');
    const [typeLabel, setTypeLabel] = useState('');
    const [capacityKg, setCapacityKg] = useState('');
    const [transporterId, setTransporterId] = useState('');
    const [driverName, setDriverName] = useState('');
    const [driverPhone, setDriverPhone] = useState('');
    const [licence, setLicence] = useState('');

    const canSubmit =
        registration.trim().length >= 4 &&
        typeLabel.trim() &&
        capacityKg.trim() &&
        transporterId &&
        driverName.trim();

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                onOpenChange(o);
                if (!o) {
                    setRegistration('');
                    setTypeLabel('');
                    setCapacityKg('');
                    setTransporterId('');
                    setDriverName('');
                    setDriverPhone('');
                    setLicence('');
                }
            }}
        >
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>New vehicle</DialogTitle>
                    <DialogDescription>
                        Register a vehicle and assign a transporter & driver.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Registration *">
                            <Input
                                value={registration}
                                onChange={(e) => setRegistration(e.target.value)}
                                placeholder="GJ-01-AB-1234"
                            />
                        </Field>
                        <Field label="Type *">
                            <Input
                                value={typeLabel}
                                onChange={(e) => setTypeLabel(e.target.value)}
                                placeholder="Tata 407"
                            />
                        </Field>
                        <Field label="Capacity (kg) *">
                            <Input
                                type="number"
                                value={capacityKg}
                                onChange={(e) => setCapacityKg(e.target.value)}
                            />
                        </Field>
                        <Field label="Transporter *">
                            <Select
                                value={transporterId}
                                onChange={(e) => setTransporterId(e.target.value)}
                            >
                                <option value="">Select…</option>
                                {transporters.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </Select>
                        </Field>
                        <Field label="Driver name *">
                            <Input
                                value={driverName}
                                onChange={(e) => setDriverName(e.target.value)}
                            />
                        </Field>
                        <Field label="Driver phone">
                            <Input
                                value={driverPhone}
                                onChange={(e) => setDriverPhone(e.target.value)}
                                placeholder="+91 …"
                            />
                        </Field>
                        <Field label="Licence number" className="sm:col-span-2">
                            <Input
                                value={licence}
                                onChange={(e) => setLicence(e.target.value)}
                            />
                        </Field>
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
                    <Button
                        type="button"
                        disabled={!canSubmit}
                        onClick={() => onSubmit(registration)}
                    >
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function Field({
    label,
    children,
    className,
}: {
    label: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`space-y-1 ${className ?? ''}`}>
            <label className="text-xs font-semibold uppercase text-slate-500">
                {label}
            </label>
            {children}
        </div>
    );
}
