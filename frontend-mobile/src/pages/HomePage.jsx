import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { shopService } from '../services/api';
import api from '../services/api';
import {
    ClockIcon,
    CheckBadgeIcon,
    ArrowPathIcon,
    ChevronRightIcon,
    WalletIcon,
    CreditCardIcon,
    BellIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';

const HomePage = () => {
    const { user } = useAuth();
    const [financialStatus, setFinancialStatus] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [suggestedOrder, setSuggestedOrder] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                const results = await Promise.allSettled([
                    api.get('/shop/financial-status'),
                    shopService.getOrders(),
                    shopService.getPredictiveOrder(),
                    shopService.getNotifications()
                ]);

                if (results[0].status === 'fulfilled') setFinancialStatus(results[0].value.data);
                if (results[1].status === 'fulfilled') setRecentOrders(results[1].value.data.slice(0, 3));
                if (results[2].status === 'fulfilled') setSuggestedOrder(results[2].value.data.slice(0, 5));
                if (results[3].status === 'fulfilled') {
                    const unread = (results[3].value.data || []).filter(n => !n.is_read).length;
                    setUnreadCount(unread);
                }
            } catch (error) {
                console.error("Error fetching home data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHomeData();
    }, []);

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
            <div className="h-10 w-10 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="bg-slate-50 min-h-screen pb-24">
            {/* Header Modernista Estilo Glassmorphism */}
            <div className="glass-card px-6 pt-12 pb-6 sticky top-0 z-50 border-b border-white/5 flex justify-between items-center transition-all shadow-xl">
                <div>
                    <h1 className="text-brand-xl font-black text-white leading-tight">Hola, {user?.full_name?.split(' ')[0]} 👋</h1>
                    <p className="text-brand-label mt-1">
                        Socio {user?.classification || 'Standard'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link to="/notifications" className="relative p-2.5 bg-slate-50 rounded-2xl text-slate-400 active:scale-95 transition-all">
                        {unreadCount > 0 ? (
                            <BellIconSolid className="h-6 w-6 text-primary-500" />
                        ) : (
                            <BellIcon className="h-6 w-6" />
                        )}
                        {unreadCount > 0 && (
                            <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                        )}
                    </Link>
                    <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
                        <img src={`https://ui-avatars.com/api/?name=${user?.full_name}&background=6366f1&color=fff`} alt="Profile" />
                    </div>
                </div>
            </div>

            {/* Financial Hero Section - Reemplaza el bloque oscuro por un diseño más aireado */}
            <div className="p-6">
                <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden mb-8">
                    <div className="relative z-10 flex flex-col gap-6">
                        <div className="flex justify-between items-start">
                            <div className="bg-white/10 p-5 rounded-[2rem] backdrop-blur-md border border-white/10 shadow-inner">
                                <p className="text-brand-metadata !text-white/60 mb-1">Puntos acumulados</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-brand-2xl font-black text-white">{user?.loyalty_points || 0}</span>
                                    <span className="text-brand-xs font-black text-brand-primary uppercase">pts</span>
                                </div>
                            </div>
                            <div className="text-right py-2">
                                <p className="text-brand-metadata !text-white/60 mb-1">Deuda Total</p>
                                <p className="text-brand-xl font-black text-white">S/ {financialStatus?.total_debt?.toFixed(2) || '0.00'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="bg-white/5 p-5 rounded-[2.5rem] border border-white/10 backdrop-blur-sm shadow-inner">
                                <p className="text-brand-metadata !text-white/40 mb-1">Crédito Disp.</p>
                                <p className="text-brand-lg font-black text-white">S/ {financialStatus?.available_credit?.toFixed(2) || '0.00'}</p>
                                <div className="w-full bg-white/10 h-2 rounded-full mt-3 overflow-hidden">
                                    <div
                                        className="bg-brand-primary h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                        style={{ width: `${Math.min((financialStatus?.available_credit / financialStatus?.credit_limit) * 100 || 0, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="bg-white/5 p-5 rounded-[2.5rem] border border-white/10 backdrop-blur-sm shadow-inner">
                                <p className="text-brand-metadata !text-white/40 mb-1">Facturas</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-brand-lg font-black text-white">{financialStatus?.overdue_count || 0}</span>
                                    {financialStatus?.overdue_count > 0 && (
                                        <span className="bg-brand-danger text-white text-brand-xs font-black px-2 py-0.5 rounded-lg uppercase tracking-tighter">Vencidas</span>
                                    )}
                                </div>
                                <p className="text-brand-xs text-white/30 font-bold mt-2 uppercase tracking-tighter">Límite S/ {financialStatus?.credit_limit || 0}</p>
                            </div>
                        </div>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary-600/20 rounded-full blur-[100px]"></div>
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px]"></div>
                </div>
            </div>

            <div className="px-6 mb-10">
                <h2 className="text-brand-heading mb-6 pl-1">Accesos Rápidos</h2>
                <div className="grid grid-cols-4 gap-4">
                    {[
                        { label: 'Filtros', icon: '📦', color: 'bg-indigo-500/10', path: '/catalog' },
                        { label: 'Buscar', icon: '🔍', color: 'bg-amber-500/10', path: '/search' },
                        { label: 'Estado', icon: '📊', color: 'bg-emerald-500/10', path: '/profile' },
                        { label: 'Ayuda', icon: '💬', color: 'bg-slate-500/10', path: '/profile' },
                    ].map(action => (
                        <Link key={action.label} to={action.path} className="flex flex-col items-center gap-3 group">
                            <div className={`${action.color} h-16 w-16 rounded-[1.5rem] flex items-center justify-center text-2xl shadow-xl group-active:scale-95 transition-all border border-white/5`}>
                                {action.icon}
                            </div>
                            <span className="text-brand-xs font-black text-brand-text-muted uppercase tracking-tighter">{action.label}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent activity & suggestions */}
            <div className="px-6 mb-20 space-y-10">
                {/* Predictive order if available */}
                {suggestedOrder.length > 0 && (
                    <div>
                        <div className="flex justify-between items-center mb-5 pl-1">
                            <h2 className="text-lg font-black text-slate-900">Pedido Sugerido</h2>
                            <div className="h-6 w-6 bg-primary-100 rounded-full flex items-center justify-center">
                                <ArrowPathIcon className="h-3.5 w-3.5 text-primary-600 animate-spin-slow" />
                            </div>
                        </div>
                        <div className="bg-brand-primary/10 p-10 rounded-[3rem] border border-brand-primary/20 relative overflow-hidden shadow-2xl">
                            <div className="relative z-10">
                                <p className="text-brand-label mb-3">Inteligencia Artificial</p>
                                <h3 className="text-brand-xl font-black mb-8 leading-tight text-white">Abastece tu stock en segundos.</h3>

                                <div className="flex -space-x-4 mb-10">
                                    {suggestedOrder.slice(0, 4).map((prod) => (
                                        <div key={prod.sku} className="h-14 w-14 rounded-full border-4 border-brand-bg bg-brand-surface shadow-2xl overflow-hidden flex items-center justify-center">
                                            <img src={prod.image_url || 'https://via.placeholder.com/100'} alt={prod.sku} className="h-full w-full object-cover" />
                                        </div>
                                    ))}
                                    {suggestedOrder.length > 4 && (
                                        <div className="h-14 w-14 rounded-full border-4 border-brand-bg bg-brand-surface-3 flex items-center justify-center text-brand-xs font-black text-brand-primary">
                                            +{suggestedOrder.length - 4}
                                        </div>
                                    )}
                                </div>

                                <Link to="/catalog" className="inline-block bg-brand-primary text-brand-bg px-10 py-5 rounded-2xl font-black text-brand-sm uppercase shadow-2xl hover:brightness-110 active:scale-95 transition-all tracking-widest">
                                    Revisar Propuesta
                                </Link>
                            </div>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                        </div>
                    </div>
                )}

                {/* Recent Orders */}
                <div>
                    <div className="flex justify-between items-end mb-5 pl-1">
                        <h2 className="text-lg font-black text-slate-900">Mis Últimos Pedidos</h2>
                        <Link to="/profile" className="text-xs font-black text-primary-600 border-b border-primary-100 pb-0.5">Ver historial</Link>
                    </div>

                    <div className="space-y-4">
                        {recentOrders.length === 0 ? (
                            <div className="bg-white p-10 rounded-[2rem] border-2 border-dashed border-slate-100 text-center">
                                <p className="text-slate-400 text-sm font-medium">Aún no tienes pedidos registrados.</p>
                            </div>
                        ) : (
                            recentOrders.map(order => (
                                <div key={order.order_number} className="bg-brand-surface p-6 rounded-[2.5rem] shadow-xl border border-white/5 flex items-center justify-between active:bg-brand-surface-2 transition-colors">
                                    <div className="flex items-center gap-5">
                                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner ${order.status === 'DELIVERED' ? 'bg-brand-primary/10 text-brand-primary' :
                                                order.status === 'PENDING' ? 'bg-brand-orange/10 text-brand-orange' : 'bg-brand-accent/10 text-brand-accent'
                                            }`}>
                                            {order.status === 'DELIVERED' ? <CheckBadgeIcon className="h-7 w-7" /> : <ClockIcon className="h-7 w-7" />}
                                        </div>
                                        <div>
                                            <div className="text-brand-sm font-black text-white uppercase tracking-tighter">{order.order_number || 'S/N'}</div>
                                            <div className="text-brand-xs text-brand-text-muted font-bold uppercase tracking-tight mt-1">
                                                {new Date(order.date).toLocaleDateString()} • {order.items?.length || 0} ITEMS
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <div className="text-brand-md font-black text-white leading-none">S/ {order.total_amount?.toFixed(2)}</div>
                                        <ChevronRightIcon className="h-5 w-5 text-brand-text-dim" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
