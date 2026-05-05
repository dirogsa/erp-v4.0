import React, { useState, useEffect } from 'react';
import { shopService } from '../services/api';
import { 
    ChartBarIcon, 
    ArrowPathIcon, 
    QueueListIcon, 
    CurrencyDollarIcon,
    ExclamationTriangleIcon,
    BuildingOfficeIcon,
    ChevronRightIcon,
    FunnelIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const AdminDashboardPage = () => {
    const [stats, setStats] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filterStatus, setFilterStatus] = useState('BACKORDER'); // Default to monitoring backorders
    const navigate = useNavigate();

    const loadData = async () => {
        try {
            setRefreshing(true);
            const [statsRes, ordersRes] = await Promise.all([
                shopService.getAdminStats(),
                shopService.getAdminOrders({ status: filterStatus, page_size: 15 })
            ]);
            setStats(statsRes.data);
            setOrders(ordersRes.data.items);
        } catch (error) {
            console.error("Failed to load admin data", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [filterStatus]);

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-bg flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    return (
        <div className="bg-brand-bg min-h-screen pb-32 text-brand-text">
            {/* Header */}
            <header className="glass-card px-6 pt-12 pb-8 border-b border-white/5 sticky top-0 z-50 shadow-2xl">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-brand-xl font-black text-white uppercase tracking-tighter">Command Center</h1>
                        <p className="text-brand-primary font-black text-[10px] tracking-[0.3em] uppercase mt-1">SuperAdmin / Global Monitoring</p>
                    </div>
                    <button 
                        onClick={loadData}
                        className={`h-10 w-10 bg-brand-surface rounded-xl flex items-center justify-center border border-white/5 shadow-lg active:scale-90 transition-all ${refreshing ? 'animate-spin' : ''}`}
                    >
                        <ArrowPathIcon className="h-5 w-5 text-brand-primary" />
                    </button>
                </div>
            </header>

            <main className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                
                {/* Real-time KPIs */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-brand-surface p-5 rounded-[2rem] border border-white/5 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                            <CurrencyDollarIcon className="h-12 w-12 text-brand-primary" />
                        </div>
                        <p className="text-brand-metadata text-[10px] mb-1">VENTA GLOBAL</p>
                        <h3 className="text-white font-black text-lg tracking-tighter">S/ {stats?.total_revenue.toLocaleString()}</h3>
                        <div className="mt-2 h-1 w-12 bg-brand-primary rounded-full"></div>
                    </div>

                    <div className="bg-brand-surface p-5 rounded-[2rem] border border-brand-orange/20 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                            <ExclamationTriangleIcon className="h-12 w-12 text-brand-orange" />
                        </div>
                        <p className="text-brand-orange font-black text-[10px] mb-1 uppercase">Backorders</p>
                        <h3 className="text-white font-black text-lg tracking-tighter">{stats?.backorders_count} UND</h3>
                        <div className="mt-2 h-1 w-12 bg-brand-orange rounded-full animate-pulse"></div>
                    </div>
                </div>

                {/* Secondary Stats */}
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                    <div className="flex-shrink-0 bg-brand-surface/40 px-6 py-3 rounded-2xl border border-white/5 flex items-center gap-3">
                        <div className="h-2 w-2 bg-brand-primary rounded-full"></div>
                        <span className="text-[10px] font-black uppercase text-brand-text-dim">Órdenes Totales: {stats?.total_orders}</span>
                    </div>
                    <div className="flex-shrink-0 bg-brand-surface/40 px-6 py-3 rounded-2xl border border-white/5 flex items-center gap-3">
                        <div className="h-2 w-2 bg-brand-orange rounded-full"></div>
                        <span className="text-[10px] font-black uppercase text-brand-text-dim">Pendientes: {stats?.pending_count}</span>
                    </div>
                </div>

                {/* Order Monitor Section */}
                <section className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-brand-heading !text-sm">Monitor de Órdenes</h2>
                        <div className="flex gap-2">
                            {['BACKORDER', 'PENDING', 'ALL'].map((s) => (
                                <button 
                                    key={s}
                                    onClick={() => setFilterStatus(s === 'ALL' ? null : s)}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                                        (filterStatus === s || (s === 'ALL' && !filterStatus))
                                        ? 'bg-brand-primary text-brand-bg shadow-lg shadow-brand-primary/20' 
                                        : 'bg-brand-surface text-brand-text-dim border border-white/5'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        {orders.length === 0 ? (
                            <div className="py-12 text-center bg-brand-surface/30 rounded-[2.5rem] border border-dashed border-white/10">
                                <p className="text-brand-text-dim text-xs uppercase font-bold italic">No hay órdenes {filterStatus?.toLowerCase()} en este momento</p>
                            </div>
                        ) : (
                            orders.map((order) => (
                                <div 
                                    key={order.order_number} 
                                    onClick={() => navigate(`/orders?highlight=${order.order_number}`)}
                                    className="bg-brand-surface p-5 rounded-[2rem] border border-white/5 shadow-lg flex items-center gap-4 active:scale-[0.98] transition-all group"
                                >
                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl shadow-inner ${
                                        order.status === 'BACKORDER' ? 'bg-brand-orange/10' : 'bg-brand-primary/10'
                                    }`}>
                                        {order.status === 'BACKORDER' ? '⏳' : '📦'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-white font-black text-xs uppercase tracking-tighter truncate pr-2">{order.customer_name}</h4>
                                            <span className="text-[10px] font-black text-white">S/ {order.total_amount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-brand-primary font-bold text-[10px]">{order.order_number}</span>
                                            <span className="text-brand-text-dim text-[10px] font-medium">•</span>
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                                order.status === 'BACKORDER' ? 'text-brand-orange bg-brand-orange/10' : 'text-brand-primary bg-brand-primary/10'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        {/* Multitenancy Badge */}
                                        <div className="mt-2 flex items-center gap-1.5 opacity-60">
                                            <BuildingOfficeIcon className="h-3 w-3 text-brand-primary" />
                                            <span className="text-[8px] font-black text-brand-text-dim uppercase tracking-widest">{order.company_id || 'Global'}</span>
                                        </div>
                                    </div>
                                    <ChevronRightIcon className="h-5 w-5 text-brand-text-dim group-hover:translate-x-1 transition-transform" />
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* System Integrity (Visual Polish) */}
                <div className="bg-brand-primary/5 p-6 rounded-[2.5rem] border border-brand-primary/10">
                    <div className="flex items-start gap-4">
                        <div className="h-8 w-8 bg-brand-primary/20 rounded-full flex items-center justify-center shrink-0">
                            <ChartBarIcon className="h-5 w-5 text-brand-primary" />
                        </div>
                        <div>
                            <h4 className="text-white font-black text-xs uppercase mb-1">Audit Log Active</h4>
                            <p className="text-[10px] text-brand-text-dim leading-relaxed font-medium">
                                Todas las consultas y acciones realizadas en este Command Center están siendo auditadas bajo los protocolos de seguridad de DIROGSA.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboardPage;
