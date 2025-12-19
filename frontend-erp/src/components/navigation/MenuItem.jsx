import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const MenuItem = ({ item, onNavigate }) => {
    const location = useLocation();
    const isActive = location.pathname === item.path;

    return (
        <Link
            to={item.path}
            className={`menu-item ${isActive ? 'active' : ''}`}
            onClick={onNavigate}
        >
            {item.icon && <span className="menu-item-icon">{item.icon}</span>}
            <span className="menu-item-label">{item.label}</span>
        </Link>
    );
};

export default MenuItem;
