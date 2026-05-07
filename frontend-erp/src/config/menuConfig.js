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
        id: 'planeamiento-estrategico',
        label: 'PLANEAMIENTO ESTRATÉGICO',
        icon: '🎯',
        roles: [ROLES.ADMIN, ROLES.ACCOUNTANT],
        isGroup: true,
        children: [
            { id: 'dashboard', label: 'Consola de Mando (BI)', path: '/', icon: '📊' },
            { id: 'pricing-strategy', label: 'Estrategia de Precios', path: '/pricing-strategy', icon: '🎮' }
        ]
    },
    {
        id: 'finanzas-corporativas',
        label: 'FINANZAS CORPORATIVAS',
        icon: '🏛️',
        roles: [ROLES.ADMIN, ROLES.ACCOUNTANT],
        isGroup: true,
        children: [
            { id: 'exchange-rates', label: 'Tesorería y Monedas', path: '/exchange-rates', icon: '💱' },
            { id: 'financial-audit', label: 'Gestión de Cobranzas', path: '/audit/financial', icon: '🛡️' },
            { id: 'reports', label: 'Reportes Financieros', path: '/reports', icon: '📉' }
        ]
    },
    {
        id: 'recursos-humanos',
        label: 'RECURSOS HUMANOS',
        icon: '👥',
        roles: [ROLES.ADMIN],
        isGroup: true,
        children: [
            { id: 'staff', label: 'Gestión de Talento Humano', path: '/staff', icon: '👤' },
            { id: 'users', label: 'Seguridad y Accesos', path: '/users', icon: '🔐' }
        ]
    },
    {
        id: 'operaciones',
        label: 'OPERACIONES',
        icon: '⚙️',
        roles: [ROLES.ADMIN, ROLES.STOCK_MANAGER, ROLES.SELLER, ROLES.STAFF],
        isGroup: true,
        children: [
            { id: 'inventory', label: 'Inventarios y Almacenes', path: '/inventory', icon: '📦' },
            { id: 'transfers', label: 'Logística Interna', path: '/transfers', icon: '🚚' },
            { id: 'purchasing', label: 'Abastecimiento (Compras)', path: '/purchasing', icon: '🛒' },
            { id: 'warehouses', label: 'Sedes y Almacenes', path: '/warehouses', icon: '🏢' }
        ]
    },
    {
        id: 'tecnologia-digital',
        label: 'TECNOLOGÍA Y T. DIGITAL',
        icon: '🚀',
        roles: [ROLES.ADMIN],
        isGroup: true,
        children: [
            { id: 'system-config', label: 'Configuración de la Suite', path: '/system-config', icon: '⚙️' },
            { id: 'data-center', label: 'Central de Datos (Datahub)', path: '/import-export', icon: '📤' },
            { id: 'catalog-ingestion', label: 'Ecosistema Digital (Wix)', path: '/catalog-ingestion', icon: '🌐' }
        ]
    },
    {
        id: 'comercial',
        label: 'ÁREA COMERCIAL',
        icon: '💼',
        roles: [ROLES.ADMIN, ROLES.SELLER, ROLES.ACCOUNTANT, ROLES.STAFF],
        isGroup: true,
        children: [
            { id: 'sales', label: 'Ventas y Facturación', path: '/sales', icon: '🛍️' },
            { id: 'customers', label: 'Cartera de Clientes (CRM)', path: '/customers', icon: '👥' },
            { id: 'catalog', label: 'Catálogo Industrial', path: '/catalog', icon: '📖' },
            { id: 'marketing', label: 'Marketing y Fidelización', path: '/marketing', icon: '🎁' }
        ]
    },
    {
        id: 'legal-compliance',
        label: 'LEGAL Y COMPLIANCE',
        icon: '⚖️',
        roles: [ROLES.ADMIN, ROLES.ACCOUNTANT],
        isGroup: true,
        children: [
            { id: 'bulk-xml', label: 'Monitor Tributario (XML)', path: '/bulk/xml', icon: '📄' },
            { id: 'companies', label: 'Gestión de Empresas', path: '/companies', icon: '🏢' }
        ]
    },
    {
        id: 'auditoria-interna',
        label: 'AUDITORÍA INTERNA',
        icon: '🔍',
        roles: [ROLES.ADMIN, ROLES.STOCK_MANAGER],
        isGroup: true,
        children: [
            { id: 'audit-logs', label: 'Auditoría Normativa (Logs)', path: '/audit', icon: '🕵️' },
            { id: 'losses', label: 'Auditoría de Stock (Mermas)', path: '/losses', icon: '⚠️' },
            { id: 'reconciliation', label: 'Sinceramiento de Inventario', path: '/reconciliation', icon: '⚙️' }
        ]
    },
    {
        id: 'innovacion',
        label: 'INNOVACIÓN',
        icon: '💡',
        roles: [ROLES.ADMIN],
        isGroup: true,
        children: [
            { id: 'market-intel', label: 'Inteligencia Competitiva', path: '/brands', icon: '🏎️' },
            { id: 'product-lab', label: 'Laboratorio de Productos', path: '/categories', icon: '🏷️' }
        ]
    },
    {
        id: 'relaciones-institucionales',
        label: 'RELACIONES INST.',
        icon: '🤝',
        roles: [ROLES.ADMIN, ROLES.SELLER],
        isGroup: true,
        children: [
            { id: 'b2b-apps', label: 'Solicitudes B2B', path: '/b2b', icon: '📩' },
            { id: 'suppliers', label: 'Gestión de Aliados (Proveedores)', path: '/suppliers', icon: '🏭' }
        ]
    }
];
