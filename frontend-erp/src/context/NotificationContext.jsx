import React, { createContext, useState, useCallback } from 'react';
import NotificationContainer from './NotificationContainer';

export const NotificationContext = createContext();

// Helper para acceder a las notificaciones fuera del árbol de React (ej. React Query MutationCache)
export let globalNotification = {
    show: (message, type) => console.warn('globalNotification called before initialization', message, type)
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const showNotification = useCallback((message, type = 'info', options = {}) => {
        const id = Date.now() + Math.random(); // Asegurar ID único
        
        // Valores por defecto para el Enfoque Híbrido
        const { 
            mode = 'toast', // 'toast' | 'dialog'
            sticky = false  // Si es true, no se cierra automáticamente
        } = options;

        const notification = { id, message, type, mode, sticky };

        setNotifications(prev => [...prev, notification]);

        // Auto-remover solo si es un toast y no es sticky
        if (mode === 'toast' && !sticky) {
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }, 5000);
        }
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Sincronizar con el helper global
    React.useEffect(() => {
        globalNotification.show = showNotification;
    }, [showNotification]);

    const value = {
        showNotification,
        removeNotification,
        notifications
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            <NotificationContainer />
        </NotificationContext.Provider>
    );
};
