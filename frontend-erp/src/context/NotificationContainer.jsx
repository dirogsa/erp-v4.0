import React, { useContext } from 'react';
import { NotificationContext } from './NotificationContext';

const NotificationContainer = () => {
    const { notifications, removeNotification } = useContext(NotificationContext);

    if (!notifications || notifications.length === 0) return null;

    const typeStyles = {
        success: { backgroundColor: '#10b981', icon: '✓' },
        error: { backgroundColor: '#ef4444', icon: '✕' },
        warning: { backgroundColor: '#f59e0b', icon: '⚠' },
        info: { backgroundColor: '#3b82f6', icon: 'ℹ' },
    };

    return (
        <div style={{
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            maxWidth: '400px',
        }}>
            {notifications.map(notif => {
                const style = typeStyles[notif.type] || typeStyles.info;

                return (
                    <div
                        key={notif.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            backgroundColor: style.backgroundColor,
                            color: 'white',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                            cursor: 'pointer',
                            animation: 'slideIn 0.3s ease-out',
                        }}
                        onClick={() => removeNotification(notif.id)}
                    >
                        <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                            {style.icon}
                        </span>
                        <span style={{ flex: 1, fontSize: '0.875rem' }}>
                            {notif.message}
                        </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notif.id);
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '1.5rem',
                                padding: '0',
                                lineHeight: '1',
                                opacity: 0.7,
                            }}
                        >
                            ×
                        </button>
                    </div>
                );
            })}
            <style>
                {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
            </style>
        </div>
    );
};

export default NotificationContainer;
