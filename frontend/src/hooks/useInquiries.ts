import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    assignInquiry,
    bulkAssignInquiries,
    bulkChangeStatus,
    bulkExportInquiries,
    changeInquiryStatus,
    convertInquiryToQuotation,
    createFollowUp,
    createInquiry,
    createLineItem,
    deleteFollowUp,
    deleteInquiry,
    deleteLineItem,
    getInquiry,
    getInquiryStats,
    listActivity,
    listFollowUps,
    listInquirySources,
    listInquiries,
    listLineItems,
    updateFollowUp,
    updateInquiry,
    updateLineItem,
    type FollowUpWritePayload,
    type InquiryWritePayload,
    type LineItemWritePayload,
    type ListInquiriesParams,
} from '@/services/inquiries';
import type { InquiryStatus } from '@/lib/inquiryStatus';

export const inquiryKeys = {
    all: ['inquiries'] as const,
    lists: () => [...inquiryKeys.all, 'list'] as const,
    list: (params: ListInquiriesParams) => [...inquiryKeys.lists(), params] as const,
    details: () => [...inquiryKeys.all, 'detail'] as const,
    detail: (id: string | number) => [...inquiryKeys.details(), String(id)] as const,
    followUps: (id: string | number) => [...inquiryKeys.detail(id), 'follow-ups'] as const,
    items: (id: string | number) => [...inquiryKeys.detail(id), 'items'] as const,
    activity: (id: string | number) => [...inquiryKeys.detail(id), 'activity'] as const,
    stats: () => [...inquiryKeys.all, 'stats'] as const,
    sources: () => ['inquiry-sources'] as const,
};

export function useInquiriesQuery(params: ListInquiriesParams = {}) {
    return useQuery({
        queryKey: inquiryKeys.list(params),
        queryFn: () => listInquiries(params),
        placeholderData: (prev) => prev,
    });
}

export function useInquiryQuery(id: string | number | undefined) {
    return useQuery({
        queryKey: id ? inquiryKeys.detail(id) : ['inquiries', 'detail', 'noop'],
        queryFn: () => getInquiry(id!),
        enabled: id != null && id !== '',
    });
}

export function useInquiryFollowUps(id: string | number | undefined) {
    return useQuery({
        queryKey: id ? inquiryKeys.followUps(id) : ['inquiries', 'follow-ups', 'noop'],
        queryFn: () => listFollowUps(id!),
        enabled: id != null && id !== '',
    });
}

export function useInquiryLineItems(id: string | number | undefined) {
    return useQuery({
        queryKey: id ? inquiryKeys.items(id) : ['inquiries', 'items', 'noop'],
        queryFn: () => listLineItems(id!),
        enabled: id != null && id !== '',
    });
}

export function useInquiryActivity(id: string | number | undefined) {
    return useQuery({
        queryKey: id ? inquiryKeys.activity(id) : ['inquiries', 'activity', 'noop'],
        queryFn: () => listActivity(id!),
        enabled: id != null && id !== '',
    });
}

export function useInquiryStats() {
    return useQuery({
        queryKey: inquiryKeys.stats(),
        queryFn: getInquiryStats,
    });
}

export function useInquirySources() {
    return useQuery({
        queryKey: inquiryKeys.sources(),
        queryFn: listInquirySources,
        staleTime: 5 * 60_000,
    });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateInquiry() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ payload, force }: { payload: InquiryWritePayload; force?: boolean }) =>
            createInquiry(payload, { force }),
        onSuccess: (result) => {
            if (result.inquiry) {
                qc.invalidateQueries({ queryKey: inquiryKeys.lists() });
                qc.invalidateQueries({ queryKey: inquiryKeys.stats() });
            }
        },
    });
}

export function useUpdateInquiry(id: string | number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: Partial<InquiryWritePayload>) => updateInquiry(id, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: inquiryKeys.detail(id) });
            qc.invalidateQueries({ queryKey: inquiryKeys.lists() });
        },
    });
}

export function useDeleteInquiry() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string | number) => deleteInquiry(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: inquiryKeys.lists() });
            qc.invalidateQueries({ queryKey: inquiryKeys.stats() });
        },
    });
}

export function useAssignInquiry(id: string | number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (userId: string | number) => assignInquiry(id, userId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: inquiryKeys.detail(id) });
            qc.invalidateQueries({ queryKey: inquiryKeys.activity(id) });
            qc.invalidateQueries({ queryKey: inquiryKeys.lists() });
        },
    });
}

export function useChangeInquiryStatus(id: string | number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ status, lostReason }: { status: InquiryStatus; lostReason?: string }) =>
            changeInquiryStatus(id, status, lostReason),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: inquiryKeys.detail(id) });
            qc.invalidateQueries({ queryKey: inquiryKeys.activity(id) });
            qc.invalidateQueries({ queryKey: inquiryKeys.lists() });
            qc.invalidateQueries({ queryKey: inquiryKeys.stats() });
        },
    });
}

export function useConvertInquiry(id: string | number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => convertInquiryToQuotation(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: inquiryKeys.detail(id) });
            qc.invalidateQueries({ queryKey: inquiryKeys.lists() });
        },
    });
}

export function useCreateFollowUp(inquiryId: string | number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: FollowUpWritePayload) => createFollowUp(inquiryId, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: inquiryKeys.followUps(inquiryId) });
            qc.invalidateQueries({ queryKey: inquiryKeys.activity(inquiryId) });
        },
    });
}

export function useUpdateFollowUp(inquiryId: string | number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            patch,
        }: {
            id: string | number;
            patch: Parameters<typeof updateFollowUp>[1];
        }) => updateFollowUp(id, patch),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: inquiryKeys.followUps(inquiryId) });
            qc.invalidateQueries({ queryKey: inquiryKeys.activity(inquiryId) });
        },
    });
}

export function useDeleteFollowUp(inquiryId: string | number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string | number) => deleteFollowUp(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: inquiryKeys.followUps(inquiryId) });
            qc.invalidateQueries({ queryKey: inquiryKeys.activity(inquiryId) });
        },
    });
}

export function useCreateLineItem(inquiryId: string | number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: LineItemWritePayload) => createLineItem(inquiryId, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: inquiryKeys.items(inquiryId) });
            qc.invalidateQueries({ queryKey: inquiryKeys.detail(inquiryId) });
            qc.invalidateQueries({ queryKey: inquiryKeys.activity(inquiryId) });
        },
    });
}

export function useUpdateLineItem(inquiryId: string | number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string | number;
            payload: Partial<LineItemWritePayload>;
        }) => updateLineItem(id, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: inquiryKeys.items(inquiryId) });
            qc.invalidateQueries({ queryKey: inquiryKeys.detail(inquiryId) });
            qc.invalidateQueries({ queryKey: inquiryKeys.activity(inquiryId) });
        },
    });
}

export function useDeleteLineItem(inquiryId: string | number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string | number) => deleteLineItem(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: inquiryKeys.items(inquiryId) });
            qc.invalidateQueries({ queryKey: inquiryKeys.detail(inquiryId) });
            qc.invalidateQueries({ queryKey: inquiryKeys.activity(inquiryId) });
        },
    });
}

export function useBulkAssignInquiries() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ ids, userId }: { ids: Array<string | number>; userId: string | number }) =>
            bulkAssignInquiries(ids, userId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: inquiryKeys.lists() });
        },
    });
}

export function useBulkChangeStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            ids,
            status,
            lostReason,
        }: {
            ids: Array<string | number>;
            status: InquiryStatus;
            lostReason?: string;
        }) => bulkChangeStatus(ids, status, lostReason),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: inquiryKeys.lists() });
            qc.invalidateQueries({ queryKey: inquiryKeys.stats() });
        },
    });
}

export function useBulkExport() {
    return useMutation({
        mutationFn: ({
            ids,
            format,
        }: {
            ids: Array<string | number>;
            format?: 'csv' | 'xlsx' | 'pdf';
        }) => bulkExportInquiries(ids, format),
    });
}
