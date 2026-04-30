import { apiClient, type PageResponse } from './apiClient';

// ---------------------------------------------------------------------------
// Domain types (camelCase) — aligned with backend Orders app
// ---------------------------------------------------------------------------

export type OrderApiStatus =
    | 'draft'
    | 'confirmed'
    | 'processing'
    | 'ready_to_dispatch'
    | 'partially_dispatched'
    | 'fully_dispatched'
    | 'installed'
    | 'closed'
    | 'cancelled';

export interface OrderItem {
    id: string;
    orderId: string;
    productId: string | null;
    productDescription: string;
    quantityOrdered: number;
    quantityDispatched: number;
    quantityPending: number;
    unit: string;
    unitPrice: number;
    discountPercent: number;
    taxRuleId: string | null;
    lineTotal: number;
    status: string;
    notes: string;
}

export interface SalesOrder {
    id: string;
    orderNumber: string;
    quotationId: string | null;
    customerId: string;
    contactId: string | null;
    projectName: string;
    orderDate: string;
    status: OrderApiStatus;
    confirmedAt: string | null;
    confirmedById: string | null;
    cancellationReason: string;
    assignedSalesExecId: string | null;
    subtotal: number;
    totalDiscount: number;
    totalTax: number;
    freightAmount: number;
    grandTotal: number;
    items: OrderItem[];
    createdAt: string;
    updatedAt: string;
}

export interface SalesOrderListItem {
    id: string;
    orderNumber: string;
    customerId: string;
    customerName: string;
    companyName: string;
    projectName: string;
    status: OrderApiStatus;
    orderDate: string;
    grandTotal: number;
    assignedSalesExecId: string | null;
    createdAt: string;
}

// ---------------------------------------------------------------------------
// Raw API shapes
// ---------------------------------------------------------------------------

interface ApiOrderItem {
    id: number;
    order: number;
    product: number | null;
    product_description: string;
    quantity_ordered: number | string;
    quantity_dispatched: number | string;
    quantity_pending: number | string;
    unit: string;
    unit_price: number | string;
    discount_percent: number | string;
    tax_rule: number | null;
    line_total: number | string;
    status: string;
    notes: string;
}

interface ApiSalesOrder {
    id: number;
    order_number: string;
    quotation: number | null;
    customer: number;
    contact: number | null;
    project_name: string;
    order_date: string;
    status: OrderApiStatus;
    confirmed_at: string | null;
    confirmed_by: number | null;
    cancellation_reason: string;
    assigned_sales_exec: number | null;
    subtotal: number | string;
    total_discount: number | string;
    total_tax: number | string;
    freight_amount: number | string;
    grand_total: number | string;
    items: ApiOrderItem[];
    created_at: string;
    updated_at: string;
}

interface ApiSalesOrderList {
    id: number;
    order_number: string;
    customer: number;
    customer_name?: string;
    company_name?: string;
    project_name: string;
    status: OrderApiStatus;
    order_date: string;
    grand_total: number | string;
    assigned_sales_exec: number | null;
    created_at: string;
}

const toNum = (v: number | string | null | undefined) => Number(v ?? 0);
const toStr = (v: number | null) => (v == null ? null : String(v));

export function fromApiItem(api: ApiOrderItem): OrderItem {
    return {
        id: String(api.id),
        orderId: String(api.order),
        productId: toStr(api.product),
        productDescription: api.product_description ?? '',
        quantityOrdered: toNum(api.quantity_ordered),
        quantityDispatched: toNum(api.quantity_dispatched),
        quantityPending: toNum(api.quantity_pending),
        unit: api.unit ?? '',
        unitPrice: toNum(api.unit_price),
        discountPercent: toNum(api.discount_percent),
        taxRuleId: toStr(api.tax_rule),
        lineTotal: toNum(api.line_total),
        status: api.status,
        notes: api.notes ?? '',
    };
}

export function fromApiOrder(api: ApiSalesOrder): SalesOrder {
    return {
        id: String(api.id),
        orderNumber: api.order_number,
        quotationId: toStr(api.quotation),
        customerId: String(api.customer),
        contactId: toStr(api.contact),
        projectName: api.project_name ?? '',
        orderDate: api.order_date,
        status: api.status,
        confirmedAt: api.confirmed_at,
        confirmedById: toStr(api.confirmed_by),
        cancellationReason: api.cancellation_reason ?? '',
        assignedSalesExecId: toStr(api.assigned_sales_exec),
        subtotal: toNum(api.subtotal),
        totalDiscount: toNum(api.total_discount),
        totalTax: toNum(api.total_tax),
        freightAmount: toNum(api.freight_amount),
        grandTotal: toNum(api.grand_total),
        items: (api.items ?? []).map(fromApiItem),
        createdAt: api.created_at,
        updatedAt: api.updated_at,
    };
}

export function fromApiList(api: ApiSalesOrderList): SalesOrderListItem {
    return {
        id: String(api.id),
        orderNumber: api.order_number,
        customerId: String(api.customer),
        customerName: api.customer_name ?? '',
        companyName: api.company_name ?? '',
        projectName: api.project_name ?? '',
        status: api.status,
        orderDate: api.order_date,
        grandTotal: toNum(api.grand_total),
        assignedSalesExecId: toStr(api.assigned_sales_exec),
        createdAt: api.created_at,
    };
}

// ---------------------------------------------------------------------------
// List / detail
// ---------------------------------------------------------------------------

export interface ListOrdersParams {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: OrderApiStatus | '';
    customer?: string;
    quotation?: string;
    assignedSalesExec?: string;
    ordering?: string;
}

export interface OrdersPage {
    results: SalesOrderListItem[];
    count: number;
    next: string | null;
    previous: string | null;
}

export async function listOrders(params: ListOrdersParams = {}): Promise<OrdersPage> {
    const query: Record<string, string | number> = {};
    if (params.page) query.page = params.page;
    if (params.pageSize) query.page_size = params.pageSize;
    if (params.search) query.search = params.search;
    if (params.status) query.status = params.status;
    if (params.customer) query.customer = params.customer;
    if (params.quotation) query.quotation = params.quotation;
    if (params.assignedSalesExec) query.assigned_sales_exec = params.assignedSalesExec;
    if (params.ordering) query.ordering = params.ordering;
    const res = await apiClient.get<PageResponse<ApiSalesOrderList>>('/orders/', {
        params: query,
    });
    return {
        results: res.data.results.map(fromApiList),
        count: res.data.count,
        next: res.data.next,
        previous: res.data.previous,
    };
}

export async function getOrder(id: string | number): Promise<SalesOrder> {
    const res = await apiClient.get<ApiSalesOrder>(`/orders/${id}/`);
    return fromApiOrder(res.data);
}

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

export interface OrderItemWritePayload {
    productId?: string | null;
    productDescription: string;
    quantityOrdered: number;
    quantityPending?: number;
    unit: string;
    unitPrice: number;
    discountPercent?: number;
    taxRuleId?: string | null;
    notes?: string;
}

function toApiItem(p: OrderItemWritePayload): Record<string, unknown> {
    const body: Record<string, unknown> = {
        product_description: p.productDescription,
        quantity_ordered: p.quantityOrdered,
        unit: p.unit,
        unit_price: p.unitPrice,
    };
    if (p.productId !== undefined) body.product = p.productId ? Number(p.productId) : null;
    if (p.quantityPending !== undefined) body.quantity_pending = p.quantityPending;
    if (p.discountPercent !== undefined) body.discount_percent = p.discountPercent;
    if (p.taxRuleId !== undefined) body.tax_rule = p.taxRuleId ? Number(p.taxRuleId) : null;
    if (p.notes !== undefined) body.notes = p.notes;
    return body;
}

export async function addItem(
    orderId: string | number,
    payload: OrderItemWritePayload,
): Promise<OrderItem> {
    const res = await apiClient.post<ApiOrderItem>(
        `/orders/${orderId}/items/`,
        toApiItem(payload),
    );
    return fromApiItem(res.data);
}

export async function updateItem(
    id: string | number,
    payload: Partial<OrderItemWritePayload>,
): Promise<OrderItem> {
    const body = toApiItem({
        productDescription: '',
        quantityOrdered: 0,
        unit: '',
        unitPrice: 0,
        ...payload,
    } as OrderItemWritePayload);
    const map: Record<string, string> = {
        productId: 'product',
        productDescription: 'product_description',
        quantityOrdered: 'quantity_ordered',
        quantityPending: 'quantity_pending',
        unitPrice: 'unit_price',
        discountPercent: 'discount_percent',
        taxRuleId: 'tax_rule',
    };
    const filtered: Record<string, unknown> = {};
    for (const key of Object.keys(payload)) {
        const apiKey = map[key] ?? key;
        if (apiKey in body) filtered[apiKey] = body[apiKey];
    }
    const res = await apiClient.patch<ApiOrderItem>(`/orders/items/${id}/`, filtered);
    return fromApiItem(res.data);
}

export async function deleteItem(id: string | number): Promise<void> {
    await apiClient.delete(`/orders/items/${id}/`);
}

// ---------------------------------------------------------------------------
// Stage / dispatch / reserve / mrp / bulk
// ---------------------------------------------------------------------------

export async function transitionStage(
    id: string | number,
    nextStage: OrderApiStatus,
    cancellationReason?: string,
): Promise<SalesOrder> {
    const body: Record<string, unknown> = { next_stage: nextStage };
    if (cancellationReason) body.cancellation_reason = cancellationReason;
    const res = await apiClient.post<ApiSalesOrder>(`/orders/${id}/stage/`, body);
    return fromApiOrder(res.data);
}

export interface MrpAvailabilityRow {
    itemId: number;
    productId: number | null;
    productDescription: string;
    requiredQty: string;
    onHand: string;
    reserved: string;
    available: string;
    shortfall: string;
    ready: boolean;
}

export interface MrpAvailability {
    items: MrpAvailabilityRow[];
    allReady: boolean;
}

export async function getMrp(id: string | number): Promise<MrpAvailability> {
    const res = await apiClient.get<{
        items: Array<{
            item_id: number;
            product_id: number | null;
            product_description: string;
            required_qty: string;
            on_hand: string;
            reserved: string;
            available: string;
            shortfall: string;
            ready: boolean;
        }>;
        all_ready: boolean;
    }>(`/orders/${id}/mrp/`);
    return {
        items: res.data.items.map((r) => ({
            itemId: r.item_id,
            productId: r.product_id,
            productDescription: r.product_description,
            requiredQty: r.required_qty,
            onHand: r.on_hand,
            reserved: r.reserved,
            available: r.available,
            shortfall: r.shortfall,
            ready: r.ready,
        })),
        allReady: res.data.all_ready,
    };
}

export async function reserveStock(
    id: string | number,
    warehouseId: string | number,
): Promise<{ reservations: Array<{ itemId: number; reservationId: number; skipped: boolean }> }> {
    const res = await apiClient.post<{
        reservations: Array<{ item_id: number; reservation_id: number; skipped: boolean }>;
    }>(`/orders/${id}/reserve/`, { warehouse: Number(warehouseId) });
    return {
        reservations: res.data.reservations.map((r) => ({
            itemId: r.item_id,
            reservationId: r.reservation_id,
            skipped: r.skipped,
        })),
    };
}

export async function releaseStock(id: string | number): Promise<{ released: number }> {
    const res = await apiClient.post<{ released: number }>(`/orders/${id}/release/`);
    return res.data;
}

export interface DispatchItemPayload {
    itemId: string | number;
    quantity: number | string;
}

export async function dispatchItems(
    id: string | number,
    items: DispatchItemPayload[],
): Promise<SalesOrder> {
    const res = await apiClient.post<ApiSalesOrder>(`/orders/${id}/dispatch/`, {
        items: items.map((i) => ({ item_id: Number(i.itemId), quantity: i.quantity })),
    });
    return fromApiOrder(res.data);
}

// ---------------------------------------------------------------------------
// Bulk
// ---------------------------------------------------------------------------

export interface BulkResultRow {
    id: number;
    status: 'ok' | 'error';
    error?: unknown;
    [extra: string]: unknown;
}

export async function bulkAssign(
    ids: Array<string | number>,
    assignedSalesExecId: string | number,
): Promise<BulkResultRow[]> {
    const res = await apiClient.post<{ results: BulkResultRow[] }>(
        '/orders/bulk-assign/',
        { ids: ids.map(Number), assigned_sales_exec: Number(assignedSalesExecId) },
    );
    return res.data.results;
}

export async function bulkReady(ids: Array<string | number>): Promise<BulkResultRow[]> {
    const res = await apiClient.post<{ results: BulkResultRow[] }>(
        '/orders/bulk-ready/',
        { ids: ids.map(Number) },
    );
    return res.data.results;
}

export async function bulkExport(ids: Array<string | number>): Promise<BulkResultRow[]> {
    const res = await apiClient.post<{ results: BulkResultRow[] }>(
        '/orders/bulk-export/',
        { ids: ids.map(Number) },
    );
    return res.data.results;
}
