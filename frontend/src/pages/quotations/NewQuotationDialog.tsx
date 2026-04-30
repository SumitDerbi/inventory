import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Search } from 'lucide-react';
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
import { FormField, Input } from '@/components/ui/FormField';
import { useToast } from '@/components/ui/Toast';
import { extractErrorMessage } from '@/services/apiClient';
import { searchCustomers, type CustomerOption } from '@/services/customers';
import { useCreateQuotation } from '@/hooks/useQuotations';

function todayIso(): string {
    return new Date().toISOString().slice(0, 10);
}

function plusDaysIso(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

export function NewQuotationDialog({ onClose }: { onClose: () => void }) {
    const { push } = useToast();
    const navigate = useNavigate();
    const create = useCreateQuotation();

    const [customer, setCustomer] = useState<CustomerOption | null>(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [debounced, setDebounced] = useState('');
    const [projectName, setProjectName] = useState('');
    const [quotationDate, setQuotationDate] = useState(todayIso());
    const [validUntil, setValidUntil] = useState(plusDaysIso(30));

    useEffect(() => {
        const id = setTimeout(() => setDebounced(customerSearch.trim()), 250);
        return () => clearTimeout(id);
    }, [customerSearch]);

    const optionsQuery = useQuery({
        queryKey: ['customers', 'lookup', debounced],
        queryFn: () => searchCustomers(debounced, 8),
        enabled: !customer,
    });

    async function submit() {
        if (!customer) return;
        try {
            const created = await create.mutateAsync({
                customerId: customer.id,
                projectName: projectName.trim() || undefined,
                quotationDate,
                validUntil,
            });
            push({
                variant: 'success',
                title: 'Quotation created',
                description: created.quotationNumber,
            });
            onClose();
            navigate(`/quotations/${created.id}`);
        } catch (e) {
            push({
                variant: 'error',
                title: 'Could not create quotation',
                description: extractErrorMessage(e),
            });
        }
    }

    const canSubmit = !!customer && !!quotationDate && !!validUntil && !create.isPending;

    return (
        <Dialog open onOpenChange={(o) => (!o ? onClose() : undefined)}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>New quotation</DialogTitle>
                    <DialogDescription>
                        Pick a customer to start a draft. Add line items and terms after creation.
                    </DialogDescription>
                </DialogHeader>
                <DialogBody className="space-y-3">
                    <FormField label="Customer" required>
                        {customer ? (
                            <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                                <div>
                                    <div className="font-medium text-slate-900">
                                        {customer.companyName || customer.contactPersonName || `#${customer.id}`}
                                    </div>
                                    {customer.contactPersonName && customer.companyName && (
                                        <div className="text-xs text-slate-500">{customer.contactPersonName}</div>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setCustomer(null);
                                        setCustomerSearch('');
                                    }}
                                >
                                    Change
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="relative">
                                    <Search
                                        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                                        aria-hidden="true"
                                    />
                                    <Input
                                        autoFocus
                                        className="pl-9"
                                        placeholder="Search by company, contact, mobile, email…"
                                        value={customerSearch}
                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                    />
                                </div>
                                <div className="max-h-56 overflow-auto rounded-md border border-slate-200 bg-white">
                                    {optionsQuery.isLoading ? (
                                        <div className="p-3 text-sm text-slate-500">Loading…</div>
                                    ) : optionsQuery.isError ? (
                                        <div className="p-3 text-sm text-red-600">
                                            {extractErrorMessage(optionsQuery.error)}
                                        </div>
                                    ) : (optionsQuery.data ?? []).length === 0 ? (
                                        <div className="p-3 text-sm text-slate-500">No matches</div>
                                    ) : (
                                        <ul className="divide-y divide-slate-100">
                                            {(optionsQuery.data ?? []).map((opt) => (
                                                <li key={opt.id}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setCustomer(opt)}
                                                        className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-slate-50"
                                                    >
                                                        <span className="font-medium text-slate-900">
                                                            {opt.companyName || opt.contactPersonName || `#${opt.id}`}
                                                        </span>
                                                        <span className="text-xs text-slate-500">
                                                            {[opt.contactPersonName, opt.mobile, opt.city]
                                                                .filter(Boolean)
                                                                .join(' • ')}
                                                        </span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        )}
                    </FormField>

                    <FormField label="Project name">
                        <Input
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="e.g. Phase 1 Pumps"
                        />
                    </FormField>

                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Quotation date" required>
                            <Input
                                type="date"
                                value={quotationDate}
                                onChange={(e) => setQuotationDate(e.target.value)}
                            />
                        </FormField>
                        <FormField label="Valid until" required>
                            <Input
                                type="date"
                                value={validUntil}
                                onChange={(e) => setValidUntil(e.target.value)}
                            />
                        </FormField>
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={create.isPending}>
                        Cancel
                    </Button>
                    <Button onClick={submit} disabled={!canSubmit}>
                        {create.isPending && (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        )}
                        Create draft
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
