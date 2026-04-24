import { useMemo, useState } from 'react';
import { Plus, Star, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/ui/FilterBar';
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { Input, Textarea } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { transporters } from '@/mocks/transporters';

export default function TransportersPage() {
    const { push } = useToast();
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return transporters;
        return transporters.filter((t) =>
            `${t.name} ${t.code} ${t.contactPerson} ${t.serviceCities.join(' ')}`
                .toLowerCase()
                .includes(q),
        );
    }, [search]);

    return (
        <>
            <FilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search transporter, contact or city…"
                actions={
                    <Button size="sm" onClick={() => setOpen(true)}>
                        <Plus className="size-4" aria-hidden="true" />
                        New transporter
                    </Button>
                }
            />

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {rows.map((t) => (
                    <article
                        key={t.id}
                        className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-800">
                                    {t.name}
                                </p>
                                <p className="font-mono text-xs text-slate-500">
                                    {t.code}
                                </p>
                            </div>
                            <RatingBadge rating={t.rating} />
                        </div>
                        <dl className="mt-3 space-y-1.5 text-xs">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Phone
                                    className="size-3.5 text-slate-400"
                                    aria-hidden="true"
                                />
                                <span>{t.contactPerson} · {t.phone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                                <Mail
                                    className="size-3.5 text-slate-400"
                                    aria-hidden="true"
                                />
                                <span className="truncate">{t.email}</span>
                            </div>
                        </dl>
                        <div className="mt-3 flex flex-wrap gap-1">
                            {t.serviceCities.map((c) => (
                                <span
                                    key={c}
                                    className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                                >
                                    {c}
                                </span>
                            ))}
                        </div>
                        <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs">
                            <div>
                                <dt className="text-slate-400">On-time</dt>
                                <dd
                                    className={cn(
                                        'font-semibold',
                                        t.onTimePct >= 90
                                            ? 'text-emerald-600'
                                            : t.onTimePct >= 80
                                                ? 'text-amber-600'
                                                : 'text-red-600',
                                    )}
                                >
                                    {t.onTimePct}%
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-400">Active shipments</dt>
                                <dd className="font-semibold text-slate-700">
                                    {t.activeShipments}
                                </dd>
                            </div>
                        </dl>
                        {t.notes && (
                            <p className="mt-3 text-xs italic text-slate-500">
                                {t.notes}
                            </p>
                        )}
                    </article>
                ))}
            </div>

            {rows.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
                    No transporters match this search.
                </div>
            )}

            <p className="mt-3 text-xs text-slate-500">
                Showing {rows.length} of {transporters.length} transporters.
            </p>

            <TransporterDialog
                open={open}
                onOpenChange={setOpen}
                onSubmit={(name) => {
                    setOpen(false);
                    push({
                        variant: 'success',
                        title: 'Transporter added',
                        description: name,
                    });
                }}
            />
        </>
    );
}

function RatingBadge({ rating }: { rating: 1 | 2 | 3 | 4 | 5 }) {
    return (
        <Badge
            tone={rating >= 4 ? 'emerald' : rating === 3 ? 'amber' : 'red'}
            className="gap-0.5"
        >
            <Star className="size-3" aria-hidden="true" />
            {rating}.0
        </Badge>
    );
}

function TransporterDialog({
    open,
    onOpenChange,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    onSubmit: (name: string) => void;
}) {
    const [name, setName] = useState('');
    const [contact, setContact] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [cities, setCities] = useState('');
    const [notes, setNotes] = useState('');

    const canSubmit =
        name.trim().length >= 2 && phone.trim().length >= 8 && contact.trim();

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                onOpenChange(o);
                if (!o) {
                    setName('');
                    setContact('');
                    setPhone('');
                    setEmail('');
                    setCities('');
                    setNotes('');
                }
            }}
        >
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>New transporter</DialogTitle>
                    <DialogDescription>
                        Add a transporter to the master list.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody className="space-y-3">
                    <Field label="Company name *">
                        <Input value={name} onChange={(e) => setName(e.target.value)} />
                    </Field>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Contact person *">
                            <Input
                                value={contact}
                                onChange={(e) => setContact(e.target.value)}
                            />
                        </Field>
                        <Field label="Phone *">
                            <Input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+91 …"
                            />
                        </Field>
                    </div>
                    <Field label="Email">
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </Field>
                    <Field label="Service cities (comma separated)">
                        <Input
                            value={cities}
                            onChange={(e) => setCities(e.target.value)}
                            placeholder="Ahmedabad, Surat, Vadodara"
                        />
                    </Field>
                    <Field label="Notes">
                        <Textarea
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </Field>
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
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-slate-500">
                {label}
            </label>
            {children}
        </div>
    );
}
