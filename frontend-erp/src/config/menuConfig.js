// Menu configuration with role-based access control
// Each menu item or group specifies which roles can see it

export const ROLES = {
    SUPERADMIN: 'SUPERADMIN',
    ADMIN: 'ADMIN',
    STAFF: 'STAFF',
    CUSTOMER_B2B: 'CUSTOMER_B2B',
    CUSTOMER_B2C: 'CUSTOMER_B2C'
};

// Helper to check if user has access
export const hasAccess = (userRole, allowedRoles) => {
    if (!userRole || !allowedRoles) return false;
    return allowedRoles.includes(userRole);
};

export const MENU_CONFIG = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: '📊',
        path: '/',
        roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.STAFF, ROLES.CUSTOMER_B2B],
        isGroup: false
    },
    {
        id: 'comercial',
        label: 'Comercial',
        icon: '💼',
        roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.STAFF],
        isGroup: true,
        children: [
            { id: 'sales', label: 'Ventas', path: '/sales', icon: '🛍️' },
            { id: 'customers', label: 'Clientes', path: '/customers', icon: '👥' },
            { id: 'catalog', label: 'Catálogo Digital', path: '/catalog', icon: '📖' }
        ]
    },
    {
        id: 'compras',
        label: 'Compras',
        icon: '🛒',
        roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.STAFF],
        isGroup: true,
        children: [
            { id: 'purchasing', label: 'Órdenes de Compra', path: '/purchasing', icon: '📋' },
            { id: 'suppliers', label: 'Proveedores', path: '/suppliers', icon: '🏭' }
        ]
    },
    {
        id: 'inventario',
        label: 'Inventario',
        icon: '📦',
        roles: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.STAFF],
        isGroup: true,
        children: [
            { id: 'inventory', label: 'Productos', path: '/inventory', icon: '📦' },
            { id: 'marketing-inventory', label: 'Publicidad', path: '/inventory/marketing', icon: '🎁' },
            { id: 'brands', label: 'Marcas de Vehículos', path: '/brands', icon: '🏎️' },
            { id: 'categories', label: 'Categorías', path: '/categories', icon: '🏷️' },
            { id: 'warehouses', label: 'Almacenes', path: '/warehouses', icon: '🏢' },
            { id: 'losses', label: 'Mermas', path: '/losses', icon: '⚠️' },
            { id: 'transfers', label: 'Transferencias', path: '/transfers', icon: '🚚' }
        ]
    },
    {
        id: 'reportes',
        label: 'Reportes',
        icon: '📈',
        roles: [ROLES.SUPERADMIN, ROLES.ADMIN],
        isGroup: true,
        children: [
            { id: 'reports', label: 'Análisis', path: '/reports', icon: '📊' },
            { id: 'import-export', label: 'Importar/Exportar', path: '/import-export', icon: '📤' }
        ]
    },
    {
        id: 'admin',
        label: 'Administración',
        icon: '⚙️',
        roles: [ROLES.SUPERADMIN, ROLES.ADMIN],
        isGroup: true,
        children: [
            { id: 'companies', label: 'Empresas', path: '/companies', icon: '🏢' },
            { id: 'b2b', label: 'Socios B2B', path: '/b2b', icon: '🤝' },
            { id: 'pricing', label: 'Precios Especiales B2B', path: '/pricing', icon: '🏷️' },
            { id: 'marketing', label: 'Lealtad y Puntos', path: '/marketing', icon: '🎁' }
        ]

    }
];
