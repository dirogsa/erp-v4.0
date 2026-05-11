// Global configuration for the ERP Frontend
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const APP_CONFIG = {
    VERSION: '4.3.0',
    ENVIRONMENT: import.meta.env.MODE || 'development',
    DEFAULT_CURRENCY: 'PEN',
};

export default {
    API_BASE_URL,
    APP_CONFIG
};
