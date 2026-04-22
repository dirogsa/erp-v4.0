import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
    CheckCircleIcon, 
    ExclamationTriangleIcon, 
    XCircleIcon, 
    InformationCircleIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const showNotification = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
        const id = Math.random().toString(36).substr(2, 9);
        setNotifications((prev) => [...prev, { id, type, title, message }]);

        if (duration !== Infinity) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const icons = {
        success: <CheckCircleIcon className="h-7 w-7 text-brand-primary" />,
        warning: <ExclamationTriangleIcon className="h-7 w-7 text-brand-orange" />,
        error: <XCircleIcon className="h-7 w-7 text-brand-danger" />,
        info: <InformationCircleIcon className="h-7 w-7 text-brand-accent" />,
    };

    const colors = {
        success: 'border-brand-primary/30 bg-brand-primary/10',
        warning: 'border-brand-orange/30 bg-brand-orange/10',
        error: 'border-brand-danger/30 bg-brand-danger/10',
        info: 'border-brand-accent/30 bg-brand-accent/10',
    };

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            {/* Notification Portal */}
            <div className="fixed top-6 left-0 right-0 z-[100] pointer-events-none flex flex-col items-center gap-4 px-6">
                <AnimatePresence>
                    {notifications.map((n) => (
                        <motion.div
                            key={n.id}
                            initial={{ opacity: 0, y: -20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, y: -20 }}
                            className={`
                                pointer-events-auto w-full max-w-md glass-card border-2 ${colors[n.type]} 
                                p-5 rounded-[2rem] flex items-start gap-4 shadow-2xl shadow-black/40
                            `}
                        >
                            <div className="mt-1">{icons[n.type]}</div>
                            <div className="flex-1">
                                <h4 className="text-brand-sm font-black text-white uppercase tracking-tight leading-none mb-1">
                                    {n.title}
                                </h4>
                                <p className="text-brand-xs font-bold text-brand-text-2 leading-tight">
                                    {n.message}
                                </p>
                            </div>
                            <button 
                                onClick={() => removeNotification(n.id)}
                                className="text-brand-text-dim hover:text-white transition-colors"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </NotificationContext.Provider>
    );
};
