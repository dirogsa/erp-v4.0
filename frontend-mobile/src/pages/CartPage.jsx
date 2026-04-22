import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
    TrashIcon,
    ShoppingCartIcon,
    DocumentTextIcon,
    ExclamationCircleIcon,
    CheckCircleIcon,
    ClipboardDocumentListIcon,
    ChevronLeftIcon
} from '@heroicons/react/24/outline';
import { Link, useNavigate } from 'react-router-dom';
import { shopService } from '../services/api';
import { generateQuotationPDF } from '../utils/generateQuotationPDF';
import { useNotifications } from '../context/NotificationContext';

// Build a WhatsApp text link for a quick summary notification
const buildWhatsAppLink = (orderNo, items, total) => {
    const lines = items.map(i => `  • ${i.quantity}x ${i.name} → S/ ${(i.price * i.quantity).toFixed(2)}`).join('%0A');
    const msg = `🧾 *COTIZACIÓN DIROGSA*%0A%0ANro: *${orderNo}*%0A%0ADetalle:%0A${lines}%0A%0A💰 *TOTAL: S/ ${total}*%0A%0A_Generado desde DIROGSA Mobile_`;
    return `https://wa.me/?text=${msg}`;
};

const CartPage = () => {
    const { cart, removeFromCart, updateQuantity, cartTotal, cartPointsCost, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotifications();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [orderNumber, setOrderNumber] = useState('');
    const [orderedItems, setOrderedItems] = useState([]);

    const handleCheckout = async () => {
        if (!user) {
            showNotification({
                type: 'warning',
                title: 'Inicio de Sesión Requerido',
                message: 'Debes iniciar sesión para generar una cotización oficial.'
            });
            navigate('/login', { state: { from: '/cart' } });
            return;
        }

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

            const res = await shopService.checkout(orderData);
            setOrderNumber(res.data.number || '0001');
            setOrderedItems([...cart]); // GUARDAR SNAPSHOT ANTES DE LIMPIAR
            setSuccess(true);
            clearCart();
        } catch (error) {
            console.error("Checkout error", error);
            showNotification({
                type: 'error',
                title: 'Error de Red',
                message: 'No se pudo procesar el pedido. Revisa tu conexión e intenta de nuevo.'
            });
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="bg-brand-bg min-h-screen flex flex-col p-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
                <header className="py-8 flex flex-col items-center">
                    <div className="h-20 w-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/10">
                        <CheckCircleIcon className="h-10 w-10" />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Pedido Registrado</h2>
                    <p className="text-brand-primary font-black text-sm tracking-widest mt-1">Nro: {orderNumber}</p>
                </header>

                <main className="flex-1 overflow-y-auto space-y-8">
                    <div className="glass-card p-8 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl"></div>
                        
                        <h3 className="text-brand-metadata mb-6 border-b border-white/5 pb-4">Resumen de Operación</h3>
                        
                        <div className="space-y-4 mb-8">
                            {orderedItems.map((item, idx) => {
                                let multiplier = 1;
                                if (item.quantity >= 12) multiplier = 0.85;
                                else if (item.quantity >= 6) multiplier = 0.90;
                                else if (item.quantity >= 3) multiplier = 0.95;
                                const itemFinalPrice = item.price * multiplier;

                                return (
                                    <div key={idx} className="flex justify-between items-center text-brand-sm font-bold">
                                        <span className="text-brand-text-dim truncate max-w-[200px]">{item.quantity}x {item.name}</span>
                                        <span className="text-white">S/ {(itemFinalPrice * item.quantity).toFixed(2)}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex justify-between items-end pt-6 border-t border-white/10">
                            <div>
                                <p className="text-brand-metadata mb-2">Monto de Cotización</p>
                                <div className="text-brand-2xl font-black text-white tracking-tighter drop-shadow-md">S/ {cartTotal.toFixed(2)}</div>
                            </div>
                            <div className="bg-brand-bg px-4 py-2 rounded-xl border border-white/10 text-brand-xs font-black text-brand-primary uppercase shadow-inner">PEN / SOLES</div>
                        </div>
                    </div>

                    <div className="bg-brand-primary/5 border border-brand-primary/20 p-5 rounded-3xl">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">📄</span>
                            <p className="text-[10px] text-brand-text font-bold uppercase tracking-widest leading-relaxed">
                                Para enviar la cotización oficial en PDF al WhatsApp, ingrese a <span className="text-brand-primary">Mis Pedidos</span> donde el recibo ya estará guardado con su número definitivo.
                            </p>
                        </div>
                    </div>
                </main>

                <footer className="pt-6 space-y-3">
                    <button 
                        onClick={() => navigate('/orders')}
                        className="w-full bg-brand-primary text-brand-bg py-5 rounded-[1.25rem] font-black text-sm uppercase shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <ClipboardDocumentListIcon className="h-5 w-5" /> Ir a Mis Pedidos
                    </button>
                    <button 
                        onClick={() => navigate('/')} 
                        className="w-full text-brand-muted font-black text-[10px] uppercase tracking-widest py-3 hover:text-brand-primary transition-colors text-center"
                    >
                        Volver al Inicio
                    </button>
                </footer>
            </div>
        );
    }

    return (
        <div className="bg-brand-bg min-h-screen pb-32 text-brand-text selection:bg-brand-primary/30">
            <header className="glass-card px-6 pt-12 pb-6 border-b border-white/5 shadow-xl sticky top-0 z-50">
                <div className="flex items-center gap-4 mb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="h-10 w-10 bg-brand-surface rounded-xl flex items-center justify-center text-brand-text border border-white/5 active:scale-90 transition-all shadow-lg"
                    >
                        <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    <h1 className="text-brand-xl font-black text-white leading-tight uppercase tracking-tighter">Mi Pedido</h1>
                </div>
                <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 bg-brand-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                    <p className="text-brand-metadata">
                        {cart.length} {cart.length === 1 ? 'Producto' : 'Productos'} detectados
                    </p>
                </div>
            </header>

            <div className="p-6 space-y-4">
                {cart.length === 0 ? (
                    <div className="text-center py-20 bg-brand-surface rounded-[2.5rem] border border-brand-border px-6 shadow-inner">
                        <div className="h-24 w-24 bg-brand-bg border border-brand-border text-brand-muted rounded-full flex items-center justify-center mx-auto mb-6 shadow-[inset_0_4px_20px_rgba(0,0,0,0.5)]">
                            <ShoppingCartIcon className="h-10 w-10" />
                        </div>
                        <h3 className="text-xl font-black text-brand-text mb-2">Tu pedido está vacío</h3>
                        <p className="text-sm text-brand-muted mb-10 leading-relaxed text-balance">Parece que aún no has seleccionado ningún filtro para tu cotización.</p>
                        <Link to="/catalog" className="inline-block bg-brand-primary text-brand-bg px-10 py-4 rounded-2xl font-black text-sm uppercase shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:opacity-90 active:scale-95 transition-all">
                            Ir al Catálogo
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3">
                            {cart.map((item) => (
                                <div key={item.sku} className="bg-brand-surface p-5 rounded-[2rem] border border-white/5 shadow-xl flex items-center gap-5 transition-all hover:border-brand-primary/30">
                                    <div className="h-24 w-24 bg-brand-bg rounded-2xl overflow-hidden border border-white/10 flex-shrink-0 relative shadow-inner">
                                         <div className="absolute inset-0 bg-gradient-to-t from-brand-bg/50 to-transparent z-10 pointer-events-none"></div>
                                         <img src={item.image_url || 'https://via.placeholder.com/100'} alt={item.name} className="w-full h-full object-cover relative z-0 p-2" />
                                     </div>
                                     <div className="flex-1 min-w-0">
                                         <div className="flex justify-between items-start mb-2">
                                             <h3 className="text-brand-sm font-black text-white truncate pr-6 uppercase leading-tight">{item.name}</h3>
                                             <button
                                                 onClick={() => removeFromCart(item.sku)}
                                                 className="text-brand-text-dim hover:text-brand-danger active:scale-90 transition-all p-1"
                                             >
                                                 <TrashIcon className="h-5 w-5" />
                                             </button>
                                         </div>
                                         <p className="text-brand-xs font-bold text-brand-text-muted uppercase tracking-widest mb-2">{item.sku}</p>
                                         
                                         {item.quantity >= 50 && (
                                             <div className="bg-brand-orange/10 border border-brand-orange/30 px-3 py-1.5 rounded-xl mb-4 flex items-center gap-2">
                                                 <span className="h-2 w-2 bg-brand-orange rounded-full animate-pulse"></span>
                                                 <span className="text-[10px] font-black text-brand-orange uppercase tracking-tighter">Precio Sujeto a Cotización Especial (+50u)</span>
                                             </div>
                                         )}

                                         <div className="flex justify-between items-center">
                                             {item.type === 'MARKETING' ? (
                                                 <span className="text-brand-sm font-black text-brand-orange uppercase italic">{item.points_cost} pts</span>
                                             ) : (
                                                 <span className="text-brand-md font-black text-white tracking-tight">S/ {item.price?.toFixed(2)}</span>
                                             )}

                                             <div className="flex items-center gap-6 bg-brand-bg px-4 py-2 rounded-xl border border-white/5 shadow-inner">
                                                 <button onClick={() => updateQuantity(item.sku, Math.max(1, item.quantity - 1))} className="text-brand-text-dim font-black text-brand-lg active:text-brand-primary transition-colors">－</button>
                                                 <span className="text-brand-sm font-black text-white w-6 text-center">{item.quantity}</span>
                                                 <button onClick={() => updateQuantity(item.sku, item.quantity + 1)} className="text-brand-text-dim font-black text-brand-lg active:text-brand-primary transition-colors">＋</button>
                                             </div>
                                         </div>
                                     </div>
                                </div>
                            ))}
                        </div>

                        <Link to="/catalog" className="w-full bg-brand-surface/30 border border-brand-border border-dashed text-brand-muted p-4 rounded-2xl font-black text-brand-xs uppercase flex items-center justify-center gap-2 hover:bg-brand-surface active:bg-brand-surface transition-all tracking-widest mt-4">
                            ＋ Continuar agregando productos
                        </Link>

                        <div className="bg-brand-surface p-6 rounded-[2.5rem] mt-8 shadow-[0_-5px_30px_rgba(0,0,0,0.5)] border border-brand-border relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative z-10">
                                <h3 className="text-brand-metadata mb-8 pb-4 border-b border-white/5">Resumen de Cotización</h3>
 
                                 <div className="space-y-4 mb-10">
                                     <div className="flex justify-between items-center">
                                         <span className="text-brand-sm text-brand-text-dim font-bold">Subtotal Comercial</span>
                                         <span className="text-brand-sm text-white font-black">S/ {cartTotal.toFixed(2)}</span>
                                     </div>
                                     {cartPointsCost > 0 && (
                                         <div className="flex justify-between items-center">
                                             <span className="text-brand-label !text-brand-orange/80">Canje de Regalos</span>
                                             <span className="text-brand-sm font-black text-brand-orange">{cartPointsCost} pts</span>
                                         </div>
                                     )}
                                 </div>
 
                                 {user && user.loyalty_points < cartPointsCost && (
                                     <div className="bg-brand-danger/5 p-4 rounded-2xl flex items-center gap-4 mb-8 border border-brand-danger/20">
                                         <ExclamationCircleIcon className="h-6 w-6 text-brand-danger shrink-0" />
                                         <p className="text-brand-xs text-brand-danger font-black uppercase">Puntos insuficientes.</p>
                                     </div>
                                 )}
 
                                 <div className="flex justify-between items-end mb-10">
                                     <div>
                                         <p className="text-brand-metadata mb-2">Total Proyectado</p>
                                         <div className="text-brand-3xl font-black text-brand-primary leading-none tracking-tighter drop-shadow-2xl shadow-brand-primary/20">S/ {cartTotal.toFixed(2)}</div>
                                     </div>
                                     <div className="h-16 w-16 bg-brand-bg rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                                         <DocumentTextIcon className="h-8 w-8 text-brand-text-dim" />
                                     </div>
                                 </div>

                                <button
                                    onClick={handleCheckout}
                                    disabled={loading || cart.length === 0 || (user && user.loyalty_points < cartPointsCost)}
                                    className="w-full bg-brand-primary text-brand-bg p-5 rounded-[1.25rem] font-black text-sm uppercase shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-all flex items-center justify-center gap-3 active:scale-95 hover:opacity-90 disabled:opacity-30 disabled:scale-100"
                                >
                                    {loading ? (
                                        <div className="h-5 w-5 border-2 border-brand-bg/30 border-t-brand-bg rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            GENERAR COTIZACION
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CartPage;
