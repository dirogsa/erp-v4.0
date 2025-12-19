import React from 'react';

const Button = ({
    children,
    onClick,
    variant = 'primary',
    disabled = false,
    type = 'button',
    size = 'medium',
    fullWidth = false,
    ...props
}) => {
    const baseStyle = {
        padding: size === 'small' ? '0.4rem 0.8rem' : size === 'large' ? '0.75rem 1.5rem' : '0.5rem 1rem',
        fontSize: size === 'small' ? '0.875rem' : size === 'large' ? '1.125rem' : '1rem',
        borderRadius: '0.375rem',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s',
        fontWeight: '500',
        width: fullWidth ? '100%' : 'auto',
    };

    const variants = {
        primary: {
            backgroundColor: '#3b82f6',
            color: 'white',
        },
        secondary: {
            backgroundColor: '#64748b',
            color: 'white',
        },
        success: {
            backgroundColor: '#10b981',
            color: 'white',
        },
        danger: {
            backgroundColor: '#ef4444',
            color: 'white',
        },
        warning: {
            backgroundColor: '#f59e0b',
            color: 'white',
        },
        outline: {
            backgroundColor: 'transparent',
            color: '#3b82f6',
            border: '1px solid #3b82f6',
        }
    };

    const style = {
        ...baseStyle,
        ...variants[variant]
    };

    return (
        <button
            type={type}
            style={style}
            onClick={onClick}
            disabled={disabled}
            className="btn"
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
