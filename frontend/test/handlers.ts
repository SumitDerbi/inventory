import { http, HttpResponse } from 'msw';

// Backend payload shape (snake_case) — keep tests close to the wire format.
export interface ApiInquiryStub {
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
    inquiry_type: string;
    priority: string;
    status: string;
    assigned_to: number | null;
    expected_order_date: string | null;
    site_location: string;
    budget_range: string;
    source_reference: string;
    lost_reason: string | null;
    notes: string;
    line_items: never[];
    created_at: string;
    updated_at: string;
}

export function makeApiInquiry(
    overrides: Partial<ApiInquiryStub> = {},
): ApiInquiryStub {
    return {
        id: 1,
        inquiry_number: 'INQ-2026-0001',
        source: 1,
        customer: null,
        customer_name: 'Acme Industries',
        company_name: 'Acme Pvt Ltd',
        mobile: '+91 9000000001',
        email: 'buyer@acme.test',
        city: 'Pune',
        state: 'MH',
        project_name: 'Pump replacement',
        project_description: '',
        product_category: 1,
        inquiry_type: 'new_project',
        priority: 'medium',
        status: 'new',
        assigned_to: null,
        expected_order_date: null,
        site_location: '',
        budget_range: '',
        source_reference: '',
        lost_reason: null,
        notes: '',
        line_items: [],
        created_at: '2026-04-20T10:00:00Z',
        updated_at: '2026-04-20T10:00:00Z',
        ...overrides,
    };
}

const BASE = '/api/v1';

export const defaultHandlers = [
    http.get(`${BASE}/inquiries/`, () =>
        HttpResponse.json({
            count: 1,
            next: null,
            previous: null,
            results: [makeApiInquiry()],
        }),
    ),
    http.get(`${BASE}/inquiry-sources/`, () =>
        HttpResponse.json([
            { id: 1, name: 'Website', is_active: true },
            { id: 2, name: 'Referral', is_active: true },
        ]),
    ),
    http.get(`${BASE}/inquiries/:id/`, ({ params }) =>
        HttpResponse.json(makeApiInquiry({ id: Number(params.id) })),
    ),
    http.get(`${BASE}/inquiries/:id/follow_ups/`, () => HttpResponse.json([])),
    http.get(`${BASE}/inquiries/:id/line_items/`, () => HttpResponse.json([])),
    http.get(`${BASE}/inquiries/:id/activity/`, () => HttpResponse.json([])),
];

// ---------------------------------------------------------------------------
// Quotations stubs
// ---------------------------------------------------------------------------

export interface ApiQuotationItemStub {
    id: number;
    quotation: number;
    product: number | null;
    product_code: string;
    product_description: string;
    brand: string;
    model_number: string;
    specifications: string;
    quantity: string;
    unit: string;
    unit_cost: string;
    unit_price: string;
    discount_percent: string;
    discount_amount: string;
    tax_rule: number | null;
    tax_amount: string;
    line_total: string;
    sort_order: number;
    notes: string;
    created_at: string;
    updated_at: string;
}

export function makeApiQuotationItem(
    overrides: Partial<ApiQuotationItemStub> = {},
): ApiQuotationItemStub {
    return {
        id: 101,
        quotation: 1,
        product: null,
        product_code: 'P-100',
        product_description: 'Centrifugal pump 5HP',
        brand: 'Acme',
        model_number: 'CP-5',
        specifications: '',
        quantity: '2',
        unit: 'nos',
        unit_cost: '40000',
        unit_price: '50000',
        discount_percent: '0',
        discount_amount: '0',
        tax_rule: null,
        tax_amount: '18000',
        line_total: '118000',
        sort_order: 1,
        notes: '',
        created_at: '2026-04-20T10:00:00Z',
        updated_at: '2026-04-20T10:00:00Z',
        ...overrides,
    };
}

export interface ApiQuotationStub {
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
    status: string;
    prepared_by: number | null;
    approved_by: number | null;
    approved_at: string | null;
    currency: string;
    subtotal: string;
    total_discount: string;
    total_tax: string;
    freight_amount: string;
    other_charges: string;
    grand_total: string;
    gross_margin_percent: string | null;
    payment_terms: string;
    delivery_terms: string;
    warranty_terms: string;
    scope_of_supply: string;
    exclusions: string;
    notes: string;
    sent_at: string | null;
    parent_quotation: number | null;
    items: ApiQuotationItemStub[];
    created_at: string;
    updated_at: string;
}

export function makeApiQuotation(
    overrides: Partial<ApiQuotationStub> = {},
): ApiQuotationStub {
    return {
        id: 1,
        quotation_number: 'QUO-2026-0001',
        version_number: 1,
        inquiry: null,
        customer: 11,
        contact: null,
        site_address: '',
        project_name: 'Pump replacement',
        quotation_date: '2026-04-20',
        valid_until: '2026-05-20',
        status: 'draft',
        prepared_by: null,
        approved_by: null,
        approved_at: null,
        currency: 'INR',
        subtotal: '100000',
        total_discount: '0',
        total_tax: '18000',
        freight_amount: '0',
        other_charges: '0',
        grand_total: '118000',
        gross_margin_percent: null,
        payment_terms: '',
        delivery_terms: '',
        warranty_terms: '',
        scope_of_supply: '',
        exclusions: '',
        notes: '',
        sent_at: null,
        parent_quotation: null,
        items: [makeApiQuotationItem()],
        created_at: '2026-04-20T10:00:00Z',
        updated_at: '2026-04-20T10:00:00Z',
        ...overrides,
    };
}

export interface ApiQuotationListStub {
    id: number;
    quotation_number: string;
    version_number: number;
    customer: number;
    customer_name: string;
    company_name: string;
    project_name: string;
    status: string;
    quotation_date: string;
    valid_until: string;
    grand_total: string;
    currency: string;
    prepared_by: number | null;
    created_at: string;
}

export function makeApiQuotationListItem(
    overrides: Partial<ApiQuotationListStub> = {},
): ApiQuotationListStub {
    return {
        id: 1,
        quotation_number: 'QUO-2026-0001',
        version_number: 1,
        customer: 11,
        customer_name: 'Ravi Kumar',
        company_name: 'Acme Pvt Ltd',
        project_name: 'Pump replacement',
        status: 'draft',
        quotation_date: '2026-04-20',
        valid_until: '2026-05-20',
        grand_total: '118000',
        currency: 'INR',
        prepared_by: null,
        created_at: '2026-04-20T10:00:00Z',
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// Orders stubs
// ---------------------------------------------------------------------------

export interface ApiOrderItemStub {
    id: number;
    order: number;
    product: number | null;
    product_description: string;
    quantity_ordered: string;
    quantity_dispatched: string;
    quantity_pending: string;
    unit: string;
    unit_price: string;
    discount_percent: string;
    tax_rule: number | null;
    line_total: string;
    status: string;
    notes: string;
}

export function makeApiOrderItem(
    overrides: Partial<ApiOrderItemStub> = {},
): ApiOrderItemStub {
    return {
        id: 501,
        order: 1,
        product: null,
        product_description: 'Centrifugal pump 5HP',
        quantity_ordered: '2',
        quantity_dispatched: '0',
        quantity_pending: '2',
        unit: 'nos',
        unit_price: '50000',
        discount_percent: '0',
        tax_rule: null,
        line_total: '118000',
        status: 'open',
        notes: '',
        ...overrides,
    };
}

export interface ApiSalesOrderStub {
    id: number;
    order_number: string;
    quotation: number | null;
    customer: number;
    contact: number | null;
    project_name: string;
    order_date: string;
    status: string;
    confirmed_at: string | null;
    confirmed_by: number | null;
    cancellation_reason: string;
    assigned_sales_exec: number | null;
    subtotal: string;
    total_discount: string;
    total_tax: string;
    freight_amount: string;
    grand_total: string;
    items: ApiOrderItemStub[];
    created_at: string;
    updated_at: string;
}

export function makeApiSalesOrder(
    overrides: Partial<ApiSalesOrderStub> = {},
): ApiSalesOrderStub {
    return {
        id: 1,
        order_number: 'SO/2604/00001',
        quotation: null,
        customer: 11,
        contact: null,
        project_name: 'Pump replacement',
        order_date: '2026-04-25',
        status: 'confirmed',
        confirmed_at: '2026-04-25T10:00:00Z',
        confirmed_by: 1,
        cancellation_reason: '',
        assigned_sales_exec: null,
        subtotal: '100000',
        total_discount: '0',
        total_tax: '18000',
        freight_amount: '0',
        grand_total: '118000',
        items: [makeApiOrderItem()],
        created_at: '2026-04-25T10:00:00Z',
        updated_at: '2026-04-25T10:00:00Z',
        ...overrides,
    };
}

export interface ApiSalesOrderListStub {
    id: number;
    order_number: string;
    customer: number;
    customer_name: string;
    company_name: string;
    project_name: string;
    status: string;
    order_date: string;
    grand_total: string;
    assigned_sales_exec: number | null;
    created_at: string;
}

export function makeApiSalesOrderListItem(
    overrides: Partial<ApiSalesOrderListStub> = {},
): ApiSalesOrderListStub {
    return {
        id: 1,
        order_number: 'SO/2604/00001',
        customer: 11,
        customer_name: 'Ravi Kumar',
        company_name: 'Acme Pvt Ltd',
        project_name: 'Pump replacement',
        status: 'confirmed',
        order_date: '2026-04-25',
        grand_total: '118000',
        assigned_sales_exec: null,
        created_at: '2026-04-25T10:00:00Z',
        ...overrides,
    };
}

/** Default detail-tab handlers (items/approval-steps/communications/activity/versions). */
export function quotationDetailHandlers(
    quotation: ApiQuotationStub = makeApiQuotation(),
) {
    return [
        http.get(`${BASE}/quotations/${quotation.id}/`, () =>
            HttpResponse.json(quotation),
        ),
        http.get(`${BASE}/quotations/${quotation.id}/items/`, () =>
            HttpResponse.json(quotation.items),
        ),
        http.get(`${BASE}/quotations/${quotation.id}/approval-steps/`, () =>
            HttpResponse.json([]),
        ),
        http.get(`${BASE}/quotations/${quotation.id}/communications/`, () =>
            HttpResponse.json([]),
        ),
        http.get(`${BASE}/quotations/${quotation.id}/activity/`, () =>
            HttpResponse.json([]),
        ),
        http.get(`${BASE}/quotations/${quotation.id}/versions/`, () =>
            HttpResponse.json([]),
        ),
    ];
}
