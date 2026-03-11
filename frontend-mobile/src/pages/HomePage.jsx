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
            <div className="bg-white px-6 pt-12 pb-6 sticky top-0 z-50 border-b border-slate-100 flex justify-between items-center transition-all">
                <div>
                    <h1 className="text-xl font-black text-slate-900 leading-tight">Hola, {user?.full_name?.split(' ')[0]} 👋</h1>
                    <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] mt-0.5">
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
                            <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-md border border-white/10">
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Puntos acumulados</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-white">{user?.loyalty_points || 0}</span>
                                    <span className="text-primary-400 text-xs font-bold uppercase">pts</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Deuda</p>
                                <p className="text-xl font-black text-white">S/ {financialStatus?.total_debt?.toFixed(2) || '0.00'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="bg-white/5 p-4 rounded-[2rem] border border-white/10 backdrop-blur-sm">
                                <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Crédito Disp.</p>
                                <p className="text-lg font-black text-white">S/ {financialStatus?.available_credit?.toFixed(2) || '0.00'}</p>
                                <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                                    <div
                                        className="bg-primary-500 h-full rounded-full transition-all duration-1000"
                                        style={{ width: `${Math.min((financialStatus?.available_credit / financialStatus?.credit_limit) * 100 || 0, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="bg-white/5 p-4 rounded-[2rem] border border-white/10 backdrop-blur-sm">
                                <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Facturas</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-black text-white">{financialStatus?.overdue_count || 0}</span>
                                    {financialStatus?.overdue_count > 0 && (
                                        <span className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Vencidas</span>
                                    )}
                                </div>
                                <p className="text-[8px] text-slate-500 font-bold mt-1 tracking-tight">Límite S/ {financialStatus?.credit_limit || 0}</p>
                            </div>
                        </div>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary-600/20 rounded-full blur-[100px]"></div>
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px]"></div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="px-6 mb-10">
                <h2 className="text-lg font-black text-slate-900 mb-5 pl-1">Accesos Rápidos</h2>
                <div className="grid grid-cols-4 gap-4">
                    {[
                        { label: 'Filtros', icon: '📦', color: 'bg-indigo-50', path: '/catalog' },
                        { label: 'Buscar', icon: '🔍', color: 'bg-amber-50', path: '/search' },
                        { label: 'Estado', icon: '📊', color: 'bg-emerald-50', path: '/profile' },
                        { label: 'Ayuda', icon: '💬', color: 'bg-slate-100', path: '/profile' },
                    ].map(action => (
                        <Link key={action.label} to={action.path} className="flex flex-col items-center gap-2.5 group">
                            <div className={`${action.color} h-15 w-15 rounded-[1.25rem] flex items-center justify-center text-2xl shadow-sm group-active:scale-95 transition-all`}>
                                {action.icon}
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{action.label}</span>
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
                        <div className="bg-primary-900 p-8 rounded-[2.5rem] shadow-2xl shadow-primary-900/40 relative overflow-hidden">
                            <div className="relative z-10 text-white">
                                <p className="text-[11px] font-black text-primary-400 uppercase tracking-[0.2em] mb-3">Automatización IA</p>
                                <h3 className="text-2xl font-black mb-6 leading-tight">Abastece tu stock en segundos.</h3>

                                <div className="flex -space-x-3 mb-10">
                                    {suggestedOrder.slice(0, 4).map((prod) => (
                                        <div key={prod.sku} className="h-12 w-12 rounded-full border-4 border-primary-900 bg-white shadow-lg overflow-hidden flex items-center justify-center">
                                            <img src={prod.image_url || 'https://via.placeholder.com/100'} alt={prod.sku} className="h-full w-full object-cover" />
                                        </div>
                                    ))}
                                    {suggestedOrder.length > 4 && (
                                        <div className="h-12 w-12 rounded-full border-4 border-primary-900 bg-primary-800 flex items-center justify-center text-[11px] font-black">
                                            +{suggestedOrder.length - 4}
                                        </div>
                                    )}
                                </div>

                                <Link to="/catalog" className="inline-block bg-white text-primary-900 px-10 py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-slate-50 active:scale-95 transition-all">
                                    Revisar Propuesta
                                </Link>
                            </div>
                            <div className="absolute top-0 right-0 w-48 h-48 bg-primary-600 opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
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
                                <div key={order.order_number} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between active:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-600' :
                                                order.status === 'PENDING' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                                            }`}>
                                            {order.status === 'DELIVERED' ? <CheckBadgeIcon className="h-6 w-6" /> : <ClockIcon className="h-6 w-6" />}
                                        </div>
                                        <div>
                                            <div className="text-[13px] font-black text-slate-900 uppercase">{order.order_number || 'S/N'}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                                {new Date(order.date).toLocaleDateString()} • {order.items?.length || 0} ITEMS
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-3">
                                        <div className="text-sm font-black text-slate-900 leading-none">S/ {order.total_amount?.toFixed(2)}</div>
                                        <ChevronRightIcon className="h-4 w-4 text-slate-300" />
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
