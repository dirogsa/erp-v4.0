import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import CatalogPage from './pages/CatalogPage';
import ProductDetail from './pages/ProductDetail';
import B2BApplicationPage from './pages/B2BApplicationPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CheckoutPage from './pages/CheckoutPage';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-slate-50 w-full text-slate-900 flex flex-col">
                <Navbar />

                <div className="flex-grow">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/catalog" element={<CatalogPage />} />
                        <Route path="/product/:sku" element={<ProductDetail />} />
                        <Route path="/b2b" element={<B2BApplicationPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/orders" element={<OrdersPage />} />
                    </Routes>
                </div>

                <Footer />
            </div>
        </Router>
    );
}

export default App;
