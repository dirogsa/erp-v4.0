import React from 'react';

const Button = ({
    children,
    onClick,
    variant = 'primary',
    disabled = false,
    type = 'button',
    size = 'medium',
    fullWidth = false,
    loading = false,
    icon: Icon,
    style = {},
    ...props
}) => {
    // Design System Tokens (Industrial Tech 2026)
    const tokens = {
        primary: {
            bg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: '#ffffff',
            border: 'none',
            shadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            hover: 'brightness(1.1) translateY(-1px)'
        },
        secondary: {
            bg: '#1e293b',
            color: '#e2e8f0',
            border: '1px solid #334155',
            shadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
            hover: 'background: #2d3e50'
        },
        danger: {
            bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#ffffff',
            border: 'none',
            shadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
            hover: 'brightness(1.1)'
        },
        ghost: {
            bg: 'transparent',
            color: '#94a3b8',
            border: '1px solid transparent',
            shadow: 'none',
            hover: 'background: rgba(148, 163, 184, 0.1); color: #ffffff'
        },
        outline: {
            bg: 'transparent',
            color: '#3b82f6',
            border: '1px solid #3b82f6',
            shadow: 'none',
            hover: 'background: rgba(59, 130, 246, 0.1)'
        },
        success: {
            bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            border: 'none',
            shadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            hover: 'brightness(1.1)'
        },
        warning: {
            bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#ffffff',
            border: 'none',
            shadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
            hover: 'brightness(1.1)'
        },
        glass: {
            bg: 'rgba(255, 255, 255, 0.05)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            shadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            hover: 'background: rgba(255, 255, 255, 0.1)'
        }
    };

    const currentVariant = tokens[variant] || tokens.primary;

    const baseStyle = {
        padding: size === 'small' ? '0.5rem 1rem' : size === 'large' ? '0.875rem 2rem' : '0.625rem 1.5rem',
        fontSize: size === 'small' ? '0.8rem' : size === 'large' ? '1.1rem' : '0.95rem',
        borderRadius: '0.75rem',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        fontWeight: '700',
        width: fullWidth ? '100%' : 'auto',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.6rem',
        position: 'relative',
        letterSpacing: '0.025em',
        textTransform: 'none',
        ...currentVariant,
        background: currentVariant.bg, // Ensure it overrides base
        boxShadow: currentVariant.shadow,
        border: currentVariant.border,
        color: currentVariant.color,
        ...style
    };

    return (
        <button
            type={type}
            style={baseStyle}
            onClick={onClick}
            disabled={disabled || loading}
            className={`btn-industrial btn-${variant}`}
            {...props}
        >
            {loading ? (
                <div className="spinner-industrial" />
            ) : (
                <>
                    {Icon && <Icon size={size === 'small' ? 16 : 18} />}
                    <span>{children}</span>
                </>
            )}
            <style>{`
                .btn-industrial:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.4);
                    filter: brightness(1.1);
                }
                .btn-industrial:active:not(:disabled) {
                    transform: translateY(0) scale(0.97);
                }
                .spinner-industrial {
                    width: 18px;
                    height: 18px;
                    border: 3px solid rgba(255,255,255,0.2);
                    border-top: 3px solid currentColor;
                    border-radius: 50%;
                    animation: spin-industrial 0.8s linear infinite;
                }
                @keyframes spin-industrial {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </button>
    );
};

export default Button;
