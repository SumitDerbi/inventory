import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InquiryFormDrawer } from '@/pages/inquiries/InquiryFormDrawer';
import { renderWithProviders } from '../../../../test/test-utils';
import { server } from '../../../../test/server';
import { makeApiInquiry } from '../../../../test/handlers';

function field(name: string) {
    const el = document.querySelector(`[name="${name}"]`);
    if (!el) throw new Error(`field ${name} not found`);
    return el as HTMLInputElement | HTMLSelectElement;
}

async function fillRequiredFields() {
    await userEvent.selectOptions(field('sourceId') as HTMLSelectElement, '1');
    await userEvent.type(field('customerName'), 'Acme Industries');
    await userEvent.type(field('mobile'), '+91 9000000001');
    const cat = field('productCategoryId') as HTMLSelectElement;
    if (cat.options[1]) {
        await userEvent.selectOptions(cat, cat.options[1].value);
    }
}

describe('InquiryFormDrawer', () => {
    it('submits a new inquiry payload to the API', async () => {
        let captured: Record<string, unknown> | null = null;
        server.use(
            http.post('/api/v1/inquiries/', async ({ request }) => {
                captured = (await request.json()) as Record<string, unknown>;
                return HttpResponse.json(makeApiInquiry({ id: 99, inquiry_number: 'INQ-NEW' }));
            }),
        );
        const onOpenChange = vi.fn();

        renderWithProviders(
            <InquiryFormDrawer open onOpenChange={onOpenChange} initial={null} />,
        );

        // Wait for sources to load.
        await screen.findByRole('option', { name: 'Website' });
        await fillRequiredFields();
        await userEvent.click(
            screen.getByRole('button', { name: /create inquiry|create/i }),
        );

        await waitFor(() => expect(captured).not.toBeNull());
        expect(captured).toMatchObject({
            customer_name: 'Acme Industries',
            mobile: '+91 9000000001',
            source: 1,
        });
        await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    });

    it('renders duplicates banner on 409 and force-creates on confirm', async () => {
        let forceUsed = false;
        server.use(
            http.post('/api/v1/inquiries/', async ({ request }) => {
                const url = new URL(request.url);
                if (url.searchParams.get('force') === 'true') {
                    forceUsed = true;
                    return HttpResponse.json(makeApiInquiry({ id: 7 }));
                }
                return HttpResponse.json(
                    {
                        duplicates: [
                            {
                                id: 5,
                                inquiry_number: 'INQ-DUP',
                                customer_name: 'Existing Co',
                                match_reasons: ['mobile'],
                            },
                        ],
                    },
                    { status: 409 },
                );
            }),
        );
        const onOpenChange = vi.fn();

        renderWithProviders(
            <InquiryFormDrawer open onOpenChange={onOpenChange} initial={null} />,
        );

        await screen.findByRole('option', { name: 'Website' });
        await fillRequiredFields();
        await userEvent.click(
            screen.getByRole('button', { name: /create inquiry|create/i }),
        );

        expect(
            await screen.findByText(/Possible duplicate/i),
        ).toBeInTheDocument();
        expect(screen.getByText(/INQ-DUP/)).toBeInTheDocument();

        await userEvent.click(
            screen.getByRole('button', { name: /Create anyway/i }),
        );

        await waitFor(() => expect(forceUsed).toBe(true));
        await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    });
});
