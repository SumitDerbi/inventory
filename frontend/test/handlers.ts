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
