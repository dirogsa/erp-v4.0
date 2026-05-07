import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../context/CompanyContext';
import { MENU_CONFIG, hasAccess } from '../../config/menuConfig';
import MenuGroup from './MenuGroup';
import MenuItem from './MenuItem';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const { activeCompany, companies, selectCompany } = useCompany();

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
                <h1 className="sidebar-title">DIROGSA ERP</h1>
                <div className="sidebar-user">
                    <span className="sidebar-user-name">{user?.full_name}</span>
                    <span className="sidebar-user-role">{user?.role}</span>
                </div>
            </div>

            {/* Company Selector */}
            <div className="sidebar-company">
                <label className="sidebar-company-label">🏢 EMPRESA ACTIVA:</label>
                <select 
                    className="sidebar-company-select"
                    value={activeCompany?._id || ''}
                    onChange={(e) => {
                        const comp = companies.find(c => c._id === e.target.value);
                        if (comp) {
                            selectCompany(comp);
                            // Refresh page to clear all local states and force new company context
                            window.location.reload();
                        }
                    }}
                >
                    {companies.map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                </select>
                {activeCompany && (
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem', paddingLeft: '0.25rem' }}>
                        RUC: {activeCompany.ruc}
                    </div>
                )}
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
