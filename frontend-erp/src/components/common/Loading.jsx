import React from 'react';

/**
 * Loading: Componente de feedback visual premium.
 * Versátil y ligero, diseñado para integrarse en botones, tablas o pantallas completas.
 */
const Loading = ({ 
    size = 'medium', 
    text = '', 
    fullScreen = false,
    color = '#3b82f6'
}) => {
    const sizes = {
        small: '16px',
        medium: '40px',
        large: '80px'
    };

    const containerStyle = fullScreen ? {
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999
    } : {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
    };

    return (
        <div style={containerStyle}>
            <div style={{
                width: sizes[size],
                height: sizes[size],
                border: `3px solid rgba(51, 65, 85, 0.3)`,
                borderTop: `3px solid ${color}`,
                borderRadius: '50%',
                animation: 'spin-universal 0.8s linear infinite'
            }} />
            {text && (
                <p style={{ 
                    marginTop: '1rem', 
                    color: '#94a3b8', 
                    fontSize: size === 'large' ? '1.1rem' : '0.9rem',
                    fontWeight: '600',
                    letterSpacing: '0.025em'
                }}>
                    {text}
                </p>
            )}
            <style>{`
                @keyframes spin-universal {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default Loading;
