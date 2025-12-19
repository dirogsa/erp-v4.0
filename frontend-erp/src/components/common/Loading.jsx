import React from 'react';

const Loading = ({
    size = 'medium',
    text = 'Cargando...',
    fullScreen = false
}) => {
    const sizes = {
        small: '1.5rem',
        medium: '2.5rem',
        large: '4rem',
    };

    const spinnerStyle = {
        width: sizes[size],
        height: sizes[size],
        border: '3px solid #334155',
        borderTop: '3px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    };

    const containerStyle = fullScreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
    } : {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
    };

    return (
        <>
            <style>
                {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
            </style>
            <div style={containerStyle}>
                <div style={spinnerStyle}></div>
                {text && (
                    <p style={{
                        marginTop: '1rem',
                        color: fullScreen ? 'white' : '#94a3b8',
                        fontSize: '0.875rem'
                    }}>
                        {text}
                    </p>
                )}
            </div>
        </>
    );
};

export default Loading;
