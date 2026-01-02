import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { shopService } from '../services/api';
import {
    UserCircleIcon,
    StarIcon,
    ShoppingBagIcon,
    CalendarIcon,
    DocumentTextIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowRightIcon,
    CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const ProfilePage = () => {
    const { user } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [orders, setOrders] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('quotes');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, ordersRes, quotesRes] = await Promise.all([
                    shopService.getProfile(),
                    shopService.getOrders(),
                    shopService.getQuotes()
                ]);
                setProfileData(profileRes.data);
                setOrders(ordersRes.data);
                setQuotes(quotesRes.data);
            } catch (error) {
                console.error("Error fetching dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'PENDING':
            case 'DRAFT':
                return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'INVOICED':
            case 'ACCEPTED':
            case 'CONVERTED':
                return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'CANCELLED':
            case 'REJECTED':
                return 'bg-rose-50 text-rose-700 border-rose-100';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    const formatStatus = (status) => {
        const map = {
            'PENDING': 'Pendiente',
            'DRAFT': 'Borrador',
            'INVOICED': 'Facturado',
            'ACCEPTED': 'Aceptado',
            'CONVERTED': 'Procesado',
            'CANCELLED': 'Anulado',
            'REJECTED': 'Rechazado'
        };
        return map[status] || status;
    };

    const [selectedItem, setSelectedItem] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const handleViewDetail = (item) => {
        setSelectedItem(item);
        setShowDetailModal(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-24 flex justify-center items-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500 font-medium">Cargando tu panel...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-20 bg-gray-50/50">
            <div className="max-w-6xl mx-auto px-4">

                {/* Header Section */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                    <div className="h-40 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 relative">
                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                    </div>
                    <div className="px-8 pb-8 relative">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end -mt-16 gap-6">
                            <div className="flex items-end gap-6">
                                <div className="p-1.5 bg-white rounded-3xl shadow-lg">
                                    <div className="bg-gray-100 rounded-2xl p-4 overflow-hidden w-28 h-28 flex items-center justify-center">
                                        <UserCircleIcon className="h-20 w-20 text-gray-400" />
                                    </div>
                                </div>
                                <div className="mb-2">
                                    <h1 className="text-3xl font-black text-gray-900 leading-none">{profileData?.full_name}</h1>
                                    <p className="text-gray-500 font-medium mt-1">{profileData?.email}</p>
                                    <div className="flex gap-2 mt-3">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${profileData?.role === 'customer_b2b' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                                            {profileData?.role === 'customer_b2b' ? 'Socio Mayorista B2B' : 'Cliente Minorista'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-4 w-full md:w-auto">
                                <div className="bg-amber-50 border border-amber-100 px-6 py-4 rounded-2xl flex-1 md:flex-none min-w-[160px]">
                                    <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-widest mb-1">
                                        <StarIcon className="h-4 w-4" /> Puntos
                                    </div>
                                    <div className="text-2xl font-black text-amber-600">{profileData?.loyalty_points || 0}</div>
                                </div>
                                <div className="bg-emerald-50 border border-emerald-100 px-6 py-4 rounded-2xl flex-1 md:flex-none min-w-[160px]">
                                    <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-widest mb-1">
                                        <CurrencyDollarIcon className="h-4 w-4" /> Compras
                                    </div>
                                    <div className="text-2xl font-black text-emerald-600">S/ {profileData?.cumulative_sales?.toFixed(2) || '0.00'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Navigation Sidebar */}
                    <div className="lg:col-span-3 space-y-2">
                        <button
                            onClick={() => setActiveTab('quotes')}
                            className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all ${activeTab === 'quotes' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 translate-x-1' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'}`}
                        >
                            <div className="flex items-center gap-3 font-bold">
                                <DocumentTextIcon className="h-5 w-5" />
                                <span>Cotizaciones</span>
                            </div>
                            {quotes.length > 0 && <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'quotes' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{quotes.length}</span>}
                        </button>

                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all ${activeTab === 'orders' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 translate-x-1' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'}`}
                        >
                            <div className="flex items-center gap-3 font-bold">
                                <ShoppingBagIcon className="h-5 w-5" />
                                <span>Pedidos</span>
                            </div>
                            {orders.length > 0 && <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'orders' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{orders.length}</span>}
                        </button>

                        <div className="p-6 bg-gradient-to-br from-gray-900 to-blue-900 rounded-3xl text-white mt-8 overflow-hidden relative group">
                            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                                <StarIcon className="h-32 w-32" />
                            </div>
                            <h4 className="font-black text-lg mb-2 relative z-10">¿Sabías que?</h4>
                            <p className="text-blue-100 text-sm leading-relaxed relative z-10">Como socio B2B puedes solicitar precios especiales por volumen directamente desde el carrito.</p>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-9">
                        <div className="bg-white rounded-3xl border border-gray-100 min-h-[500px] overflow-hidden shadow-sm">

                            {/* Quotes Tab */}
                            {activeTab === 'quotes' && (
                                <div className="p-0">
                                    <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                                        <h3 className="text-xl font-black text-gray-900">Mis Cotizaciones</h3>
                                        <p className="text-sm text-gray-400 font-medium">{quotes.length} trámites encontrados</p>
                                    </div>
                                    {quotes.length === 0 ? (
                                        <div className="py-20 text-center">
                                            <DocumentTextIcon className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                                            <p className="text-gray-500 font-medium">Aún no has solicitado cotizaciones.</p>
                                            <Link to="/catalog" className="text-blue-600 font-bold text-sm mt-2 inline-block hover:underline">Ir al catálogo →</Link>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-50">
                                            {quotes.map((quote) => (
                                                <div key={quote.quote_number} className="p-6 hover:bg-gray-50/50 transition-colors group">
                                                    <div className="flex flex-wrap justify-between items-center gap-4">
                                                        <div className="flex items-start gap-4">
                                                            <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
                                                                <ClockIcon className="h-6 w-6" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="font-black text-gray-900">{quote.quote_number}</span>
                                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(quote.status)}`}>
                                                                        {formatStatus(quote.status)}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-500 mt-1">Solicitado el {new Date(quote.date).toLocaleDateString()}</p>
                                                                <button
                                                                    onClick={() => handleViewDetail(quote)}
                                                                    className="text-xs text-blue-600 font-bold mt-2 flex items-center gap-1 uppercase tracking-tighter hover:underline"
                                                                >
                                                                    {quote.items?.length} productos <ArrowRightIcon className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-2xl font-black text-gray-900 leading-none">S/ {quote.total_amount?.toFixed(2)}</p>
                                                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">Total Estimado</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Orders Tab */}
                            {activeTab === 'orders' && (
                                <div className="p-0">
                                    <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                                        <h3 className="text-xl font-black text-gray-900">Historial de Pedidos</h3>
                                        <p className="text-sm text-gray-400 font-medium">{orders.length} pedidos realizados</p>
                                    </div>
                                    {orders.length === 0 ? (
                                        <div className="py-20 text-center">
                                            <ShoppingBagIcon className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                                            <p className="text-gray-500 font-medium">Aún no tienes pedidos registrados.</p>
                                            <Link to="/catalog" className="text-blue-600 font-bold text-sm mt-2 inline-block hover:underline">Ver productos →</Link>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-50">
                                            {orders.map((order) => (
                                                <div key={order.order_number} className="p-6 hover:bg-gray-50/50 transition-colors group">
                                                    <div className="flex flex-wrap justify-between items-center gap-4">
                                                        <div className="flex items-start gap-4">
                                                            <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
                                                                <CheckCircleIcon className="h-6 w-6" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="font-black text-gray-900">{order.order_number}</span>
                                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(order.status)}`}>
                                                                        {formatStatus(order.status)}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-500 mt-1">Realizado el {new Date(order.date).toLocaleDateString()}</p>
                                                                <div className="flex gap-1 mt-3 overflow-x-auto max-w-[200px] no-scrollbar">
                                                                    {order.items?.map((item, i) => (
                                                                        <span key={i} className="flex-shrink-0 text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                                                                            {item.product_sku}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-2xl font-black text-gray-900 leading-none">S/ {order.total_amount?.toFixed(2)}</p>
                                                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">Pago Total</p>
                                                            <button
                                                                onClick={() => handleViewDetail(order)}
                                                                className="text-xs text-blue-600 font-bold mt-3 hover:text-blue-800 flex items-center justify-end gap-1 ml-auto"
                                                            >
                                                                Ver detalles <ArrowRightIcon className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowDetailModal(false)}></div>
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-8 sm:p-10">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-2xl font-black text-gray-900">
                                            {selectedItem.quote_number ? 'Detalle de Cotización' : 'Detalle de Pedido'}
                                        </h2>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(selectedItem.status)}`}>
                                            {formatStatus(selectedItem.status)}
                                        </span>
                                    </div>
                                    <p className="text-gray-500 font-medium">#{selectedItem.quote_number || selectedItem.order_number} • {new Date(selectedItem.date).toLocaleDateString()}</p>
                                </div>
                                <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <XCircleIcon className="h-8 w-8 text-gray-400" />
                                </button>
                            </div>

                            <div className="bg-gray-50 rounded-3xl p-6 mb-8">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Productos</p>
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {selectedItem.items?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black text-sm">
                                                    {item.quantity}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm leading-tight">{item.product_name || item.product_sku}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">{item.product_sku}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-gray-900">S/ {(item.unit_price * item.quantity).toFixed(2)}</p>
                                                <p className="text-[10px] text-gray-400">S/ {item.unit_price.toFixed(2)} c/u</p>
                                            </div>

                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total del Documento</p>
                                    <p className="text-4xl font-black text-blue-600 mt-1">S/ {selectedItem.total_amount?.toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500 font-medium max-w-[200px] leading-tight">
                                        {selectedItem.quote_number
                                            ? "Este documento es una proforma y no representa un compromiso de pago hasta ser procesada."
                                            : "Pedido oficial registrado en nuestro sistema de ventas."}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-900 p-6 flex justify-center">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-2xl font-black text-sm transition-all border border-white/10"
                            >
                                CERRAR DETALLES
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
