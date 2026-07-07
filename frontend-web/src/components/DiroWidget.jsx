"use client";

import React, { useState, useEffect } from "react";
import { trackDiroInteraction } from "@/lib/tracking";

export default function DiroWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);

  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    // El popup automático de bienvenida ha sido desactivado (SEO/CRO Strategy).
    // Diro ahora es 100% pasivo y silencioso hasta que el usuario lo clica intencionalmente,
    // garantizando que no robe la atención visual del buscador principal (la zona de conversión).
  }, []);

  const handleDiroClick = () => {
    const opening = !isOpen;
    setIsOpen(opening);
    setShowWelcome(false);
    setActiveTab(null);
    if (opening) {
      trackDiroInteraction("open_widget");
    }
  };

  const handleOptionClick = (tabName) => {
    setActiveTab(activeTab === tabName ? null : tabName);
    trackDiroInteraction(`view_tip_${tabName}`);
  };

  const getTipContent = () => {
    switch (activeTab) {
      case "search":
        return "Ingresa el código original, marca de auto (ej. Toyota Hilux) o tipo de filtro en el buscador principal para obtener coincidencias exactas al instante.";
      case "warranty":
        return "Nuestras marcas importadas (WIX, Hengst, Filtron) cuentan con certificación OEM. Esto garantiza que cumplen las especificaciones de fábrica, permitiendo hacer el mantenimiento sin perder la garantía de tu auto nuevo o SUV.";
      case "shipping":
        return "Despachamos pedidos diariamente a Lima y realizamos envíos seguros a todas las provincias del Perú vía Olva Courier, Shalom, Marvisur o la agencia de tu elección.";
      default:
        return null;
    }
  };

  return (
    <div className="fixed bottom-24 left-4 md:left-8 z-[60] flex flex-col items-start select-none">
      {/* ── BURBUJA DE MENSAJE / DIALOGO ── */}
      {(showWelcome || isOpen) && (
        <div 
          className="mb-3 w-[260px] md:w-[320px] bg-[#141518]/95 border border-brand-primary/30 backdrop-blur-md rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_15px_rgba(16,185,129,0.1)] text-white text-xs md:text-sm animate-fade-in relative transition-all duration-300"
        >
          {/* Triángulo indicador de la burbuja (apunta a la mascota abajo) */}
          <div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-[#141518] border-r border-b border-brand-primary/30 transform rotate-45" />

          {/* Botón Cerrar */}
          <button 
            onClick={() => { setIsOpen(false); setShowWelcome(false); }}
            className="absolute top-2.5 right-2.5 text-white/40 hover:text-white text-xs p-1"
            aria-label="Cerrar asistente"
          >
            ✕
          </button>

          {/* Contenido */}
          {isOpen ? (
            <div>
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                <span className="text-[10px] bg-brand-primary/20 text-brand-primary px-2 py-0.5 rounded font-black tracking-widest uppercase">ASISTENTE DIRO</span>
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
              </div>
              
              {!activeTab ? (
                <div>
                  <p className="text-white/80 mb-3 text-xs leading-relaxed">
                    Hola, soy <strong>DIRO</strong>. Selecciona una opción para guiarte en tu abastecimiento:
                  </p>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => handleOptionClick("search")}
                      className="w-full text-left px-3 py-2 bg-white/5 hover:bg-brand-primary/10 border border-white/10 hover:border-brand-primary/30 rounded-xl transition-all text-xs font-bold flex items-center gap-2"
                    >
                      <span>🔍</span> ¿Cómo buscar filtros?
                    </button>
                    <button 
                      onClick={() => handleOptionClick("warranty")}
                      className="w-full text-left px-3 py-2 bg-white/5 hover:bg-brand-primary/10 border border-white/10 hover:border-brand-primary/30 rounded-xl transition-all text-xs font-bold flex items-center gap-2"
                    >
                      <span>🛡️</span> Mantener Garantía de Fábrica
                    </button>
                    <button 
                      onClick={() => handleOptionClick("shipping")}
                      className="w-full text-left px-3 py-2 bg-white/5 hover:bg-brand-primary/10 border border-white/10 hover:border-brand-primary/30 rounded-xl transition-all text-xs font-bold flex items-center gap-2"
                    >
                      <span>🚚</span> Envíos a Provincias
                    </button>
                  </div>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <button 
                    onClick={() => setActiveTab(null)}
                    className="text-brand-primary hover:underline text-[10px] font-black uppercase tracking-wider mb-2 flex items-center gap-1"
                  >
                    ← Volver al menú
                  </button>
                  <p className="text-white/90 text-xs leading-relaxed font-medium bg-white/5 p-3 rounded-xl border border-white/5">
                    {getTipContent()}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="pr-4 text-white/90 text-xs leading-relaxed font-medium">
              👋 ¡Hola! Soy <strong>DIRO</strong>. Te ayudo a cotizar filtros OEM para mantener la garantía de fábrica. ¡Haz clic en mí!
            </p>
          )}
        </div>
      )}

      {/* ── MASCOTA DIRO FLOTANTE ── */}
      <button
        onClick={handleDiroClick}
        className="relative group flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#10b981]/10 border border-brand-primary/40 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_15px_rgba(16,185,129,0.15)] hover:border-brand-primary/80 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer overflow-visible"
        aria-label="Asistente inteligente DIRO"
      >
        {/* Onda expansiva de atención */}
        <span className="absolute inline-flex h-full w-full rounded-full bg-brand-primary/20 animate-ping opacity-60 pointer-events-none" />

        {/* Punto de estado en línea */}
        <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-brand-primary border-2 border-[#0A0A0B] z-10 animate-pulse" />

        {/* Imagen del avatar de DIRO */}
        <div className="w-11 h-11 md:w-13 md:h-13 rounded-full overflow-hidden relative flex items-center justify-center">
          {!imgError ? (
            <img 
              src="/diro.png" 
              alt="Mascota DIRO" 
              className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(16,185,129,0.4)]"
              onError={() => setImgError(true)}
            />
          ) : (
            <svg 
              className="w-8 h-8 text-brand-primary" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <rect x="5" y="3" width="14" height="18" rx="2" fill="#0A0A0B" stroke="var(--brand-primary)" strokeWidth="2.5"/>
              <line x1="5" y1="9" x2="19" y2="9" stroke="var(--brand-primary)" />
              <line x1="5" y1="15" x2="19" y2="15" stroke="var(--brand-primary)" />
              {/* Ojos LED verdes */}
              <circle cx="9" cy="6" r="1.5" fill="#10B981" />
              <circle cx="15" cy="6" r="1.5" fill="#10B981" />
              {/* Sonrisa */}
              <path d="M10 10 Q 12 12 14 10" stroke="#10B981" strokeWidth="1.5" fill="none"/>
            </svg>
          )}
        </div>

        {/* Tooltip Hover en Desktop */}
        <span className="hidden md:group-hover:inline-block absolute left-20 bg-[#141518] text-[10px] font-black text-brand-primary tracking-wider uppercase border border-brand-primary/30 px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
          Hablar con DIRO
        </span>
      </button>
    </div>
  );
}
