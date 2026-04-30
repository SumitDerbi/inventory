import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    addItem,
    bulkAssign,
    bulkExport,
    bulkReady,
    deleteItem,
    dispatchItems,
    getMrp,
    getOrder,
    listOrders,
    releaseStock,
    reserveStock,
    transitionStage,
    updateItem,
    type DispatchItemPayload,
    type ListOrdersParams,
    type OrderApiStatus,
    type OrderItemWritePayload,
} from '@/services/orders';

export const orderKeys = {
    all: ['orders'] as const,
    lists: () => [...orderKeys.all, 'list'] as const,
    list: (params: ListOrdersParams) => [...orderKeys.lists(), params] as const,
    details: () => [...orderKeys.all, 'detail'] as const,
    detail: (id: string | number) => [...orderKeys.details(), String(id)] as const,
    mrp: (id: string | number) => [...orderKeys.detail(id), 'mrp'] as const,
};

function invalidateOrder(qc: ReturnType<typeof useQueryClient>, id: string | number) {
    qc.invalidateQueries({ queryKey: orderKeys.detail(id) });
    qc.invalidateQueries({ queryKey: orderKeys.lists() });
}

export function useOrdersQuery(params: ListOrdersParams = {}) {
    return useQuery({
        queryKey: orderKeys.list(params),
        queryFn: () => listOrders(params),
        placeholderData: (prev) => prev,
    });
}

export function useOrderQuery(id: string | number | undefined) {
    return useQuery({
        queryKey: id ? orderKeys.detail(id) : ['orders', 'detail', 'noop'],
        queryFn: () => getOrder(id!),
        enabled: id != null && id !== '',
    });
}

export function useOrderMrp(id: string | number | undefined) {
    return useQuery({
        queryKey: id ? orderKeys.mrp(id) : ['orders', 'mrp', 'noop'],
        queryFn: () => getMrp(id!),
        enabled: id != null && id !== '',
    });
}

export function useAddOrderItem(orderId: string | number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: OrderItemWritePayload) => addItem(orderId, payload),
        onSuccess: () => invalidateOrder(qc, orderId),
    });
}

export function useUpdateOrderItem(orderId: string | number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: string | number; payload: Partial<OrderItemWritePayload> }) =>
            updateItem(id, payload),
        onSuccess: () => invalidateOrder(qc, orderId),
    });
}

export function useDeleteOrderItem(orderId: string | number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string | number) => deleteItem(id),
        onSuccess: () => invalidateOrder(qc, orderId),
    });
}

export function useTransitionStage(orderId: string | number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ nextStage, cancellationReason }: { nextStage: OrderApiStatus; cancellationReason?: string }) =>
            transitionStage(orderId, nextStage, cancellationReason),
        onSuccess: () => invalidateOrder(qc, orderId),
    });
}

export function useReserveStock(orderId: string | number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (warehouseId: string | number) => reserveStock(orderId, warehouseId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: orderKeys.mrp(orderId) });
            invalidateOrder(qc, orderId);
        },
    });
}

export function useReleaseStock(orderId: string | number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => releaseStock(orderId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: orderKeys.mrp(orderId) });
            invalidateOrder(qc, orderId);
        },
    });
}

export function useDispatchItems(orderId: string | number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (items: DispatchItemPayload[]) => dispatchItems(orderId, items),
        onSuccess: () => invalidateOrder(qc, orderId),
    });
}

export function useBulkAssignOrders() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ ids, assignedSalesExecId }: { ids: Array<string | number>; assignedSalesExecId: string | number }) =>
            bulkAssign(ids, assignedSalesExecId),
        onSuccess: () => qc.invalidateQueries({ queryKey: orderKeys.lists() }),
    });
}

export function useBulkReadyOrders() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (ids: Array<string | number>) => bulkReady(ids),
        onSuccess: () => qc.invalidateQueries({ queryKey: orderKeys.lists() }),
    });
}

export function useBulkExportOrders() {
    return useMutation({
        mutationFn: (ids: Array<string | number>) => bulkExport(ids),
    });
}
