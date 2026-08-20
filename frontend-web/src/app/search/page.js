import { ProductService } from '@/services/product.service';
import SearchModule from '@/components/SearchModule';
import DimensionalSection from '@/components/DimensionalSection';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import { Suspense } from 'react';

import { SITE_URL } from '@/config/seo.config';


/**
 * DYNAMIC METADATA con URL Canónica — Previene penalización por contenido duplicado.
 * Google indexará /search?q=WA6004 como la URL autoritativa, ignorando variaciones.
 */
export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const query = sp.q || '';
  const make  = sp.make || '';
  const type  = (sp.type || 'codes').toLowerCase();

  // Construimos la URL canónica normalizada (parámetros ordenados, minúsculas)
  const canonicalParams = new URLSearchParams();
  canonicalParams.set('type', type);
  if (query) canonicalParams.set('q', query.toUpperCase());
  if (make)  canonicalParams.set('make', make.toUpperCase());
  const canonical = `${SITE_URL}/search?${canonicalParams.toString()}`;

  const titleQuery = query || make || 'repuestos';
  return {
    title: `Buscar ${titleQuery.toUpperCase()} | Repuestos y Filtros DIROGSA Perú`,
    description: `Resultados de búsqueda para "${titleQuery}" en el catálogo de filtros automotrices DIROGSA Perú.`,
    alternates: { canonical },
    robots: { index: false, follow: false }, // Disallowed en robots.txt — SPA interactiva, sin valor SEO independiente
  };
}

// Nota: generateMetadata arriba reemplaza el export estático.
// El título de fallback se maneja en el template del layout.js

export default async function BuscarPage({ searchParams }) {
  // Await searchParams as required in Next.js 15+ (if using latest) or it's synchronous in older versions
  // We'll treat it as async to be safe and modern
  const sp = await searchParams;
  
  const type = (sp.type || 'codes').toUpperCase();
  const query = sp.q || '';
  const make = sp.make || '';
  const model = sp.model || '';

  let results = [];
  let total = 0;
  let hasSearched = false;

  // Ejecutar búsqueda en el SERVIDOR (Perfecto para SEO y velocidad)
  if ((type === 'CODES' && query) || (type === 'APPS' && make)) {
    hasSearched = true;
    
    const apiParams = {};
    if (type === 'CODES') apiParams.search = query;
    if (type === 'APPS') {
      apiParams.vehicle_brand = make;
      if (model) apiParams.vehicle_model = model;
    }

    try {
      const data = await ProductService.searchProducts(apiParams);
      results = data.items || [];
      total = data.total || results.length;
    } catch (error) {
      console.error("[Buscar] Error en búsqueda de servidor:", error);
    }
  }

  // Si busca por código, separamos las coincidencias exactas de las equivalencias
  let exactMatches = [];
  let equivalentMatches = [];
  
  if (type === 'CODES' && query && results.length > 0) {
    const qUpper = query.trim().toUpperCase();
    exactMatches = results.filter(p => p.sku === qUpper);
    equivalentMatches = results.filter(p => p.sku !== qUpper);
  }

  return (
    <div className="w-full mx-auto max-w-7xl px-4 md:px-8 py-6 md:py-8 flex flex-col md:gap-8">
      
      {/* ── MÓDULO DE BÚSQUEDA (Reutilizado del Home) ── */}
      <section className="w-full">
        <h1 className="sr-only">Buscador de Repuestos</h1>
        <Suspense fallback={<div className="p-4 text-center text-brand-text-dim">Cargando buscador...</div>}>
          <SearchModule 
            initialTab={type} 
            initialQuery={query} 
          />
        </Suspense>
      </section>

      {/* ── RESULTADOS (Renderizados en el servidor) ── */}
      <section className="w-full mt-6 md:mt-0" aria-live="polite">
        
        {hasSearched ? (
          results.length > 0 ? (
            <div className="space-y-8">
              {/* Barra de Estadísticas */}
              <div className="flex items-center justify-between px-1 border-b border-white/10 pb-4">
                <h2 className="text-white font-black text-sm md:text-base uppercase tracking-tight">Resultados Encontrados</h2>
                <span className="text-[10px] md:text-xs font-black px-3 py-1.5 rounded-lg bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                  {total} PRODUCTOS
                </span>
              </div>

              {type === 'CODES' ? (
                <div className="flex flex-col gap-8 md:gap-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                    <Section title="Código Exacto" count={exactMatches.length} color="var(--brand-primary)" results={exactMatches} />
                    <Section title="Equivalentes" count={equivalentMatches.length} color="#F59E0B" results={equivalentMatches} />
                  </div>
                  
                  {/* Bloque 3: Alternativas Dimensionales (Similares por medida) */}
                  <div className="pt-8 border-t border-white/10">
                    <DimensionalSection 
                      key={exactMatches.length > 0 ? exactMatches[0].sku : query}
                      title="Alternativas Dimensionales" 
                      color="#10B981" 
                      exactSku={exactMatches.length > 0 ? exactMatches[0].sku : query} 
                    />
                  </div>
                </div>
              ) : (
                /* Vista para VEHÍCULOS / OTROS */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {results.map(p => <ProductCard key={p.sku} product={p} />)}
                </div>
              )}
            </div>
          ) : (
            /* Sin Resultados */
            <div className="py-20 text-center space-y-4">
              <div className="h-20 w-20 mx-auto rounded-[2rem] flex items-center justify-center opacity-30 bg-brand-surface border border-white/5">
                <svg className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
              <h3 className="text-white font-black text-lg md:text-xl uppercase tracking-tight">Sin coincidencias</h3>
              <p className="text-sm max-w-sm mx-auto text-brand-text-dim">
                No encontramos resultados para <span className="text-white font-bold">{query || make}</span>. Verifica el código o ajusta los filtros.
              </p>
            </div>
          )
        ) : (
          /* Estado Inicial (Sin buscar) */
          <EmptyState />
        )}

      </section>
    </div>
  );
}

// ── COMPONENTES INTERNOS ──

function Section({ title, count, color, results }) {
  return (
    <div className="space-y-4">
      <h3 className="text-white font-black text-xs md:text-sm uppercase tracking-[0.2em] px-1 flex items-center gap-3">
        <span className="w-1 h-6 rounded-full" style={{ background: color }} />
        {title} <span className="opacity-40">({count})</span>
      </h3>
      {count > 0 ? (
        <div className="grid grid-cols-1 gap-3 md:gap-4">
          {results.map(p => <ProductCard key={p.sku} product={p} />)}
        </div>
      ) : (
        <div className="py-8 text-center rounded-2xl md:rounded-3xl text-[10px] md:text-xs font-black uppercase tracking-widest border border-white/5 bg-white/[0.02] text-brand-text-dim">
          Sin coincidencias directas
        </div>
      )}
    </div>
  );
}


function EmptyState() {
  return (
    <div className="py-12 md:py-24 px-4 text-center space-y-8 md:space-y-10">
      <div className="space-y-4">
        <div className="h-20 w-20 md:h-24 md:w-24 mx-auto rounded-[2.5rem] flex items-center justify-center relative bg-brand-surface border border-white/5">
          <div className="absolute inset-0 rounded-[2.5rem] animate-pulse bg-brand-primary/5" />
          <svg className="h-9 w-9 md:h-12 md:w-12 relative z-10 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <h3 className="text-white font-black text-lg md:text-2xl uppercase tracking-tight">¿Qué repuesto buscas?</h3>
        <p className="text-sm md:text-base max-w-sm mx-auto leading-relaxed text-brand-text-dim">
          Busca por código de referencia, fabricante de vehículo o ingresa medidas exactas.
        </p>
      </div>
      {/* Quick chips */}
      <div className="flex flex-wrap justify-center gap-2 md:gap-3 max-w-2xl mx-auto">
        {['WA6004','FLEETGUARD','DONALDSON','BALDWIN','TOYOTA','NISSAN'].map(chip => (
          <span key={chip} className="px-4 py-2 md:py-3 rounded-xl md:rounded-2xl text-[9px] md:text-xs font-black uppercase border border-white/5 bg-white/[0.03] text-brand-text-dim cursor-default">
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}
