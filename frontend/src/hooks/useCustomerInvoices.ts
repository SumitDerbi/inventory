import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    addItem,
    bulkExport,
    bulkSend,
    cancelInvoice,
    createFromOrder,
    deleteItem,
    finaliseInvoice,
    getAging,
    getInvoice,
    listInvoices,
    listInvoicesForOrder,
    updateItem,
    type InvoiceItemWritePayload,
    type InvoiceTypeApi,
    type ListInvoicesParams,
} from '@/services/customer-invoices';

export const invoiceKeys = {
    all: ['customer-invoices'] as const,
    lists: () => [...invoiceKeys.all, 'list'] as const,
    list: (params: ListInvoicesParams) => [...invoiceKeys.lists(), params] as const,
    details: () => [...invoiceKeys.all, 'detail'] as const,
    detail: (id: string | number) => [...invoiceKeys.details(), String(id)] as const,
    forOrder: (orderId: string | number) =>
        [...invoiceKeys.all, 'order', String(orderId)] as const,
    aging: () => [...invoiceKeys.all, 'aging'] as const,
};

function invalidateInvoice(
    qc: ReturnType<typeof useQueryClient>,
    id: string | number,
    orderId?: string | number | null,
) {
    qc.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
    qc.invalidateQueries({ queryKey: invoiceKeys.lists() });
    qc.invalidateQueries({ queryKey: invoiceKeys.aging() });
    if (orderId) qc.invalidateQueries({ queryKey: invoiceKeys.forOrder(orderId) });
}

export function useInvoicesQuery(params: ListInvoicesParams = {}) {
    return useQuery({
        queryKey: invoiceKeys.list(params),
        queryFn: () => listInvoices(params),
        placeholderData: (prev) => prev,
    });
}

export function useInvoiceQuery(id: string | number | undefined) {
    return useQuery({
        queryKey: id ? invoiceKeys.detail(id) : ['customer-invoices', 'detail', 'noop'],
        queryFn: () => getInvoice(id!),
        enabled: id != null && id !== '',
    });
}

export function useInvoicesForOrderQuery(orderId: string | number | undefined) {
    return useQuery({
        queryKey: orderId
            ? invoiceKeys.forOrder(orderId)
            : ['customer-invoices', 'order', 'noop'],
        queryFn: () => listInvoicesForOrder(orderId!),
        enabled: orderId != null && orderId !== '',
    });
}

export function useInvoiceAgingQuery() {
    return useQuery({
        queryKey: invoiceKeys.aging(),
        queryFn: () => getAging(),
    });
}

export function useCreateInvoiceFromOrder(orderId: string | number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (invoiceType: InvoiceTypeApi = 'tax_invoice') =>
            createFromOrder(orderId, invoiceType),
        onSuccess: (inv) => invalidateInvoice(qc, inv.id, orderId),
    });
}

export function useAddInvoiceItem(invoiceId: string | number, orderId?: string | null) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: InvoiceItemWritePayload) => addItem(invoiceId, payload),
        onSuccess: () => invalidateInvoice(qc, invoiceId, orderId),
    });
}

export function useUpdateInvoiceItem(invoiceId: string | number, orderId?: string | null) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string | number;
            payload: Partial<InvoiceItemWritePayload>;
        }) => updateItem(id, payload),
        onSuccess: () => invalidateInvoice(qc, invoiceId, orderId),
    });
}

export function useDeleteInvoiceItem(invoiceId: string | number, orderId?: string | null) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string | number) => deleteItem(id),
        onSuccess: () => invalidateInvoice(qc, invoiceId, orderId),
    });
}

export function useFinaliseInvoice(orderId?: string | null) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string | number) => finaliseInvoice(id),
        onSuccess: (inv) => invalidateInvoice(qc, inv.id, orderId ?? inv.orderId),
    });
}

export function useCancelInvoice(orderId?: string | null) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason }: { id: string | number; reason: string }) =>
            cancelInvoice(id, reason),
        onSuccess: (inv) => invalidateInvoice(qc, inv.id, orderId ?? inv.orderId),
    });
}

export function useBulkExportInvoices() {
    return useMutation({
        mutationFn: (ids: Array<string | number>) => bulkExport(ids),
    });
}

export function useBulkSendInvoices() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (ids: Array<string | number>) => bulkSend(ids),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: invoiceKeys.lists() });
            qc.invalidateQueries({ queryKey: invoiceKeys.aging() });
        },
    });
}
