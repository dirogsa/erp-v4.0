'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { trackEvent } from '@/lib/tracking';

export default function AddToCartModule({ product, isAuthenticated }) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const [showToast, setShowToast] = useState(false);

  const handleAddToCart = () => {
    // 1. Añadir al Store global
    addItem(product, quantity);

    // 2. Disparar Tracking Quirúrgico (Paso 11 de la Estrategia)
    trackEvent('add_to_cart', {
      product_sku: product.sku,
      product_brand: product.brand,
      quantity: quantity,
      value: (product.price || 0) * quantity,
      currency: product.currency || 'PEN',
      is_authenticated: isAuthenticated
    });

    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_ids: [product.sku],
        content_type: 'product',
        value: (product.price || 0) * quantity,
        currency: product.currency || 'PEN'
      });
    }

    // 3. Feedback visual (Toast temporal)
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const hasStock = product.stock > 0;

  return (
    <div className="relative rounded-[2rem] p-6 overflow-hidden"
         style={{ background: 'rgba(20,21,24,0.5)', border: '2px solid rgba(255,255,255,0.05)' }}>
      
      {/* Icono de fondo decorativo */}
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <svg className="h-20 w-20" style={{ color: 'var(--brand-primary)' }} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      </div>

      <div className="relative z-10">
        {/* Lógica de Visualización B2B vs Guest */}
        {isAuthenticated ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Precio Unitario</span>
              {product.promoDiscountPct > 0 && (
                <span className="text-[10px] font-black px-3 py-1 rounded-full animate-pulse"
                      style={{ background: 'rgba(245,158,11,0.2)', color: 'var(--brand-orange)', border: '1px solid rgba(245,158,11,0.3)' }}>
                  ¡OFERTA -{product.promoDiscountPct}%!
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-5xl font-black text-white">
                {product.currency === 'PEN' ? 'S/' : '$'} {Number(product.price).toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-white/40 mb-6">Incl. IGV · Precio para clientes registrados</p>
          </>
        ) : (
          <div className="mb-6 p-4 rounded-xl border border-white/5 bg-[#141518]/50 text-center">
            <svg className="w-8 h-8 text-[#F59E0B] mx-auto mb-2 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="text-white font-bold text-sm uppercase tracking-tight mb-1">Stock y Precios Ocultos</h3>
            <p className="text-xs text-white/60 leading-relaxed mb-3">
              Puedes agregar filtros a tu lista y enviar la cotización para recibir precios por interno.
            </p>
          </div>
        )}

        {/* Controles de Cantidad y Botón */}
        <div className="flex gap-3">
          <div className="flex items-center bg-[#0D0E12] rounded-xl border border-white/10 px-2 h-14">
            <button 
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
            </button>
            <input 
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-12 text-center bg-transparent text-white font-black text-lg focus:outline-none"
              min="1"
            />
            <button 
              onClick={() => setQuantity(q => q + 1)}
              className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>

          <button 
            onClick={handleAddToCart}
            className="flex-1 h-14 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:brightness-110 active:scale-95 text-[#0A0A0B] flex items-center justify-center gap-2"
            style={{ background: 'var(--brand-primary)', boxShadow: '0 0 20px rgba(16,185,129,0.3)' }}
          >
            {showToast ? '¡Agregado!' : 'Añadir a la lista'}
            {!showToast && (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Toast Notification Minimalista */}
        {showToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#0A0A0B] border border-brand-primary text-brand-primary text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-pulse z-50 whitespace-nowrap">
            Filtro agregado a cotización
          </div>
        )}

      </div>
    </div>
  );
}
