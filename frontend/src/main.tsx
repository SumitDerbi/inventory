import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import { AuthProvider } from './app/auth-context';
import { PortalAuthProvider } from './app/portal-context';
import { router } from './app/router';
import { ToastProvider } from './components/ui/Toast';
import { queryClient } from './services/queryClient';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <PortalAuthProvider>
                    <ToastProvider>
                        <Suspense
                            fallback={
                                <div className="flex min-h-screen items-center justify-center bg-bg text-sm text-slate-500">
                                    Loading…
                                </div>
                            }
                        >
                            <RouterProvider router={router} />
                        </Suspense>
                    </ToastProvider>
                </PortalAuthProvider>
            </AuthProvider>
        </QueryClientProvider>
    </StrictMode>,
);
