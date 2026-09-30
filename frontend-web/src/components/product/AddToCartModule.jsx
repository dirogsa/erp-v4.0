'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { trackEvent } from '@/lib/tracking';
import Link from 'next/link';

export default function AddToCartModule({ product }) {
  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { items, addItem } = useCartStore();
  const [isAdded, setIsAdded] = useState(false);

  // Evitar hydration mismatch
  useEffect(() => {
    setMounted(true);
    // Verificar si ya está en la cotización
    if (items.find(item => item.sku === product.sku)) {
      setIsAdded(true);
    }
  }, [items, product.sku]);

  const handleAddToCart = () => {
    // 1. Añadir al Store global
    addItem(product, quantity);

    // 2. Disparar Tracking Quirúrgico
    trackEvent('add_to_quote', {
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

    // 3. Feedback visual persistente en esta sesión de vista
    setIsAdded(true);
  };

  const hasStock = product.stock > 0;
  const isUser = mounted && isAuthenticated;

  return (
    <div className="relative pt-2">
      <div className="relative z-10">
        {/* Lógica de Visualización B2B vs Invitado */}
        {isUser ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Precio Exclusivo para tu empresa</span>
              {product.promoDiscountPct > 0 && (
                <span className="text-[10px] font-black px-3 py-1 rounded-full animate-pulse"
                      style={{ background: 'rgba(245,158,11,0.2)', color: 'var(--brand-orange)', border: '1px solid rgba(245,158,11,0.3)' }}>
                  ¡OFERTA -{product.promoDiscountPct}%!
                </span>
              )}
            </div>
            <p className="text-3xl font-black text-white tracking-tighter">
              {product.price > 0 ? (
                <>
                  <span className="text-xl text-white/50 font-medium mr-1">{product.currency || 'S/'}</span>
                  {product.price.toFixed(2)}
                </>
              ) : (
                'Consultar Precio'
              )}
            </p>
            <p className="text-xs text-white/40 mb-6">Incl. IGV</p>
          </>
        ) : (
          <div className="mb-6 flex flex-col gap-2 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm font-bold text-white/90">
              Precio exclusivo para clientes registrados
            </p>
            <p className="text-xs text-white/60 leading-relaxed">
              ¿Aún no eres cliente? Puedes solicitar una cotización indicando los productos y cantidades que necesitas. Revisaremos tu solicitud y te contactaremos con nuestros precios.
            </p>
          </div>
        )}

        {/* Controles de Cantidad y Botón */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex gap-3">
            <div className="flex items-center bg-[#0D0E12] rounded-xl border border-white/10 px-2 h-14">
              <button 
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                disabled={isAdded}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
              </button>
              <input 
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 text-center bg-transparent text-white font-black text-lg focus:outline-none"
                min="1"
                disabled={isAdded}
              />
              <button 
                onClick={() => setQuantity(q => q + 1)}
                className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                disabled={isAdded}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>

            <button 
              onClick={handleAddToCart}
              disabled={isAdded}
              className={`flex-1 h-14 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                isAdded 
                  ? 'bg-brand-primary text-[#0A0A0B] cursor-default'
                  : 'bg-white/10 text-white hover:bg-brand-primary hover:text-[#0A0A0B]'
              }`}
              style={isAdded ? { boxShadow: '0 0 15px rgba(16,185,129,0.2)' } : {}}
            >
              {isAdded ? (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Agregado a mi cotización
                </>
              ) : (
                <>
                  <span className="text-lg leading-none mb-0.5">＋</span> Agregar a mi cotización
                </>
              )}
            </button>
          </div>

          {/* Confirmación Visual Discreta */}
          {isAdded && (
            <div className="flex flex-col gap-3 mt-2 p-4 rounded-xl bg-brand-primary/10 border border-brand-primary/20">
              <div className="flex items-center gap-2 text-brand-primary">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-bold">{product.sku} agregado a tu cotización</span>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
                <Link href="/cart" className="text-white hover:text-brand-primary transition-colors underline decoration-white/30 underline-offset-4">
                  Ver mi cotización
                </Link>
                <button onClick={() => window.history.back()} className="text-white/50 hover:text-white transition-colors">
                  Seguir buscando
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
