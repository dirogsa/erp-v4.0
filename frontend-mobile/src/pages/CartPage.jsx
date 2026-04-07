import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
    TrashIcon,
    ShoppingCartIcon,
    DocumentTextIcon,
    ExclamationCircleIcon,
    CheckCircleIcon,
    ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { Link, useNavigate } from 'react-router-dom';
import { shopService } from '../services/api';
import { generateQuotationPDF } from '../utils/generateQuotationPDF';

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
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [orderNumber, setOrderNumber] = useState('');
    const [orderedItems, setOrderedItems] = useState([]);

    const handleCheckout = async () => {
        if (!user) {
            alert("Debes iniciar sesión para generar una cotización oficial.");
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
            alert("Error al procesar el pedido. Revisa tu conexión.");
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

                <main className="flex-1 overflow-y-auto space-y-6">
                    <div className="bg-brand-surface p-6 rounded-[2.5rem] border border-brand-border shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl"></div>
                        
                        <h3 className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-4 border-b border-brand-border/50 pb-3">Resumen de Operación</h3>
                        
                        <div className="space-y-3 mb-6">
                            {orderedItems.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[11px] font-bold">
                                    <span className="text-brand-muted truncate max-w-[180px]">{item.quantity}x {item.name}</span>
                                    <span className="text-white">S/ {(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between items-end pt-4 border-t border-brand-border/50">
                            <div>
                                <p className="text-[8px] font-black text-brand-muted uppercase tracking-widest mb-1">Monto de Cotización</p>
                                <div className="text-3xl font-black text-white tracking-tighter">S/ {orderedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)}</div>
                            </div>
                            <div className="bg-brand-bg px-3 py-1.5 rounded-lg border border-brand-border text-[9px] font-black text-brand-primary uppercase">PEN / SOLES</div>
                        </div>
                    </div>

                    <div className="bg-brand-primary/5 border border-brand-primary/20 p-5 rounded-3xl">
                        <p className="text-[10px] text-brand-text font-bold uppercase tracking-widest leading-relaxed text-center italic">
                            "Para el PDF oficial diríjase a Mis Pedidos. Puede notificar ahora por WhatsApp."
                        </p>
                    </div>

                    {/* WhatsApp Actions */}
                    <div className="space-y-3">
                        <p className="text-[9px] font-black text-brand-muted uppercase tracking-widest text-center">Compartir por WhatsApp</p>
                        <div className="grid grid-cols-2 gap-3">
                            {/* Option 1: Share PDF File via native share */}
                            <button
                                onClick={() => {
                                    const total = orderedItems.reduce((a, i) => a + (i.price * i.quantity), 0).toFixed(2);
                                    generateQuotationPDF(
                                        { quote_number: orderNumber, customer_name: user.full_name, customer_ruc: user.ruc_linked },
                                        orderedItems,
                                        'share'
                                    );
                                }}
                                className="flex flex-col items-center justify-center gap-2 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] py-4 rounded-3xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all"
                            >
                                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                Enviar PDF
                            </button>
                            {/* Option 2: Send text summary link */}
                            <a
                                href={buildWhatsAppLink(
                                    orderNumber,
                                    orderedItems,
                                    orderedItems.reduce((a, i) => a + (i.price * i.quantity), 0).toFixed(2)
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center justify-center gap-2 bg-[#128C7E]/10 border border-[#128C7E]/30 text-[#128C7E] py-4 rounded-3xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all"
                            >
                                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                Enviar Resumen
                            </a>
                        </div>
                    </div>
                </main>

                <footer className="pt-6 space-y-3">
                    <button 
                        onClick={() => navigate('/orders')}
                        className="w-full bg-brand-primary text-brand-bg py-5 rounded-[1.25rem] font-black text-sm uppercase shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <ClipboardDocumentListIcon className="h-5 w-5" /> Ver Mis Pedidos
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
            <header className="bg-brand-bg/90 backdrop-blur-xl px-6 pt-12 pb-6 border-b border-brand-border/50 shadow-sm sticky top-0 z-50">
                <h1 className="text-2xl font-black text-brand-text leading-tight">Mi Pedido</h1>
                <div className="flex items-center gap-2 mt-1">
                    <span className="h-2 w-2 bg-brand-primary rounded-full animate-pulse"></span>
                    <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">
                        {cart.length} {cart.length === 1 ? 'Producto' : 'Productos'} en el carrito
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
                            {cart.map(item => (
                                <div key={item.sku} className="bg-brand-surface p-4 rounded-3xl border border-brand-border shadow-[0_8px_20px_rgba(0,0,0,0.2)] flex items-center gap-4 transition-all hover:border-brand-primary/30">
                                    <div className="h-20 w-20 bg-brand-bg rounded-2xl overflow-hidden border border-brand-border flex-shrink-0 relative shadow-inner">
                                        <div className="absolute inset-0 bg-gradient-to-t from-brand-bg/50 to-transparent z-10 pointer-events-none"></div>
                                        <img src={item.image_url || 'https://via.placeholder.com/100'} alt={item.name} className="w-full h-full object-cover relative z-0 p-1" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="text-[11px] font-black text-brand-text truncate pr-4 uppercase leading-none">{item.name}</h3>
                                            <button
                                                onClick={() => removeFromCart(item.sku)}
                                                className="text-brand-muted hover:text-red-500 active:scale-90 transition-all p-1"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <p className="text-[9px] font-bold text-brand-muted uppercase tracking-widest mb-3">{item.sku}</p>
                                        <div className="flex justify-between items-center">
                                            {item.type === 'MARKETING' ? (
                                                <span className="text-xs font-black text-amber-500 uppercase italic">{item.points_cost} pts</span>
                                            ) : (
                                                <span className="text-sm font-black text-white tracking-tight">S/ {item.price?.toFixed(2)}</span>
                                            )}

                                            <div className="flex items-center gap-4 bg-brand-bg px-2 py-1.5 rounded-xl border border-brand-border/50">
                                                <button onClick={() => updateQuantity(item.sku, Math.max(1, item.quantity - 1))} className="text-brand-muted font-black px-1 active:text-brand-primary transition-colors">－</button>
                                                <span className="text-xs font-black text-white w-4 text-center">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.sku, item.quantity + 1)} className="text-brand-muted font-black px-1 active:text-brand-primary transition-colors">＋</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Link to="/catalog" className="w-full bg-brand-surface/30 border border-brand-border border-dashed text-brand-muted p-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-brand-surface active:bg-brand-surface transition-all tracking-widest mt-4">
                            ＋ Continuar agregando productos
                        </Link>

                        <div className="bg-brand-surface p-6 rounded-[2.5rem] mt-8 shadow-[0_-5px_30px_rgba(0,0,0,0.5)] border border-brand-border relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative z-10">
                                <h3 className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-6 pb-4 border-b border-brand-border/50">Resumen de Cotización</h3>

                                <div className="space-y-3 mb-8">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-brand-muted font-bold tracking-tight">Subtotal Comercial</span>
                                        <span className="text-sm text-brand-text font-black tracking-tight">S/ {cartTotal.toFixed(2)}</span>
                                    </div>
                                    {cartPointsCost > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest">Canje de Regalos</span>
                                            <span className="text-xs font-black text-amber-500 tracking-tight">{cartPointsCost} pts</span>
                                        </div>
                                    )}
                                </div>

                                {user && user.loyalty_points < cartPointsCost && (
                                    <div className="bg-red-500/5 p-3 rounded-2xl flex items-center gap-3 mb-6 border border-red-500/20">
                                        <ExclamationCircleIcon className="h-5 w-5 text-red-500 shrink-0" />
                                        <p className="text-[9px] text-red-400 font-bold uppercase tracking-widest">Puntos insuficientes.</p>
                                    </div>
                                )}

                                <div className="flex justify-between items-end mb-8">
                                    <div>
                                        <p className="text-[9px] font-black text-brand-muted uppercase tracking-widest mb-1">Total Proyectado</p>
                                        <div className="text-4xl font-black text-brand-primary leading-none tracking-tighter drop-shadow-md">S/ {cartTotal.toFixed(2)}</div>
                                    </div>
                                    <div className="h-12 w-12 bg-brand-bg rounded-2xl flex items-center justify-center border border-brand-border shadow-inner">
                                        <DocumentTextIcon className="h-6 w-6 text-brand-text/50" />
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
