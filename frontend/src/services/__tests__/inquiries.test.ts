import { describe, expect, it } from 'vitest';
import { fromApiInquiry } from '@/services/inquiries';

describe('fromApiInquiry', () => {
    it('converts snake_case payload to camelCase Inquiry shape', () => {
        const result = fromApiInquiry({
            id: 42,
            inquiry_number: 'INQ-2026-0042',
            source: 3,
            customer: null,
            customer_name: 'Acme',
            company_name: 'Acme Pvt',
            mobile: '+91 9000000000',
            email: 'a@b.test',
            city: 'Pune',
            state: 'MH',
            project_name: 'Foo',
            project_description: 'desc',
            product_category: 7,
            inquiry_type: 'new_project',
            priority: 'high',
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
        });

        expect(result.id).toBe('42');
        expect(result.inquiryNumber).toBe('INQ-2026-0042');
        expect(result.sourceId).toBe('3');
        expect(result.productCategoryId).toBe('7');
        expect(result.customerId).toBeNull();
        expect(result.assignedTo).toBeNull();
        expect(result.priority).toBe('high');
        expect(result.lineItems).toEqual([]);
        expect(result.followUps).toEqual([]);
        expect(result.activity).toEqual([]);
        expect(result.attachments).toEqual([]);
    });

    it('stringifies non-null FK ids', () => {
        const result = fromApiInquiry({
            id: 1,
            inquiry_number: 'INQ-1',
            source: 2,
            customer: 5,
            customer_name: '',
            company_name: '',
            mobile: '',
            email: '',
            city: '',
            state: '',
            project_name: '',
            project_description: '',
            product_category: 9,
            inquiry_type: 'new_project',
            priority: 'medium',
            status: 'new',
            assigned_to: 11,
            expected_order_date: null,
            site_location: '',
            budget_range: '',
            source_reference: '',
            lost_reason: null,
            notes: '',
            line_items: [],
            created_at: '',
            updated_at: '',
        });

        expect(result.customerId).toBe('5');
        expect(result.assignedTo).toBe('11');
    });
});
