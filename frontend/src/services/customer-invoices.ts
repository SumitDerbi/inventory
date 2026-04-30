import { apiClient, type PageResponse } from './apiClient';

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export type InvoiceApiStatus = 'draft' | 'issued' | 'cancelled';
export type InvoiceTypeApi = 'tax_invoice' | 'proforma' | 'credit_note' | 'debit_note';

export interface InvoiceItem {
    id: string;
    invoiceId: string;
    productId: string | null;
    description: string;
    hsnCode: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    discountAmount: number;
    taxPercent: number;
    taxAmount: number;
    lineTotal: number;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    orderId: string | null;
    customerId: string;
    challanId: string | null;
    invoiceType: InvoiceTypeApi;
    invoiceDate: string;
    dueDate: string | null;
    isGstInvoice: boolean;
    placeOfSupply: string;
    subtotal: number;
    taxAmount: number;
    grandTotal: number;
    status: InvoiceApiStatus;
    notes: string;
    items: InvoiceItem[];
    createdAt: string;
    updatedAt: string;
}

export interface InvoiceListItem {
    id: string;
    invoiceNumber: string;
    customerId: string;
    customerName: string;
    orderId: string | null;
    orderNumber: string;
    invoiceType: InvoiceTypeApi;
    invoiceDate: string;
    grandTotal: number;
    status: InvoiceApiStatus;
    createdAt: string;
}

// ---------------------------------------------------------------------------
// Raw API shapes
// ---------------------------------------------------------------------------

interface ApiInvoiceItem {
    id: number;
    invoice: number;
    product: number | null;
    description: string;
    hsn_code: string;
    quantity: number | string;
    unit: string;
    unit_price: number | string;
    discount_amount: number | string;
    tax_percent: number | string;
    tax_amount: number | string;
    line_total: number | string;
}

interface ApiInvoice {
    id: number;
    invoice_number: string;
    order: number | null;
    customer: number;
    challan: number | null;
    invoice_type: InvoiceTypeApi;
    invoice_date: string;
    due_date: string | null;
    is_gst_invoice: boolean;
    place_of_supply: string;
    subtotal: number | string;
    tax_amount: number | string;
    grand_total: number | string;
    status: InvoiceApiStatus;
    notes: string;
    items: ApiInvoiceItem[];
    created_at: string;
    updated_at: string;
}

interface ApiInvoiceList {
    id: number;
    invoice_number: string;
    customer: number;
    customer_name?: string;
    order: number | null;
    order_number?: string;
    invoice_type: InvoiceTypeApi;
    invoice_date: string;
    grand_total: number | string;
    status: InvoiceApiStatus;
    created_at: string;
}

const toNum = (v: number | string | null | undefined) => Number(v ?? 0);
const toStr = (v: number | null) => (v == null ? null : String(v));

export function fromApiItem(api: ApiInvoiceItem): InvoiceItem {
    return {
        id: String(api.id),
        invoiceId: String(api.invoice),
        productId: toStr(api.product),
        description: api.description ?? '',
        hsnCode: api.hsn_code ?? '',
        quantity: toNum(api.quantity),
        unit: api.unit ?? '',
        unitPrice: toNum(api.unit_price),
        discountAmount: toNum(api.discount_amount),
        taxPercent: toNum(api.tax_percent),
        taxAmount: toNum(api.tax_amount),
        lineTotal: toNum(api.line_total),
    };
}

export function fromApiInvoice(api: ApiInvoice): Invoice {
    return {
        id: String(api.id),
        invoiceNumber: api.invoice_number,
        orderId: toStr(api.order),
        customerId: String(api.customer),
        challanId: toStr(api.challan),
        invoiceType: api.invoice_type,
        invoiceDate: api.invoice_date,
        dueDate: api.due_date,
        isGstInvoice: api.is_gst_invoice,
        placeOfSupply: api.place_of_supply ?? '',
        subtotal: toNum(api.subtotal),
        taxAmount: toNum(api.tax_amount),
        grandTotal: toNum(api.grand_total),
        status: api.status,
        notes: api.notes ?? '',
        items: (api.items ?? []).map(fromApiItem),
        createdAt: api.created_at,
        updatedAt: api.updated_at,
    };
}

export function fromApiList(api: ApiInvoiceList): InvoiceListItem {
    return {
        id: String(api.id),
        invoiceNumber: api.invoice_number,
        customerId: String(api.customer),
        customerName: api.customer_name ?? '',
        orderId: toStr(api.order),
        orderNumber: api.order_number ?? '',
        invoiceType: api.invoice_type,
        invoiceDate: api.invoice_date,
        grandTotal: toNum(api.grand_total),
        status: api.status,
        createdAt: api.created_at,
    };
}

// ---------------------------------------------------------------------------
// List / detail
// ---------------------------------------------------------------------------

export interface ListInvoicesParams {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: InvoiceApiStatus | '';
    customer?: string;
    order?: string;
    invoiceType?: InvoiceTypeApi | '';
    ordering?: string;
}

export interface InvoicesPage {
    results: InvoiceListItem[];
    count: number;
    next: string | null;
    previous: string | null;
}

export async function listInvoices(params: ListInvoicesParams = {}): Promise<InvoicesPage> {
    const query: Record<string, string | number> = {};
    if (params.page) query.page = params.page;
    if (params.pageSize) query.page_size = params.pageSize;
    if (params.search) query.search = params.search;
    if (params.status) query.status = params.status;
    if (params.customer) query.customer = params.customer;
    if (params.order) query.order = params.order;
    if (params.invoiceType) query.invoice_type = params.invoiceType;
    if (params.ordering) query.ordering = params.ordering;
    const res = await apiClient.get<PageResponse<ApiInvoiceList>>('/customer-invoices/', {
        params: query,
    });
    return {
        results: res.data.results.map(fromApiList),
        count: res.data.count,
        next: res.data.next,
        previous: res.data.previous,
    };
}

export async function getInvoice(id: string | number): Promise<Invoice> {
    const res = await apiClient.get<ApiInvoice>(`/customer-invoices/${id}/`);
    return fromApiInvoice(res.data);
}

export async function listInvoicesForOrder(
    orderId: string | number,
): Promise<InvoiceListItem[]> {
    const res = await apiClient.get<PageResponse<ApiInvoiceList> | ApiInvoiceList[]>(
        `/orders/${orderId}/customer-invoices/`,
    );
    const rows = Array.isArray(res.data) ? res.data : res.data.results;
    return rows.map(fromApiList);
}

export async function createFromOrder(
    orderId: string | number,
    invoiceType: InvoiceTypeApi = 'tax_invoice',
): Promise<Invoice> {
    const res = await apiClient.post<ApiInvoice>(
        `/orders/${orderId}/customer-invoices/`,
        { invoice_type: invoiceType },
    );
    return fromApiInvoice(res.data);
}

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

export interface InvoiceItemWritePayload {
    productId?: string | null;
    description: string;
    hsnCode?: string;
    quantity: number | string;
    unit: string;
    unitPrice: number | string;
    discountAmount?: number | string;
    taxPercent?: number | string;
}

function toApiItem(p: InvoiceItemWritePayload): Record<string, unknown> {
    const body: Record<string, unknown> = {
        description: p.description,
        quantity: p.quantity,
        unit: p.unit,
        unit_price: p.unitPrice,
    };
    if (p.productId !== undefined) body.product = p.productId ? Number(p.productId) : null;
    if (p.hsnCode !== undefined) body.hsn_code = p.hsnCode;
    if (p.discountAmount !== undefined) body.discount_amount = p.discountAmount;
    if (p.taxPercent !== undefined) body.tax_percent = p.taxPercent;
    return body;
}

export async function addItem(
    invoiceId: string | number,
    payload: InvoiceItemWritePayload,
): Promise<InvoiceItem> {
    const res = await apiClient.post<ApiInvoiceItem>(
        `/customer-invoices/${invoiceId}/items/`,
        toApiItem(payload),
    );
    return fromApiItem(res.data);
}

export async function updateItem(
    id: string | number,
    payload: Partial<InvoiceItemWritePayload>,
): Promise<InvoiceItem> {
    const map: Record<string, string> = {
        productId: 'product',
        hsnCode: 'hsn_code',
        unitPrice: 'unit_price',
        discountAmount: 'discount_amount',
        taxPercent: 'tax_percent',
    };
    const body: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(payload)) {
        const apiKey = map[k] ?? k;
        body[apiKey] = k === 'productId' ? (v ? Number(v as string) : null) : v;
    }
    const res = await apiClient.patch<ApiInvoiceItem>(
        `/customer-invoices/items/${id}/`,
        body,
    );
    return fromApiItem(res.data);
}

export async function deleteItem(id: string | number): Promise<void> {
    await apiClient.delete(`/customer-invoices/items/${id}/`);
}

// ---------------------------------------------------------------------------
// Status transitions
// ---------------------------------------------------------------------------

export async function finaliseInvoice(id: string | number): Promise<Invoice> {
    const res = await apiClient.post<ApiInvoice>(`/customer-invoices/${id}/finalise/`, {});
    return fromApiInvoice(res.data);
}

export async function cancelInvoice(
    id: string | number,
    reason: string,
): Promise<Invoice> {
    const res = await apiClient.post<ApiInvoice>(
        `/customer-invoices/${id}/cancel/`,
        { reason },
    );
    return fromApiInvoice(res.data);
}

// ---------------------------------------------------------------------------
// Aging + bulk
// ---------------------------------------------------------------------------

export type AgingBucketKey = '0-30' | '31-60' | '61-90' | '90+';

export type AgingBuckets = Record<AgingBucketKey, { count: number; total: number }>;

export async function getAging(): Promise<AgingBuckets> {
    const res = await apiClient.get<Record<AgingBucketKey, { count: number; total: number | string }>>(
        '/customer-invoices/aging/',
    );
    const out = {} as AgingBuckets;
    (Object.keys(res.data) as AgingBucketKey[]).forEach((k) => {
        out[k] = { count: Number(res.data[k].count), total: toNum(res.data[k].total) };
    });
    return out;
}

export interface BulkResultRow {
    id: number;
    status: 'ok' | 'error';
    error?: unknown;
    [extra: string]: unknown;
}

export async function bulkExport(ids: Array<string | number>): Promise<BulkResultRow[]> {
    const res = await apiClient.post<{ results: BulkResultRow[] }>(
        '/customer-invoices/bulk-export/',
        { ids: ids.map(Number) },
    );
    return res.data.results;
}

export async function bulkSend(ids: Array<string | number>): Promise<BulkResultRow[]> {
    const res = await apiClient.post<{ results: BulkResultRow[] }>(
        '/customer-invoices/bulk-send/',
        { ids: ids.map(Number) },
    );
    return res.data.results;
}
