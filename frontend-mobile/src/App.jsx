import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import BottomNav from './components/BottomNav';
import CatalogPage from './pages/CatalogPage';
import HomePage from './pages/HomePage';
import PublicHomePage from './pages/PublicHomePage';
import LoginPage from './pages/LoginPage';
import CartPage from './pages/CartPage';
import PrizesPage from './pages/PrizesPage';
import ProfilePage from './pages/ProfilePage';
import ProductDetailPage from './pages/ProductDetailPage';
import SearchPage from './pages/SearchPage';
import NotificationsPage from './pages/NotificationsPage';
import OrdersPage from './pages/OrdersPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { NotificationProvider } from './context/NotificationContext';
import SystemLoader from './components/SystemLoader';

function App() {
    const { isAuthenticated, loading, user } = useAuth();
    const location = useLocation();

    const isAdmin = user?.role === 'SUPERADMIN' || user?.role === 'ADMIN';

    if (loading) return <SystemLoader />;

    // The user explicitly requested the BottomNav to ALWAYS be visible, even on the login screen
    const hideNavOn = []; // Previously contained '/login'
    const shouldHideNav = hideNavOn.some(path => location.pathname.startsWith(path));

    return (
        <NotificationProvider>
            <CartProvider>
                <div className="min-h-screen bg-brand-bg pb-24">
                    <Routes>
                        <Route path="/" element={<PublicHomePage />} />
                        <Route path="/dashboard" element={isAuthenticated ? <HomePage /> : <Navigate to="/login" />} />
                        <Route path="/catalog" element={<Navigate to="/search" />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/prizes" element={<PrizesPage />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/orders" element={isAuthenticated ? <OrdersPage /> : <Navigate to="/login" />} />
                        <Route path="/admin" element={isAdmin ? <AdminDashboardPage /> : <Navigate to="/" />} />
                        <Route path="/product/:sku" element={<ProductDetailPage />} />
                        <Route path="/profile" element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />} />
                        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
                    </Routes>

                    {!shouldHideNav && <BottomNav />}
                </div>
            </CartProvider>
        </NotificationProvider>
    );
}

export default App;
