import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    approveQuotation,
    cloneQuotation,
    convertToOrder,
    createItem,
    createQuotation,
    deleteItem,
    deleteQuotation,
    getQuotation,
    listActivity,
    listApprovalSteps,
    listCommunications,
    listItems,
    listQuotations,
    listVersions,
    newVersion,
    rejectQuotation,
    sendQuotation,
    submitForApproval,
    updateItem,
    updateQuotation,
    type ListQuotationsParams,
    type QuotationItemWritePayload,
    type QuotationWritePayload,
    type SendQuotationPayload,
} from '@/services/quotations';

export const quotationKeys = {
    all: ['quotations'] as const,
    lists: () => [...quotationKeys.all, 'list'] as const,
    list: (params: ListQuotationsParams) => [...quotationKeys.lists(), params] as const,
    details: () => [...quotationKeys.all, 'detail'] as const,
    detail: (id: string | number) => [...quotationKeys.details(), String(id)] as const,
    items: (id: string | number) => [...quotationKeys.detail(id), 'items'] as const,
    activity: (id: string | number) => [...quotationKeys.detail(id), 'activity'] as const,
    communications: (id: string | number) =>
        [...quotationKeys.detail(id), 'communications'] as const,
    approvalSteps: (id: string | number) =>
        [...quotationKeys.detail(id), 'approval-steps'] as const,
    versions: (id: string | number) => [...quotationKeys.detail(id), 'versions'] as const,
};

function invalidateQuotation(qc: ReturnType<typeof useQueryClient>, id: string | number) {
    qc.invalidateQueries({ queryKey: quotationKeys.detail(id) });
    qc.invalidateQueries({ queryKey: quotationKeys.lists() });
}

export function useQuotationsQuery(params: ListQuotationsParams = {}) {
    return useQuery({
        queryKey: quotationKeys.list(params),
        queryFn: () => listQuotations(params),
        placeholderData: (prev) => prev,
    });
}

export function useQuotationQuery(id: string | number | undefined) {
    return useQuery({
        queryKey: id ? quotationKeys.detail(id) : ['quotations', 'detail', 'noop'],
        queryFn: () => getQuotation(id!),
        enabled: id != null && id !== '',
    });
}

export function useQuotationItems(id: string | number | undefined) {
    return useQuery({
        queryKey: id ? quotationKeys.items(id) : ['quotations', 'items', 'noop'],
        queryFn: () => listItems(id!),
        enabled: id != null && id !== '',
    });
}

export function useQuotationActivity(id: string | number | undefined) {
    return useQuery({
        queryKey: id ? quotationKeys.activity(id) : ['quotations', 'activity', 'noop'],
        queryFn: () => listActivity(id!),
        enabled: id != null && id !== '',
    });
}

export function useQuotationCommunications(id: string | number | undefined) {
    return useQuery({
        queryKey: id ? quotationKeys.communications(id) : ['quotations', 'comms', 'noop'],
        queryFn: () => listCommunications(id!),
        enabled: id != null && id !== '',
    });
}

export function useQuotationApprovalSteps(id: string | number | undefined) {
    return useQuery({
        queryKey: id ? quotationKeys.approvalSteps(id) : ['quotations', 'approvals', 'noop'],
        queryFn: () => listApprovalSteps(id!),
        enabled: id != null && id !== '',
    });
}

export function useQuotationVersions(id: string | number | undefined) {
    return useQuery({
        queryKey: id ? quotationKeys.versions(id) : ['quotations', 'versions', 'noop'],
        queryFn: () => listVersions(id!),
        enabled: id != null && id !== '',
    });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateQuotation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: QuotationWritePayload) => createQuotation(payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: quotationKeys.lists() });
        },
    });
}

export function useUpdateQuotation(id: string | number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: Partial<QuotationWritePayload>) => updateQuotation(id, payload),
        onSuccess: () => invalidateQuotation(qc, id),
    });
}

export function useDeleteQuotation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string | number) => deleteQuotation(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: quotationKeys.lists() });
        },
    });
}

export function useCreateQuotationItem(id: string | number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: QuotationItemWritePayload) => createItem(id, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: quotationKeys.items(id) });
            qc.invalidateQueries({ queryKey: quotationKeys.detail(id) });
            qc.invalidateQueries({ queryKey: quotationKeys.activity(id) });
        },
    });
}

export function useUpdateQuotationItem(quotationId: string | number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            itemId,
            payload,
        }: {
            itemId: string | number;
            payload: Partial<QuotationItemWritePayload>;
        }) => updateItem(itemId, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: quotationKeys.items(quotationId) });
            qc.invalidateQueries({ queryKey: quotationKeys.detail(quotationId) });
            qc.invalidateQueries({ queryKey: quotationKeys.activity(quotationId) });
        },
    });
}

export function useDeleteQuotationItem(quotationId: string | number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (itemId: string | number) => deleteItem(itemId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: quotationKeys.items(quotationId) });
            qc.invalidateQueries({ queryKey: quotationKeys.detail(quotationId) });
            qc.invalidateQueries({ queryKey: quotationKeys.activity(quotationId) });
        },
    });
}

export function useSubmitQuotationApproval(id: string | number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => submitForApproval(id),
        onSuccess: () => {
            invalidateQuotation(qc, id);
            qc.invalidateQueries({ queryKey: quotationKeys.activity(id) });
            qc.invalidateQueries({ queryKey: quotationKeys.approvalSteps(id) });
        },
    });
}

export function useApproveQuotation(id: string | number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (comments?: string) => approveQuotation(id, comments),
        onSuccess: () => {
            invalidateQuotation(qc, id);
            qc.invalidateQueries({ queryKey: quotationKeys.activity(id) });
            qc.invalidateQueries({ queryKey: quotationKeys.approvalSteps(id) });
        },
    });
}

export function useRejectQuotation(id: string | number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (comments: string) => rejectQuotation(id, comments),
        onSuccess: () => {
            invalidateQuotation(qc, id);
            qc.invalidateQueries({ queryKey: quotationKeys.activity(id) });
            qc.invalidateQueries({ queryKey: quotationKeys.approvalSteps(id) });
        },
    });
}

export function useSendQuotation(id: string | number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: SendQuotationPayload) => sendQuotation(id, payload),
        onSuccess: () => {
            invalidateQuotation(qc, id);
            qc.invalidateQueries({ queryKey: quotationKeys.communications(id) });
            qc.invalidateQueries({ queryKey: quotationKeys.activity(id) });
        },
    });
}

export function useCloneQuotation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string | number) => cloneQuotation(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: quotationKeys.lists() });
        },
    });
}

export function useNewQuotationVersion(id: string | number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => newVersion(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: quotationKeys.lists() });
            qc.invalidateQueries({ queryKey: quotationKeys.versions(id) });
        },
    });
}

export function useConvertQuotationToOrder(id: string | number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => convertToOrder(id),
        onSuccess: () => {
            invalidateQuotation(qc, id);
            qc.invalidateQueries({ queryKey: quotationKeys.activity(id) });
        },
    });
}
