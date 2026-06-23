'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trackSearch } from '@/lib/tracking';

export const TABS = [
  { id: 'CODES', label: 'CÓDIGO', iconPath: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" },
  { id: 'APPS', label: 'VEHÍCULO', iconPath: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" },
  { id: 'DIMENSIONS', label: 'MEDIDAS', iconPath: "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" }
];

export default function SearchModule({ 
  initialTab = 'CODES', 
  initialQuery = '', 
  onSearch = null // Si se pasa, la búsqueda se maneja localmente (útil para la página de resultados)
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [vehicleMake, setVehicleMake] = useState(searchParams?.get('make') || '');
  const [vehicleModel, setVehicleModel] = useState(searchParams?.get('model') || '');
  const [isSearching, setIsSearching] = useState(false);

  // Efecto para sincronizar si cambian los props (cuando el usuario navega atrás/adelante)
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
    if (initialQuery) setSearchQuery(initialQuery);
  }, [initialTab, initialQuery]);

  // Resetea el estado de carga cuando la navegación termina (los parámetros cambian)
  useEffect(() => {
    setIsSearching(false);
  }, [searchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSearching(true);
    
    // Preparar parámetros según el tab activo
    const params = new URLSearchParams();
    params.set('type', activeTab.toLowerCase());
    
    let searchString = '';
    
    if (activeTab === 'CODES') {
      if (!searchQuery) return;
      params.set('q', searchQuery);
      searchString = searchQuery;
    } else if (activeTab === 'APPS') {
      if (!vehicleMake) return;
      params.set('make', vehicleMake);
      searchString = vehicleMake;
      if (vehicleModel) {
        params.set('model', vehicleModel);
        searchString += ` ${vehicleModel}`;
      }
    }

    // Tracker del evento B2B
    trackSearch(searchString);

    if (onSearch) {
      onSearch(params); // Ejecuta la búsqueda local en la página /search
      // Nota: Si onSearch no provoca un cambio en searchParams, 
      // podría ser necesario resetear setIsSearching(false) dentro de onSearch.
    } else {
      router.push(`/search?${params.toString()}`); // Navega a la página de búsqueda
    }
  };

  return (
    <div className="w-full mb-6 md:mb-0">
      {/* TABS */}
      <div role="tablist" aria-label="Pestañas de Búsqueda" className="flex gap-2 mb-4 md:mb-6">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          const colorClass = tab.id === 'APPS' ? 'text-[#38BDF8]' : tab.id === 'DIMENSIONS' ? 'text-[#FB923C]' : 'text-brand-primary';
          const inactiveColor = 'text-white/70';
          
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-selected={isActive}
              role="tab"
              className={`flex-1 py-3 md:py-4 rounded-xl md:rounded-2xl border flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-primary`}
              style={{
                background: isActive ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
                borderColor: isActive ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.05)',
              }}
            >
              <svg className={`h-5 w-5 md:h-6 md:w-6 ${isActive ? colorClass : inactiveColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tab.iconPath} />
              </svg>
              <span className={`text-[9px] md:text-[11px] font-black uppercase tracking-widest ${isActive ? colorClass : inactiveColor}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* FORMULARIO */}
      <form onSubmit={handleSubmit} className="bg-[#141518] border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl" role="search">
        
        {activeTab === 'CODES' && (
          <>
            <label htmlFor="searchQuery" className="block text-[10px] md:text-xs font-black text-brand-primary uppercase tracking-widest mb-3 md:mb-4">
              CÓDIGO / REFERENCIA DEL FILTRO
            </label>
            <div className="relative mb-4 md:mb-6">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 md:h-6 md:w-6 text-brand-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                id="searchQuery"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                placeholder="Ej: LF3970, P553004..."
                className="w-full bg-[#1A1C21] border border-white/10 rounded-xl md:rounded-2xl py-4 md:py-5 pl-12 md:pl-14 pr-4 text-sm md:text-base font-bold text-white placeholder-white/30 focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/50 transition-all uppercase"
                aria-label="Buscar filtro por código"
              />
            </div>
          </>
        )}

        {activeTab === 'APPS' && (
          <>
            <label htmlFor="vehicleMake" className="block text-[10px] md:text-xs font-black text-[#38BDF8] uppercase tracking-widest mb-3 md:mb-4">
              SELECCIONA TU VEHÍCULO
            </label>
            <div className="space-y-3 mb-4 md:mb-6">
              <input 
                id="vehicleMake"
                type="text"
                value={vehicleMake}
                onChange={(e) => setVehicleMake(e.target.value.toUpperCase())}
                placeholder="EJ: TOYOTA, NISSAN..."
                className="w-full bg-[#1A1C21] border border-white/10 rounded-xl md:rounded-2xl py-4 md:py-5 px-4 text-sm md:text-base font-bold text-white placeholder-white/30 focus:outline-none focus:border-[#38BDF8]/50 focus:ring-1 focus:ring-[#38BDF8]/50 transition-all uppercase"
                aria-label="Marca de vehículo"
              />
              <input 
                id="vehicleModel"
                type="text"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value.toUpperCase())}
                placeholder="MODELO (OPCIONAL)"
                className="w-full bg-[#1A1C21] border border-white/10 rounded-xl md:rounded-2xl py-4 md:py-5 px-4 text-sm md:text-base font-bold text-white placeholder-white/30 focus:outline-none focus:border-[#38BDF8]/50 focus:ring-1 focus:ring-[#38BDF8]/50 transition-all uppercase"
                aria-label="Modelo de vehículo"
              />
            </div>
          </>
        )}

        {activeTab === 'DIMENSIONS' && (
          <div className="py-4 text-center">
            <p className="text-sm text-brand-text-dim">Búsqueda por medidas en desarrollo...</p>
          </div>
        )}

        {activeTab !== 'DIMENSIONS' && (
          <>
            <button type="submit" disabled={isSearching}
              className="w-full bg-[#1E3A2F] text-brand-primary hover:text-white border border-brand-primary/20 hover:bg-[#254639] transition-all rounded-xl md:rounded-2xl py-3 md:py-5 flex items-center justify-center font-black text-xs md:text-sm uppercase tracking-widest gap-2 shadow-lg hover:shadow-brand-primary/20 disabled:opacity-70 disabled:cursor-not-allowed">
              {isSearching ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 md:h-5 md:w-5 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  BUSCANDO...
                </>
              ) : (
                <>
                  BUSCAR FILTRO <span className="text-lg leading-none" aria-hidden="true">→</span>
                </>
              )}
            </button>
            {isSearching && (
              <div className="mt-4 p-4 rounded-xl md:rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-bold text-center animate-pulse flex flex-col items-center gap-1.5">
                <span className="text-sm font-black">Conectando al catálogo de DIROGSA...</span>
                <span className="opacity-80 font-normal">Si es la primera consulta del día, el servidor gratuito de Render puede tomar hasta 40 segundos en activarse. Por favor, no recargue la página.</span>
              </div>
            )}
          </>
        )}
      </form>
    </div>
  );
}
