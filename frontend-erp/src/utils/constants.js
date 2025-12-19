// Estados de órdenes
export const ORDER_STATUS = {
    PENDING: 'PENDING',
    INVOICED: 'INVOICED'
};

// Estados de pago
export const PAYMENT_STATUS = {
    PENDING: 'PENDING',
    PARTIAL: 'PARTIAL',
    PAID: 'PAID'
};

// Estados de despacho
export const DISPATCH_STATUS = {
    PENDING: 'PENDING',
    DISPATCHED: 'DISPATCHED'
};

// Estados de recepción
export const RECEPTION_STATUS = {
    PENDING: 'PENDING',
    RECEIVED: 'RECEIVED'
};

// Tipos de movimiento de inventario
export const MOVEMENT_TYPE = {
    PURCHASE: 'PURCHASE',
    SALE: 'SALE',
    LOSS: 'LOSS',
    TRANSFER_OUT: 'TRANSFER_OUT',
    TRANSFER_IN: 'TRANSFER_IN',
    ADJUSTMENT: 'ADJUSTMENT'
};

// Tipos de notificación
export const NOTIFICATION_TYPE = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

// Colores de estado
export const STATUS_COLORS = {
    PENDING: '#f59e0b',
    INVOICED: '#10b981',
    PAID: '#10b981',
    PARTIAL: '#f97316',
    DISPATCHED: '#3b82f6',
    RECEIVED: '#10b981'
};

// Límites de paginación
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
};

// Configuración de la aplicación
export const APP_CONFIG = {
    API_BASE_URL: 'http://localhost:8000',
    NOTIFICATION_DURATION: 5000, // 5 segundos
    DEBOUNCE_DELAY: 300, // 300ms para búsquedas
};

// Mensajes comunes
export const MESSAGES = {
    CONFIRM_DELETE: '¿Estás seguro de eliminar este registro?',
    CONFIRM_CANCEL: '¿Estás seguro de cancelar? Los cambios no guardados se perderán.',
    SUCCESS_CREATE: 'Registro creado exitosamente',
    SUCCESS_UPDATE: 'Registro actualizado exitosamente',
    SUCCESS_DELETE: 'Registro eliminado exitosamente',
    ERROR_GENERIC: 'Ocurrió un error. Por favor intenta nuevamente.',
    ERROR_NETWORK: 'Error de conexión. Verifica tu conexión a internet.',
    ERROR_REQUIRED_FIELDS: 'Por favor completa todos los campos requeridos',
};
