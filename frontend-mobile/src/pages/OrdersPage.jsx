import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { shopService } from '../services/api';
import { 
    ClipboardDocumentListIcon, 
    ChevronRightIcon, 
    CheckCircleIcon, 
    ClockIcon,
    DocumentArrowDownIcon,
    ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { generateQuotationPDF } from '../utils/generateQuotationPDF';
import { useNotifications } from '../context/NotificationContext';

const OrdersPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotifications();
    const [orders, setOrders] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);
    const [activeTab, setActiveTab] = useState('orders');

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        loadData();
    }, [user, navigate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [ordersRes, quotesRes] = await Promise.all([
                shopService.getOrders(),
                shopService.getQuotes()
            ]);
            setOrders(ordersRes.data || []);
            setQuotes(quotesRes.data || []);
        } catch (error) {
            console.error("Failed to load history", error);
            showNotification({
                type: 'error',
                title: 'Error',
                message: 'No se pudieron cargar tus pedidos.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async (orderNumber) => {
        if (!window.confirm(`¿Estás seguro de que deseas cancelar la reserva ${orderNumber}?`)) return;
        
        try {
            await shopService.cancelOrder(orderNumber);
            showNotification({
                type: 'success',
                title: 'Reserva Cancelada',
                message: 'La reserva ha sido eliminada exitosamente.'
            });
            loadData(); // Reload
        } catch (error) {
            showNotification({
                type: 'error',
                title: 'Error',
                message: error.response?.data?.detail || 'No se pudo cancelar la orden.'
            });
        }
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'PENDING': return { label: 'Pendiente', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
            case 'BACKORDER': return { label: 'Reserva (Backorder)', color: 'text-brand-orange bg-brand-orange/10 border-brand-orange/20' };
            case 'COMPLETED': case 'INVOICED': return { label: 'Completado', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
            case 'CANCELLED': return { label: 'Cancelado', color: 'text-red-500 bg-red-500/10 border-red-500/20' };
            default: return { label: status, color: 'text-brand-muted bg-brand-surface border-brand-border' };
        }
    };

    return (
        <div className="bg-brand-bg min-h-screen pb-32 text-brand-text">
            <header className="glass-card px-6 pt-12 pb-2 border-b border-white/5 shadow-xl sticky top-0 z-50">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-14 w-14 flex items-center justify-center bg-brand-surface rounded-2xl border border-brand-border shadow-lg">
                        <ClipboardDocumentListIcon className="h-7 w-7 text-brand-primary" />
                    </div>
                    <div>
                        <h1 className="text-brand-xl font-black text-white leading-tight uppercase tracking-tighter">Mi Actividad</h1>
                        <p className="text-brand-metadata mt-1">Gestión de pedidos y reservas</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={() => setActiveTab('orders')}
                        className={`flex-1 py-3 text-brand-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'orders' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-muted'}`}
                    >
                        Mis Pedidos
                    </button>
                    <button 
                        onClick={() => setActiveTab('quotes')}
                        className={`flex-1 py-3 text-brand-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'quotes' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-muted'}`}
                    >
                        Cotizaciones
                    </button>
                </div>
            </header>

            <main className="p-6">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 bg-brand-surface rounded-[2rem] border border-brand-border animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-5">
                        {activeTab === 'orders' ? (
                            orders.length === 0 ? (
                                <EmptyState message="No tienes pedidos registrados aún." onAction={() => navigate('/')} />
                            ) : (
                                orders.map((order) => (
                                    <OrderCard 
                                        key={order.order_number} 
                                        order={order} 
                                        statusInfo={getStatusInfo(order.status)} 
                                        onCancel={handleCancelOrder}
                                    />
                                ))
                            )
                        ) : (
                            quotes.length === 0 ? (
                                <EmptyState message="No tienes cotizaciones guardadas." onAction={() => navigate('/')} />
                            ) : (
                                quotes.map((quote) => (
                                    <QuoteCard 
                                        key={quote.quote_number} 
                                        quote={quote} 
                                        statusInfo={getStatusInfo(quote.status)} 
                                        onNavigate={(sku) => navigate(`/product/${sku}`)}
                                    />
                                ))
                            )
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

const OrderCard = ({ order, statusInfo, onCancel }) => (
    <div className="bg-brand-surface border-2 border-brand-border/30 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden group">
        <div className={`absolute top-0 left-0 w-1.5 h-full bg-current transition-colors ${statusInfo.color.split(' ')[0]}`}></div>
        
        <div className="flex justify-between items-start mb-6">
            <div className="flex flex-col gap-2">
                <div className={`px-3 py-1 rounded-lg border ${statusInfo.color} inline-flex items-center gap-2`}>
                    <span className="text-[10px] font-black uppercase tracking-tighter">{statusInfo.label}</span>
                </div>
                <h3 className="text-brand-sm font-black text-white uppercase tracking-tighter">ORDEN #{order.order_number}</h3>
            </div>
            <div className="text-right">
                <span className="text-[10px] text-brand-metadata block mb-1 font-bold">FECHA</span>
                <span className="text-brand-xs font-bold text-white">{new Date(order.date).toLocaleDateString()}</span>
            </div>
        </div>

        <div className="bg-brand-bg/40 rounded-2xl p-4 mb-6 border border-white/5">
            <div className="flex justify-between items-center">
                <span className="text-brand-xs text-brand-text-dim uppercase font-black">{order.items?.length} Ítems</span>
                <span className="text-brand-md font-black text-white">S/ {order.total_amount?.toFixed(2)}</span>
            </div>
        </div>

        <div className="flex gap-3">
            {order.status === 'BACKORDER' ? (
                <button 
                    onClick={() => onCancel(order.order_number)}
                    className="flex-1 bg-brand-danger/10 border border-brand-danger/20 text-brand-danger py-4 rounded-xl text-brand-xs font-black uppercase tracking-widest active:scale-95 transition-all"
                >
                    ELIMINAR RESERVA
                </button>
            ) : (
                <div className="flex-1 text-center py-4 text-brand-xs font-black text-brand-muted uppercase tracking-widest bg-brand-bg/20 rounded-xl">
                    PROCESANDO DESPACHO...
                </div>
            )}
        </div>
    </div>
);

const QuoteCard = ({ quote, statusInfo, onNavigate }) => (
    <div className="bg-brand-surface border border-brand-border/30 rounded-[2.5rem] p-6 shadow-lg">
        <div className="flex justify-between items-start mb-6">
            <h3 className="text-brand-xs font-black text-brand-text-muted uppercase tracking-widest">COTIZACIÓN #{quote.quote_number}</h3>
            <span className="text-brand-xs font-bold text-white opacity-60">{new Date(quote.date).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between items-end">
            <div>
                <p className="text-[10px] text-brand-metadata mb-1 font-bold uppercase tracking-tighter">PRECIO ESTIMADO</p>
                <p className="text-brand-lg font-black text-white">S/ {quote.total_amount?.toFixed(2)}</p>
            </div>
            <button 
                onClick={() => quote.items?.[0] && onNavigate(quote.items[0].product_sku)}
                className="h-12 w-12 bg-brand-bg rounded-xl border border-white/10 flex items-center justify-center text-brand-primary active:scale-90 transition-all shadow-inner"
            >
                <ChevronRightIcon className="h-6 w-6" />
            </button>
        </div>
    </div>
);

const EmptyState = ({ message, onAction }) => (
    <div className="text-center py-16 bg-brand-surface rounded-[3rem] border border-brand-border px-8 shadow-inner">
        <div className="h-20 w-20 bg-brand-bg border border-brand-border text-brand-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <ClockIcon className="h-10 w-10" />
        </div>
        <h3 className="text-brand-sm font-black text-white uppercase tracking-widest mb-8">{message}</h3>
        <button onClick={onAction} className="w-full bg-brand-primary text-brand-bg py-4 rounded-xl font-black text-brand-xs uppercase tracking-widest active:scale-95 transition-all shadow-lg">
            Ir a la Tienda
        </button>
    </div>
);

export default OrdersPage;
