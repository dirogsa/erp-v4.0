import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../context/CompanyContext';
import { MENU_CONFIG, hasAccess } from '../../config/menuConfig';
import MenuGroup from './MenuGroup';
import MenuItem from './MenuItem';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const { activeCompany } = useCompany();

    // Filter menu items based on user role recursively
    const filteredMenu = MENU_CONFIG
        .filter(item => hasAccess(user?.role, item.roles))
        .map(item => {
            if (item.isGroup && item.children) {
                return {
                    ...item,
                    children: item.children.filter(child =>
                        !child.roles || hasAccess(user?.role, child.roles)
                    )
                };
            }
            return item;
        })
        .filter(item => !item.isGroup || (item.children && item.children.length > 0));

    const handleNavigate = () => {
        // Close sidebar on mobile after navigation
        if (onClose) onClose();
    };

    return (
        <aside className={`sidebar no-print ${isOpen ? 'open' : ''}`}>
            {/* Header */}
            <div className="sidebar-header">
                <h1 className="sidebar-title">ERP System</h1>
                <div className="sidebar-user">
                    <span className="sidebar-user-name">{user?.full_name}</span>
                    <span className="sidebar-user-role">{user?.role}</span>
                </div>
            </div>

            {/* Company indicator */}
            <div className="sidebar-company">
                <span className="sidebar-company-label">Emisor:</span>
                <span className="sidebar-company-name">
                    {activeCompany ? activeCompany.name : 'Sin seleccionar'}
                </span>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {filteredMenu.map(item => (
                    item.isGroup ? (
                        <MenuGroup
                            key={item.id}
                            group={item}
                            onNavigate={handleNavigate}
                        />
                    ) : (
                        <MenuItem
                            key={item.id}
                            item={item}
                            onNavigate={handleNavigate}
                        />
                    )
                ))}
            </nav>

            {/* Logout */}
            <div className="sidebar-footer">
                <button className="sidebar-logout" onClick={logout}>
                    🚪 Cerrar Sesión
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
