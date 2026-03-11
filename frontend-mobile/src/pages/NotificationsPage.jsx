import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, BellIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { shopService } from '../services/api';

const NotificationsPage = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await shopService.getNotifications();
            setNotifications(res.data);
        } catch (error) {
            console.error("Error fetching notifications", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRead = async (id) => {
        try {
            await shopService.markNotificationRead(id);
            setNotifications(notifications.map(n => n._id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error("Error marking read", error);
        }
    };

    const getIcon = (notification_type) => {
        switch (notification_type) {
            case 'ORDER_UPDATE': return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
            case 'CREDIT_UPDATE': return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
            default: return <BellIcon className="h-6 w-6 text-primary-500" />;
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            {/* Header */}
            <header className="bg-white px-6 pt-12 pb-6 border-b border-slate-100 sticky top-0 z-50 flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 bg-slate-50 rounded-xl text-slate-500 active:scale-95 transition-all"
                >
                    <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-xl font-black text-slate-900 leading-tight">Notificaciones</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Centro de avisos</p>
                </div>
            </header>

            <div className="p-6 space-y-4">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white h-24 rounded-3xl animate-pulse"></div>
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-20 px-10">
                        <div className="h-20 w-20 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BellIcon className="h-10 w-10" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-1">Sin avisos nuevos</h3>
                        <p className="text-sm text-slate-500">Te avisaremos cuando haya actualizaciones sobre tu cuenta o pedidos.</p>
                    </div>
                ) : (
                    notifications.map(notif => (
                        <div
                            key={notif._id}
                            onClick={() => handleRead(notif._id)}
                            className={`p-4 rounded-[2rem] border transition-all flex gap-4 items-start ${notif.is_read ? 'bg-white border-slate-100 opacity-60' : 'bg-white border-primary-100 shadow-lg shadow-primary-500/5'}`}
                        >
                            <div className={`p-3 rounded-2xl shrink-0 ${notif.is_read ? 'bg-slate-50' : 'bg-primary-50'}`}>
                                {getIcon(notif.notification_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={`text-sm font-black truncate ${notif.is_read ? 'text-slate-600' : 'text-slate-900'}`}>{notif.title}</h3>
                                    {!notif.is_read && <span className="h-2 w-2 bg-primary-500 rounded-full shrink-0 mt-1.5"></span>}
                                </div>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-2">{notif.message}</p>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">
                                    {new Date(notif.created_at).toLocaleDateString()} • {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
