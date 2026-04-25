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
const QuotationDetailPage = lazy(
    () => import('@/pages/quotations/QuotationDetailPage'),
);
const OrdersPage = lazy(() => import('@/pages/orders/OrdersPage'));
const OrderDetailPage = lazy(() => import('@/pages/orders/OrderDetailPage'));
const InventoryLayout = lazy(() => import('@/pages/inventory/InventoryLayout'));
const ProductsListPage = lazy(
    () => import('@/pages/inventory/ProductsListPage'),
);
const ProductDetailPage = lazy(
    () => import('@/pages/inventory/ProductDetailPage'),
);
const AdjustmentsPage = lazy(
    () => import('@/pages/inventory/AdjustmentsPage'),
);
const WarehousesPage = lazy(() => import('@/pages/inventory/WarehousesPage'));
const ReorderPage = lazy(() => import('@/pages/inventory/ReorderPage'));
const ReservationsPage = lazy(
    () => import('@/pages/inventory/ReservationsPage'),
);
const DispatchLayout = lazy(() => import('@/pages/dispatch/DispatchLayout'));
const DispatchListPage = lazy(
    () => import('@/pages/dispatch/DispatchListPage'),
);
const DispatchDetailPage = lazy(
    () => import('@/pages/dispatch/DispatchDetailPage'),
);
const PlanDispatchPage = lazy(
    () => import('@/pages/dispatch/PlanDispatchPage'),
);
const TransportersPage = lazy(
    () => import('@/pages/dispatch/TransportersPage'),
);
const VehiclesPage = lazy(() => import('@/pages/dispatch/VehiclesPage'));
const JobsLayout = lazy(() => import('@/pages/jobs/JobsLayout'));
const JobsListPage = lazy(() => import('@/pages/jobs/JobsListPage'));
const JobDetailPage = lazy(() => import('@/pages/jobs/JobDetailPage'));
const SchedulerPage = lazy(() => import('@/pages/jobs/SchedulerPage'));
const EngineersPage = lazy(() => import('@/pages/jobs/EngineersPage'));
const DocumentsPage = lazy(() => import('@/pages/documents/DocumentsPage'));
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'));
const ReportViewerPage = lazy(
    () => import('@/pages/reports/ReportViewerPage'),
);
const UsersPage = lazy(() => import('@/pages/admin/UsersPage'));
const RolesPage = lazy(() => import('@/pages/admin/RolesPage'));
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage'));
const ProfilePage = lazy(() => import('@/pages/admin/ProfilePage'));
const NotificationCenterPage = lazy(
    () => import('@/pages/admin/NotificationCenterPage'),
);

// Dev/utility
const KitchenSinkPage = lazy(() => import('@/pages/_dev/KitchenSink'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

const devRoutes = import.meta.env.DEV
    ? [{ path: '/__kitchen-sink', element: <KitchenSinkPage /> }]
    : [];

export const router = createBrowserRouter(
    [
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
            { path: 'quotations/:id', element: <QuotationDetailPage /> },
            { path: 'orders', element: <OrdersPage /> },
            { path: 'orders/:id', element: <OrderDetailPage /> },
            {
                path: 'inventory',
                element: <InventoryLayout />,
                children: [
                    { index: true, element: <Navigate to="products" replace /> },
                    { path: 'products', element: <ProductsListPage /> },
                    { path: 'products/:id', element: <ProductDetailPage /> },
                    { path: 'reorder', element: <ReorderPage /> },
                    { path: 'reservations', element: <ReservationsPage /> },
                    { path: 'adjustments', element: <AdjustmentsPage /> },
                    { path: 'warehouses', element: <WarehousesPage /> },
                ],
            },
            {
                path: 'dispatch',
                element: <DispatchLayout />,
                children: [
                    { index: true, element: <DispatchListPage /> },
                    { path: 'plan', element: <PlanDispatchPage /> },
                    { path: 'transporters', element: <TransportersPage /> },
                    { path: 'vehicles', element: <VehiclesPage /> },
                    { path: ':id', element: <DispatchDetailPage /> },
                ],
            },
            {
                path: 'jobs',
                element: <JobsLayout />,
                children: [
                    { index: true, element: <JobsListPage /> },
                    { path: 'calendar', element: <SchedulerPage /> },
                    { path: 'engineers', element: <EngineersPage /> },
                    { path: ':id', element: <JobDetailPage /> },
                ],
            },
            { path: 'documents', element: <DocumentsPage /> },
            { path: 'reports', element: <ReportsPage /> },
            { path: 'reports/:slug', element: <ReportViewerPage /> },
            { path: 'users', element: <UsersPage /> },
            { path: 'users/roles', element: <RolesPage /> },
            { path: 'settings', element: <SettingsPage /> },
            { path: 'profile', element: <ProfilePage /> },
            { path: 'notifications', element: <NotificationCenterPage /> },
        ],
    },
    { path: '*', element: <NotFoundPage /> },
    ...devRoutes,
],
    { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
);
