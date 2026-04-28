import { Search } from 'lucide-react';
import { Input, Select } from '@/components/ui/FormField';
import { customers } from '@/mocks/customers';
import {
    INVOICE_STATUS_LABEL,
    type CustomerInvoiceStatus,
} from '@/mocks/customer-invoices';
import type { CustomerInvoiceFilterValue } from './invoice-filter';

export interface CustomerInvoiceFilterBarProps {
    value: CustomerInvoiceFilterValue;
    onChange: (next: CustomerInvoiceFilterValue) => void;
    showCustomerFilter?: boolean;
}

export function CustomerInvoiceFilterBar({
    value,
    onChange,
    showCustomerFilter = true,
}: CustomerInvoiceFilterBarProps) {
    function patch(p: Partial<CustomerInvoiceFilterValue>) {
        onChange({ ...value, ...p });
    }

    return (
        <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" />
                <Input
                    type="search"
                    placeholder="Search invoices"
                    value={value.search}
                    onChange={(e) => patch({ search: e.target.value })}
                    className="pl-9"
                />
            </div>
            <Select
                value={value.status}
                onChange={(e) => patch({ status: e.target.value as CustomerInvoiceFilterValue['status'] })}
                className="w-40"
            >
                <option value="">All statuses</option>
                {(Object.keys(INVOICE_STATUS_LABEL) as CustomerInvoiceStatus[]).map((s) => (
                    <option key={s} value={s}>{INVOICE_STATUS_LABEL[s]}</option>
                ))}
            </Select>
            {showCustomerFilter && (
                <Select
                    value={value.customerId}
                    onChange={(e) => patch({ customerId: e.target.value })}
                    className="w-56"
                >
                    <option value="">All customers</option>
                    {customers.map((c) => (
                        <option key={c.id} value={c.id}>{c.legalName ?? c.name}</option>
                    ))}
                </Select>
            )}
            <Input
                type="date"
                value={value.fromDate}
                onChange={(e) => patch({ fromDate: e.target.value })}
                aria-label="From date"
                className="w-40"
            />
            <Input
                type="date"
                value={value.toDate}
                onChange={(e) => patch({ toDate: e.target.value })}
                aria-label="To date"
                className="w-40"
            />
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                <input
                    type="checkbox"
                    checked={value.onlyOutstanding}
                    onChange={(e) => patch({ onlyOutstanding: e.target.checked })}
                />
                Outstanding only
            </label>
        </div>
    );
}
