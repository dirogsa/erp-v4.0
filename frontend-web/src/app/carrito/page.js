'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';

export default function CarritoPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, getTotalPrice, getTotalItems } = useCartStore();
  
  // Evitar hydration mismatch (Zustand + LocalStorage)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [clientData, setClientData] = useState({
    name: '',
    company: '',
    ruc: '',
  });

  const { isAuthenticated, user, token } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    setIsSubmitting(true);

    try {
      if (isAuthenticated) {
        // FLUJO 2: Cliente Autenticado -> Mandar directo al ERP
        // Se hace un fetch al backend Python (endpoint placeholder por ahora)
        console.log("Enviando orden B2B al ERP para el cliente:", user);
        
        // Simulación de llamada a API
        // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales/quotes`, { ... });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Pasamos data por sessionStorage para la página de gracias
        sessionStorage.setItem('diro_checkout_data', JSON.stringify({
          name: user?.name || 'Cliente B2B',
          company: user?.company || 'Empresa Logueada',
          is_erp_synced: true // Flag importante
        }));
      } else {
        // FLUJO 1: Invitado -> Flujo WhatsApp (No toca el ERP)
        sessionStorage.setItem('diro_checkout_data', JSON.stringify({
          name: clientData.name,
          company: clientData.company,
          is_erp_synced: false
        }));
      }

      // Navegar a /gracias para disparar Pixels (Ambos flujos terminan aquí)
      router.push('/gracias');
    } catch (error) {
      console.error("Error procesando checkout:", error);
      setIsSubmitting(false);
    }
  };

  if (!mounted) return <div className="min-h-[50vh] flex items-center justify-center"><div className="animate-spin h-8 w-8 border-t-2 border-brand-primary rounded-full" /></div>;

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-5 py-20 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#141518] border border-white/5 mb-6">
          <svg className="w-10 h-10 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-2">Tu lista está vacía</h1>
        <p className="text-white/50 mb-8 max-w-md mx-auto">
          Busca los filtros por código o vehículo y agrégalos aquí para generar una cotización B2B.
        </p>
        <Link href="/buscar" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest bg-brand-primary text-[#0A0A0B] hover:brightness-110 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          Empezar a buscar
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-8">
        Cotización B2B
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de Productos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <span className="text-xs font-bold text-white/50 uppercase tracking-widest">{getTotalItems()} Productos</span>
            <button onClick={() => useCartStore.getState().clearCart()} className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-widest">
              Vaciar Lista
            </button>
          </div>

          {items.map((item) => (
            <div key={item.sku} className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-[#141518]/50 border border-white/5 items-center">
              <div className="w-20 h-20 rounded-xl bg-white/5 flex items-center justify-center p-2 shrink-0">
                {item.imageUrl && item.imageUrl !== 'none' ? (
                  <img src={item.imageUrl} alt={item.sku} className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className="text-2xl">📦</span>
                )}
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                <div className="text-[9px] font-black uppercase text-brand-primary tracking-widest mb-1">{item.brand}</div>
                <h3 className="text-sm font-bold text-white leading-tight mb-1">{item.name}</h3>
                <div className="text-[10px] text-white/40">{item.sku}</div>
              </div>

              <div className="flex items-center gap-6 mt-2 sm:mt-0">
                {isAuthenticated ? (
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-black text-white">{item.currency === 'PEN' ? 'S/' : '$'} {Number(item.price).toFixed(2)}</div>
                    <div className="text-[9px] text-white/40 uppercase">Unidad</div>
                  </div>
                ) : (
                  <div className="hidden sm:block text-[9px] font-bold text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20 px-2 py-1 rounded">Precio Oculto</div>
                )}

                <div className="flex items-center bg-[#0A0A0B] rounded-lg border border-white/10 h-10">
                  <button onClick={() => updateQuantity(item.sku, Math.max(1, item.quantity - 1))} className="w-8 h-full text-white/50 hover:text-white flex items-center justify-center">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg>
                  </button>
                  <span className="w-8 text-center text-xs font-black text-white">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.sku, item.quantity + 1)} className="w-8 h-full text-white/50 hover:text-white flex items-center justify-center">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                  </button>
                </div>

                {isAuthenticated && (
                  <div className="text-right w-20">
                    <div className="text-sm font-black text-brand-primary">{item.currency === 'PEN' ? 'S/' : '$'} {(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                )}

                <button onClick={() => removeItem(item.sku)} className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen y Checkout Form */}
        <div>
          <form onSubmit={handleCheckout} className="sticky top-24 bg-[#141518]/80 backdrop-blur-md rounded-[2rem] border border-white/5 p-6 md:p-8">
            <h2 className="text-lg font-black text-white uppercase tracking-tight mb-6 border-b border-white/10 pb-4">
              Resumen de Cotización
            </h2>

            {isAuthenticated ? (
              <div className="space-y-3 mb-8">
                <div className="flex justify-between text-sm text-white/60">
                  <span>Subtotal ({getTotalItems()} items)</span>
                  <span>S/ {(getTotalPrice() / 1.18).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-white/60">
                  <span>IGV (18%)</span>
                  <span>S/ {(getTotalPrice() - (getTotalPrice() / 1.18)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-black text-white pt-4 border-t border-white/10">
                  <span>Total</span>
                  <span className="text-brand-primary">S/ {getTotalPrice().toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className="mb-8 p-4 rounded-xl border border-white/5 bg-[#0A0A0B]/50">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div>
                    <p className="text-[11px] text-white/70 leading-relaxed">
                      El monto total será calculado por uno de nuestros asesores y se te enviará junto con disponibilidad de stock exacta.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!isAuthenticated && (
              <div className="space-y-4 mb-8">
                <h3 className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Tus Datos para Cotizar</h3>
                <div>
                  <input type="text" required placeholder="Nombre completo" value={clientData.name} onChange={e => setClientData({...clientData, name: e.target.value})} className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all" />
                </div>
                <div>
                  <input type="text" placeholder="RUC o Nombre de Empresa (Opcional)" value={clientData.company} onChange={e => setClientData({...clientData, company: e.target.value})} className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all" />
                </div>
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:brightness-110 active:scale-95 text-[#0A0A0B] flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: 'var(--brand-primary)', boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}>
              {isSubmitting ? 'Procesando...' : (isAuthenticated ? 'Confirmar Pedido ERP' : 'Enviar Cotización')}
              {!isSubmitting && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
            </button>
            <p className="text-center text-[9px] text-white/40 mt-4 uppercase tracking-widest">
              {isAuthenticated ? 'Sincronizado con sistema ERP central' : 'Te contactaremos por WhatsApp'}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
