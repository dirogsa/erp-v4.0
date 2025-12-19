import React, { createContext, useState, useCallback } from 'react';
import NotificationContainer from './NotificationContainer';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const showNotification = useCallback((message, type = 'info') => {
        const id = Date.now() + Math.random(); // Asegurar ID único
        const notification = { id, message, type };

        setNotifications(prev => [...prev, notification]);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

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
