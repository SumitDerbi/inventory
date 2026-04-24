/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/layouts/AppShell';
import { ProtectedRoute } from './ProtectedRoute';

// Public
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(
    () => import('@/pages/auth/ForgotPasswordPage'),
);

// Modules
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const InquiriesPage = lazy(() => import('@/pages/inquiries/InquiriesPage'));
const InquiryDetailPage = lazy(
    () => import('@/pages/inquiries/InquiryDetailPage'),
);
const QuotationsPage = lazy(() => import('@/pages/quotations/QuotationsPage'));
const OrdersPage = lazy(() => import('@/pages/orders/OrdersPage'));
const InventoryPage = lazy(() => import('@/pages/inventory/InventoryPage'));
const DispatchPage = lazy(() => import('@/pages/dispatch/DispatchPage'));
const JobsPage = lazy(() => import('@/pages/jobs/JobsPage'));
const DocumentsPage = lazy(() => import('@/pages/documents/DocumentsPage'));
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'));
const UsersPage = lazy(() => import('@/pages/admin/UsersPage'));
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage'));

// Dev/utility
const KitchenSinkPage = lazy(() => import('@/pages/_dev/KitchenSink'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

export const router = createBrowserRouter([
    { path: '/login', element: <LoginPage /> },
    { path: '/forgot-password', element: <ForgotPasswordPage /> },
    {
        element: (
            <ProtectedRoute>
                <AppShell />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <Navigate to="/dashboard" replace /> },
            { path: 'dashboard', element: <DashboardPage /> },
            { path: 'inquiries', element: <InquiriesPage /> },
            { path: 'inquiries/:id', element: <InquiryDetailPage /> },
            { path: 'quotations', element: <QuotationsPage /> },
            { path: 'orders', element: <OrdersPage /> },
            { path: 'inventory', element: <InventoryPage /> },
            { path: 'dispatch', element: <DispatchPage /> },
            { path: 'jobs', element: <JobsPage /> },
            { path: 'documents', element: <DocumentsPage /> },
            { path: 'reports', element: <ReportsPage /> },
            { path: 'users', element: <UsersPage /> },
            { path: 'settings', element: <SettingsPage /> },
        ],
    },
    { path: '/__kitchen-sink', element: <KitchenSinkPage /> },
    { path: '*', element: <NotFoundPage /> },
]);
