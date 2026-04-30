import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrdersPage from '@/pages/orders/OrdersPage';
import { renderWithProviders } from '../../../../test/test-utils';
import { server } from '../../../../test/server';
import { makeApiSalesOrderListItem } from '../../../../test/handlers';

describe('OrdersPage', () => {
    it('renders orders fetched from the API', async () => {
        server.use(
            http.get('/api/v1/orders/', () =>
                HttpResponse.json({
                    count: 1,
                    next: null,
                    previous: null,
                    results: [makeApiSalesOrderListItem()],
                }),
            ),
        );

        renderWithProviders(<OrdersPage />);

        expect(await screen.findByText('SO/2604/00001')).toBeInTheDocument();
        expect(screen.getByText('Ravi Kumar')).toBeInTheDocument();
        expect(screen.getByText('Acme Pvt Ltd')).toBeInTheDocument();
    });

    it('shows an error alert when listing fails', async () => {
        server.use(
            http.get('/api/v1/orders/', () =>
                HttpResponse.json({ detail: 'boom' }, { status: 500 }),
            ),
        );

        renderWithProviders(<OrdersPage />);

        expect(
            await screen.findByText(/Failed to load orders/i),
        ).toBeInTheDocument();
    });

    it('shows the empty-state message when there are no results', async () => {
        server.use(
            http.get('/api/v1/orders/', () =>
                HttpResponse.json({
                    count: 0,
                    next: null,
                    previous: null,
                    results: [],
                }),
            ),
        );

        renderWithProviders(<OrdersPage />);

        expect(
            await screen.findByText(/No orders match the current filters/i),
        ).toBeInTheDocument();
    });

    it('passes the search term as a query param', async () => {
        const captured: string[] = [];
        server.use(
            http.get('/api/v1/orders/', ({ request }) => {
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

        renderWithProviders(<OrdersPage />);

        const search = await screen.findByPlaceholderText(/search by so/i);
        await userEvent.type(search, 'pump');

        await waitFor(() => {
            expect(captured.some((s) => s === 'pump')).toBe(true);
        });
    });

    it('passes the status filter as a query param', async () => {
        const captured: string[] = [];
        server.use(
            http.get('/api/v1/orders/', ({ request }) => {
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

        renderWithProviders(<OrdersPage />);

        const select = await screen.findByLabelText('Status');
        await userEvent.selectOptions(select, 'processing');

        await waitFor(() => {
            expect(captured.some((s) => s === 'processing')).toBe(true);
        });
    });

    it('shows the dataset count footer', async () => {
        server.use(
            http.get('/api/v1/orders/', () =>
                HttpResponse.json({
                    count: 3,
                    next: null,
                    previous: null,
                    results: [
                        makeApiSalesOrderListItem({ id: 1, order_number: 'SO-A' }),
                        makeApiSalesOrderListItem({ id: 2, order_number: 'SO-B' }),
                        makeApiSalesOrderListItem({ id: 3, order_number: 'SO-C' }),
                    ],
                }),
            ),
        );

        renderWithProviders(<OrdersPage />);

        expect(await screen.findByText('SO-A')).toBeInTheDocument();
        expect(screen.getByText(/Showing 3 of 3 orders/)).toBeInTheDocument();
    });

    it('renders the bulk export menu', async () => {
        server.use(
            http.get('/api/v1/orders/', () =>
                HttpResponse.json({
                    count: 1,
                    next: null,
                    previous: null,
                    results: [makeApiSalesOrderListItem()],
                }),
            ),
        );

        renderWithProviders(<OrdersPage />);

        await screen.findByText('SO/2604/00001');
        await userEvent.click(screen.getByRole('button', { name: /Export/i }));
        expect(await screen.findByText(/Format/i)).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /CSV/i })).toBeInTheDocument();
    });
});
