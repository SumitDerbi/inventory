import type { CustomerInvoiceStatus } from '@/mocks/customer-invoices';

export interface CustomerInvoiceFilterValue {
    search: string;
    status: '' | CustomerInvoiceStatus;
    customerId: string;
    fromDate: string;
    toDate: string;
    onlyOutstanding: boolean;
}

export const EMPTY_FILTER: CustomerInvoiceFilterValue = {
    search: '',
    status: '',
    customerId: '',
    fromDate: '',
    toDate: '',
    onlyOutstanding: false,
};

export function applyInvoiceFilters<T extends {
    invoiceNumber: string;
    customerName: string;
    customerId: string;
    salesOrderNumber: string | null;
    invoiceDate: string;
    status: CustomerInvoiceStatus;
    balance: number;
}>(rows: T[], v: CustomerInvoiceFilterValue): T[] {
    const q = v.search.trim().toLowerCase();
    const from = v.fromDate ? new Date(v.fromDate).getTime() : null;
    const to = v.toDate ? new Date(v.toDate).getTime() + 86400000 : null;
    return rows.filter((r) => {
        if (v.status && r.status !== v.status) return false;
        if (v.customerId && r.customerId !== v.customerId) return false;
        if (v.onlyOutstanding && r.balance <= 0) return false;
        const t = new Date(r.invoiceDate).getTime();
        if (from !== null && t < from) return false;
        if (to !== null && t > to) return false;
        if (q) {
            const hay = `${r.invoiceNumber} ${r.customerName} ${r.salesOrderNumber ?? ''}`.toLowerCase();
            if (!hay.includes(q)) return false;
        }
        return true;
    });
}
