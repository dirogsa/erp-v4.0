import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('shop_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const shopService = {
    // Only COMMERCIAL products for sales/catalog
    getProducts: (params = {}) => api.get('/shop/products', { params: { ...params, type: 'COMMERCIAL' } }),
    getProductBySku: (sku) => api.get(`/shop/products/${sku}`),
    getCategories: () => api.get('/categories'),
    getVehicleBrands: () => api.get('/shop/brands'),
    getSynchronizedVehicles: () => api.get('/shop/vehicles'),
    getPaymentOptions: () => api.get('/shop/payment-options'),
    getInvoices: () => api.get('/shop/invoices'),
    checkout: (data) => api.post('/shop/checkout', data),
    getNotifications: () => api.get('/shop/notifications'),
    markNotificationRead: (id) => api.post(`/shop/notifications/${id}/read`),
    getPredictiveOrder: () => api.get('/shop/predictive-order'),
    getProfile: () => api.get('/shop/profile'),
    getOrders: () => api.get('/shop/orders'),
    cancelOrder: (orderNumber) => api.delete(`/shop/orders/${orderNumber}`),
    getQuotes: () => api.get('/shop/quotes'),
    // ADMIN DASHBOARD (SuperAdmin / Admin Only)
    getAdminStats: (companyId = null) => api.get('/shop/admin/stats', { params: { company_id: companyId } }),
    getAdminOrders: (params = {}) => api.get('/shop/admin/orders', { params }),
    // MARKETING products for prizes/redemption
    getPrizes: (params = {}) => api.get('/shop/prizes', { params: { ...params, type: 'MARKETING' } }),
    redeemPrize: (redemptionData) => api.post('/shop/redeem', redemptionData),
};

export const authService = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getMe: () => api.get('/auth/me'),
    applyB2B: (appData) => api.post('/auth/apply-b2b', appData),
};

export default api;
