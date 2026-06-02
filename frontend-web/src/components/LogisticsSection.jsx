"use client";

import React from "react";

export default function LogisticsSection() {
  return (
    <section className="w-full mb-16 md:mb-20" aria-labelledby="logistics-heading">
      <div className="text-center mb-8">
        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-brand-primary bg-brand-primary/10 px-3.5 py-1 rounded-full border border-brand-primary/20 mb-2 inline-block">
          Garantía de Operación Real
        </span>
        <h2 id="logistics-heading" className="text-2xl md:text-3xl font-black text-white mb-2">
          Nuestra Operación Logística
        </h2>
        <p className="text-white/60 text-sm md:text-base">
          Instalaciones centralizadas y despacho diario directo a provincias en todo el Perú.
        </p>
      </div>

      {/* Swiper móvil / Grid desktop */}
      <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-4 md:grid md:grid-cols-4 pb-4 md:pb-0">
        
        {/* Tarjeta 1: Almacén */}
        <div className="min-w-[80%] md:min-w-0 snap-center bg-[#141518]/40 border border-white/5 rounded-2xl overflow-hidden group hover:border-brand-primary/20 transition-all duration-300 relative cursor-default">
          <div className="h-40 bg-[#0E0F12] border-b border-white/5 relative flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-[#0A0A0B] z-0" />
            <img 
              src="/images/logistics-almacen.webp" 
              alt="Almacén centralizado de filtros DIROGSA" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-500 opacity-60 group-hover:opacity-100 z-10"
            />
          </div>
          <div className="p-4 relative z-20 bg-[#141518]/90">
            <h3 className="text-white font-bold text-sm mb-1">Almacén Centralizado</h3>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Stock permanente de alta rotación en Lima, listo para atender requerimientos inmediatos.
            </p>
          </div>
        </div>

        {/* Tarjeta 2: Stock */}
        <div className="min-w-[80%] md:min-w-0 snap-center bg-[#141518]/40 border border-white/5 rounded-2xl overflow-hidden group hover:border-brand-primary/20 transition-all duration-300 relative cursor-default">
          <div className="h-40 bg-[#0E0F12] border-b border-white/5 relative flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-[#0A0A0B] z-0" />
            <img 
              src="/images/logistics-stock.webp" 
              alt="Stock de filtros originales OEM" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-500 opacity-60 group-hover:opacity-100 z-10"
            />
          </div>
          <div className="p-4 relative z-20 bg-[#141518]/90">
            <h3 className="text-white font-bold text-sm mb-1">Stock Garantizado</h3>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Control de inventarios estricto de filtros de aire, aceite y cabina de marcas líderes WIX y Filtron.
            </p>
          </div>
        </div>

        {/* Tarjeta 3: Embalaje */}
        <div className="min-w-[80%] md:min-w-0 snap-center bg-[#141518]/40 border border-white/5 rounded-2xl overflow-hidden group hover:border-brand-primary/20 transition-all duration-300 relative cursor-default">
          <div className="h-40 bg-[#0E0F12] border-b border-white/5 relative flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-[#0A0A0B] z-0" />
            <img 
              src="/images/logistics-embalaje.webp" 
              alt="Embalaje reforzado para provincias" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-500 opacity-60 group-hover:opacity-100 z-10"
            />
          </div>
          <div className="p-4 relative z-20 bg-[#141518]/90">
            <h3 className="text-white font-bold text-sm mb-1">Empaque y Rotulado</h3>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Rotulado y embalaje reforzado por bultos para asegurar que tu mercadería llegue impecable a destino.
            </p>
          </div>
        </div>

        {/* Tarjeta 4: Despacho */}
        <div className="min-w-[80%] md:min-w-0 snap-center bg-[#141518]/40 border border-white/5 rounded-2xl overflow-hidden group hover:border-brand-primary/20 transition-all duration-300 relative cursor-default">
          <div className="h-40 bg-[#0E0F12] border-b border-white/5 relative flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-[#0A0A0B] z-0" />
            <img 
              src="/images/logistics-despacho.webp" 
              alt="Despacho diario a agencias de transporte" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-500 opacity-60 group-hover:opacity-100 z-10"
            />
          </div>
          <div className="p-4 relative z-20 bg-[#141518]/90">
            <h3 className="text-white font-bold text-sm mb-1">Envíos a Provincias</h3>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Coordinación y entrega en agencias de transporte (Shalom, Marvisur, etc.) con trazabilidad del envío.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
