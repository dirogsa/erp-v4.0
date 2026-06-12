import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationProvider } from './context/NotificationContext';
import { CompanyProvider } from './context/CompanyContext';
import { AuthProvider } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingScreen from './components/common/LoadingScreen';

// ─── Eager (pequeños, siempre necesarios) ────────────────────────────────────
import LoginPage from './pages/LoginPage';

// ─── Lazy: cada página = chunk separado en producción ────────────────────────
// Core
const Dashboard            = lazy(() => import('./pages/Dashboard'));
const Companies            = lazy(() => import('./pages/Companies'));
const Reports              = lazy(() => import('./pages/Reports'));
const Warehouses           = lazy(() => import('./pages/Warehouses'));

// Inventario
const Inventory            = lazy(() => import('./pages/Inventory'));
const MarketingInventory   = lazy(() => import('./pages/MarketingInventory'));
const Categories           = lazy(() => import('./pages/Categories'));
const BrandsManager        = lazy(() => import('./pages/BrandsManager'));
const BrandManagement      = lazy(() => import('./pages/BrandManagement'));
const ProductBrandManagement = lazy(() => import('./pages/ProductBrandManagement'));
const Losses               = lazy(() => import('./pages/Losses'));
const Transfers            = lazy(() => import('./pages/Transfers'));

// Compras / Proveedores
const Suppliers            = lazy(() => import('./pages/Suppliers'));
const Purchasing           = lazy(() => import('./pages/Purchasing'));
const ImportExport         = lazy(() => import('./pages/ImportExport'));
const ImportPlanning       = lazy(() => import('./pages/ImportPlanning'));

// Ventas / Clientes / B2B
const Sales                = lazy(() => import('./pages/Sales'));
const Customers            = lazy(() => import('./pages/Customers'));
const B2BManagement        = lazy(() => import('./pages/B2BManagement'));

// Precios
const PricingStrategy      = lazy(() => import('./pages/PricingStrategy'));

// Marketing
const Marketing            = lazy(() => import('./pages/Marketing'));
const ReviewsManager       = lazy(() => import('./pages/marketing/ReviewsManager'));

// Finanzas / Auditoría
const Audit                = lazy(() => import('./pages/Audit'));
const FinancialAudit       = lazy(() => import('./pages/FinancialAudit'));
const FinancialSincerityInbox = lazy(() => import('./pages/FinancialSincerityInbox'));
const ReconciliationPage   = lazy(() => import('./pages/ReconciliationPage'));
const Treasury             = lazy(() => import('./pages/Treasury'));
const ExchangeRates        = lazy(() => import('./pages/ExchangeRates'));
const GovernanceDashboard  = lazy(() => import('./pages/GovernanceDashboard'));

// Sistema
const StaffManagement      = lazy(() => import('./pages/StaffManagement'));
const SystemConfigPage     = lazy(() => import('./pages/SystemConfigPage'));
const SystemStatus         = lazy(() => import('./pages/SystemStatus'));

// Katalog (pantalla completa, fuera de Layout)
const KatalogConfigPanel   = lazy(() => import('./pages/katalog/ConfigPanel'));
const KatalogPrintEngine   = lazy(() => import('./pages/katalog/PrintEngine'));

// ─── React Query ─────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 0,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000, // v5: cacheTime → gcTime
    },
  },
});

// ─── Fallback de carga ───────────────────────────────────────────────────────
const PageLoader = () => <LoadingScreen />;

// ─── App ─────────────────────────────────────────────────────────────────────
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LoadingProvider>
          <NotificationProvider>
            <CompanyProvider>
              <BrowserRouter>
                <Routes>
                  {/* Pública */}
                  <Route path="/login" element={<LoginPage />} />

                  {/* Katalog — pantalla completa, lazy */}
                  <Route path="/catalog" element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}>
                        <KatalogConfigPanel />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="/catalog/print" element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}>
                        <KatalogPrintEngine />
                      </Suspense>
                    </ProtectedRoute>
                  } />

                  {/* ERP — Layout compartido, Suspense envuelve el router interno */}
                  <Route path="*" element={
                    <ProtectedRoute>
                      <Layout>
                        <Suspense fallback={<PageLoader />}>
                          <Routes>
                            <Route path="/"                         element={<Dashboard />} />
                            <Route path="/dashboard"               element={<Dashboard />} />
                            <Route path="/companies"               element={<Companies />} />
                            <Route path="/reports"                 element={<Reports />} />
                            <Route path="/inventory"               element={<Inventory />} />
                            <Route path="/inventory/marketing"     element={<MarketingInventory />} />
                            <Route path="/inventory/brands-master" element={<BrandsManager />} />
                            <Route path="/categories"              element={<Categories />} />
                            <Route path="/suppliers"               element={<Suppliers />} />
                            <Route path="/purchasing"              element={<Purchasing />} />
                            <Route path="/warehouses"              element={<Warehouses />} />
                            <Route path="/sales"                   element={<Sales />} />
                            <Route path="/customers"               element={<Customers />} />
                            <Route path="/import-export"           element={<ImportExport />} />
                            <Route path="/import-planning"         element={<ImportPlanning />} />
                            <Route path="/losses"                  element={<Losses />} />
                            <Route path="/transfers"               element={<Transfers />} />
                            <Route path="/brands"                  element={<BrandManagement />} />
                            <Route path="/product-brands"          element={<ProductBrandManagement />} />
                            <Route path="/b2b"                     element={<B2BManagement />} />
                            <Route path="/pricing-strategy"        element={<PricingStrategy />} />
                            <Route path="/marketing"               element={<Marketing />} />
                            <Route path="/marketing/reviews"       element={<ReviewsManager />} />
                            <Route path="/audit"                   element={<Audit />} />
                            <Route path="/audit/financial"         element={<FinancialAudit />} />
                            <Route path="/financial-sincerity"     element={<FinancialSincerityInbox />} />
                            <Route path="/reconciliation"          element={<ReconciliationPage />} />
                            <Route path="/treasury"                element={<Treasury />} />
                            <Route path="/exchange-rates"          element={<ExchangeRates />} />
                            <Route path="/governance"              element={<GovernanceDashboard />} />
                            <Route path="/staff"                   element={<StaffManagement />} />
                            <Route path="/system-config"           element={<SystemConfigPage />} />
                            <Route path="/system-status"           element={<SystemStatus />} />
                          </Routes>
                        </Suspense>
                      </Layout>
                    </ProtectedRoute>
                  } />
                </Routes>
              </BrowserRouter>
            </CompanyProvider>
          </NotificationProvider>
        </LoadingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
