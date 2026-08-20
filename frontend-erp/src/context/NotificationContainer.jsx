import React, { useContext } from 'react';
import { NotificationContext } from './NotificationContext';

const NotificationContainer = () => {
    const { notifications, removeNotification } = useContext(NotificationContext);

    if (!notifications || notifications.length === 0) return null;

    // Separamos las notificaciones por modo
    const toasts = notifications.filter(n => n.mode !== 'dialog');
    const dialogs = notifications.filter(n => n.mode === 'dialog');

    const typeStyles = {
        success: { backgroundColor: '#10b981', icon: '✓', color: '#047857' },
        error: { backgroundColor: '#ef4444', icon: '✕', color: '#b91c1c' },
        warning: { backgroundColor: '#f59e0b', icon: '⚠', color: '#b45309' },
        info: { backgroundColor: '#3b82f6', icon: 'ℹ', color: '#1d4ed8' },
    };

    return (
        <>
            {/* TOASTS (Esquina superior derecha) */}
            {toasts.length > 0 && (
                <div style={{
                    position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999,
                    display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '400px',
                }}>
                    {toasts.map(notif => {
                        const style = typeStyles[notif.type] || typeStyles.info;
                        return (
                            <div
                                key={notif.id}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem',
                                    borderRadius: '0.5rem', backgroundColor: style.backgroundColor, color: 'white',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)', cursor: 'pointer',
                                    animation: 'slideIn 0.3s ease-out',
                                }}
                                onClick={() => removeNotification(notif.id)}
                            >
                                <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{style.icon}</span>
                                <span style={{ flex: 1, fontSize: '0.875rem' }}>{notif.message}</span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeNotification(notif.id); }}
                                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem', opacity: 0.7 }}
                                >
                                    ×
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* DIALOGS / MODALS (Centro de la pantalla, bloqueante) */}
            {dialogs.length > 0 && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000,
                    backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    {dialogs.map(notif => {
                        const style = typeStyles[notif.type] || typeStyles.info;
                        return (
                            <div key={notif.id} style={{
                                backgroundColor: '#1e293b', borderRadius: '0.75rem', padding: '2rem',
                                maxWidth: '400px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                                border: '1px solid #334155', display: 'flex', flexDirection: 'column',
                                alignItems: 'center', textAlign: 'center', animation: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}>
                                <div style={{
                                    width: '3.5rem', height: '3.5rem', borderRadius: '50%',
                                    backgroundColor: style.backgroundColor, color: 'white',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1.25rem'
                                }}>
                                    {style.icon}
                                </div>
                                
                                <h3 style={{ color: 'white', fontSize: '1.25rem', margin: '0 0 0.5rem 0', fontWeight: '600' }}>
                                    {notif.type === 'success' ? 'Operación Exitosa' : notif.type === 'error' ? 'Ha ocurrido un error' : 'Atención'}
                                </h3>
                                
                                <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '0 0 1.5rem 0', lineHeight: '1.5' }}>
                                    {notif.message}
                                </p>
                                
                                <button
                                    onClick={() => removeNotification(notif.id)}
                                    style={{
                                        backgroundColor: style.backgroundColor, color: 'white',
                                        border: 'none', padding: '0.75rem 2rem', borderRadius: '0.5rem',
                                        fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer',
                                        width: '100%', transition: 'filter 0.2s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                                    onMouseOut={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                                >
                                    Aceptar
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            <style>
                {`
                    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                `}
            </style>
        </>
    );
};

export default NotificationContainer;
