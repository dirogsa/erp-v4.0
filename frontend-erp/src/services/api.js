import axios from 'axios';

// Use environment variable for backend URL, fallback to localhost for development
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Authorization Interceptor
api.interceptors.request.use(config => {
  const token = localStorage.getItem('erp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  getMe: () => api.get('/auth/me'),
  getB2BApplications: () => api.get('/auth/b2b-applications'),
  updateB2BApplication: (appId, data) => api.put(`/auth/b2b-applications/${appId}`, data),
  processB2BApplication: (appId, status, adminNotes = '', targetUser = null, targetPass = null, classification = 'STANDARD') => {
    let url = `/auth/b2b-applications/${appId}/process`;
    const params = new URLSearchParams();
    if (targetUser) params.append('target_username', targetUser);
    if (targetPass) params.append('target_password', targetPass);
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    return api.post(url, { status, admin_notes: adminNotes, classification });
  },
  resetUserPassword: (username, email, new_password) => api.post('/auth/reset-password', { username, email, new_password }),
  deleteB2BApplication: (appId) => api.delete(`/auth/b2b-applications/${appId}`),
};



export const inventoryService = {
  getProducts: (page = 1, limit = 50, search = '', category = '', product_type = '') =>
    api.get('/inventory/products', { params: { skip: (page - 1) * limit, limit, search, category, product_type } }),
  createProduct: (product, initial_stock = 0) => api.post(`/inventory/products?initial_stock=${initial_stock}`, product),
  generateMarketingSku: () => api.get('/inventory/generate-marketing-sku'),
  deleteProduct: (sku) => api.delete(`/inventory/products/${sku}`),
  updateProduct: (sku, product, new_stock = null) => {
    const params = new_stock !== null ? `?new_stock=${new_stock}` : '';
    return api.put(`/inventory/products/${sku}${params}`, product);
  },
  importProducts: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/inventory/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  exportProducts: (template = 'current') => api.get(`/inventory/export?template=${template}`, { responseType: 'blob' }),

  // Losses
  registerLoss: (lossData) => api.post('/inventory/losses', lossData),
  getLossesReport: (params) => api.get('/inventory/losses/report', { params }),

  // Transfers
  // Warehouses
  getWarehouses: () => api.get('/inventory/warehouses'),
  createWarehouse: (warehouse) => api.post('/inventory/warehouses', warehouse),
  updateWarehouse: (code, warehouse) => api.put(`/inventory/warehouses/${code}`, warehouse),
  deleteWarehouse: (code) => api.delete(`/inventory/warehouses/${code}`),
  registerTransfer: (transferData) => api.post('/inventory/transfer-out', transferData),
};

export const priceService = {
  getProductsWithPrices: (page = 1, limit = 50, search = '') =>
    api.get('/inventory/prices', { params: { skip: (page - 1) * limit, limit, search: search || undefined } }),
  updatePrice: (sku, priceData) => api.put(`/inventory/prices/${sku}`, priceData),
  getHistory: (sku, priceType = '') =>
    api.get(`/inventory/prices/${sku}/history`, { params: { price_type: priceType || undefined } }),
  bulkUpdate: (updates, reason = '') =>
    api.post('/inventory/prices/bulk-update', { updates, reason: reason || undefined }),
  importCsv: (file, reason = '') => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/inventory/prices/import-csv?reason=${encodeURIComponent(reason)}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};
export const purchasingService = {
  // Orders
  createOrder: (order) => api.post('/purchasing/orders', order),
  getOrders: (page = 1, limit = 50, search = '', status = '', date_from = '', date_to = '') =>
    api.get('/purchasing/orders', { params: { skip: (page - 1) * limit, limit, search, status, date_from, date_to } }),
  deleteOrder: (orderNumber) => api.delete(`/purchasing/orders/${orderNumber}`),

  // Invoices
  createInvoice: (invoiceData) => api.post('/purchasing/invoices', invoiceData),
  getInvoices: (page = 1, limit = 50, search = '', payment_status = '', date_from = '', date_to = '') =>
    api.get('/purchasing/invoices', { params: { skip: (page - 1) * limit, limit, search, payment_status, date_from, date_to } }),
  deleteInvoice: (invoiceNumber) => api.delete(`/purchasing/invoices/${invoiceNumber}`),
  registerPayment: (invoiceNumber, paymentData) => api.post(`/purchasing/invoices/${invoiceNumber}/payments`, paymentData),
  registerReception: (invoiceNumber, receptionData) => api.post(`/purchasing/invoices/${invoiceNumber}/receive`, receptionData),

  // Guides (NUEVO)
  createReceptionGuide: (invoiceNumber, guideData) => api.post(`/purchasing/invoices/${invoiceNumber}/receive`, guideData),

  // Suppliers
  getSuppliers: () => api.get('/purchasing/suppliers'),
  createSupplier: (supplier) => api.post('/purchasing/suppliers', supplier),
  deleteSupplier: (id) => api.delete(`/purchasing/suppliers/${id}`),
  updateSupplier: (id, supplier) => api.put(`/purchasing/suppliers/${id}`, supplier),

};

export const purchaseQuotesService = {
  createQuote: (quote) => api.post('/purchasing/quotes', quote),
  getQuotes: (page = 1, limit = 50, search = '', status = '', date_from = '', date_to = '') =>
    api.get('/purchasing/quotes', { params: { skip: (page - 1) * limit, limit, search, status, date_from, date_to } }),
  getQuote: (quoteNumber) => api.get(`/purchasing/quotes/${quoteNumber}`),
  updateQuote: (quoteNumber, quote) => api.put(`/purchasing/quotes/${quoteNumber}`, quote),
  deleteQuote: (quoteNumber) => api.delete(`/purchasing/quotes/${quoteNumber}`),
  convertQuote: (quoteNumber) => api.post(`/purchasing/quotes/${quoteNumber}/convert`),
};

export const salesQuotesService = {
  createQuote: (quote) => api.post('/sales/quotes', quote),
  getQuotes: (page = 1, limit = 50, search = '', status = '', source = '', date_from = '', date_to = '') => {
    let url = `/sales/quotes?skip=${(page - 1) * limit}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (status) url += `&status=${status}`;
    if (source) url += `&source=${source}`;
    if (date_from) url += `&date_from=${date_from}`;
    if (date_to) url += `&date_to=${date_to}`;
    return api.get(url);
  },
  getQuote: (quoteNumber) => api.get(`/sales/quotes/${quoteNumber}`),
  updateQuote: (quoteNumber, quote) => api.put(`/sales/quotes/${quoteNumber}`, quote),
  deleteQuote: (quoteNumber) => api.delete(`/sales/quotes/${quoteNumber}`),
  convertQuote: (quoteNumber, preview = false) => api.post(`/sales/quotes/${quoteNumber}/convert?preview=${preview}`),
};

export const salesNotesService = {
  getNotes: (page = 1, limit = 50, search = '', type = '', date_from = '', date_to = '') =>
    api.get('/sales/notes', { params: { skip: (page - 1) * limit, limit, search, type, date_from, date_to } }),
  createNote: (invoiceNumber, type, data) => api.post(`/sales/invoices/${invoiceNumber}/notes`, data, { params: { type } }),
};

export const salesService = {
  // Orders
  createOrder: (order) => api.post('/sales/orders', order),
  getSales: (page = 1, limit = 50, search = '', status = '', date_from = '', date_to = '') =>
    api.get('/sales/orders', { params: { skip: (page - 1) * limit, limit, search, status, date_from, date_to } }),
  deleteOrder: (orderNumber) => api.delete(`/sales/orders/${orderNumber}`),
  convertBackorder: (orderNumber) => api.post(`/sales/orders/${orderNumber}/convert`),
  checkBackorderAvailability: (orderNumber) => api.get(`/sales/orders/${orderNumber}/availability`),

  getProductHistory: (sku, limit = 10, customerRuc = null) => {
    let url = `/sales/products/${sku}/history?limit=${limit}`;
    if (customerRuc) url += `&customer_ruc=${encodeURIComponent(customerRuc)}`;
    return api.get(url);
  },

  // Invoices
  createInvoice: (invoiceData) => api.post('/sales/invoices', invoiceData),
  getInvoices: (page = 1, limit = 50, search = '', payment_status = '', date_from = '', date_to = '') =>
    api.get('/sales/invoices', { params: { skip: (page - 1) * limit, limit, search, payment_status, date_from, date_to } }),
  deleteInvoice: (invoiceNumber) => api.delete(`/sales/invoices/${invoiceNumber}`),
  registerPayment: (invoiceNumber, paymentData) => api.post(`/sales/invoices/${invoiceNumber}/payments`, paymentData),

  // Guides (NUEVO)
  createDispatchGuide: (invoiceNumber, guideData) => api.post(`/sales/invoices/${invoiceNumber}/dispatch`, guideData),

  // Customers
  getCustomers: () => api.get('/sales/customers'),
  getCustomerByRuc: (ruc) => api.get(`/sales/customers/by-ruc/${ruc}`),
  createCustomer: (customer) => api.post('/sales/customers', customer),
  updateCustomer: (id, customer) => api.put(`/sales/customers/${id}`, customer),
  deleteCustomer: (id) => api.delete(`/sales/customers/${id}`),

  // Customer Branches
  addCustomerBranch: (customerId, branch) => api.post(`/sales/customers/${customerId}/branches`, branch),
  getCustomerBranches: (customerId) => api.get(`/sales/customers/${customerId}/branches`),
  updateCustomerBranch: (customerId, branchIndex, branch) => api.put(`/sales/customers/${customerId}/branches/${branchIndex}`, branch),
  deleteCustomerBranch: (customerId, branchIndex) => api.delete(`/sales/customers/${customerId}/branches/${branchIndex}`),
};

export const deliveryService = {
  // Guides
  getGuides: (page = 1, limit = 50, search = '', status = '', guide_type = '') =>
    api.get('/delivery/guides', { params: { skip: (page - 1) * limit, limit, search: search || undefined, status: status || undefined, guide_type: guide_type || undefined } }),
  getGuide: (guideNumber) => api.get(`/delivery/guides/${guideNumber}`),
  createGuide: (guideData) => api.post('/delivery/guides', guideData),
  dispatchGuide: (guideNumber) => api.put(`/delivery/guides/${guideNumber}/dispatch`),
  deliverGuide: (guideNumber, receivedBy = '') => api.put(`/delivery/guides/${guideNumber}/deliver`, { received_by: receivedBy || null }),
  cancelGuide: (guideNumber) => api.delete(`/delivery/guides/${guideNumber}`),
};

export const analyticsService = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getDebtorsReport: (customerId = '', status = 'pending') => api.get('/analytics/reports/debtors', { params: { customer_id: customerId || undefined, status_filter: status } }),
  getSalesReport: (startDate, endDate) => api.get('/analytics/reports/sales', { params: { start_date: startDate, end_date: endDate } }),
  getInventoryValuation: () => api.get('/analytics/reports/inventory-valuation')
};

export const companyService = {
  getCompanies: () => api.get('/companies'),
  createCompany: (company) => api.post('/companies', company),
  updateCompany: (id, company) => api.put(`/companies/${id}`, company),
  deleteCompany: (id) => api.delete(`/companies/${id}`),
};

export const categoryService = {
  getCategories: () => api.get('/categories'),
  createCategory: (category) => api.post('/categories', category),
  updateCategory: (id, category) => api.put(`/categories/${id}`, category),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};

export const brandService = {
  getBrands: (origin = '') => api.get('/brands', { params: { origin: origin || undefined } }),
  syncBrands: () => api.post('/brands/sync'),
  updateBrand: (name, data) => api.put(`/brands/${name}`, data),
  deleteBrand: (name) => api.delete(`/brands/${name}`),
};

export const pricingService = {
  getRules: () => api.get('/pricing/rules'),
  createRule: (rule) => api.post('/pricing/rules', rule),
  updateRule: (id, rule) => api.put(`/pricing/rules/${id}`, rule),
  deleteRule: (id) => api.delete(`/pricing/rules/${id}`),
};

export const dataExchangeService = {
  exportEntity: (entity) => api.get(`/io/export/${entity}`, { responseType: 'blob' }),
  importEntity: (entity, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/io/import/${entity}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};


export const marketingService = {
  getLoyaltyConfig: () => api.get('/marketing/loyalty/config'),
  updateLoyaltyConfig: (data) => api.put('/marketing/loyalty/config', data),
  convertPoints: (data) => api.post('/marketing/loyalty/convert-points', data),
};

export const salesPolicyService = {
  getPolicies: () => api.get('/sales/config/policies'),
  updatePolicies: (data) => api.put('/sales/config/policies', data),
};

export const auditService = {
  getLogs: (params) => api.get('/audit/logs', { params }),
  deleteLogs: (log_ids) => api.delete('/audit/logs', { data: log_ids }),
  purgeLogs: (days, module = '') => {
    let url = `/audit/purge?days=${days}`;
    if (module) url += `&module=${module}`;
    return api.delete(url);
  },
};

export default api;

