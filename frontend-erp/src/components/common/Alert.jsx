import React from 'react';

const Alert = ({
    children,
    type = 'info',
    onClose,
    title
}) => {
    const types = {
        success: {
            backgroundColor: '#10b981',
            icon: '✓',
        },
        error: {
            backgroundColor: '#ef4444',
            icon: '✕',
        },
        warning: {
            backgroundColor: '#f59e0b',
            icon: '⚠',
        },
        info: {
            backgroundColor: '#3b82f6',
            icon: 'ℹ',
        },
    };

    const config = types[type];

    return (
        <div style={{
            padding: '1rem',
            borderRadius: '0.5rem',
            backgroundColor: config.backgroundColor,
            color: 'white',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'start',
            gap: '0.75rem',
        }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                {config.icon}
            </span>
            <div style={{ flex: 1 }}>
                {title && (
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                        {title}
                    </div>
                )}
                <div>{children}</div>
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '1.25rem',
                        padding: '0',
                        lineHeight: '1',
                    }}
                >
                    ×
                </button>
            )}
        </div>
    );
};

export default Alert;
