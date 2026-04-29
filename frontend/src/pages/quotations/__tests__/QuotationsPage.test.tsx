import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuotationsPage from '@/pages/quotations/QuotationsPage';
import { renderWithProviders } from '../../../../test/test-utils';
import { server } from '../../../../test/server';
import { makeApiQuotationListItem } from '../../../../test/handlers';

describe('QuotationsPage', () => {
    it('renders quotations fetched from the API', async () => {
        server.use(
            http.get('/api/v1/quotations/', () =>
                HttpResponse.json({
                    count: 1,
                    next: null,
                    previous: null,
                    results: [makeApiQuotationListItem()],
                }),
            ),
        );

        renderWithProviders(<QuotationsPage />);

        expect(await screen.findByText('QUO-2026-0001')).toBeInTheDocument();
        expect(screen.getByText('Ravi Kumar')).toBeInTheDocument();
        expect(screen.getByText('Acme Pvt Ltd')).toBeInTheDocument();
        expect(screen.getByText('Pump replacement')).toBeInTheDocument();
    });

    it('shows an error alert when listing fails', async () => {
        server.use(
            http.get('/api/v1/quotations/', () =>
                HttpResponse.json({ detail: 'boom' }, { status: 500 }),
            ),
        );

        renderWithProviders(<QuotationsPage />);

        expect(
            await screen.findByText(/Could not load quotations/i),
        ).toBeInTheDocument();
    });

    it('shows the empty-state message when there are no results', async () => {
        server.use(
            http.get('/api/v1/quotations/', () =>
                HttpResponse.json({
                    count: 0,
                    next: null,
                    previous: null,
                    results: [],
                }),
            ),
        );

        renderWithProviders(<QuotationsPage />);

        expect(
            await screen.findByText(/No quotations match the current filters/i),
        ).toBeInTheDocument();
    });

    it('passes the search term as a query param', async () => {
        const captured: string[] = [];
        server.use(
            http.get('/api/v1/quotations/', ({ request }) => {
                const url = new URL(request.url);
                captured.push(url.searchParams.get('search') ?? '');
                return HttpResponse.json({
                    count: 0,
                    next: null,
                    previous: null,
                    results: [],
                });
            }),
        );

        renderWithProviders(<QuotationsPage />);

        const search = await screen.findByPlaceholderText(/search by quote/i);
        await userEvent.type(search, 'pump');

        await waitFor(() => {
            expect(captured.some((s) => s === 'pump')).toBe(true);
        });
    });

    it('passes the status filter as a query param', async () => {
        const captured: string[] = [];
        server.use(
            http.get('/api/v1/quotations/', ({ request }) => {
                const url = new URL(request.url);
                captured.push(url.searchParams.get('status') ?? '');
                return HttpResponse.json({
                    count: 0,
                    next: null,
                    previous: null,
                    results: [],
                });
            }),
        );

        renderWithProviders(<QuotationsPage />);

        const select = await screen.findByLabelText('Status');
        await userEvent.selectOptions(select, 'sent');

        await waitFor(() => {
            expect(captured.some((s) => s === 'sent')).toBe(true);
        });
    });

    it('renders multiple quotation rows with totals and version badge', async () => {
        server.use(
            http.get('/api/v1/quotations/', () =>
                HttpResponse.json({
                    count: 2,
                    next: null,
                    previous: null,
                    results: [
                        makeApiQuotationListItem({
                            id: 1,
                            quotation_number: 'QUO-A',
                            version_number: 2,
                        }),
                        makeApiQuotationListItem({
                            id: 2,
                            quotation_number: 'QUO-B',
                            customer_name: 'Beta Buyer',
                            company_name: 'Beta Co',
                            grand_total: '250000',
                        }),
                    ],
                }),
            ),
        );

        renderWithProviders(<QuotationsPage />);

        expect(await screen.findByText('QUO-A')).toBeInTheDocument();
        expect(screen.getByText('QUO-B')).toBeInTheDocument();
        expect(screen.getByText('Beta Buyer')).toBeInTheDocument();
        expect(screen.getByText('v2')).toBeInTheDocument();
    });
});
