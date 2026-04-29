import { apiClient, type PageResponse } from './apiClient';
import type { QuotationStatus } from '@/lib/quotationStatus';

// ---------------------------------------------------------------------------
// Domain types (camelCase) — aligned with backend Quotation app
// ---------------------------------------------------------------------------

export interface QuotationItem {
    id: string;
    quotationId: string;
    productId: string | null;
    productCode: string;
    productDescription: string;
    brand: string;
    modelNumber: string;
    specifications: string;
    quantity: number;
    unit: string;
    unitCost: number;
    unitPrice: number;
    discountPercent: number;
    discountAmount: number;
    taxRuleId: string | null;
    taxAmount: number;
    lineTotal: number;
    sortOrder: number;
    notes: string;
}

export interface Quotation {
    id: string;
    quotationNumber: string;
    versionNumber: number;
    inquiryId: string | null;
    customerId: string;
    contactId: string | null;
    projectName: string;
    siteAddress: string;
    quotationDate: string;
    validUntil: string;
    status: QuotationStatus;
    preparedBy: string | null;
    approvedBy: string | null;
    approvedAt: string | null;
    currency: string;
    subtotal: number;
    totalDiscount: number;
    totalTax: number;
    freightAmount: number;
    otherCharges: number;
    grandTotal: number;
    grossMarginPercent: number | null;
    paymentTerms: string;
    deliveryTerms: string;
    warrantyTerms: string;
    scopeOfSupply: string;
    exclusions: string;
    notes: string;
    sentAt: string | null;
    parentQuotationId: string | null;
    items: QuotationItem[];
    createdAt: string;
    updatedAt: string;
}

export interface QuotationListItem {
    id: string;
    quotationNumber: string;
    versionNumber: number;
    customerId: string;
    customerName: string;
    companyName: string;
    projectName: string;
    status: QuotationStatus;
    quotationDate: string;
    validUntil: string;
    grandTotal: number;
    currency: string;
    preparedBy: string | null;
    createdAt: string;
}

export interface QuotationActivity {
    id: string;
    quotationId: string;
    actionType: string;
    oldValue: string;
    newValue: string;
    remarks: string;
    performedBy: string | null;
    performedAt: string;
}

export interface QuotationCommunication {
    id: string;
    quotationId: string;
    channel: 'email' | 'whatsapp' | 'sms';
    toAddress: string;
    subject: string;
    body: string;
    sentAt: string;
    sentBy: string | null;
}

export interface QuotationApprovalStep {
    id: string;
    quotationId: string;
    stepOrder: number;
    approverId: string | null;
    status: 'pending' | 'approved' | 'rejected';
    actionAt: string | null;
    comments: string;
    conditionType: string;
}

// ---------------------------------------------------------------------------
// Raw API shapes (snake_case)
// ---------------------------------------------------------------------------

interface ApiQuotationItem {
    id: number;
    quotation: number;
    product: number | null;
    product_code: string;
    product_description: string;
    brand: string;
    model_number: string;
    specifications: string;
    quantity: number | string;
    unit: string;
    unit_cost: number | string;
    unit_price: number | string;
    discount_percent: number | string;
    discount_amount: number | string;
    tax_rule: number | null;
    tax_amount: number | string;
    line_total: number | string;
    sort_order: number;
    notes: string;
    created_at: string;
    updated_at: string;
}

interface ApiQuotation {
    id: number;
    quotation_number: string;
    version_number: number;
    inquiry: number | null;
    customer: number;
    contact: number | null;
    site_address: string;
    project_name: string;
    quotation_date: string;
    valid_until: string;
    status: QuotationStatus;
    prepared_by: number | null;
    approved_by: number | null;
    approved_at: string | null;
    currency: string;
    subtotal: number | string;
    total_discount: number | string;
    total_tax: number | string;
    freight_amount: number | string;
    other_charges: number | string;
    grand_total: number | string;
    gross_margin_percent: number | string | null;
    payment_terms: string;
    delivery_terms: string;
    warranty_terms: string;
    scope_of_supply: string;
    exclusions: string;
    notes: string;
    sent_at: string | null;
    parent_quotation: number | null;
    items: ApiQuotationItem[];
    created_at: string;
    updated_at: string;
}

interface ApiQuotationListItem {
    id: number;
    quotation_number: string;
    version_number: number;
    customer: number;
    customer_name?: string;
    company_name?: string;
    project_name: string;
    status: QuotationStatus;
    quotation_date: string;
    valid_until: string;
    grand_total: number | string;
    currency: string;
    prepared_by: number | null;
    created_at: string;
}

interface ApiActivity {
    id: number;
    quotation: number;
    action_type: string;
    old_value: string | null;
    new_value: string | null;
    remarks: string | null;
    performed_by: number | null;
    performed_at: string;
}

interface ApiCommunication {
    id: number;
    quotation: number;
    channel: 'email' | 'whatsapp' | 'sms';
    to_address: string;
    subject: string;
    body: string;
    sent_at: string;
    sent_by: number | null;
}

interface ApiApprovalStep {
    id: number;
    quotation: number;
    step_order: number;
    approver: number | null;
    status: 'pending' | 'approved' | 'rejected';
    action_at: string | null;
    comments: string;
    condition_type: string;
}

const toNum = (v: number | string | null | undefined) => Number(v ?? 0);
const toNumOrNull = (v: number | string | null | undefined) =>
    v == null || v === '' ? null : Number(v);

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

export function fromApiItem(api: ApiQuotationItem): QuotationItem {
    return {
        id: String(api.id),
        quotationId: String(api.quotation),
        productId: api.product == null ? null : String(api.product),
        productCode: api.product_code ?? '',
        productDescription: api.product_description ?? '',
        brand: api.brand ?? '',
        modelNumber: api.model_number ?? '',
        specifications: api.specifications ?? '',
        quantity: toNum(api.quantity),
        unit: api.unit ?? '',
        unitCost: toNum(api.unit_cost),
        unitPrice: toNum(api.unit_price),
        discountPercent: toNum(api.discount_percent),
        discountAmount: toNum(api.discount_amount),
        taxRuleId: api.tax_rule == null ? null : String(api.tax_rule),
        taxAmount: toNum(api.tax_amount),
        lineTotal: toNum(api.line_total),
        sortOrder: api.sort_order ?? 0,
        notes: api.notes ?? '',
    };
}

export function fromApiQuotation(api: ApiQuotation): Quotation {
    return {
        id: String(api.id),
        quotationNumber: api.quotation_number,
        versionNumber: api.version_number,
        inquiryId: api.inquiry == null ? null : String(api.inquiry),
        customerId: String(api.customer),
        contactId: api.contact == null ? null : String(api.contact),
        projectName: api.project_name ?? '',
        siteAddress: api.site_address ?? '',
        quotationDate: api.quotation_date,
        validUntil: api.valid_until,
        status: api.status,
        preparedBy: api.prepared_by == null ? null : String(api.prepared_by),
        approvedBy: api.approved_by == null ? null : String(api.approved_by),
        approvedAt: api.approved_at,
        currency: api.currency,
        subtotal: toNum(api.subtotal),
        totalDiscount: toNum(api.total_discount),
        totalTax: toNum(api.total_tax),
        freightAmount: toNum(api.freight_amount),
        otherCharges: toNum(api.other_charges),
        grandTotal: toNum(api.grand_total),
        grossMarginPercent: toNumOrNull(api.gross_margin_percent),
        paymentTerms: api.payment_terms ?? '',
        deliveryTerms: api.delivery_terms ?? '',
        warrantyTerms: api.warranty_terms ?? '',
        scopeOfSupply: api.scope_of_supply ?? '',
        exclusions: api.exclusions ?? '',
        notes: api.notes ?? '',
        sentAt: api.sent_at,
        parentQuotationId: api.parent_quotation == null ? null : String(api.parent_quotation),
        items: (api.items ?? []).map(fromApiItem),
        createdAt: api.created_at,
        updatedAt: api.updated_at,
    };
}

export function fromApiList(api: ApiQuotationListItem): QuotationListItem {
    return {
        id: String(api.id),
        quotationNumber: api.quotation_number,
        versionNumber: api.version_number,
        customerId: String(api.customer),
        customerName: api.customer_name ?? '',
        companyName: api.company_name ?? '',
        projectName: api.project_name ?? '',
        status: api.status,
        quotationDate: api.quotation_date,
        validUntil: api.valid_until,
        grandTotal: toNum(api.grand_total),
        currency: api.currency,
        preparedBy: api.prepared_by == null ? null : String(api.prepared_by),
        createdAt: api.created_at,
    };
}

export function fromApiActivity(api: ApiActivity): QuotationActivity {
    return {
        id: String(api.id),
        quotationId: String(api.quotation),
        actionType: api.action_type,
        oldValue: api.old_value ?? '',
        newValue: api.new_value ?? '',
        remarks: api.remarks ?? '',
        performedBy: api.performed_by == null ? null : String(api.performed_by),
        performedAt: api.performed_at,
    };
}

export function fromApiCommunication(api: ApiCommunication): QuotationCommunication {
    return {
        id: String(api.id),
        quotationId: String(api.quotation),
        channel: api.channel,
        toAddress: api.to_address,
        subject: api.subject ?? '',
        body: api.body ?? '',
        sentAt: api.sent_at,
        sentBy: api.sent_by == null ? null : String(api.sent_by),
    };
}

export function fromApiApprovalStep(api: ApiApprovalStep): QuotationApprovalStep {
    return {
        id: String(api.id),
        quotationId: String(api.quotation),
        stepOrder: api.step_order,
        approverId: api.approver == null ? null : String(api.approver),
        status: api.status,
        actionAt: api.action_at,
        comments: api.comments ?? '',
        conditionType: api.condition_type ?? '',
    };
}

// ---------------------------------------------------------------------------
// Request payloads
// ---------------------------------------------------------------------------

export interface QuotationWritePayload {
    customerId: string;
    contactId?: string | null;
    inquiryId?: string | null;
    projectName?: string;
    quotationDate?: string;
    validUntil?: string;
    siteAddress?: string;
    paymentTerms?: string;
    deliveryTerms?: string;
    warrantyTerms?: string;
    scopeOfSupply?: string;
    exclusions?: string;
    notes?: string;
    freightAmount?: number;
    otherCharges?: number;
    currency?: string;
}

function toApiQuotationWrite(p: QuotationWritePayload): Record<string, unknown> {
    const body: Record<string, unknown> = {
        customer: Number(p.customerId),
    };
    if (p.contactId !== undefined) body.contact = p.contactId ? Number(p.contactId) : null;
    if (p.inquiryId !== undefined) body.inquiry = p.inquiryId ? Number(p.inquiryId) : null;
    if (p.projectName !== undefined) body.project_name = p.projectName;
    if (p.quotationDate !== undefined) body.quotation_date = p.quotationDate;
    if (p.validUntil !== undefined) body.valid_until = p.validUntil;
    if (p.siteAddress !== undefined) body.site_address = p.siteAddress;
    if (p.paymentTerms !== undefined) body.payment_terms = p.paymentTerms;
    if (p.deliveryTerms !== undefined) body.delivery_terms = p.deliveryTerms;
    if (p.warrantyTerms !== undefined) body.warranty_terms = p.warrantyTerms;
    if (p.scopeOfSupply !== undefined) body.scope_of_supply = p.scopeOfSupply;
    if (p.exclusions !== undefined) body.exclusions = p.exclusions;
    if (p.notes !== undefined) body.notes = p.notes;
    if (p.freightAmount !== undefined) body.freight_amount = p.freightAmount;
    if (p.otherCharges !== undefined) body.other_charges = p.otherCharges;
    if (p.currency !== undefined) body.currency = p.currency;
    return body;
}

export interface QuotationItemWritePayload {
    productId?: string | null;
    productCode?: string;
    productDescription: string;
    brand?: string;
    modelNumber?: string;
    specifications?: string;
    quantity: number;
    unit: string;
    unitCost?: number;
    unitPrice: number;
    discountPercent?: number;
    taxRuleId?: string | null;
    sortOrder?: number;
    notes?: string;
}

function toApiItemWrite(p: QuotationItemWritePayload): Record<string, unknown> {
    const body: Record<string, unknown> = {
        product_description: p.productDescription,
        quantity: p.quantity,
        unit: p.unit,
        unit_price: p.unitPrice,
    };
    if (p.productId !== undefined) body.product = p.productId ? Number(p.productId) : null;
    if (p.productCode !== undefined) body.product_code = p.productCode;
    if (p.brand !== undefined) body.brand = p.brand;
    if (p.modelNumber !== undefined) body.model_number = p.modelNumber;
    if (p.specifications !== undefined) body.specifications = p.specifications;
    if (p.unitCost !== undefined) body.unit_cost = p.unitCost;
    if (p.discountPercent !== undefined) body.discount_percent = p.discountPercent;
    if (p.taxRuleId !== undefined) body.tax_rule = p.taxRuleId ? Number(p.taxRuleId) : null;
    if (p.sortOrder !== undefined) body.sort_order = p.sortOrder;
    if (p.notes !== undefined) body.notes = p.notes;
    return body;
}

// ---------------------------------------------------------------------------
// List / detail
// ---------------------------------------------------------------------------

export interface ListQuotationsParams {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: QuotationStatus | '';
    customer?: string;
    inquiry?: string;
    preparedBy?: string;
    ordering?: string;
}

export interface QuotationsPage {
    results: QuotationListItem[];
    count: number;
    next: string | null;
    previous: string | null;
}

export async function listQuotations(
    params: ListQuotationsParams = {},
): Promise<QuotationsPage> {
    const query: Record<string, string | number> = {};
    if (params.page) query.page = params.page;
    if (params.pageSize) query.page_size = params.pageSize;
    if (params.search) query.search = params.search;
    if (params.status) query.status = params.status;
    if (params.customer) query.customer = params.customer;
    if (params.inquiry) query.inquiry = params.inquiry;
    if (params.preparedBy) query.prepared_by = params.preparedBy;
    if (params.ordering) query.ordering = params.ordering;
    const res = await apiClient.get<PageResponse<ApiQuotationListItem>>('/quotations/', {
        params: query,
    });
    return {
        results: res.data.results.map(fromApiList),
        count: res.data.count,
        next: res.data.next,
        previous: res.data.previous,
    };
}

export async function getQuotation(id: string | number): Promise<Quotation> {
    const res = await apiClient.get<ApiQuotation>(`/quotations/${id}/`);
    return fromApiQuotation(res.data);
}

export async function createQuotation(payload: QuotationWritePayload): Promise<Quotation> {
    const res = await apiClient.post<ApiQuotation>('/quotations/', toApiQuotationWrite(payload));
    return fromApiQuotation(res.data);
}

export async function updateQuotation(
    id: string | number,
    payload: Partial<QuotationWritePayload>,
): Promise<Quotation> {
    const body = toApiQuotationWrite(payload as QuotationWritePayload);
    delete body.customer; // PATCH should not require customer when not provided
    if (payload.customerId !== undefined) body.customer = Number(payload.customerId);
    const res = await apiClient.patch<ApiQuotation>(`/quotations/${id}/`, body);
    return fromApiQuotation(res.data);
}

export async function deleteQuotation(id: string | number): Promise<void> {
    await apiClient.delete(`/quotations/${id}/`);
}

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

export async function listItems(quotationId: string | number): Promise<QuotationItem[]> {
    const res = await apiClient.get<ApiQuotationItem[]>(`/quotations/${quotationId}/items/`);
    return (Array.isArray(res.data) ? res.data : []).map(fromApiItem);
}

export async function createItem(
    quotationId: string | number,
    payload: QuotationItemWritePayload,
): Promise<QuotationItem> {
    const res = await apiClient.post<ApiQuotationItem>(
        `/quotations/${quotationId}/items/`,
        toApiItemWrite(payload),
    );
    return fromApiItem(res.data);
}

export async function updateItem(
    id: string | number,
    payload: Partial<QuotationItemWritePayload>,
): Promise<QuotationItem> {
    const body: Record<string, unknown> = {};
    const full = toApiItemWrite({
        productDescription: '',
        quantity: 0,
        unit: '',
        unitPrice: 0,
        ...payload,
    } as QuotationItemWritePayload);
    const map: Record<string, string> = {
        productId: 'product',
        productCode: 'product_code',
        productDescription: 'product_description',
        modelNumber: 'model_number',
        unitCost: 'unit_cost',
        unitPrice: 'unit_price',
        discountPercent: 'discount_percent',
        taxRuleId: 'tax_rule',
        sortOrder: 'sort_order',
    };
    for (const key of Object.keys(payload)) {
        const apiKey = map[key] ?? key;
        if (apiKey in full) body[apiKey] = full[apiKey];
    }
    const res = await apiClient.patch<ApiQuotationItem>(`/quotations/items/${id}/`, body);
    return fromApiItem(res.data);
}

export async function deleteItem(id: string | number): Promise<void> {
    await apiClient.delete(`/quotations/items/${id}/`);
}

// ---------------------------------------------------------------------------
// Workflow actions
// ---------------------------------------------------------------------------

export async function submitForApproval(id: string | number): Promise<Quotation> {
    const res = await apiClient.post<ApiQuotation>(`/quotations/${id}/submit-approval/`);
    return fromApiQuotation(res.data);
}

export async function approveQuotation(
    id: string | number,
    comments?: string,
): Promise<Quotation> {
    const res = await apiClient.post<ApiQuotation>(`/quotations/${id}/approve/`, { comments: comments ?? '' });
    return fromApiQuotation(res.data);
}

export async function rejectQuotation(
    id: string | number,
    comments: string,
): Promise<Quotation> {
    const res = await apiClient.post<ApiQuotation>(`/quotations/${id}/reject/`, { comments });
    return fromApiQuotation(res.data);
}

export interface SendQuotationPayload {
    channel?: 'email' | 'whatsapp' | 'sms';
    toAddress: string;
    subject?: string;
    body?: string;
}

export async function sendQuotation(
    id: string | number,
    payload: SendQuotationPayload,
): Promise<QuotationCommunication> {
    const res = await apiClient.post<ApiCommunication>(`/quotations/${id}/send/`, {
        channel: payload.channel ?? 'email',
        to_address: payload.toAddress,
        subject: payload.subject ?? '',
        body: payload.body ?? '',
    });
    return fromApiCommunication(res.data);
}

export async function cloneQuotation(id: string | number): Promise<Quotation> {
    const res = await apiClient.post<ApiQuotation>(`/quotations/${id}/clone/`);
    return fromApiQuotation(res.data);
}

export async function newVersion(id: string | number): Promise<Quotation> {
    const res = await apiClient.post<ApiQuotation>(`/quotations/${id}/versions/`);
    return fromApiQuotation(res.data);
}

export async function listVersions(id: string | number): Promise<QuotationListItem[]> {
    const res = await apiClient.get<ApiQuotationListItem[]>(`/quotations/${id}/versions/`);
    return (Array.isArray(res.data) ? res.data : []).map(fromApiList);
}

export async function convertToOrder(
    id: string | number,
): Promise<{ orderId: string; orderNumber: string; quotationId: string; quotationStatus: QuotationStatus }> {
    const res = await apiClient.post<{
        order_id: number;
        order_number: string;
        quotation_id: number;
        quotation_status: QuotationStatus;
    }>(`/quotations/${id}/convert-to-order/`);
    return {
        orderId: String(res.data.order_id),
        orderNumber: res.data.order_number,
        quotationId: String(res.data.quotation_id),
        quotationStatus: res.data.quotation_status,
    };
}

export async function listActivity(id: string | number): Promise<QuotationActivity[]> {
    const res = await apiClient.get<ApiActivity[]>(`/quotations/${id}/activity/`);
    return (Array.isArray(res.data) ? res.data : []).map(fromApiActivity);
}

export async function listCommunications(
    id: string | number,
): Promise<QuotationCommunication[]> {
    const res = await apiClient.get<ApiCommunication[]>(`/quotations/${id}/communications/`);
    return (Array.isArray(res.data) ? res.data : []).map(fromApiCommunication);
}

export async function listApprovalSteps(
    id: string | number,
): Promise<QuotationApprovalStep[]> {
    const res = await apiClient.get<ApiApprovalStep[]>(`/quotations/${id}/approval-steps/`);
    return (Array.isArray(res.data) ? res.data : []).map(fromApiApprovalStep);
}
