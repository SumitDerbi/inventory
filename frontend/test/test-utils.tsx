import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import { ToastProvider } from '@/components/ui/Toast';

export function makeTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: 0, staleTime: 0 },
            mutations: { retry: false },
        },
    });
}

export interface WrapperOptions {
    route?: string;
    queryClient?: QueryClient;
}

export function AllProviders({
    children,
    route = '/',
    queryClient,
}: WrapperOptions & { children: ReactNode }) {
    const qc = queryClient ?? makeTestQueryClient();
    return (
        <QueryClientProvider client={qc}>
            <ToastProvider>
                <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
            </ToastProvider>
        </QueryClientProvider>
    );
}

export function renderWithProviders(
    ui: ReactElement,
    {
        route,
        queryClient,
        ...options
    }: WrapperOptions & Omit<RenderOptions, 'wrapper'> = {},
) {
    const qc = queryClient ?? makeTestQueryClient();
    return {
        queryClient: qc,
        ...render(ui, {
            wrapper: ({ children }) => (
                <AllProviders route={route} queryClient={qc}>
                    {children}
                </AllProviders>
            ),
            ...options,
        }),
    };
}
