import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomerInvoiceDetailPage from '@/pages/sales/invoices/CustomerInvoiceDetailPage';
import { renderWithProviders } from '../../../../../test/test-utils';
import { server } from '../../../../../test/server';

interface ApiInvoiceItemStub {
    id: number;
    invoice: number;
    product: number | null;
    description: string;
    hsn_code: string;
    quantity: string;
    unit: string;
    unit_price: string;
    discount_amount: string;
    tax_percent: string;
    tax_amount: string;
    line_total: string;
}

interface ApiInvoiceStub {
    id: number;
    invoice_number: string;
    order: number | null;
    customer: number;
    challan: number | null;
    invoice_type: 'tax_invoice';
    invoice_date: string;
    due_date: string | null;
    is_gst_invoice: boolean;
    place_of_supply: string;
    subtotal: string;
    tax_amount: string;
    grand_total: string;
    status: 'draft' | 'issued' | 'cancelled';
    notes: string;
    items: ApiInvoiceItemStub[];
    created_at: string;
    updated_at: string;
}

function makeItem(overrides: Partial<ApiInvoiceItemStub> = {}): ApiInvoiceItemStub {
    return {
        id: 501,
        invoice: 11,
        product: null,
        description: 'Centrifugal pump 5HP',
        hsn_code: '8413',
        quantity: '2',
        unit: 'nos',
        unit_price: '50000',
        discount_amount: '0',
        tax_percent: '18',
        tax_amount: '18000',
        line_total: '118000',
        ...overrides,
    };
}

function makeInvoice(overrides: Partial<ApiInvoiceStub> = {}): ApiInvoiceStub {
    return {
        id: 11,
        invoice_number: 'INV/2604/00001',
        order: 5,
        customer: 1,
        challan: null,
        invoice_type: 'tax_invoice',
        invoice_date: '2026-04-25',
        due_date: null,
        is_gst_invoice: true,
        place_of_supply: 'MH',
        subtotal: '100000',
        tax_amount: '18000',
        grand_total: '118000',
        status: 'draft',
        notes: '',
        items: [makeItem()],
        created_at: '2026-04-25T10:00:00Z',
        updated_at: '2026-04-25T10:00:00Z',
        ...overrides,
    };
}

function renderDetail(id: string | number = 11) {
    return renderWithProviders(
        <Routes>
            <Route
                path="/sales/invoices/:id"
                element={<CustomerInvoiceDetailPage />}
            />
        </Routes>,
        { route: `/sales/invoices/${id}` },
    );
}

describe('CustomerInvoiceDetailPage', () => {
    it('renders header, totals, and line items from the API', async () => {
        server.use(
            http.get('/api/v1/customer-invoices/11/', () =>
                HttpResponse.json(makeInvoice()),
            ),
        );

        renderDetail();

        expect(await screen.findByText('INV/2604/00001')).toBeInTheDocument();
        expect(screen.getByText('Centrifugal pump 5HP')).toBeInTheDocument();
        expect(screen.getByText('Grand total')).toBeInTheDocument();
    });

    it('shows an error alert when the detail fetch fails', async () => {
        server.use(
            http.get('/api/v1/customer-invoices/11/', () =>
                HttpResponse.json({ detail: 'nope' }, { status: 500 }),
            ),
        );

        renderDetail();

        expect(
            await screen.findByText(/Failed to load invoice/i),
        ).toBeInTheDocument();
    });

    it('shows an empty state when the invoice has no items', async () => {
        server.use(
            http.get('/api/v1/customer-invoices/11/', () =>
                HttpResponse.json(makeInvoice({ items: [] })),
            ),
        );

        renderDetail();

        expect(await screen.findByText(/No items yet/i)).toBeInTheDocument();
    });

    it('issues the invoice via the finalise endpoint', async () => {
        let posted = false;
        let getCalls = 0;
        const draft = makeInvoice();
        const issued = makeInvoice({ status: 'issued' });
        server.use(
            http.get('/api/v1/customer-invoices/11/', () => {
                getCalls += 1;
                return HttpResponse.json(getCalls === 1 ? draft : issued);
            }),
            http.post('/api/v1/customer-invoices/11/finalise/', () => {
                posted = true;
                return HttpResponse.json(issued);
            }),
        );

        renderDetail();

        const issueBtn = await screen.findByRole('button', {
            name: /Issue invoice/i,
        });
        await userEvent.click(issueBtn);

        await waitFor(() => {
            expect(posted).toBe(true);
        });
    });

    it('cancels the invoice via the cancel endpoint with a reason', async () => {
        let postedBody: unknown = null;
        const draft = makeInvoice();
        const cancelled = makeInvoice({ status: 'cancelled' });
        let getCalls = 0;
        server.use(
            http.get('/api/v1/customer-invoices/11/', () => {
                getCalls += 1;
                return HttpResponse.json(getCalls === 1 ? draft : cancelled);
            }),
            http.post(
                '/api/v1/customer-invoices/11/cancel/',
                async ({ request }) => {
                    postedBody = await request.json();
                    return HttpResponse.json(cancelled);
                },
            ),
        );

        renderDetail();

        const cancelBtn = await screen.findByRole('button', { name: /^Cancel$/ });
        await userEvent.click(cancelBtn);

        const reason = await screen.findByLabelText('Reason');
        await userEvent.type(reason, 'Customer changed mind');

        const confirm = screen.getByRole('button', { name: /Cancel invoice/i });
        await userEvent.click(confirm);

        await waitFor(() => {
            expect(postedBody).toEqual({ reason: 'Customer changed mind' });
        });
    });

    it('removes a line item via the items DELETE endpoint', async () => {
        let deleted = false;
        const draft = makeInvoice();
        let getCalls = 0;
        server.use(
            http.get('/api/v1/customer-invoices/11/', () => {
                getCalls += 1;
                return HttpResponse.json(
                    getCalls === 1 ? draft : makeInvoice({ items: [] }),
                );
            }),
            http.delete('/api/v1/customer-invoices/items/501/', () => {
                deleted = true;
                return new HttpResponse(null, { status: 204 });
            }),
        );

        renderDetail();

        const delBtn = await screen.findByRole('button', {
            name: /Delete Centrifugal pump 5HP/i,
        });
        await userEvent.click(delBtn);

        const confirm = await screen.findByRole('button', { name: /^Remove$/ });
        await userEvent.click(confirm);

        await waitFor(() => {
            expect(deleted).toBe(true);
        });
    });
});
