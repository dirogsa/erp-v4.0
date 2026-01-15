import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './navigation/Sidebar';

const Layout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const location = useLocation();

    // Determine current theme based on path
    const moduleTheme = useMemo(() => {
        const path = location.pathname;
        if (path.startsWith('/sales') || path.startsWith('/customers')) return 'theme-comercial';
        if (path.startsWith('/inventory') || path.startsWith('/warehouses') || path.startsWith('/losses')) return 'theme-logistica';
        if (path.startsWith('/purchasing') || path.startsWith('/suppliers')) return 'theme-purchasing';
        if (path.startsWith('/reports')) return 'theme-finanzas';
        if (path.startsWith('/audit') || path.startsWith('/users') || path.startsWith('/companies')) return 'theme-admin';
        return '';
    }, [location.pathname]);

    return (
        <div className={`app-container ${moduleTheme}`}>
            <button
                className="sidebar-toggle"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                title={isSidebarOpen ? "Cerrar menú" : "Abrir menú"}
            >
                {isSidebarOpen ? '✕' : '☰'}
            </button>

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Overlay to close sidebar on mobile */}
            {isSidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

export default Layout;
