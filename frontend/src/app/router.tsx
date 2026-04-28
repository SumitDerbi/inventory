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
const CustomersListPage = lazy(
    () => import('@/pages/customers/CustomersListPage'),
);
const CustomerDetailPage = lazy(
    () => import('@/pages/customers/CustomerDetailPage'),
);
const CustomerNewPage = lazy(
    () => import('@/pages/customers/CustomerNewPage'),
);
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
const PurchaseLayout = lazy(() => import('@/pages/purchase/PurchaseLayout'));
const POListPage = lazy(() => import('@/pages/purchase/POListPage'));
const PODetailPage = lazy(() => import('@/pages/purchase/PODetailPage'));
const PRListPage = lazy(() => import('@/pages/purchase/PRListPage'));
const PRDetailPage = lazy(() => import('@/pages/purchase/PRDetailPage'));
const RFQListPage = lazy(() => import('@/pages/purchase/RFQListPage'));
const RFQDetailPage = lazy(() => import('@/pages/purchase/RFQDetailPage'));
const GRNListPage = lazy(() => import('@/pages/purchase/GRNListPage'));
const GRNDetailPage = lazy(() => import('@/pages/purchase/GRNDetailPage'));
const VendorInvoiceListPage = lazy(() => import('@/pages/purchase/VendorInvoiceListPage'));
const VendorInvoiceDetailPage = lazy(() => import('@/pages/purchase/VendorInvoiceDetailPage'));
const PaymentListPage = lazy(() => import('@/pages/purchase/PaymentListPage'));
const PurchaseReturnListPage = lazy(() => import('@/pages/purchase/PurchaseReturnListPage'));
const PurchaseReturnDetailPage = lazy(() => import('@/pages/purchase/PurchaseReturnDetailPage'));
const VendorsListPage = lazy(() => import('@/pages/purchase/VendorsListPage'));
const VendorDetailPage = lazy(() => import('@/pages/purchase/VendorDetailPage'));
const PurchaseDashboardPage = lazy(() => import('@/pages/purchase/PurchaseDashboardPage'));
const PurchaseAdminPage = lazy(() => import('@/pages/purchase/PurchaseAdminPage'));
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
                { path: 'customers', element: <CustomersListPage /> },
                { path: 'customers/new', element: <CustomerNewPage /> },
                { path: 'customers/:id', element: <CustomerDetailPage /> },
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
                    path: 'purchase',
                    element: <PurchaseLayout />,
                    children: [
                        { index: true, element: <POListPage /> },
                        { path: 'orders/:id', element: <PODetailPage /> },
                        { path: 'requisitions', element: <PRListPage /> },
                        { path: 'requisitions/:id', element: <PRDetailPage /> },
                        { path: 'rfqs', element: <RFQListPage /> },
                        { path: 'rfqs/:id', element: <RFQDetailPage /> },
                        { path: 'grns', element: <GRNListPage /> },
                        { path: 'grns/:id', element: <GRNDetailPage /> },
                        { path: 'invoices', element: <VendorInvoiceListPage /> },
                        { path: 'invoices/:id', element: <VendorInvoiceDetailPage /> },
                        { path: 'payments', element: <PaymentListPage /> },
                        { path: 'returns', element: <PurchaseReturnListPage /> },
                        { path: 'returns/:id', element: <PurchaseReturnDetailPage /> },
                        { path: 'vendors', element: <VendorsListPage /> },
                        { path: 'vendors/:id', element: <VendorDetailPage /> },
                        { path: 'dashboard', element: <PurchaseDashboardPage /> },
                        { path: 'admin', element: <PurchaseAdminPage /> },
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
