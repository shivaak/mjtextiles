import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import ProtectedRoute from './ProtectedRoute';
import AppShell from '../layout/AppShell';

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('../../pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('../../pages/dashboard/DashboardPage'));
const BillingPage = lazy(() => import('../../pages/billing/BillingPage'));
const ProductsPage = lazy(() => import('../../pages/products/ProductsPage'));
const PurchasesPage = lazy(() => import('../../pages/purchases/PurchasesPage'));
const InventoryPage = lazy(() => import('../../pages/inventory/InventoryPage'));
const SalesPage = lazy(() => import('../../pages/sales/SalesPage'));
const SaleDetailPage = lazy(() => import('../../pages/sales/SaleDetailPage'));
const ReportsPage = lazy(() => import('../../pages/reports/ReportsPage'));
const UsersPage = lazy(() => import('../../pages/users/UsersPage'));
const SettingsPage = lazy(() => import('../../pages/settings/SettingsPage'));

function PageLoader() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
      }}
    >
      <CircularProgress />
    </Box>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes with layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="sales/:id" element={<SaleDetailPage />} />
          
          {/* Admin only routes */}
          <Route
            path="purchases"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <PurchasesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
