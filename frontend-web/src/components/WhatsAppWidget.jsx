'use client';

import { useState, useEffect } from 'react';
import TrackingLink from '@/components/TrackingLink';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function WhatsAppWidget() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verificar si el usuario ya lo cerró en esta sesión
    const isDismissed = sessionStorage.getItem('whatsapp_widget_dismissed');
    if (isDismissed) return;

    // Retrasar la aparición ligeramente para un mejor efecto visual
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('whatsapp_widget_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-[104px] md:bottom-24 right-4 md:right-8 z-[60] flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Botón de cerrar */}
      <button
        onClick={handleClose}
        className="bg-[#0D0E12]/80 backdrop-blur-md p-1.5 rounded-full border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors shadow-lg"
        aria-label="Cerrar widget de WhatsApp"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>

      <TrackingLink
        external
        eventName="click_whatsapp"
        payload={{ button_context: 'floating_bottom' }}
        href="https://wa.me/51991717240?text=Hola%20DIROGSA,%20necesito%20asistencia%20en%20l%C3%ADnea."
        className="flex items-center gap-0 md:gap-3.5 p-3 md:px-4 md:py-2.5 rounded-full bg-[#0D0E12]/95 border border-[#25D366]/40 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_20px_rgba(37,211,102,0.15)] hover:border-[#25D366]/80 transition-all duration-300 hover:scale-105 active:scale-95 group"
        aria-label="Asistencia por WhatsApp 991717240"
      >
        {/* Onda expansiva de atención */}
        <span className="absolute left-[14px] md:left-4 inline-flex h-10 w-10 rounded-full bg-[#25D366]/20 animate-ping opacity-75" />
        
        {/* Icono circular de WhatsApp */}
        <div className="relative h-12 w-12 md:h-10 md:w-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-[0_3px_12px_rgba(37,211,102,0.4)] flex-shrink-0">
          <svg className="w-6 h-6 md:w-5 md:h-5 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.528 1.971 14.076 1.97 11.98 1.97c-5.433 0-9.863 4.374-9.867 9.806-.001 1.73.457 3.41 1.32 4.947l-1.047 3.826 3.925-1.029zm13.111-7.234c-.29-.145-1.716-.847-1.978-.942-.262-.096-.453-.145-.642.145-.19.29-.738.942-.905 1.135-.167.19-.335.21-.625.065-2.9-.145-4.814-1.924-5.59-3.267-.168-.29-.018-.447.127-.592.13-.13.29-.339.436-.508.145-.17.193-.29.29-.483.097-.19.048-.363-.024-.508-.073-.145-.642-1.547-.88-2.122-.232-.558-.468-.483-.642-.492-.166-.008-.356-.01-.546-.01-.19 0-.501.07-.763.356-.262.29-1 .977-1 2.382s1.02 2.762 1.164 2.956c.145.195 2.007 3.064 4.862 4.297.68.293 1.21.468 1.623.599.683.217 1.305.186 1.797.112.548-.08 1.716-.702 1.957-1.378.24-.678.24-1.257.17-1.378-.073-.121-.262-.19-.553-.335z"/>
          </svg>
        </div>
        
        {/* Contenedor de Texto / Número (Oculto en móvil) */}
        <div className="hidden md:flex flex-col pr-1.5 select-none w-0 md:w-auto overflow-hidden opacity-0 md:opacity-100 transition-all duration-300">
          <span className="text-[9px] font-black uppercase tracking-widest text-[#25D366] leading-none">WhatsApp</span>
          <span className="text-[13px] md:text-sm font-black text-white tracking-wide leading-none mt-1 whitespace-nowrap">991 717 240</span>
        </div>
      </TrackingLink>
    </div>
  );
}
