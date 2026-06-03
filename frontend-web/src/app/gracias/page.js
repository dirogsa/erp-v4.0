'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { trackEvent } from '@/lib/tracking';

export default function GraciasPage() {
  const [waLink, setWaLink] = useState('');
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // 1. Obtener Datos del Pedido
    const items = useCartStore.getState().items;
    if (items.length === 0) {
      setIsProcessing(false);
      return;
    }

    const clientDataStr = sessionStorage.getItem('diro_checkout_data');
    const clientData = clientDataStr ? JSON.parse(clientDataStr) : { name: 'Cliente B2B', company: '' };

    // 2. Disparar Evento de Conversión Máxima (Google Ads / Meta)
    const totalValue = items.reduce((sum, i) => sum + ((i.price || 0) * i.quantity), 0);
    const skuList = items.map(i => i.sku);

    // GTM DataLayer
    trackEvent('generate_lead', {
      value: totalValue,
      currency: 'PEN',
      items: skuList,
      client_type: clientData.company ? 'B2B_Empresa' : 'B2B_Persona'
    });

    // Meta Pixel (Lead)
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Lead', {
        content_name: 'Cotización B2B',
        content_category: 'Filtros y Repuestos',
        value: totalValue,
        currency: 'PEN',
      });
    }

    // 3. Generar Texto para WhatsApp
    let waText = `*NUEVA COTIZACIÓN B2B* 📦\n`;
    waText += `-------------------\n`;
    waText += `👤 Nombre: ${clientData.name}\n`;
    if (clientData.company) waText += `🏢 Empresa/RUC: ${clientData.company}\n`;
    waText += `-------------------\n`;
    
    items.forEach(item => {
      waText += `▫️ ${item.quantity}x ${item.sku} - ${item.brand}\n`;
    });
    waText += `-------------------\n`;
    waText += `Por favor, confírmenme disponibilidad y precios.`;

    const encodedText = encodeURIComponent(waText);
    const phoneNumber = "51991717240"; // Teléfono oficial
    setWaLink(`https://wa.me/${phoneNumber}?text=${encodedText}`);

    // 4. Limpiar el Carrito y la Sesión
    useCartStore.getState().clearCart();
    sessionStorage.removeItem('diro_checkout_data');
    
    setIsProcessing(false);
  }, []);

  if (isProcessing) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-t-2 border-brand-primary rounded-full" /></div>;
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="relative rounded-[2.5rem] p-[2px] overflow-hidden group max-w-lg w-full text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#10B981] via-[#0A0A0B] to-[#10B981] opacity-20" />
        
        <div className="relative rounded-[2.5rem] p-10 flex flex-col items-center justify-center space-y-6 backdrop-blur-xl bg-[#0A0A0B]/90 border border-white/5">
          
          <div className="h-24 w-24 rounded-full flex items-center justify-center mb-4 relative">
            <div className="absolute inset-0 bg-brand-primary blur-2xl opacity-20 rounded-full animate-pulse" />
            <div className="relative bg-[#10B981]/10 border border-[#10B981]/30 h-full w-full rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <div>
            <h1 className="text-white font-black text-3xl uppercase tracking-tighter mb-2">¡Cotización Lista!</h1>
            <p className="text-sm leading-relaxed text-white/60 mb-6">
              Tu lista de repuestos ha sido procesada. Haz clic en el botón abajo para enviarnos tu pedido por WhatsApp y un asesor te responderá inmediatamente con disponibilidad y precios.
            </p>
          </div>

          {waLink ? (
            <a 
              href={waLink}
              className="w-full py-5 rounded-xl font-black text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 text-white"
              style={{ background: '#25D366', boxShadow: '0 0 30px rgba(37,211,102,0.3)' }}
            >
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.528 1.971 14.076 1.97 11.98 1.97c-5.433 0-9.863 4.374-9.867 9.806-.001 1.73.457 3.41 1.32 4.947l-1.047 3.826 3.925-1.029zm13.111-7.234c-.29-.145-1.716-.847-1.978-.942-.262-.096-.453-.145-.642.145-.19.29-.738.942-.905 1.135-.167.19-.335.21-.625.065-2.9-.145-4.814-1.924-5.59-3.267-.168-.29-.018-.447.127-.592.13-.13.29-.339.436-.508.145-.17.193-.29.29-.483.097-.19.048-.363-.024-.508-.073-.145-.642-1.547-.88-2.122-.232-.558-.468-.483-.642-.492-.166-.008-.356-.01-.546-.01-.19 0-.501.07-.763.356-.262.29-1 .977-1 2.382s1.02 2.762 1.164 2.956c.145.195 2.007 3.064 4.862 4.297.68.293 1.21.468 1.623.599.683.217 1.305.186 1.797.112.548-.08 1.716-.702 1.957-1.378.24-.678.24-1.257.17-1.378-.073-.121-.262-.19-.553-.335z"/>
              </svg>
              Enviar a WhatsApp
            </a>
          ) : (
            <Link href="/" className="w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all bg-white/5 text-white/50 hover:bg-white/10 hover:text-white">
              Volver al Catálogo
            </Link>
          )}

        </div>
      </div>
    </div>
  );
}
