import { apiClient, type PageResponse } from './apiClient';
import type {
    Inquiry,
    InquiryActivity,
    InquiryFollowUp,
    InquiryLineItem,
    FollowUpType,
    FollowUpStatus,
    ActivityActionType,
} from '@/mocks/inquiries';
import type { InquirySource } from '@/mocks/inquirySources';
import type {
    InquiryPriority,
    InquiryStatus,
    InquiryType,
} from '@/lib/inquiryStatus';

// ---------------------------------------------------------------------------
// Backend payload shapes (snake_case)
// ---------------------------------------------------------------------------

interface ApiInquiry {
    id: number;
    inquiry_number: string;
    source: number;
    customer: number | null;
    customer_name: string;
    company_name: string;
    mobile: string;
    email: string;
    city: string;
    state: string;
    project_name: string;
    project_description: string;
    product_category: number | null;
    inquiry_type: InquiryType;
    priority: InquiryPriority;
    status: InquiryStatus;
    assigned_to: number | null;
    expected_order_date: string | null;
    site_location: string;
    budget_range: string;
    source_reference: string;
    lost_reason: string | null;
    notes: string;
    line_items?: ApiLineItem[];
    created_at: string;
    updated_at: string;
}

interface ApiLineItem {
    id: number;
    inquiry: number;
    product: number | null;
    product_description: string;
    category: string;
    specification_notes: string;
    quantity: number;
    unit: string;
    estimated_value: number | string;
    notes: string;
    created_at: string;
    updated_at: string;
}

interface ApiFollowUp {
    id: number;
    inquiry: number;
    follow_up_type: FollowUpType;
    scheduled_at: string;
    completed_at: string | null;
    status: FollowUpStatus;
    outcome: string | null;
    next_follow_up_date: string | null;
    assigned_to: number;
    created_at: string;
    updated_at: string;
}

interface ApiActivityLog {
    id: number;
    inquiry: number;
    action_type: ActivityActionType;
    old_value: string | null;
    new_value: string | null;
    remarks: string | null;
    performed_by: number | null;
    performed_at: string;
    created_at: string;
}

interface ApiInquirySource {
    id: number;
    name: string;
    is_active: boolean;
}

// ---------------------------------------------------------------------------
// Mappers (snake_case → camelCase)
// ---------------------------------------------------------------------------

const toStr = (v: number | string | null | undefined): string => (v == null ? '' : String(v));
const toNum = (v: number | string | null | undefined): number => Number(v ?? 0);

export function fromApiInquiry(api: ApiInquiry): Inquiry {
    return {
        id: String(api.id),
        inquiryNumber: api.inquiry_number,
        sourceId: toStr(api.source),
        customerId: api.customer == null ? null : String(api.customer),
        customerName: api.customer_name,
        companyName: api.company_name,
        mobile: api.mobile,
        email: api.email,
        city: api.city,
        state: api.state,
        projectName: api.project_name,
        projectDescription: api.project_description,
        productCategoryId: toStr(api.product_category),
        inquiryType: api.inquiry_type,
        priority: api.priority,
        status: api.status,
        assignedTo: api.assigned_to == null ? null : String(api.assigned_to),
        expectedOrderDate: api.expected_order_date,
        siteLocation: api.site_location,
        budgetRange: api.budget_range,
        sourceReference: api.source_reference,
        lostReason: api.lost_reason,
        notes: api.notes,
        createdAt: api.created_at,
        lineItems: (api.line_items ?? []).map(fromApiLineItem),
        followUps: [],
        activity: [],
        attachments: [],
    };
}

export function fromApiLineItem(api: ApiLineItem): InquiryLineItem {
    return {
        id: String(api.id),
        productDescription: api.product_description,
        category: api.category,
        specificationNotes: api.specification_notes,
        quantity: toNum(api.quantity),
        unit: api.unit,
        estimatedValue: toNum(api.estimated_value),
        notes: api.notes,
    };
}

export function fromApiFollowUp(api: ApiFollowUp): InquiryFollowUp {
    return {
        id: String(api.id),
        inquiryId: String(api.inquiry),
        followUpType: api.follow_up_type,
        scheduledAt: api.scheduled_at,
        completedAt: api.completed_at,
        status: api.status,
        outcome: api.outcome,
        nextFollowUpDate: api.next_follow_up_date,
        assignedTo: String(api.assigned_to),
    };
}

export function fromApiActivity(api: ApiActivityLog): InquiryActivity {
    return {
        id: String(api.id),
        inquiryId: String(api.inquiry),
        actionType: api.action_type,
        oldValue: api.old_value,
        newValue: api.new_value,
        remarks: api.remarks,
        performedBy: api.performed_by == null ? '' : String(api.performed_by),
        performedAt: api.performed_at,
    };
}

export function fromApiSource(api: ApiInquirySource): InquirySource {
    return { id: String(api.id), name: api.name, isActive: api.is_active };
}

// ---------------------------------------------------------------------------
// Request payloads
// ---------------------------------------------------------------------------

export interface InquiryWritePayload {
    sourceId: string;
    customerId?: string | null;
    customerName: string;
    companyName?: string;
    mobile: string;
    email?: string;
    city?: string;
    state?: string;
    projectName?: string;
    projectDescription?: string;
    productCategoryId?: string;
    inquiryType: InquiryType;
    priority: InquiryPriority;
    assignedTo?: string | null;
    expectedOrderDate?: string | null;
    siteLocation?: string;
    budgetRange?: string;
    sourceReference?: string;
    notes?: string;
}

function toApiInquiryWrite(p: InquiryWritePayload): Record<string, unknown> {
    return {
        source: p.sourceId ? Number(p.sourceId) : null,
        customer: p.customerId ? Number(p.customerId) : null,
        customer_name: p.customerName,
        company_name: p.companyName ?? '',
        mobile: p.mobile,
        email: p.email ?? '',
        city: p.city ?? '',
        state: p.state ?? '',
        project_name: p.projectName ?? '',
        project_description: p.projectDescription ?? '',
        product_category: p.productCategoryId ? Number(p.productCategoryId) : null,
        inquiry_type: p.inquiryType,
        priority: p.priority,
        assigned_to: p.assignedTo ? Number(p.assignedTo) : null,
        expected_order_date: p.expectedOrderDate || null,
        site_location: p.siteLocation ?? '',
        budget_range: p.budgetRange ?? '',
        source_reference: p.sourceReference ?? '',
        notes: p.notes ?? '',
    };
}

export interface ListInquiriesParams {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: InquiryStatus | '';
    priority?: InquiryPriority | '';
    source?: string;
    assignedTo?: string;
    customer?: string;
    ordering?: string;
}

export interface InquiriesPage {
    results: Inquiry[];
    count: number;
    next: string | null;
    previous: string | null;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function listInquiries(params: ListInquiriesParams = {}): Promise<InquiriesPage> {
    const query: Record<string, string | number> = {};
    if (params.page) query.page = params.page;
    if (params.pageSize) query.page_size = params.pageSize;
    if (params.search) query.search = params.search;
    if (params.status) query.status = params.status;
    if (params.priority) query.priority = params.priority;
    if (params.source) query.source = params.source;
    if (params.assignedTo) query.assigned_to = params.assignedTo;
    if (params.customer) query.customer = params.customer;
    if (params.ordering) query.ordering = params.ordering;
    const res = await apiClient.get<PageResponse<ApiInquiry>>('/inquiries/', { params: query });
    return {
        results: res.data.results.map(fromApiInquiry),
        count: res.data.count,
        next: res.data.next,
        previous: res.data.previous,
    };
}

export async function getInquiry(id: string | number): Promise<Inquiry> {
    const res = await apiClient.get<ApiInquiry>(`/inquiries/${id}/`);
    return fromApiInquiry(res.data);
}

export interface DuplicateMatch {
    id: number;
    inquiry_number: string;
    customer_name: string;
    match_reasons: string[];
}

export interface CreateInquiryResult {
    inquiry?: Inquiry;
    duplicates?: DuplicateMatch[];
}

export async function createInquiry(
    payload: InquiryWritePayload,
    opts: { force?: boolean } = {},
): Promise<CreateInquiryResult> {
    try {
        const res = await apiClient.post<ApiInquiry>(
            `/inquiries/${opts.force ? '?force=true' : ''}`,
            toApiInquiryWrite(payload),
        );
        return { inquiry: fromApiInquiry(res.data) };
    } catch (err) {
        const e = err as { response?: { status?: number; data?: { duplicates?: DuplicateMatch[] } } };
        if (e.response?.status === 409 && e.response?.data?.duplicates) {
            return { duplicates: e.response.data.duplicates };
        }
        throw err;
    }
}

export async function updateInquiry(
    id: string | number,
    payload: Partial<InquiryWritePayload>,
): Promise<Inquiry> {
    const body = toApiInquiryWrite({
        sourceId: '',
        customerName: '',
        mobile: '',
        inquiryType: 'other' as InquiryType,
        priority: 'medium' as InquiryPriority,
        ...payload,
    } as InquiryWritePayload);
    // Remove keys that weren't explicitly provided so PATCH stays minimal.
    const allowed = new Set<string>(
        Object.keys(payload).map((k) => {
            const map: Record<string, string> = {
                sourceId: 'source',
                customerId: 'customer',
                customerName: 'customer_name',
                companyName: 'company_name',
                projectName: 'project_name',
                projectDescription: 'project_description',
                productCategoryId: 'product_category',
                inquiryType: 'inquiry_type',
                assignedTo: 'assigned_to',
                expectedOrderDate: 'expected_order_date',
                siteLocation: 'site_location',
                budgetRange: 'budget_range',
                sourceReference: 'source_reference',
            };
            return map[k] ?? k;
        }),
    );
    const minimal: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) {
        if (allowed.has(k)) minimal[k] = v;
    }
    const res = await apiClient.patch<ApiInquiry>(`/inquiries/${id}/`, minimal);
    return fromApiInquiry(res.data);
}

export async function deleteInquiry(id: string | number): Promise<void> {
    await apiClient.delete(`/inquiries/${id}/`);
}

export async function assignInquiry(id: string | number, userId: string | number): Promise<void> {
    await apiClient.post(`/inquiries/${id}/assign/`, { user_id: Number(userId) });
}

export async function changeInquiryStatus(
    id: string | number,
    status: InquiryStatus,
    lostReason?: string,
): Promise<void> {
    const body: Record<string, unknown> = { status };
    if (lostReason) body.lost_reason = lostReason;
    await apiClient.post(`/inquiries/${id}/status/`, body);
}

export async function convertInquiryToQuotation(
    id: string | number,
): Promise<{ id: string; quotation_number: string }> {
    const res = await apiClient.post<{ id: number; quotation_number: string }>(
        `/inquiries/${id}/convert-to-quotation/`,
    );
    return { id: String(res.data.id), quotation_number: res.data.quotation_number };
}

export async function listFollowUps(inquiryId: string | number): Promise<InquiryFollowUp[]> {
    const res = await apiClient.get<PageResponse<ApiFollowUp> | ApiFollowUp[]>(
        `/inquiries/${inquiryId}/follow-ups/`,
    );
    const arr = Array.isArray(res.data) ? res.data : res.data.results;
    return arr.map(fromApiFollowUp);
}

export interface FollowUpWritePayload {
    followUpType: FollowUpType;
    scheduledAt: string;
    assignedTo: string;
    outcome?: string;
}

export async function createFollowUp(
    inquiryId: string | number,
    payload: FollowUpWritePayload,
): Promise<InquiryFollowUp> {
    const res = await apiClient.post<ApiFollowUp>(`/inquiries/${inquiryId}/follow-ups/`, {
        follow_up_type: payload.followUpType,
        scheduled_at: payload.scheduledAt,
        assigned_to: Number(payload.assignedTo),
        outcome: payload.outcome ?? '',
    });
    return fromApiFollowUp(res.data);
}

export async function updateFollowUp(
    id: string | number,
    patch: Partial<{ status: FollowUpStatus; outcome: string; completedAt: string | null }>,
): Promise<InquiryFollowUp> {
    const body: Record<string, unknown> = {};
    if (patch.status !== undefined) body.status = patch.status;
    if (patch.outcome !== undefined) body.outcome = patch.outcome;
    if (patch.completedAt !== undefined) body.completed_at = patch.completedAt;
    const res = await apiClient.patch<ApiFollowUp>(`/inquiries/follow-ups/${id}/`, body);
    return fromApiFollowUp(res.data);
}

export async function deleteFollowUp(id: string | number): Promise<void> {
    await apiClient.delete(`/inquiries/follow-ups/${id}/`);
}

export async function listLineItems(inquiryId: string | number): Promise<InquiryLineItem[]> {
    const res = await apiClient.get<PageResponse<ApiLineItem> | ApiLineItem[]>(
        `/inquiries/${inquiryId}/items/`,
    );
    const arr = Array.isArray(res.data) ? res.data : res.data.results;
    return arr.map(fromApiLineItem);
}

export interface LineItemWritePayload {
    productDescription: string;
    category?: string;
    specificationNotes?: string;
    quantity: number;
    unit: string;
    estimatedValue?: number;
    notes?: string;
}

function toApiLineItemWrite(p: LineItemWritePayload): Record<string, unknown> {
    return {
        product_description: p.productDescription,
        category: p.category ?? '',
        specification_notes: p.specificationNotes ?? '',
        quantity: p.quantity,
        unit: p.unit,
        estimated_value: p.estimatedValue ?? 0,
        notes: p.notes ?? '',
    };
}

export async function createLineItem(
    inquiryId: string | number,
    payload: LineItemWritePayload,
): Promise<InquiryLineItem> {
    const res = await apiClient.post<ApiLineItem>(
        `/inquiries/${inquiryId}/items/`,
        toApiLineItemWrite(payload),
    );
    return fromApiLineItem(res.data);
}

export async function updateLineItem(
    id: string | number,
    payload: Partial<LineItemWritePayload>,
): Promise<InquiryLineItem> {
    const res = await apiClient.patch<ApiLineItem>(
        `/inquiries/items/${id}/`,
        toApiLineItemWrite(payload as LineItemWritePayload),
    );
    return fromApiLineItem(res.data);
}

export async function deleteLineItem(id: string | number): Promise<void> {
    await apiClient.delete(`/inquiries/items/${id}/`);
}

export async function listActivity(inquiryId: string | number): Promise<InquiryActivity[]> {
    const res = await apiClient.get<PageResponse<ApiActivityLog> | ApiActivityLog[]>(
        `/inquiries/${inquiryId}/activity/`,
    );
    const arr = Array.isArray(res.data) ? res.data : res.data.results;
    return arr.map(fromApiActivity);
}

export interface BulkResult {
    succeeded: number[];
    failed: { id: number; reason: string }[];
}

export async function bulkAssignInquiries(
    ids: Array<string | number>,
    userId: string | number,
): Promise<BulkResult> {
    const res = await apiClient.post<BulkResult>(`/inquiries/bulk-assign/`, {
        inquiry_ids: ids.map(Number),
        user_id: Number(userId),
    });
    return res.data;
}

export async function bulkChangeStatus(
    ids: Array<string | number>,
    status: InquiryStatus,
    lostReason?: string,
): Promise<BulkResult> {
    const body: Record<string, unknown> = {
        inquiry_ids: ids.map(Number),
        status,
    };
    if (lostReason) body.lost_reason = lostReason;
    const res = await apiClient.post<BulkResult>(`/inquiries/bulk-status/`, body);
    return res.data;
}

export async function bulkExportInquiries(
    ids: Array<string | number>,
    format: 'csv' | 'xlsx' | 'pdf' = 'csv',
): Promise<Blob> {
    const res = await apiClient.post(
        `/inquiries/bulk-export/`,
        { inquiry_ids: ids.map(Number), format },
        { responseType: 'blob' },
    );
    return res.data as Blob;
}

export async function getInquiryStats(): Promise<{
    by_status: { status: string; count: number }[];
    by_source: { source: string; count: number }[];
    by_priority: { priority: string; count: number }[];
    total: number;
}> {
    const res = await apiClient.get(`/inquiries/stats/`);
    return res.data;
}

// ---------------------------------------------------------------------------
// Sources (read-only for now)
// ---------------------------------------------------------------------------

export async function listInquirySources(): Promise<InquirySource[]> {
    const res = await apiClient.get<PageResponse<ApiInquirySource> | ApiInquirySource[]>(
        '/inquiry-sources/',
    );
    const arr = Array.isArray(res.data) ? res.data : res.data.results;
    return arr.map(fromApiSource);
}
