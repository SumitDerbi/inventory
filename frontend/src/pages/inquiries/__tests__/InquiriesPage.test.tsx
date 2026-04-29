import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InquiriesPage from '@/pages/inquiries/InquiriesPage';
import { renderWithProviders } from '../../../../test/test-utils';
import { server } from '../../../../test/server';
import { makeApiInquiry } from '../../../../test/handlers';

describe('InquiriesPage', () => {
    it('renders inquiries fetched from the API', async () => {
        renderWithProviders(<InquiriesPage />);

        expect(await screen.findByText('INQ-2026-0001')).toBeInTheDocument();
        expect(screen.getByText('Acme Industries')).toBeInTheDocument();
        expect(screen.getByText(/1 of 1 inquiries/)).toBeInTheDocument();
    });

    it('shows an error alert when listing fails', async () => {
        server.use(
            http.get('/api/v1/inquiries/', () =>
                HttpResponse.json({ detail: 'boom' }, { status: 500 }),
            ),
        );

        renderWithProviders(<InquiriesPage />);

        expect(
            await screen.findByText(/Could not load inquiries/i),
        ).toBeInTheDocument();
    });

    it('passes the search term as a query param', async () => {
        const captured: string[] = [];
        server.use(
            http.get('/api/v1/inquiries/', ({ request }) => {
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

        renderWithProviders(<InquiriesPage />);

        const search = await screen.findByPlaceholderText(/search by/i);
        await userEvent.type(search, 'acme');

        await waitFor(() => {
            expect(captured.some((s) => s === 'acme')).toBe(true);
        });
    });

    it('shows an empty-state message when there are no results', async () => {
        server.use(
            http.get('/api/v1/inquiries/', () =>
                HttpResponse.json({
                    count: 0,
                    next: null,
                    previous: null,
                    results: [],
                }),
            ),
        );

        renderWithProviders(<InquiriesPage />);

        expect(
            await screen.findByText(/No inquiries match the current filters/i),
        ).toBeInTheDocument();
    });

    it('renders multiple inquiry rows', async () => {
        server.use(
            http.get('/api/v1/inquiries/', () =>
                HttpResponse.json({
                    count: 2,
                    next: null,
                    previous: null,
                    results: [
                        makeApiInquiry({ id: 1, inquiry_number: 'INQ-A' }),
                        makeApiInquiry({
                            id: 2,
                            inquiry_number: 'INQ-B',
                            customer_name: 'Beta Co',
                        }),
                    ],
                }),
            ),
        );

        renderWithProviders(<InquiriesPage />);

        expect(await screen.findByText('INQ-A')).toBeInTheDocument();
        expect(screen.getByText('INQ-B')).toBeInTheDocument();
        expect(screen.getByText('Beta Co')).toBeInTheDocument();
    });
});
