import React, { useState, useEffect } from 'react';
import { shopService } from '../services/api';
import { ShoppingBagIcon, ChevronRightIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await shopService.getOrders();
                setOrders(response.data);
            } catch (error) {
                console.error("Error fetching orders", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING':
                return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-100"><ClockIcon className="h-3.5 w-3.5" /> Pendiente</span>;
            case 'INVOICED':
                return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100"><CheckCircleIcon className="h-3.5 w-3.5" /> Facturado</span>;
            case 'CANCELLED':
                return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100"><XCircleIcon className="h-3.5 w-3.5" /> Anulado</span>;
            default:
                return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-100">{status}</span>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-24 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 bg-gray-50">
            <div className="max-w-4xl mx-auto px-4">
                <div className="mb-8">
                    <nav className="flex mb-4" aria-label="Breadcrumb">
                        <ol className="flex items-center space-x-2 text-sm text-gray-500">
                            <li><Link to="/profile" className="hover:text-blue-600 transition-colors">Mi Perfil</Link></li>
                            <li><ChevronRightIcon className="h-4 w-4" /></li>
                            <li className="text-gray-900 font-medium">Mis Pedidos</li>
                        </ol>
                    </nav>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <ShoppingBagIcon className="h-8 w-8 text-blue-600" />
                        Historial de Pedidos
                    </h1>
                    <p className="text-gray-500 mt-2">Consulta el estado y detalle de todas tus compras.</p>
                </div>

                {orders.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
                        <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                            <ShoppingBagIcon className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Aún no tienes pedidos</h3>
                        <p className="text-gray-500 mt-2 mb-6">Cuando realices tu primera compra, aparecerá aquí.</p>
                        <Link to="/catalog" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200">
                            Empezar a comprar
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div key={order.order_number} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">N° {order.order_number}</span>
                                            {getStatusBadge(order.status)}
                                        </div>
                                        <p className="text-sm text-gray-500">{new Date(order.date).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">Total</p>
                                        <p className="text-xl font-black text-gray-900">S/ {order.total_amount?.toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="border-t border-gray-50 pt-4 mt-4 overflow-x-auto">
                                    <div className="flex gap-4">
                                        {order.items?.map((item, idx) => (
                                            <div key={idx} className="flex-shrink-0 flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2">
                                                <div className="bg-white rounded-lg p-1 border border-gray-100">
                                                    <div className="w-8 h-8 rounded flex items-center justify-center bg-blue-50 text-blue-600 font-bold text-xs">
                                                        {item.quantity}
                                                    </div>
                                                </div>
                                                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">{item.product_sku}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrdersPage;
