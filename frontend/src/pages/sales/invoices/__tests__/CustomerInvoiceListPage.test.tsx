import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomerInvoiceListPage from '@/pages/sales/invoices/CustomerInvoiceListPage';
import { renderWithProviders } from '../../../../../test/test-utils';
import { server } from '../../../../../test/server';

interface ApiInvoiceListStub {
    id: number;
    invoice_number: string;
    customer: number;
    customer_name: string;
    order: number | null;
    order_number: string;
    invoice_type: 'tax_invoice';
    invoice_date: string;
    grand_total: string;
    status: 'draft' | 'issued' | 'cancelled';
    created_at: string;
}

function makeRow(overrides: Partial<ApiInvoiceListStub> = {}): ApiInvoiceListStub {
    return {
        id: 11,
        invoice_number: 'INV/2604/00001',
        customer: 1,
        customer_name: 'Acme Pvt Ltd',
        order: 5,
        order_number: 'SO/2604/00001',
        invoice_type: 'tax_invoice',
        invoice_date: '2026-04-25',
        grand_total: '118000',
        status: 'draft',
        created_at: '2026-04-25T10:00:00Z',
        ...overrides,
    };
}

const AGING_OK = {
    '0-30': { count: 2, total: '236000' },
    '31-60': { count: 0, total: '0' },
    '61-90': { count: 0, total: '0' },
    '90+': { count: 0, total: '0' },
};

describe('CustomerInvoiceListPage', () => {
    it('renders invoices fetched from the API', async () => {
        server.use(
            http.get('/api/v1/customer-invoices/', () =>
                HttpResponse.json({
                    count: 1,
                    next: null,
                    previous: null,
                    results: [makeRow()],
                }),
            ),
            http.get('/api/v1/customer-invoices/aging/', () =>
                HttpResponse.json(AGING_OK),
            ),
        );

        renderWithProviders(<CustomerInvoiceListPage />);

        expect(await screen.findByText('INV/2604/00001')).toBeInTheDocument();
        expect(screen.getByText('Acme Pvt Ltd')).toBeInTheDocument();
        expect(screen.getByText('SO/2604/00001')).toBeInTheDocument();
    });

    it('shows aging bucket counts from the aging endpoint', async () => {
        server.use(
            http.get('/api/v1/customer-invoices/', () =>
                HttpResponse.json({ count: 0, next: null, previous: null, results: [] }),
            ),
            http.get('/api/v1/customer-invoices/aging/', () =>
                HttpResponse.json(AGING_OK),
            ),
        );

        renderWithProviders(<CustomerInvoiceListPage />);

        expect(await screen.findByText(/0–30 days · 2/)).toBeInTheDocument();
    });

    it('shows an error alert when listing fails', async () => {
        server.use(
            http.get('/api/v1/customer-invoices/', () =>
                HttpResponse.json({ detail: 'boom' }, { status: 500 }),
            ),
            http.get('/api/v1/customer-invoices/aging/', () =>
                HttpResponse.json(AGING_OK),
            ),
        );

        renderWithProviders(<CustomerInvoiceListPage />);

        expect(
            await screen.findByText(/Failed to load invoices/i),
        ).toBeInTheDocument();
    });

    it('shows the empty-state message when there are no results', async () => {
        server.use(
            http.get('/api/v1/customer-invoices/', () =>
                HttpResponse.json({ count: 0, next: null, previous: null, results: [] }),
            ),
            http.get('/api/v1/customer-invoices/aging/', () =>
                HttpResponse.json(AGING_OK),
            ),
        );

        renderWithProviders(<CustomerInvoiceListPage />);

        expect(
            await screen.findByText(/No invoices match the current filters/i),
        ).toBeInTheDocument();
    });

    it('passes the status filter as a query param', async () => {
        const captured: string[] = [];
        server.use(
            http.get('/api/v1/customer-invoices/', ({ request }) => {
                const url = new URL(request.url);
                captured.push(url.searchParams.get('status') ?? '');
                return HttpResponse.json({
                    count: 0,
                    next: null,
                    previous: null,
                    results: [],
                });
            }),
            http.get('/api/v1/customer-invoices/aging/', () =>
                HttpResponse.json(AGING_OK),
            ),
        );

        renderWithProviders(<CustomerInvoiceListPage />);

        const select = await screen.findByLabelText('Status');
        await userEvent.selectOptions(select, 'issued');

        await waitFor(() => {
            expect(captured.some((s) => s === 'issued')).toBe(true);
        });
    });

    it('triggers bulk export with selected ids', async () => {
        let postedBody: unknown = null;
        server.use(
            http.get('/api/v1/customer-invoices/', () =>
                HttpResponse.json({
                    count: 1,
                    next: null,
                    previous: null,
                    results: [makeRow()],
                }),
            ),
            http.get('/api/v1/customer-invoices/aging/', () =>
                HttpResponse.json(AGING_OK),
            ),
            http.post(
                '/api/v1/customer-invoices/bulk-export/',
                async ({ request }) => {
                    postedBody = await request.json();
                    return HttpResponse.json({
                        results: [{ id: 11, status: 'ok' }],
                    });
                },
            ),
        );

        renderWithProviders(<CustomerInvoiceListPage />);

        const checkbox = await screen.findByLabelText('Select INV/2604/00001');
        await userEvent.click(checkbox);

        const exportSelected = await screen.findByRole('button', {
            name: /Export selected/i,
        });
        await userEvent.click(exportSelected);

        await waitFor(() => {
            expect(postedBody).toEqual({ ids: [11] });
        });
    });
});
