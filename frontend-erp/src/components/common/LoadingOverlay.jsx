import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Componente uniforme para mensajes de espera.
 * Bloquea la interacción del usuario y proporciona feedback visual premium.
 */
const LoadingOverlay = ({ 
    message = "Procesando solicitud...", 
    subMessage = "Por favor, espere un momento.",
    visible = false 
}) => {
    if (!visible) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div style={{
                background: '#1e293b',
                padding: '3rem',
                borderRadius: '2rem',
                border: '1px solid #334155',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.5rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                maxWidth: '400px',
                width: '90%'
            }}>
                <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        border: '4px solid #1e293b',
                        borderTopColor: '#3b82f6',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <div style={{
                        position: 'absolute',
                        inset: '10px',
                        borderRadius: '50%',
                        border: '4px solid #1e293b',
                        borderTopColor: '#10b981',
                        animation: 'spin 1.5s linear infinite reverse'
                    }} />
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Loader2 size={30} color="#3b82f6" style={{ opacity: 0.5 }} />
                    </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ 
                        color: 'white', 
                        margin: '0 0 0.5rem', 
                        fontSize: '1.4rem', 
                        fontWeight: '800',
                        letterSpacing: '-0.025em'
                    }}>
                        {message}
                    </h2>
                    <p style={{ 
                        color: '#94a3b8', 
                        margin: 0, 
                        fontSize: '0.95rem',
                        lineHeight: '1.5'
                    }}>
                        {subMessage}
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default LoadingOverlay;
