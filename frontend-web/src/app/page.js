// SERVER COMPONENT — No 'use client' directiva. Permite inyectar JSON-LD sin JS en cliente.
import Link from 'next/link';
import SearchModule from '@/components/SearchModule';
import { Suspense } from 'react';

// Metadata a nivel de página (extiende el template del layout)
export const metadata = {
  title: 'DIROGSA | Filtros y Repuestos Automotrices en Perú',
  description: 'Importador y distribuidor oficial de filtros automotrices en Perú. Encuentra filtros de aceite, aire, combustible y cabina por código, vehículo o medidas.',
  alternates: {
    canonical: 'https://dirogsa.com',
  },
  openGraph: {
    url: 'https://dirogsa.com',
    title: 'DIROGSA | Filtros y Repuestos Automotrices en Perú',
    description: 'Catálogo completo de repuestos automotrices en Perú. Distribuidor oficial con cobertura nacional.',
    images: [{ url: 'https://dirogsa.com/og-home.jpg', width: 1200, height: 630 }],
  },
};

export default function HomePage() {
  // ── JSON-LD: WebSite con SearchAction (Habilita Sitelinks Search Box en Google) ──
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'DIROGSA',
    url: 'https://dirogsa.com',
    description: 'Importador y distribuidor oficial de filtros automotrices en Perú.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://dirogsa.com/buscar?q={search_term_string}&type=codes',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  // ── JSON-LD: Organization (Genera Knowledge Panel en Google) ──
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DIROGSA',
    url: 'https://dirogsa.com',
    logo: 'https://dirogsa.com/logo.png',
    description: 'Importador y distribuidor oficial de filtros automotrices e industriales en Perú.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'PE',
      addressRegion: 'Lima',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: 'Spanish',
    },
    sameAs: [
      'https://www.facebook.com/dirogsa',
    ],
  };

  return (
    <div className="w-full mx-auto max-w-7xl px-4 md:px-8 py-6 md:py-12 flex flex-col md:gap-12">
      
      {/* ── JSON-LD SCHEMAS INVISIBLES PARA GOOGLE ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      {/* ── SECCIÓN: TITULAR OCULTO (Solo SEO) ── */}
      <h1 className="sr-only">Catálogo de Repuestos y Filtros DIROGSA - Buscador Principal</h1>

      {/* ── CAROUSEL DE NOVEDADES (Responsive Grid on Desktop) ── */}
      <section aria-labelledby="news-heading" className="w-full mb-8 md:mb-0">
        <h2 id="news-heading" className="sr-only">Últimas novedades de la empresa</h2>
        <div className="flex overflow-x-auto snap-x md:snap-none no-scrollbar gap-4 md:grid md:grid-cols-3 pb-2 md:pb-0">
          
          <article className="min-w-[85%] md:min-w-0 snap-center relative rounded-2xl overflow-hidden h-36 md:h-48 border border-white/10 group focus-within:ring-2 focus-within:ring-brand-primary">
            <img 
              src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800" 
              alt="Almacén de logística DIROGSA — Distribución Nacional"
              className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity duration-500"
              loading="lazy"
              width={800} height={400}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <span className="px-2 py-0.5 rounded text-[8px] md:text-[10px] font-black uppercase tracking-widest bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40 mb-2 md:mb-3 inline-block shadow-sm">
                LOGÍSTICA
              </span>
              <h3 className="text-white font-black text-lg md:text-xl leading-tight mb-1">Distribución Nacional Expandida</h3>
              <p className="text-[10px] md:text-xs text-[#38BDF8]">Cobertura en Lima, Arequipa y Trujillo</p>
            </div>
            <Link href="/noticias/distribucion" prefetch={false} className="absolute inset-0 z-20" aria-label="Leer más sobre distribución nacional expandida" />
          </article>
          
          <article className="min-w-[85%] md:min-w-0 snap-center relative rounded-2xl overflow-hidden h-36 md:h-48 border border-white/10 group focus-within:ring-2 focus-within:ring-brand-primary">
            <img 
              src="https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?auto=format&fit=crop&q=80&w=800" 
              alt="Tecnología Nanoflow — Filtración de alta eficiencia"
              className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity duration-500"
              loading="lazy"
              width={800} height={400}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <span className="px-2 py-0.5 rounded text-[8px] md:text-[10px] font-black uppercase tracking-widest bg-[#FB923C]/20 text-[#FB923C] border border-[#FB923C]/40 mb-2 md:mb-3 inline-block shadow-sm">
                TECNOLOGÍA
              </span>
              <h3 className="text-white font-black text-lg md:text-xl leading-tight mb-1">Tecnología Nanoflow</h3>
              <p className="text-[10px] md:text-xs text-[#FB923C]">Eficiencia de filtrado 99.7%</p>
            </div>
            <Link href="/tecnologia/nanoflow" prefetch={false} className="absolute inset-0 z-20" aria-label="Leer más sobre la tecnología nanoflow" />
          </article>
          
          <article className="hidden md:block snap-center relative rounded-2xl overflow-hidden h-36 md:h-48 border border-white/10 group focus-within:ring-2 focus-within:ring-brand-primary">
            <img 
              src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800" 
              alt="Línea Industrial Pesada — Filtros para maquinaria minera"
              className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity duration-500"
              loading="lazy"
              width={800} height={400}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <span className="px-2 py-0.5 rounded text-[8px] md:text-[10px] font-black uppercase tracking-widest bg-brand-primary/20 text-brand-primary border border-brand-primary/40 mb-2 md:mb-3 inline-block shadow-sm">
                LANZAMIENTO
              </span>
              <h3 className="text-white font-black text-lg md:text-xl leading-tight mb-1">Línea Industrial Pesada</h3>
              <p className="text-[10px] md:text-xs text-brand-primary">Para maquinaria minera y de construcción</p>
            </div>
            <Link href="/catalogo?category=industrial" className="absolute inset-0 z-20" aria-label="Explorar la nueva línea industrial pesada" />
          </article>

        </div>
      </section>

      {/* ── CONTENEDOR GRID DESKTOP PARA BUSCADOR Y BOTONES ── */}
      <div className="w-full flex flex-col md:grid md:grid-cols-12 md:gap-8 items-start">

        {/* ── MÓDULO DE BÚSQUEDA (Ocupa 8 de 12 columnas en Desktop) ── */}
        <section aria-labelledby="search-heading" className="w-full md:col-span-8 mb-6 md:mb-0">
          <h2 id="search-heading" className="sr-only">Módulo de Búsqueda de Productos</h2>
          <Suspense fallback={<div className="p-4 text-center text-brand-text-dim">Cargando buscador...</div>}>
            <SearchModule />
          </Suspense>
        </section>

        {/* ── BOTONES DE ACCIÓN RÁPIDA (Ocupa 4 de 12 columnas en Desktop) ── */}
        <nav aria-label="Accesos Rápidos" className="w-full flex md:flex-col gap-3 md:gap-4 md:col-span-4 mt-auto md:mt-0">
          <Link href="/catalogo" className="flex-1 md:flex-none bg-brand-primary text-[#0A0A0B] py-3.5 md:py-6 rounded-xl md:rounded-3xl font-black text-xs md:text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] md:shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <svg className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            CATÁLOGO
          </Link>
          <Link href="/carrito" className="flex-1 md:flex-none bg-[#0D0E12] md:bg-[#141518] border border-brand-primary text-brand-primary py-3.5 md:py-6 rounded-xl md:rounded-3xl font-black text-xs md:text-sm uppercase tracking-widest flex items-center justify-center hover:bg-brand-primary/10 hover:text-white transition-all md:shadow-xl">
            MI CARRITO
          </Link>
        </nav>

      </div>
    </div>
  );
}
