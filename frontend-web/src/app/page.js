// SERVER COMPONENT — No 'use client' directiva. Permite inyectar JSON-LD sin JS en cliente.
import Link from 'next/link';
import Image from 'next/image';
import SearchModule from '@/components/SearchModule';
import SearchSkeleton from '@/components/SearchSkeleton';
import { Suspense } from 'react';
import { PRODUCT_CATEGORIES, HOME_SEO_HUB_BRANDS, SITE_URL } from '@/config/seo.config';

// Metadata a nivel de página (extiende el template del layout)
export const metadata = {
  title: 'Distribuidor e Importador de Filtros Automotrices en Perú (Wix, Filtron, Hengst, Asakashi, Totachi, Mann-Filter)',
  description: 'Catálogo oficial de venta al por mayor de filtros importados. Distribuidor B2B e importador con cobertura nacional a todo el Perú.',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    url: SITE_URL,
    title: 'Distribuidor e Importador de Filtros Automotrices en Perú (Wix, Filtron, Hengst, Asakashi, Totachi, Mann-Filter) | DIROGSA',
    description: 'Catálogo oficial al por mayor de filtros importados para Perú. Distribuidor "Business to Business (B2B)" con cobertura nacional.',
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
    description: 'Importador y distribuidor al por mayor de filtros automotrices en Perú.',
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
    '@type': 'WholesaleStore',
    name: 'DIROGSA',
    url: 'https://dirogsa.com',
    logo: 'https://dirogsa.com/logo.png',
    description: 'Importador y distribuidor al por mayor de filtros automotrices e industriales en Perú.',
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
      {/* ── HERO SECTION B2B PREMIUM ── */}
      <section className="w-full text-center md:text-left pt-2 pb-8 md:pt-4 md:pb-12 flex flex-col md:items-start items-center">
        <span className="px-3 py-1 text-[10px] md:text-xs font-black uppercase tracking-widest text-brand-primary border border-brand-primary/30 bg-brand-primary/10 rounded-full mb-4 inline-block">
          Importación y Distribución Nacional
        </span>
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tighter mb-4 max-w-4xl">
          Plataforma Mayorista de <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-emerald-300">Filtros Automotrices</span> en Perú
        </h1>
        <p className="text-base md:text-lg text-white/80 max-w-2xl mb-6 leading-relaxed">
          Cotiza online filtros <strong>WIX, Filtron, Hengst, TOTACHI y Asakashi</strong> para vehículos livianos, pesados y líneas especiales.
        </p>
        
        <ul className="flex flex-col gap-3 mb-8 text-sm md:text-base text-white/80 text-left max-w-2xl">
          <li className="flex items-start gap-3">
            <span className="text-brand-primary font-black mt-0.5">✅</span>
            <span><strong>Cotizaciones web automatizadas</strong> con gestión en tiempo real.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-brand-primary font-black mt-0.5">✅</span>
            <span><strong>Acceso B2B</strong> para talleres, flotas y distribuidores a nivel nacional.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-brand-primary font-black mt-0.5">✅</span>
            <span><strong>Asesoría rápida</strong> vía WhatsApp para acompañamiento comercial.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-brand-primary font-black mt-0.5">✅</span>
            <span><em>Disponibilidad de líneas especiales para vehículos de alta gama bajo pedido.</em></span>
          </li>
        </ul>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="#search-heading" className="bg-brand-primary text-[#0A0A0B] px-6 py-3.5 md:py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] text-center flex items-center justify-center gap-2">
            Iniciar Cotización Web
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
          <Link href="/catalogo" className="border border-white/20 bg-[#141518]/80 text-white px-6 py-3.5 md:py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-center">
            Explorar Catálogo
          </Link>
        </div>
      </section>
      {/* ── CONTENEDOR GRID PARA BUSCADOR (Prioridad UX) ── */}
      <div className="w-full mb-8 md:mb-12">
        <section aria-labelledby="search-heading" className="w-full">
          <h2 id="search-heading" className="sr-only">Módulo de Búsqueda de Productos</h2>
          <Suspense fallback={<SearchSkeleton />}>
            <SearchModule />
          </Suspense>
        </section>
      </div>
      {/* ── SECCIÓN: ¿CÓMO FUNCIONA LA PLATAFORMA? (Flujo B2B) ── */}
      <section className="w-full mb-16 md:mb-20" aria-labelledby="how-it-works-heading">
        <div className="text-center mb-8">
          <h2 id="how-it-works-heading" className="text-2xl md:text-3xl font-black text-white mb-2">¿Cómo funciona la plataforma?</h2>
          <p className="text-white/60 text-sm md:text-base">Un proceso automatizado, diseñado para no detener tu operación.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 relative">
          {/* Línea conectora Desktop */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-[1px] bg-white/10 -z-10" />

          {/* Paso 1 */}
          <div className="bg-[#141518]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center relative">
            <div className="w-12 h-12 rounded-full bg-[#0A0A0B] border-2 border-brand-primary/50 text-brand-primary flex items-center justify-center font-black text-xl mb-4 shadow-[0_0_15px_rgba(16,185,129,0.2)]">1</div>
            <h3 className="font-bold text-white mb-2">Busca tu Filtro</h3>
            <p className="text-xs text-white/60">Encuentra por código, vehículo o medidas exactas.</p>
          </div>

          {/* Paso 2 */}
          <div className="bg-[#141518]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center relative">
            <div className="w-12 h-12 rounded-full bg-[#0A0A0B] border-2 border-brand-primary/50 text-brand-primary flex items-center justify-center font-black text-xl mb-4 shadow-[0_0_15px_rgba(16,185,129,0.2)]">2</div>
            <h3 className="font-bold text-white mb-2">Arma tu Cotización</h3>
            <p className="text-xs text-white/60">Agrega productos a tu lista web de forma rápida.</p>
          </div>

          {/* Paso 3 */}
          <div className="bg-[#141518]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center relative">
            <div className="w-12 h-12 rounded-full bg-[#0A0A0B] border-2 border-brand-primary/50 text-brand-primary flex items-center justify-center font-black text-xl mb-4 shadow-[0_0_15px_rgba(16,185,129,0.2)]">3</div>
            <h3 className="font-bold text-white mb-2">Envía Solicitud</h3>
            <p className="text-xs text-white/60">Manda tu lista online para recibir precios mayoristas.</p>
          </div>

          {/* Paso 4 */}
          <div className="bg-[#141518]/90 backdrop-blur-sm border border-brand-primary/30 rounded-2xl p-6 flex flex-col items-center text-center relative shadow-[0_0_20px_rgba(16,185,129,0.05)]">
            <div className="w-12 h-12 rounded-full bg-brand-primary text-[#0A0A0B] flex items-center justify-center font-black text-xl mb-4 shadow-[0_0_15px_rgba(16,185,129,0.4)]">4</div>
            <h3 className="font-bold text-white mb-2">Recibe tu Pedido</h3>
            <p className="text-xs text-white/70">Atención comercial y despacho a nivel nacional.</p>
          </div>
        </div>
      </section>



      {/* ── SECCIÓN DE AUTORIDAD LOGÍSTICA (B2B) ── */}
      <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-16">
        {/* Card 1: Cobertura Nacional */}
        <div className="bg-[#141518]/60 backdrop-blur-md border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center group hover:border-brand-primary/50 transition-colors">
          <div className="h-16 w-16 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h3 className="text-xl font-black text-white mb-3">Cobertura Nacional</h3>
          <p className="text-sm text-white/60">
            Despachos diarios en Lima y envíos rápidos a provincias en todo el Perú.
          </p>
        </div>

        {/* Card 2: Stock Permanente */}
        <div className="bg-[#141518]/60 backdrop-blur-md border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center group hover:border-brand-primary/50 transition-colors">
          <div className="h-16 w-16 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          <h3 className="text-xl font-black text-white mb-3">Stock Permanente</h3>
          <p className="text-sm text-white/60">
            Alta disponibilidad de filtros automotrices con almacenes centralizados y rotación constante.
          </p>
        </div>

        {/* Card 3: Atención B2B */}
        <div className="bg-[#141518]/60 backdrop-blur-md border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center group hover:border-brand-primary/50 transition-colors">
          <div className="h-16 w-16 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <h3 className="text-xl font-black text-white mb-3">Atención Especializada</h3>
          <p className="text-sm text-white/60">
            Cotizaciones mayoristas para talleres, flotas y distribuidores. Disponibilidad de líneas especiales para vehículos premium y de alta gama bajo pedido.
          </p>
        </div>
      </section>


      {/* ── HUB SEO PROGRAMÁTICO (Linking Interno — Carreteras para Googlebot) ── */}
      <section aria-labelledby="seo-hub-heading" className="w-full mt-10 md:mt-16">
        <h2 id="seo-hub-heading" className="text-xs font-black uppercase tracking-widest mb-5" style={{ color: 'var(--brand-text-dim)' }}>Explorar por Categoría o Vehículo</h2>

        {/* Categorías — links to /catalogo/[categoria] Hub pages */}
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--brand-text-muted)' }}>Tipo de filtro</p>
          <div className="flex flex-wrap gap-2">
            {PRODUCT_CATEGORIES.slice(0, 4).map(({ slug, label, emoji }) => (
              <Link
                key={slug}
                href={`/catalogo/${slug.toLowerCase()}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold border transition-colors hover:border-brand-primary/40 hover:text-white"
                style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)', color: 'var(--brand-text-dim)' }}
              >
                <span aria-hidden="true">{emoji}</span>
                {label}
              </Link>
            ))}
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold border transition-colors hover:border-brand-primary/40 hover:text-white"
              style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)', color: 'var(--brand-text-dim)' }}
            >
              <span aria-hidden="true">📦</span>
              Ver Catálogo Completo
            </Link>
          </div>
        </div>

        {/* Marcas de filtros — links to /marca/[brand] Hub pages */}
        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--brand-text-muted)' }}>Marcas importadas disponibles</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'WIX Filters', slug: 'wix', color: '#F59E0B' },
              { label: 'MANN-FILTER', slug: 'mann', color: '#3B82F6' },
              { label: 'AZUMI', slug: 'azumi', color: '#10B981' },
              { label: 'TOTACHI', slug: 'totachi', color: '#8B5CF6' },
            ].map(({ label, slug, color }) => (
              <Link
                key={slug}
                href={`/marca/${slug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors hover:scale-105"
                style={{ background: `${color}10`, border: `1px solid ${color}30`, color }}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/marca"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors hover:border-white/20 hover:text-white"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--brand-border)', color: 'var(--brand-text-dim)' }}
            >
              Ver todas las marcas →
            </Link>
          </div>
        </div>

        {/* Marcas de vehículos — links to /vehiculo/[marca] Hub pages */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--brand-text-muted)' }}>Filtros por marca de vehículo</p>
          <div className="flex flex-wrap gap-2">
            {HOME_SEO_HUB_BRANDS.slice(0, 6).map(({ label, slug }) => (
              <Link
                key={slug}
                href={`/vehiculo/${slug}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors hover:border-brand-primary/40 hover:text-white"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--brand-border)', color: 'var(--brand-text-dim)' }}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/vehiculo"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors hover:border-white/20 hover:text-white"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--brand-border)', color: 'var(--brand-text-dim)' }}
            >
              Ver más vehículos →
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN SEO SEMÁNTICA (Texto Enriquecido para Googlebot) ── */}
      <section aria-labelledby="seo-about-heading" className="w-full mt-10 md:mt-14 pt-8 border-t border-white/5" style={{ color: 'var(--brand-text-muted)' }}>
        <h2 id="seo-about-heading" className="sr-only">Sobre DIROGSA</h2>
        <div className="text-xs md:text-sm leading-relaxed text-left max-w-4xl mx-auto opacity-70">
          <p>
            DIROGSA es un importador y distribuidor mayorista de filtros automotrices en Perú. Nuestra plataforma B2B permite cotizar online filtros WIX, Filtron, Hengst, Totachi y otras marcas premium para vehículos livianos, pesados y líneas especiales. Atendemos talleres, lubricentros, flotas y distribuidores con cobertura nacional y soporte comercial especializado.
          </p>
        </div>
      </section>

    </div>
  );
}
