import React from 'react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { TrashIcon, ShoppingBagIcon, ArrowLeftIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';

const CartPage = () => {
    const { cart, removeFromCart, updateQuantity, cartTotal, cartPointsTotal, cartCount, getItemPrice } = useCart();

    if (cart.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-32 text-center">
                <div className="bg-slate-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
                    <ShoppingBagIcon className="h-12 w-12 text-slate-400" />
                </div>
                <h2 className="text-4xl font-black text-slate-900 mb-4">Tu carrito está vacío</h2>
                <p className="text-slate-500 text-lg mb-10">¡Parece que aún no has añadido nada al carrito!</p>
                <Link to="/catalog" className="bg-primary-600 text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-primary-500 transition-all shadow-xl">
                    EXPLORAR CATÁLOGO
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-16">
            <h1 className="text-5xl font-black text-slate-900 mb-12 tracking-tighter">Tu Carrito</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 items-start">
                {/* Items List */}
                <div className="lg:col-span-2 space-y-6">
                    {cart.map((item) => (
                        <div key={item.sku} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-8 relative hover:shadow-md transition-all">
                            <div className="w-32 h-32 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0">
                                <img src={item.image_url || 'https://via.placeholder.com/200'} alt={item.name} className="w-full h-full object-cover" />
                            </div>

                            <div className="flex-grow text-center md:text-left">
                                <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{item.brand}</span>
                                <h3 className="text-xl font-bold text-slate-800 mb-1">{item.name}</h3>
                                <p className="text-slate-400 font-mono text-xs">SKU: {item.sku}</p>
                            </div>

                            <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                                <button
                                    onClick={() => updateQuantity(item.sku, item.quantity - 1)}
                                    className="p-2 bg-white rounded-xl shadow-sm hover:text-primary-600 transition-colors"
                                >
                                    <MinusIcon className="h-5 w-5" />
                                </button>
                                <span className="font-black text-xl w-8 text-center">{item.quantity}</span>
                                <button
                                    onClick={() => updateQuantity(item.sku, item.quantity + 1)}
                                    className="p-2 bg-white rounded-xl shadow-sm hover:text-primary-600 transition-colors"
                                >
                                    <PlusIcon className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="text-right flex flex-col items-end min-w-[150px]">
                                {getItemPrice(item) < item.price && (
                                    <span className="text-xs text-slate-400 line-through">
                                        S/ {(item.price * item.quantity).toFixed(2)}
                                    </span>
                                )}
                                <div className="text-2xl font-black text-slate-900">
                                    {item.points_cost > 0 ? (
                                        <span className="text-amber-500">
                                            🎁 {(item.points_cost * item.quantity)} pts
                                        </span>
                                    ) : (
                                        `S/ ${(getItemPrice(item) * item.quantity).toFixed(2)}`
                                    )}
                                </div>
                                {getItemPrice(item) < item.price && (
                                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
                                        ¡Ahorraste S/ {((item.price - getItemPrice(item)) * item.quantity).toFixed(2)}!
                                    </span>
                                )}
                            </div>

                            <button
                                onClick={() => removeFromCart(item.sku)}
                                className="absolute top-4 right-4 md:static p-3 text-slate-300 hover:text-rose-600 transition-colors"
                            >
                                <TrashIcon className="h-6 w-6" />
                            </button>
                        </div>
                    ))}

                    <Link to="/catalog" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-600 font-bold mt-4 transition-colors">
                        <ArrowLeftIcon className="h-5 w-5" /> Continuar Comprando
                    </Link>
                </div>

                {/* Summary Side */}
                <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden sticky top-32">
                    <h3 className="text-2xl font-black mb-8">Resumen</h3>

                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between text-slate-400 font-bold uppercase tracking-widest text-xs">
                            <span>Subtotal ({cartCount} prod.)</span>
                            <span>S/ {cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400 font-bold uppercase tracking-widest text-xs">
                            <span>Envío</span>
                            <span className="text-emerald-400">Gratis</span>
                        </div>
                        <div className="border-t border-slate-800 pt-4 flex justify-between items-end">
                            <span className="text-lg font-bold">Total</span>
                            <div className="text-right">
                                {cartTotal > 0 && (
                                    <div className="text-4xl font-black text-primary-500">S/ {cartTotal.toFixed(2)}</div>
                                )}
                                {cartPointsTotal > 0 && (
                                    <div className="text-2xl font-black text-amber-500 mt-1">
                                        + {cartPointsTotal} pts
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <Link
                        to="/checkout"
                        className="w-full bg-primary-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-primary-500 transition-all shadow-xl shadow-primary-600/20 active:scale-[0.98] mb-4 flex items-center justify-center"
                    >
                        FINALIZAR COMPRA
                    </Link>
                    <p className="text-center text-slate-500 text-xs">
                        Impuestos y cargos de envío calculados al finalizar la compra.
                    </p>

                    {/* Decorative element */}
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary-500 opacity-10 rounded-full translate-y-1/2 translate-x-1/2"></div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
