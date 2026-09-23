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
        {/* Contenedor del Icono con su Onda Expansiva */}
        <div className="relative flex items-center justify-center flex-shrink-0">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[#25D366]/40 animate-ping opacity-75" />
          
          <svg className="relative w-10 h-10 md:w-9 md:h-9 drop-shadow-[0_3px_12px_rgba(37,211,102,0.4)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.031 0C5.398 0 .015 5.38.013 12.012c0 2.125.553 4.196 1.604 6.02L.031 24l6.11-1.603a11.96 11.96 0 0 0 5.89 1.545h.005c6.632 0 12.014-5.38 12.016-12.013A11.972 11.972 0 0 0 12.03 0z" fill="#25D366"/>
            <path d="M17.527 12.511c-.302-.151-1.783-.881-2.06-.982-.276-.101-.478-.151-.679.151-.202.302-.78.982-.955 1.183-.176.201-.352.226-.653.075-.302-.15-1.272-.47-2.424-1.498-.895-.8-1.502-1.787-1.678-2.088-.176-.302-.019-.465.132-.616.136-.136.302-.352.453-.528.151-.176.201-.301.302-.503.1-.201.05-.377-.025-.528-.075-.151-.679-1.636-.93-2.24-.245-.588-.495-.508-.679-.517a12.98 12.98 0 0 0-.579-.01c-.2 0-.528.075-.804.377-.276.301-1.056 1.031-1.056 2.515 0 1.484 1.08 2.918 1.231 3.12.151.201 2.127 3.245 5.148 4.549.719.31 1.28.496 1.718.635.723.23 1.381.197 1.898.12.581-.086 1.783-.73 2.036-1.434.251-.704.251-1.307.176-1.434-.075-.126-.276-.201-.579-.352z" fill="#FFFFFF"/>
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
