import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import MenuItem from './MenuItem';

const MenuGroup = ({ group, onNavigate }) => {
    const location = useLocation();

    // Check if any child is active to auto-expand and highlight
    const isChildActive = group.children?.some(child => location.pathname === child.path);
    const [isExpanded, setIsExpanded] = useState(isChildActive);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className={`menu-group ${isExpanded ? 'expanded' : ''} ${isChildActive ? 'has-active' : ''}`}>
            <button
                className="menu-group-header"
                onClick={toggleExpand}
                type="button"
            >
                <span className="menu-group-icon">{group.icon}</span>
                <span className="menu-group-label">{group.label}</span>
                <span className={`menu-group-arrow ${isExpanded ? 'expanded' : ''}`}>
                    ▾
                </span>
            </button>

            <div className={`menu-group-children ${isExpanded ? 'expanded' : ''}`}>
                {group.children?.map(item => (
                    <MenuItem
                        key={item.id}
                        item={item}
                        onNavigate={onNavigate}
                    />
                ))}
            </div>
        </div>
    );
};

export default MenuGroup;
