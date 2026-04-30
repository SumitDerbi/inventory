import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrderDetailPage from '@/pages/orders/OrderDetailPage';
import { renderWithProviders } from '../../../../test/test-utils';
import { server } from '../../../../test/server';
import { makeApiSalesOrder, makeApiOrderItem } from '../../../../test/handlers';

function renderDetail(id: string | number = 1) {
    return renderWithProviders(
        <Routes>
            <Route path="/orders/:id" element={<OrderDetailPage />} />
        </Routes>,
        { route: `/orders/${id}` },
    );
}

describe('OrderDetailPage', () => {
    it('renders header, totals and line items from the API', async () => {
        server.use(
            http.get('/api/v1/orders/1/', () =>
                HttpResponse.json(makeApiSalesOrder()),
            ),
        );

        renderDetail();

        expect(await screen.findByText('SO/2604/00001')).toBeInTheDocument();
        expect(screen.getByText('Pump replacement')).toBeInTheDocument();
        expect(screen.getByText('Centrifugal pump 5HP')).toBeInTheDocument();
        expect(screen.getByText('Grand total')).toBeInTheDocument();
    });

    it('shows an error alert when the detail fetch fails', async () => {
        server.use(
            http.get('/api/v1/orders/1/', () =>
                HttpResponse.json({ detail: 'nope' }, { status: 500 }),
            ),
        );

        renderDetail();

        expect(
            await screen.findByText(/Failed to load order/i),
        ).toBeInTheDocument();
    });

    it('shows an empty state when the order has no items', async () => {
        server.use(
            http.get('/api/v1/orders/1/', () =>
                HttpResponse.json(makeApiSalesOrder({ items: [] })),
            ),
        );

        renderDetail();

        expect(await screen.findByText('SO/2604/00001')).toBeInTheDocument();
        expect(screen.getByText(/No items/i)).toBeInTheDocument();
    });

    it('advances the stage via the transition endpoint', async () => {
        let postedBody: unknown = null;
        const initial = makeApiSalesOrder({ status: 'confirmed' });
        const advanced = { ...initial, status: 'processing' };
        let getCalls = 0;
        server.use(
            http.get('/api/v1/orders/1/', () => {
                getCalls += 1;
                return HttpResponse.json(getCalls === 1 ? initial : advanced);
            }),
            http.post('/api/v1/orders/1/stage/', async ({ request }) => {
                postedBody = await request.json();
                return HttpResponse.json(advanced);
            }),
        );

        renderDetail();

        const advanceBtn = await screen.findByRole('button', {
            name: /Advance to Processing/i,
        });
        await userEvent.click(advanceBtn);

        await waitFor(() => {
            expect(postedBody).toEqual({ next_stage: 'processing' });
        });
    });

    it('records dispatch quantities through the dispatch endpoint', async () => {
        let postedBody: unknown = null;
        const order = makeApiSalesOrder({
            status: 'ready_to_dispatch',
            items: [makeApiOrderItem({ id: 501, quantity_pending: '2' })],
        });
        server.use(
            http.get('/api/v1/orders/1/', () => HttpResponse.json(order)),
            http.post('/api/v1/orders/1/dispatch/', async ({ request }) => {
                postedBody = await request.json();
                return HttpResponse.json({
                    ...order,
                    status: 'fully_dispatched',
                    items: [
                        makeApiOrderItem({
                            id: 501,
                            quantity_dispatched: '2',
                            quantity_pending: '0',
                        }),
                    ],
                });
            }),
        );

        renderDetail();

        const dispatchBtn = await screen.findByRole('button', { name: /^Dispatch$/i });
        await userEvent.click(dispatchBtn);

        const dialog = await screen.findByRole('dialog');
        await userEvent.click(
            within(dialog).getByRole('button', { name: /Record dispatch/i }),
        );

        await waitFor(() => {
            expect(postedBody).toEqual({
                items: [{ item_id: 501, quantity: 2 }],
            });
        });
    });

    it('renders MRP rows when the MRP tab is opened', async () => {
        server.use(
            http.get('/api/v1/orders/1/', () =>
                HttpResponse.json(makeApiSalesOrder()),
            ),
            http.get('/api/v1/orders/1/mrp/', () =>
                HttpResponse.json({
                    all_ready: false,
                    items: [
                        {
                            item_id: 501,
                            product_id: null,
                            product_description: 'Centrifugal pump 5HP',
                            required_qty: '2',
                            on_hand: '1',
                            reserved: '0',
                            available: '1',
                            shortfall: '1',
                            ready: false,
                        },
                    ],
                }),
            ),
        );

        renderDetail();

        await screen.findByText('SO/2604/00001');
        await userEvent.click(
            screen.getByRole('button', { name: /Material Readiness/i }),
        );

        expect(await screen.findByText('Shortage')).toBeInTheDocument();
        expect(screen.getByText('Short')).toBeInTheDocument();
    });
});
