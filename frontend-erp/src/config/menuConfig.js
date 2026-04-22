// Menu configuration with role-based access control
// Each menu item or group specifies which roles can see it

export const ROLES = {
    SUPERADMIN: 'SUPERADMIN',
    ADMIN: 'ADMIN',
    SELLER: 'SELLER',
    STOCK_MANAGER: 'STOCK_MANAGER',
    ACCOUNTANT: 'ACCOUNTANT',
    STAFF: 'STAFF',
    CUSTOMER_B2B: 'CUSTOMER_B2B',
    CUSTOMER_B2C: 'CUSTOMER_B2C'
};

// Helper to check if user has access
export const hasAccess = (userRole, allowedRoles) => {
    if (!userRole || !allowedRoles) return false;
    // SUPERADMIN always has access
    if (userRole === ROLES.SUPERADMIN) return true;
    return allowedRoles.includes(userRole);
};

export const MENU_CONFIG = [
    {
        id: 'dashboard',
        label: 'Dashboard Principal',
        icon: '🏠',
        path: '/',
        roles: [ROLES.ADMIN, ROLES.SELLER, ROLES.STOCK_MANAGER, ROLES.ACCOUNTANT, ROLES.STAFF],
        isGroup: false
    },
    {
        id: 'comercial',
        label: 'ÁREA COMERCIAL',
        icon: '💼',
        roles: [ROLES.ADMIN, ROLES.SELLER, ROLES.ACCOUNTANT, ROLES.STAFF],
        isGroup: true,
        children: [
            { id: 'sales', label: 'Gestión de Ventas', path: '/sales', icon: '🛍️' },
            { id: 'customers', label: 'Cartera de Clientes', path: '/customers', icon: '👥' },
            { id: 'catalog', label: 'Catálogo Digital', path: '/catalog', icon: '📖' },
            { id: 'marketing', label: 'Lealtad y Puntos', path: '/marketing', icon: '🎁', roles: [ROLES.ADMIN, ROLES.SELLER, ROLES.ACCOUNTANT] }
        ]
    },
    {
        id: 'logistica',
        label: 'LOGÍSTICA Y ALMACÉN',
        icon: '📦',
        roles: [ROLES.ADMIN, ROLES.STOCK_MANAGER, ROLES.STAFF],
        isGroup: true,
        children: [
            { id: 'inventory', label: 'Maestro de Productos', path: '/inventory', icon: '📦' },
            { id: 'brands', label: 'Marcas / Modelos', path: '/brands', icon: '🏎️' },
            { id: 'categories', label: 'Categorías de Stock', path: '/categories', icon: '🏷️' },
            { id: 'warehouses', label: 'Sedes y Almacenes', path: '/warehouses', icon: '🏢' },
            { id: 'transfers', label: 'Transferencias Internas', path: '/transfers', icon: '🚚' },
            { id: 'losses', label: 'Ajustes y Mermas', path: '/losses', icon: '⚠️' }
        ]
    },
    {
        id: 'operaciones-masivas',
        label: 'CARGA MASIVA (HUB)',
        icon: '⚡',
        roles: [ROLES.ADMIN, ROLES.STOCK_MANAGER, ROLES.ACCOUNTANT],
        isGroup: true,
        children: [
            { id: 'bulk-xml', label: 'Importador XML SUNAT', path: '/bulk/xml', icon: '📄' },
            { id: 'bulk-ingestion', label: 'Ingesta de Catálogos', path: '/catalog-ingestion', icon: '🚀' },
            { id: 'bulk-prices', label: 'Precios Masivos', path: '/price-update', icon: '📈' },
            { id: 'data-center', label: 'Centro de Datos (CSV)', path: '/import-export', icon: '📤' }
        ]
    },
    {
        id: 'compras',
        label: 'COMPRAS Y SUMINISTRO',
        icon: '🛒',
        roles: [ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.STAFF],
        isGroup: true,
        children: [
            { id: 'purchasing', label: 'Órdenes de Compra', path: '/purchasing', icon: '📋' },
            { id: 'suppliers', label: 'Directorio de Proveedores', path: '/suppliers', icon: '🏭' }
        ]
    },
    {
        id: 'finanzas',
        label: 'ADM. Y FINANZAS',
        icon: '🏛️',
        roles: [ROLES.ADMIN, ROLES.ACCOUNTANT],
        isGroup: true,
        children: [
            { id: 'reports', label: 'Análisis y Reportes', path: '/reports', icon: '📊' },
            { id: 'companies', label: 'Gestión de Empresas', path: '/companies', icon: '🏢' },
            { id: 'exchange-rates', label: 'Tipos de Cambio', path: '/exchange-rates', icon: '💱' },
            { id: 'pricing', label: 'Precios Especiales B2B', path: '/pricing', icon: '🏷️' },
            { id: 'financial-audit', label: 'Auditoría Financiera', path: '/audit/financial', icon: '🛡️', roles: [ROLES.ADMIN, ROLES.ACCOUNTANT] },
            { id: 'b2b', label: 'Socios de Negocio B2B', path: '/b2b', icon: '🤝' },
            { id: 'policies', label: 'Políticas de Venta', path: '/sales-policies', icon: '⚖️' }
        ]
    },
    {
        id: 'rrhh-seguridad',
        label: 'RRHH Y SEGURIDAD',
        icon: '🛡️',
        roles: [ROLES.ADMIN],
        isGroup: true,
        children: [
            { id: 'staff', label: 'Colaboradores (RRHH)', path: '/staff', icon: '👤' },
            { id: 'users', label: 'Usuarios del Sistema', path: '/users', icon: '🔐', roles: [ROLES.SUPERADMIN] },
            { id: 'audit', label: 'Auditoría (Logs)', path: '/audit', icon: '🕵️', roles: [ROLES.SUPERADMIN] }
        ]
    }
];
