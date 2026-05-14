import React from 'react';
import { Loader2, Zap } from 'lucide-react';

/**
 * MasterLoader: Componente centralizado de feedback para operaciones globales.
 * Proporciona una experiencia de usuario de clase mundial con glassmorphism
 * e identidad visual industrial 2026.
 */
const LoadingOverlay = ({ 
    message = "Procesando solicitud...", 
    subMessage = "Por favor, no cierre esta ventana.",
    visible = false 
}) => {
    if (!visible) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            animation: 'loaderFadeIn 0.3s ease-out'
        }}>
            <div style={{
                background: '#1e293b',
                padding: '4rem 3rem',
                borderRadius: '2.5rem',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2rem',
                boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.8)',
                maxWidth: '450px',
                width: '90%',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background pulse decoration */}
                <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)', zIndex: 0, animation: 'pulse-bg 4s ease-in-out infinite' }} />

                <div style={{ position: 'relative', width: '100px', height: '100px', zIndex: 1 }}>
                    <div style={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        border: '4px solid rgba(51, 65, 85, 0.5)',
                        borderTop: '4px solid #6366f1',
                        animation: 'spin-master 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite'
                    }} />
                    <div style={{
                        position: 'absolute', inset: '12px', borderRadius: '50%',
                        border: '4px solid rgba(51, 65, 85, 0.5)',
                        borderTop: '4px solid #10b981',
                        animation: 'spin-master 1.5s linear infinite reverse'
                    }} />
                    <div style={{
                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Zap size={32} color="#6366f1" style={{ filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.5))' }} />
                    </div>
                </div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h2 style={{ color: 'white', margin: '0 0 0.75rem', fontSize: '1.6rem', fontWeight: '950', letterSpacing: '-0.04em' }}>{message}</h2>
                    <p style={{ color: '#94a3b8', margin: 0, fontSize: '1rem', fontWeight: '500', lineHeight: '1.6' }}>{subMessage}</p>
                </div>

                {/* Progress simulator line (purely visual for UX) */}
                <div style={{ width: '100%', height: '4px', background: '#0f172a', borderRadius: '2px', marginTop: '1rem', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
                    <div style={{ position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%', background: 'linear-gradient(90deg, transparent, #6366f1, transparent)', animation: 'progress-scan 2s linear infinite' }} />
                </div>
            </div>

            <style>{`
                @keyframes spin-master { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes loaderFadeIn { from { opacity: 0; transform: scale(1.05); } to { opacity: 1; transform: scale(1); } }
                @keyframes pulse-bg { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
                @keyframes progress-scan { from { left: -100%; } to { left: 100%; } }
            `}</style>
        </div>
    );
};

export default LoadingOverlay;
