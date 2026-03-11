import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
    TrashIcon,
    ShoppingCartIcon,
    DocumentTextIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { Link, useNavigate } from 'react-router-dom';
import { shopService } from '../services/api';

const CartPage = () => {
    const { cart, removeFromCart, updateQuantity, cartTotal, cartPointsCost, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        setLoading(true);
        try {
            const orderData = {
                items: cart.map(item => ({
                    sku: item.sku,
                    quantity: item.quantity
                })),
                customer_name: user?.full_name || 'Cliente App',
                customer_ruc: user?.ruc_linked || '',
                delivery_address: 'RECOJO EN TIENDA',
                notes: 'Generado desde App Móvil'
            };

            await shopService.checkout(orderData);
            alert("¡Cotización generada con éxito!");
            clearCart();
            navigate('/');
        } catch (error) {
            console.error("Checkout error", error);
            alert("Error al procesar el pedido. Revisa tu conexión.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen pb-32">
            <header className="bg-white px-6 pt-12 pb-6 border-b border-slate-100 shadow-sm sticky top-0 z-50">
                <h1 className="text-2xl font-black text-slate-900 leading-tight">Mi Pedido</h1>
                <div className="flex items-center gap-2 mt-1">
                    <span className="h-2 w-2 bg-primary-500 rounded-full animate-pulse"></span>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {cart.length} {cart.length === 1 ? 'Producto' : 'Productos'} en el carrito
                    </p>
                </div>
            </header>

            <div className="p-6 space-y-4">
                {cart.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 px-6">
                        <div className="h-24 w-24 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingCartIcon className="h-12 w-12" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Tu pedido está vacío</h3>
                        <p className="text-sm text-slate-500 mb-10 leading-relaxed text-balance">Parece que aún no has seleccionado ningún filtro para tu cotización.</p>
                        <Link to="/catalog" className="inline-block bg-primary-600 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase shadow-2xl shadow-primary-200 active:scale-95 transition-all">
                            Ir al Catálogo
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3">
                            {cart.map(item => (
                                <div key={item.sku} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                                    <div className="h-16 w-16 bg-slate-50 rounded-2xl overflow-hidden border border-slate-50 flex-shrink-0">
                                        <img src={item.image_url || 'https://via.placeholder.com/100'} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="text-[11px] font-black text-slate-900 truncate pr-4 uppercase leading-none">{item.name}</h3>
                                            <button
                                                onClick={() => removeFromCart(item.sku)}
                                                className="text-slate-300 hover:text-red-500 transition-all"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">{item.sku}</p>
                                        <div className="flex justify-between items-center">
                                            {item.type === 'MARKETING' ? (
                                                <span className="text-xs font-black text-amber-600 uppercase italic">{item.points_cost} pts</span>
                                            ) : (
                                                <span className="text-sm font-black text-slate-900 tracking-tight">S/ {item.price?.toFixed(2)}</span>
                                            )}

                                            <div className="flex items-center gap-3 bg-slate-50 px-2 py-1 rounded-xl border border-slate-100">
                                                <button onClick={() => updateQuantity(item.sku, Math.max(1, item.quantity - 1))} className="text-slate-400 font-black px-1 active:text-primary-600">－</button>
                                                <span className="text-xs font-black text-slate-900 w-4 text-center">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.sku, item.quantity + 1)} className="text-slate-400 font-black px-1 active:text-primary-600">＋</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Link to="/catalog" className="w-full bg-white border-2 border-slate-200 text-slate-500 p-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 active:bg-slate-50 transition-all tracking-widest">
                            ＋ Continuar agregando productos
                        </Link>

                        <div className="bg-slate-900 p-6 rounded-[2.5rem] mt-8 shadow-2xl shadow-slate-900/10 relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 pb-4 border-b border-white/5">Resumen de Cotización</h3>

                                <div className="space-y-3 mb-8">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-400 font-medium tracking-tight">Subtotal Comercial</span>
                                        <span className="text-sm text-white font-bold tracking-tight">S/ {cartTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Canje de Regalos</span>
                                        <span className="text-xs font-black text-amber-400 tracking-tight">{cartPointsCost} pts</span>
                                    </div>
                                </div>

                                {user && user.loyalty_points < cartPointsCost && (
                                    <div className="bg-red-500/10 p-3 rounded-2xl flex items-center gap-3 mb-6 border border-red-500/20">
                                        <ExclamationCircleIcon className="h-5 w-5 text-red-500 shrink-0" />
                                        <p className="text-[9px] text-red-400 font-bold uppercase tracking-tight">No tienes suficientes puntos para estos premios.</p>
                                    </div>
                                )}

                                <div className="flex justify-between items-end mb-8">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Proyectado</p>
                                        <div className="text-3xl font-black text-white leading-none tracking-tight">S/ {cartTotal.toFixed(2)}</div>
                                    </div>
                                    <div className="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
                                        <DocumentTextIcon className="h-6 w-6 text-primary-500" />
                                    </div>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    disabled={loading || cart.length === 0}
                                    className="w-full bg-primary-600 hover:bg-primary-700 text-white p-5 rounded-2xl font-black text-sm uppercase shadow-2xl shadow-primary-900/50 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span className="text-xl">📋</span>
                                            GENERAR COTIZACION
                                        </>
                                    )}
                                </button>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CartPage;
