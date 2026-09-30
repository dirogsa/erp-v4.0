import api from './api';

const marketplaceService = {
  // Categories
  getCategories: async (params) => {
    const response = await api.get('/marketplace/categories', { params });
    return response.data;
  },
  createCategory: async (data) => {
    const response = await api.post('/marketplace/categories', data);
    return response.data;
  },
  updateCategory: async (id, data) => {
    const response = await api.put(`/marketplace/categories/${id}`, data);
    return response.data;
  },
  deleteCategory: async (id) => {
    const response = await api.delete(`/marketplace/categories/${id}`);
    return response.data;
  },

  // Vendors
  getVendors: async (params) => {
    const response = await api.get('/marketplace/vendors', { params });
    return response.data;
  },
  createVendor: async (data) => {
    const response = await api.post('/marketplace/vendors', data);
    return response.data;
  },
  updateVendor: async (id, data) => {
    const response = await api.put(`/marketplace/vendors/${id}`, data);
    return response.data;
  },
  deleteVendor: async (id) => {
    const response = await api.delete(`/marketplace/vendors/${id}`);
    return response.data;
  },

  // Products
  getProducts: async (params) => {
    const response = await api.get('/marketplace/products', { params });
    return response.data;
  },
  createProduct: async (data) => {
    const response = await api.post('/marketplace/products', data);
    return response.data;
  },
  updateProduct: async (id, data) => {
    const response = await api.put(`/marketplace/products/${id}`, data);
    return response.data;
  },
  deleteProduct: async (id) => {
    const response = await api.delete(`/marketplace/products/${id}`);
    return response.data;
  }
};

export default marketplaceService;
