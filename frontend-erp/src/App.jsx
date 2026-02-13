import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationProvider } from './context/NotificationContext';
import { CompanyProvider } from './context/CompanyContext';
import { AuthProvider } from './context/AuthContext';
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

import Companies from './pages/Companies';
import Warehouses from './pages/Warehouses';
import Categories from './pages/Categories';
import CatalogConfig from './pages/CatalogConfig';
import CatalogView from './pages/CatalogView';
import B2BManagement from './pages/B2BManagement';
import BrandManagement from './pages/BrandManagement';
import PricingManagement from './pages/PricingManagement';
import Marketing from './pages/Marketing';
import Audit from './pages/Audit';
import SalesPolicies from './pages/SalesPolicies';
import PriceUpdateMasive from './pages/PriceUpdateMasive';
import CatalogIngestion from './pages/CatalogIngestion';
import StaffManagement from './pages/StaffManagement';



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
        <NotificationProvider>
          <CompanyProvider>
            <BrowserRouter>
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
                        <Route path="/inventory/bulk-import" element={<CatalogIngestion />} />
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
                        <Route path="/b2b" element={<B2BManagement />} />
                        <Route path="/pricing" element={<PricingManagement />} />
                        <Route path="/marketing" element={<Marketing />} />
                        <Route path="/audit" element={<Audit />} />
                        <Route path="/sales-policies" element={<SalesPolicies />} />
                        <Route path="/price-update" element={<PriceUpdateMasive />} />
                        <Route path="/staff" element={<StaffManagement />} />
                      </Routes>

                    </Layout>
                  </ProtectedRoute>
                } />
              </Routes>
            </BrowserRouter>
          </CompanyProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
