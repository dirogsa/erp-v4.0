import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { shopService } from '../services/api';
import {
    CheckCircleIcon,
    TruckIcon,
    CreditCardIcon,
    UserIcon,
    IdentificationIcon,
    MapPinIcon,
    ArrowLeftIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';

const CheckoutPage = () => {
    const { cart, cartTotal, cartPointsTotal, clearCart, getItemPrice } = useCart();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        customer_name: '',
        customer_ruc: '',
        delivery_address: '',
        delivery_branch_name: '',
        notes: ''
    });

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [orderInfo, setOrderInfo] = useState(null);
    const [checkoutSummary, setCheckoutSummary] = useState({ items: [], total: 0 });

    useEffect(() => {
        if (isAuthenticated && user) {
            setFormData(prev => ({
                ...prev,
                customer_name: user.full_name || '',
                customer_ruc: user.ruc_linked || '',
                delivery_address: user.address || ''
            }));
        }
    }, [isAuthenticated, user]);

    if (cart.length === 0 && status !== 'success') {
        return (
            <div className="max-w-7xl mx-auto px-4 py-32 text-center">
                <h2 className="text-3xl font-black mb-4">No hay productos para procesar</h2>
                <Link to="/catalog" className="text-primary-600 font-bold hover:underline">Volver al catálogo</Link>
            </div>
        );
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate points
        if (cartPointsTotal > (user?.loyalty_points || 0)) {
            alert(`No tienes suficientes puntos. Necesitas ${cartPointsTotal} pero tienes ${user?.loyalty_points || 0}.`);
            return;
        }

        setLoading(true);
        try {
            const orderData = {
                ...formData,
                items: cart.map(item => ({ sku: item.sku, quantity: item.quantity }))
            };
            const response = await shopService.checkout(orderData);
            setOrderInfo(response.data);
            setCheckoutSummary({
                items: [...cart],
                total: cartTotal,
                points: cartPointsTotal
            });
            setStatus('success');
            clearCart();
        } catch (error) {
            console.error("Error creating order", error);
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'success') {
        return (
            <div className="max-w-3xl mx-auto px-4 py-20 text-center animate-in fade-in zoom-in duration-500">
                <div className="bg-emerald-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
                    <CheckCircleIcon className="h-16 w-16 text-emerald-600" />
                </div>
                <h1 className="text-4xl font-black text-slate-900 mb-4">¡Cotización Enviada!</h1>
                <p className="text-slate-500 text-lg mb-8">
                    Tu solicitud de cotización <span className="font-black text-slate-900">#{orderInfo?.quote_number}</span> ha sido recibida correctamente.
                </p>
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl mb-10 text-left">
                    <div className="mb-6 pb-6 border-b border-slate-50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Resumen de Cotización</p>
                        <div className="space-y-3">
                            {checkoutSummary.items.map((item) => (
                                <div key={item.sku} className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600 font-medium">
                                        {item.name} <span className="text-slate-400 font-bold ml-2">x{item.quantity}</span>
                                    </span>
                                    {item.points_cost > 0 ? (
                                        <span className="font-bold text-amber-500">🎁 {item.points_cost * item.quantity} pts</span>
                                    ) : (
                                        <span className="font-bold text-slate-900">S/ {(getItemPrice(item) * item.quantity).toFixed(2)}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Total Estimado</span>
                        <div className="text-right">
                            <span className="block text-3xl font-black text-primary-600">S/ {checkoutSummary.total.toFixed(2)}</span>
                            {checkoutSummary.points > 0 && (
                                <span className="block text-xl font-black text-amber-500">+ {checkoutSummary.points} pts</span>
                            )}
                        </div>
                    </div>
                    <p className="text-slate-500 text-sm italic">
                        Un asesor de **DIROGSA** revisará tu pedido pronto. Puedes hacer seguimiento desde tu panel de cliente.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/profile"
                        className="bg-primary-600 text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-primary-500 transition-all shadow-xl shadow-primary-500/20"
                    >
                        VER MI PANEL
                    </Link>
                    <Link
                        to="/catalog"
                        className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl"
                    >
                        SEGUIR COMPRANDO
                    </Link>
                </div>

            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="flex items-center gap-4 mb-12">
                <Link to="/cart" className="p-3 bg-white rounded-2xl shadow-sm hover:text-primary-600 transition-all">
                    <ArrowLeftIcon className="h-6 w-6" />
                </Link>
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Enviar Cotización</h1>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                {/* Left Side: Forms */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Customer Info */}
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="bg-primary-50 p-3 rounded-2xl text-primary-600">
                                <UserIcon className="h-6 w-6" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900">Información del Cliente</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-slate-400 ml-2">Nombre o Razón Social</label>
                                <div className="relative">
                                    <IdentificationIcon className="absolute left-4 top-4 h-5 w-5 text-slate-300" />
                                    <input
                                        required
                                        name="customer_name"
                                        value={formData.customer_name}
                                        onChange={handleChange}
                                        placeholder="Juan Pérez o Empresa S.A.C"
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-slate-400 ml-2">RUC o DNI</label>
                                <div className="relative">
                                    <IdentificationIcon className="absolute left-4 top-4 h-5 w-5 text-slate-300" />
                                    <input
                                        required
                                        name="customer_ruc"
                                        value={formData.customer_ruc}
                                        onChange={handleChange}
                                        placeholder="Número de identidad"
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Delivery Info */}
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="bg-primary-50 p-3 rounded-2xl text-primary-600">
                                <TruckIcon className="h-6 w-6" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900">Entrega</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-slate-400 ml-2">Dirección de Envío</label>
                                <div className="relative">
                                    <MapPinIcon className="absolute left-4 top-4 h-5 w-5 text-slate-300" />
                                    <input
                                        required
                                        name="delivery_address"
                                        value={formData.delivery_address}
                                        onChange={handleChange}
                                        placeholder="Av. Las Magnolias 123, Ate"
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-slate-400 ml-2">Notas Adicionales (Opcional)</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    placeholder="Instrucciones especiales para el pedido..."
                                    rows="3"
                                    className="w-full p-6 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Summary & Action */}
                <div className="space-y-8">
                    <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                        <h3 className="text-2xl font-black mb-10">Tu Pedido</h3>

                        <div className="space-y-4 mb-10 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                            {cart.map((item) => {
                                const unitPrice = getItemPrice(item);
                                const isDiscounted = unitPrice < item.price;
                                return (
                                    <div key={item.sku} className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-grow">
                                                <h4 className="font-bold text-sm line-clamp-2">{item.name}</h4>
                                                <p className="text-[10px] text-slate-400 font-mono mt-1">{item.sku}</p>
                                            </div>
                                            <div className="text-right">
                                                {item.points_cost > 0 ? (
                                                    <div className="font-black text-amber-500">🎁 {item.points_cost * item.quantity} pts</div>
                                                ) : (
                                                    <>
                                                        <div className="font-black text-primary-500">S/ {(unitPrice * item.quantity).toFixed(2)}</div>
                                                        {isDiscounted && (
                                                            <div className="text-[10px] text-slate-500 line-through">S/ {(item.price * item.quantity).toFixed(2)}</div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                            <span className="text-[10px] font-black text-slate-500 uppercase">Cantidad: {item.quantity}</span>
                                            {item.points_cost > 0 ? (
                                                <span className="text-[10px] font-bold text-slate-400">P.U. {item.points_cost} pts</span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-400">P.U. S/ {unitPrice.toFixed(2)}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="space-y-3 mb-10 pt-6 border-t border-white/10">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Total Final</span>
                                <div className="text-right">
                                    <span className="block text-4xl font-black text-primary-500">S/ {cartTotal.toFixed(2)}</span>
                                    {cartPointsTotal > 0 && (
                                        <span className="block text-2xl font-black text-amber-500">+ {cartPointsTotal} pts</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-6 rounded-[2rem] font-black text-xl transition-all shadow-2xl flex items-center justify-center gap-3 ${loading
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-primary-600 text-white hover:bg-primary-500 shadow-primary-600/30'
                                }`}
                        >
                            {loading ? 'PROCESANDO...' : 'ENVIAR COTIZACIÓN'}
                        </button>

                        <div className="mt-8 flex items-center justify-center gap-2 text-slate-500">
                            <ShieldCheckIcon className="h-5 w-5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Compra Segura</span>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CheckoutPage;
