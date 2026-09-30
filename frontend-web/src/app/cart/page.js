'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';

export default function QuotePage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, getTotalPrice, getTotalItems, clearCart } = useCartStore();
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [clientData, setClientData] = useState({
    name: '',
    company: '',
    ruc: '',
    phone: '',
    email: '',
    city: '',
    comments: ''
  });

  const { isAuthenticated, user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    setIsSubmitting(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const payload = {
        name: isAuthenticated ? (user?.full_name || user?.name || 'Cliente Mayorista') : clientData.name,
        company: isAuthenticated ? (user?.company_name || 'Empresa Logueada') : clientData.company,
        ruc: clientData.ruc || null,
        phone: clientData.phone || null,
        email: clientData.email || null,
        city: clientData.city || null,
        comments: clientData.comments || null,
        items: items.map(item => ({
          product_sku: item.sku,
          quantity: item.quantity,
          unit_price: item.price || 0,
          brand: item.brand || 'OEM',
          product_name: item.name
        }))
      };

      const headers = { 'Content-Type': 'application/json' };
      if (isAuthenticated && user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const response = await fetch(`${API_URL}/shop/quotes`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error(await response.text());
        throw new Error('Error al conectar con el servidor');
      }

      sessionStorage.setItem('diro_checkout_data', JSON.stringify({
        name: payload.name,
        company: payload.company,
        phone: payload.phone,
        email: payload.email,
        city: payload.city,
        comments: payload.comments,
        is_erp_synced: true
      }));

      router.push('/thank-you');
    } catch (error) {
      console.error("Error procesando checkout:", error);
      setIsSubmitting(false);
      alert("Hubo un problema procesando tu solicitud. Por favor, intenta de nuevo.");
    }
  };

  if (!mounted) return <div className="min-h-[50vh] flex items-center justify-center"><div className="animate-spin h-8 w-8 border-t-2 border-brand-primary rounded-full" /></div>;

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-5 py-20 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#141518] border border-white/5 mb-6 shadow-inner">
          <span className="text-4xl">📋</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">Tu cotización está vacía</h1>
        <p className="text-white/60 mb-10 max-w-md mx-auto text-lg">
          Busca los filtros por código o vehículo y agrégalos aquí para solicitar tus precios.
        </p>
        <Link href="/catalog" className="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-black text-sm uppercase tracking-widest bg-brand-primary text-[#0A0A0B] hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          Explorar Catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-2">
          Mi cotización
        </h1>
        <p className="text-white/60 text-sm md:text-base">
          Revisa los productos y cantidades que deseas solicitar.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Lista de Productos */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <span className="text-xs font-bold text-white/50 uppercase tracking-widest">{getTotalItems()} Productos en lista</span>
            <button onClick={clearCart} className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-widest flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Vaciar Lista
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.sku} className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-[#141518] border border-white/5 items-center hover:border-brand-primary/20 transition-colors">
                <div className="w-20 h-20 rounded-xl bg-white/5 flex items-center justify-center p-2 shrink-0">
                  {item.imageUrl && item.imageUrl !== 'none' ? (
                    <img src={item.imageUrl} alt={item.sku} className="max-w-full max-h-full object-contain drop-shadow-xl" />
                  ) : (
                    <span className="text-2xl opacity-50">📦</span>
                  )}
                </div>
                
                <div className="flex-1 text-center sm:text-left min-w-0">
                  <div className="text-[10px] font-black uppercase text-brand-primary tracking-widest mb-1">{item.brand}</div>
                  <div className="text-lg font-black text-white leading-none mb-1 truncate">{item.sku}</div>
                  <h3 className="text-xs text-white/60 truncate">{item.name}</h3>
                </div>

                <div className="flex flex-col items-center sm:items-end gap-3 mt-2 sm:mt-0">
                  {isAuthenticated && (
                    <div className="text-right hidden sm:block mb-1">
                      <div className="text-sm font-black text-white">{item.currency === 'PEN' ? 'S/' : '$'} {Number(item.price).toFixed(2)}</div>
                      <div className="text-[9px] text-white/40 uppercase">Unidad</div>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-[#0A0A0B] rounded-xl border border-white/10 h-12 px-1">
                      <button onClick={() => updateQuantity(item.sku, Math.max(1, item.quantity - 1))} className="w-10 h-full text-white/50 hover:text-white flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg>
                      </button>
                      <span className="w-10 text-center text-sm font-black text-white">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.sku, item.quantity + 1)} className="w-10 h-full text-white/50 hover:text-white flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                      </button>
                    </div>

                    <button 
                      onClick={() => removeItem(item.sku)} 
                      className="w-10 h-10 flex items-center justify-center rounded-xl text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      title="Eliminar producto"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                  
                  {isAuthenticated && (
                     <div className="text-right mt-1">
                       <div className="text-sm font-black text-brand-primary">{item.currency === 'PEN' ? 'S/' : '$'} {(item.price * item.quantity).toFixed(2)}</div>
                     </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Formulario de Cotización */}
        <div className="lg:col-span-5">
          <form onSubmit={handleCheckout} className="sticky top-24 bg-[#141518] rounded-3xl border border-white/5 p-6 md:p-8 shadow-2xl">
            {isAuthenticated ? (
              <>
                <h2 className="text-xl font-black text-white tracking-tight mb-6 border-b border-white/10 pb-4">Resumen de tu pedido</h2>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm text-white/60">
                    <span>Subtotal ({getTotalItems()} items)</span>
                    <span>S/ {(getTotalPrice() / 1.18).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-white/60">
                    <span>IGV (18%)</span>
                    <span>S/ {(getTotalPrice() - (getTotalPrice() / 1.18)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-2xl font-black text-white pt-4 border-t border-white/10">
                    <span>Total</span>
                    <span className="text-brand-primary">S/ {getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-black text-white tracking-tight mb-2">Solicita tu cotización</h2>
                <p className="text-xs text-white/60 leading-relaxed mb-8">
                  Indícanos los productos y cantidades que necesitas. Revisaremos tu solicitud y te contactaremos con nuestros precios.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" required placeholder="Nombre completo *" value={clientData.name} onChange={e => setClientData({...clientData, name: e.target.value})} className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/40 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all" />
                    <input type="text" required placeholder="WhatsApp / Teléfono *" value={clientData.phone} onChange={e => setClientData({...clientData, phone: e.target.value})} className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/40 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all" />
                  </div>
                  <input type="email" placeholder="Correo electrónico" value={clientData.email} onChange={e => setClientData({...clientData, email: e.target.value})} className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/40 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" required placeholder="Nombre de Empresa *" value={clientData.company} onChange={e => setClientData({...clientData, company: e.target.value})} className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/40 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all" />
                    <input type="text" placeholder="RUC (Opcional)" value={clientData.ruc} onChange={e => setClientData({...clientData, ruc: e.target.value})} className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/40 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all" />
                  </div>
                  <input type="text" placeholder="Ciudad / Provincia" value={clientData.city} onChange={e => setClientData({...clientData, city: e.target.value})} className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/40 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all" />
                  <textarea placeholder="Comentario adicional (Opcional)" value={clientData.comments} onChange={e => setClientData({...clientData, comments: e.target.value})} rows="3" className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/40 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all resize-none"></textarea>
                </div>
              </>
            )}

            <button type="submit" disabled={isSubmitting} className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all hover:brightness-110 active:scale-[0.98] text-[#0A0A0B] flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: 'var(--brand-primary)', boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}>
              {isSubmitting ? 'Procesando...' : (isAuthenticated ? 'Confirmar Pedido' : 'Solicitar Cotización')}
              {!isSubmitting && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
            </button>

            {!isAuthenticated && (
              <div className="mt-6 flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                <svg className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  <strong className="text-white/80">DIROGSA revisará tu solicitud y te responderá directamente.</strong> Tus datos serán utilizados exclusivamente para enviarte los precios y disponibilidad solicitada.
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
