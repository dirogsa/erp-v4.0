import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationProvider } from './context/NotificationContext';
import { CompanyProvider } from './context/CompanyContext';
import { AuthProvider } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import Inventory from './pages/Inventory';
import MarketingInventory from './pages/MarketingInventory';
import Purchasing from './pages/Purchasing';
import Sales from './pages/Sales';
import Suppliers from './pages/Suppliers';
import Customers from './pages/Customers';
import ImportExport from './pages/ImportExport';
import Losses from './pages/Losses';
import Transfers from './pages/Transfers';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import BrandsManager from './pages/BrandsManager';

import Companies from './pages/Companies';
import Warehouses from './pages/Warehouses';
import Categories from './pages/Categories';
import CatalogConfig from './pages/CatalogConfig';
import CatalogView from './pages/CatalogView';
import B2BManagement from './pages/B2BManagement';
import BrandManagement from './pages/BrandManagement';
import PricingStrategy from './pages/PricingStrategy';
import Marketing from './pages/Marketing';
import Audit from './pages/Audit';
import CatalogIngestion from './pages/CatalogIngestion';
import FinancialAudit from './pages/FinancialAudit';
import StaffManagement from './pages/StaffManagement';
import ExchangeRates from './pages/ExchangeRates';
import SystemConfigPage from './pages/SystemConfigPage';
import ReconciliationPage from './pages/ReconciliationPage';
import ImportPlanning from './pages/ImportPlanning';
import SystemStatus from './pages/SystemStatus';
import FinancialSincerityInbox from './pages/FinancialSincerityInbox';
import GovernanceDashboard from './pages/GovernanceDashboard';



const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 0, // Disable retries to see errors immediately
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      onError: (error) => {
        console.error('React Query Global Error:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LoadingProvider>
          <NotificationProvider>
            <CompanyProvider>
              <BrowserRouter>
                {/* ... existing routes ... */}
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="*" element={
                    <ProtectedRoute>
                      <Layout>
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/companies" element={<Companies />} />
                          <Route path="/reports" element={<Reports />} />
                          <Route path="/inventory" element={<Inventory />} />
                          <Route path="/inventory/marketing" element={<MarketingInventory />} />
                          <Route path="/catalog-ingestion" element={<CatalogIngestion />} />
                          <Route path="/categories" element={<Categories />} />
                          <Route path="/suppliers" element={<Suppliers />} />
                          <Route path="/purchasing" element={<Purchasing />} />
                          <Route path="/warehouses" element={<Warehouses />} />
                          <Route path="/sales" element={<Sales />} />
                          <Route path="/customers" element={<Customers />} />
                          <Route path="/import-export" element={<ImportExport />} />
                          <Route path="/losses" element={<Losses />} />
                          <Route path="/transfers" element={<Transfers />} />
                          <Route path="/catalog" element={<CatalogConfig />} />
                          <Route path="/catalog/view" element={<CatalogView />} />
                          <Route path="/brands" element={<BrandManagement />} />
                          <Route path="/inventory/brands-master" element={<BrandsManager />} />
                          <Route path="/b2b" element={<B2BManagement />} />
                          <Route path="/pricing-strategy" element={<PricingStrategy />} />
                          <Route path="/marketing" element={<Marketing />} />
                          <Route path="/audit" element={<Audit />} />
                          <Route path="/audit/financial" element={<FinancialAudit />} />
                          <Route path="/staff" element={<StaffManagement />} />
                          <Route path="/exchange-rates" element={<ExchangeRates />} />
                          <Route path="/system-config" element={<SystemConfigPage />} />
                          <Route path="/system-status" element={<SystemStatus />} />
                          <Route path="/reconciliation" element={<ReconciliationPage />} />
                          <Route path="/import-planning" element={<ImportPlanning />} />
                          <Route path="/financial-sincerity" element={<FinancialSincerityInbox />} />
                          <Route path="/governance" element={<GovernanceDashboard />} />
                        </Routes>
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
