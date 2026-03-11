import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import BottomNav from './components/BottomNav';
import CatalogPage from './pages/CatalogPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CartPage from './pages/CartPage';
import PrizesPage from './pages/PrizesPage';
import ProfilePage from './pages/ProfilePage';
import ProductDetailPage from './pages/ProductDetailPage';
import SearchPage from './pages/SearchPage';
import NotificationsPage from './pages/NotificationsPage';

function App() {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
            <div className="h-12 w-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">DIROGSA Mobile</p>
        </div>
    );

    // List of pages where we DON'T want the BottomNav
    const hideNavOn = ['/product', '/login', '/search'];
    const shouldHideNav = hideNavOn.some(path => location.pathname.startsWith(path));

    return (
        <CartProvider>
            <div className="min-h-screen bg-slate-50">
                <Routes>
                    <Route path="/" element={isAuthenticated ? <HomePage /> : <Navigate to="/login" />} />
                    <Route path="/catalog" element={<CatalogPage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/prizes" element={<PrizesPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/product/:sku" element={<ProductDetailPage />} />
                    <Route path="/profile" element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />} />
                    <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
                </Routes>

                {isAuthenticated && !shouldHideNav && <BottomNav />}
            </div>
        </CartProvider>
    );
}

export default App;
