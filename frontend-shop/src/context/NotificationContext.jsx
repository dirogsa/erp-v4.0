import React, { createContext, useState, useCallback, useContext } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

const NotificationContainer = ({ notifications, removeNotification }) => {
    return (
        <div className="fixed top-24 right-4 z-[9999] flex flex-col gap-3 w-full max-w-md pointer-events-none">
            {notifications.map((notif) => (
                <div
                    key={notif.id}
                    className="pointer-events-auto animate-in slide-in-from-right duration-500"
                >
                    <NotificationItem notif={notif} onClose={() => removeNotification(notif.id)} />
                </div>
            ))}
        </div>
    );
};

const NotificationItem = ({ notif, onClose }) => {
    const types = {
        success: {
            bg: 'bg-emerald-500',
            icon: <CheckCircleIcon className="h-6 w-6" />,
            label: 'Éxito'
        },
        error: {
            bg: 'bg-rose-500',
            icon: <ExclamationCircleIcon className="h-6 w-6" />,
            label: 'Error'
        },
        warning: {
            bg: 'bg-amber-500',
            icon: <ExclamationTriangleIcon className="h-6 w-6" />,
            label: 'Aviso'
        },
        info: {
            bg: 'bg-blue-500',
            icon: <InformationCircleIcon className="h-6 w-6" />,
            label: 'Info'
        }
    };

    const config = types[notif.type] || types.info;

    return (
        <div className={`${config.bg} text-white p-4 rounded-2xl shadow-2xl flex items-start gap-4 border border-white/20 backdrop-blur-md`}>
            <div className="bg-white/20 p-2 rounded-xl">
                {config.icon}
            </div>
            <div className="flex-grow">
                <div className="font-black uppercase text-[10px] tracking-widest opacity-80 mb-0.5">{config.label}</div>
                <div className="font-bold text-sm leading-tight">{notif.message}</div>
            </div>
            <button
                onClick={onClose}
                className="hover:bg-white/20 p-1 rounded-lg transition-colors"
            >
                <XMarkIcon className="h-5 w-5" />
            </button>
        </div>
    );
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const showNotification = useCallback((message, type = 'info') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            <NotificationContainer notifications={notifications} removeNotification={removeNotification} />
        </NotificationContext.Provider>
    );
};
