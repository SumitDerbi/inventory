import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuotationDetailPage from '@/pages/quotations/QuotationDetailPage';
import { renderWithProviders } from '../../../../test/test-utils';
import { server } from '../../../../test/server';
import {
    makeApiQuotation,
    makeApiQuotationItem,
    quotationDetailHandlers,
} from '../../../../test/handlers';

function renderDetail(id: string | number = 1) {
    return renderWithProviders(
        <Routes>
            <Route
                path="/quotations/:id"
                element={<QuotationDetailPage />}
            />
        </Routes>,
        { route: `/quotations/${id}` },
    );
}

describe('QuotationDetailPage', () => {
    it('renders quotation header, totals and line items from the API', async () => {
        server.use(...quotationDetailHandlers());

        renderDetail();

        expect(await screen.findByText('QUO-2026-0001')).toBeInTheDocument();
        expect(screen.getByText('v1')).toBeInTheDocument();
        expect(screen.getAllByText('Grand total').length).toBeGreaterThan(0);
        // Line item content
        expect(
            await screen.findByText('Centrifugal pump 5HP'),
        ).toBeInTheDocument();
    });

    it('shows an error alert when the detail fetch fails', async () => {
        server.use(
            http.get('/api/v1/quotations/1/', () =>
                HttpResponse.json({ detail: 'nope' }, { status: 500 }),
            ),
            // Stub sibling tab queries so MSW does not log unhandled-request errors.
            http.get('/api/v1/quotations/1/items/', () => HttpResponse.json([])),
            http.get('/api/v1/quotations/1/approval-steps/', () =>
                HttpResponse.json([]),
            ),
            http.get('/api/v1/quotations/1/communications/', () =>
                HttpResponse.json([]),
            ),
            http.get('/api/v1/quotations/1/activity/', () => HttpResponse.json([])),
            http.get('/api/v1/quotations/1/versions/', () => HttpResponse.json([])),
        );

        renderDetail();

        expect(
            await screen.findByText(/Could not load quotation/i),
        ).toBeInTheDocument();
    });

    it('shows an empty state when the quotation has no line items', async () => {
        const quote = makeApiQuotation({ items: [] });
        server.use(...quotationDetailHandlers(quote));

        renderDetail();

        expect(await screen.findByText('QUO-2026-0001')).toBeInTheDocument();
        expect(screen.getByText(/No line items/i)).toBeInTheDocument();
    });

    it('switches to the activity tab and renders log entries from the API', async () => {
        const quote = makeApiQuotation();
        server.use(
            http.get(`/api/v1/quotations/${quote.id}/activity/`, () =>
                HttpResponse.json([
                    {
                        id: 1,
                        quotation: quote.id,
                        action_type: 'created',
                        old_value: null,
                        new_value: null,
                        remarks: 'Initial draft',
                        performed_by: null,
                        performed_at: '2026-04-20T10:00:00Z',
                    },
                ]),
            ),
            ...quotationDetailHandlers(quote),
        );

        renderDetail();

        await screen.findByText('QUO-2026-0001');
        await userEvent.click(screen.getByRole('tab', { name: /Activity/i }));

        expect(await screen.findByText('created')).toBeInTheDocument();
        expect(screen.getByText('Initial draft')).toBeInTheDocument();
    });

    it('submits a draft quotation for approval and shows a success toast', async () => {
        let submitted = false;
        const quote = makeApiQuotation();
        server.use(
            ...quotationDetailHandlers(quote),
            http.post(`/api/v1/quotations/${quote.id}/submit-approval/`, () => {
                submitted = true;
                return HttpResponse.json({
                    ...quote,
                    status: 'pending_approval',
                });
            }),
        );

        renderDetail();

        const submitBtn = await screen.findByRole('button', {
            name: /Submit approval/i,
        });
        await userEvent.click(submitBtn);

        await waitFor(() => expect(submitted).toBe(true));
        expect(
            await screen.findByText(/Submitted for approval/i),
        ).toBeInTheDocument();
    });

    it('renders multiple line items in order', async () => {
        const quote = makeApiQuotation({
            items: [
                makeApiQuotationItem({
                    id: 101,
                    product_description: 'Pump A',
                    sort_order: 1,
                }),
                makeApiQuotationItem({
                    id: 102,
                    product_description: 'Valve B',
                    sort_order: 2,
                }),
            ],
        });
        server.use(...quotationDetailHandlers(quote));

        renderDetail();

        expect(await screen.findByText('Pump A')).toBeInTheDocument();
        expect(screen.getByText('Valve B')).toBeInTheDocument();
    });
});
