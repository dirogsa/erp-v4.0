import React from 'react';
import { STATUS_COLORS } from '../../utils/constants';

const Badge = ({
    children,
    variant = 'default',
    status,
    size = 'medium'
}) => {
    const variants = {
        default: { backgroundColor: '#64748b', color: 'white' },
        primary: { backgroundColor: '#3b82f6', color: 'white' },
        success: { backgroundColor: '#10b981', color: 'white' },
        warning: { backgroundColor: '#f59e0b', color: 'white' },
        danger: { backgroundColor: '#ef4444', color: 'white' },
        info: { backgroundColor: '#06b6d4', color: 'white' },
    };

    const sizes = {
        small: { padding: '0.125rem 0.375rem', fontSize: '0.75rem' },
        medium: { padding: '0.25rem 0.5rem', fontSize: '0.8rem' },
        large: { padding: '0.375rem 0.75rem', fontSize: '0.875rem' },
    };

    // Si se proporciona un status, usar el color correspondiente
    const backgroundColor = status && STATUS_COLORS[status]
        ? STATUS_COLORS[status]
        : variants[variant].backgroundColor;

    const style = {
        display: 'inline-block',
        ...sizes[size],
        borderRadius: '0.25rem',
        fontWeight: '500',
        backgroundColor,
        color: variants[variant].color,
        textAlign: 'center',
        whiteSpace: 'nowrap',
    };

    return (
        <span style={style}>
            {children}
        </span>
    );
};

export default Badge;
