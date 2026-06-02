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
          Distribuidor al por Mayor de <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-emerald-300">Filtros Automotrices</span> en Perú
        </h1>
        <p className="text-sm md:text-base text-white/70 max-w-2xl mb-6 leading-relaxed">
          Importación y distribución nacional de filtros <strong>WIX, Filtron, Asakashi, TOTACHI y Hengst</strong>. Atención especializada al por mayor para flotas y talleres, y <strong>venta al por menor para modelos muy exclusivos de alta gama</strong>.
        </p>

        {/* ── MENSAJE EXPLÍCITO DE COTIZACIÓN WEB ── */}
        <div className="bg-brand-primary/10 border border-brand-primary/30 rounded-xl px-5 py-3.5 mb-8 flex items-center gap-4 w-full max-w-2xl text-left shadow-[0_0_20px_rgba(16,185,129,0.05)]">
          <div className="bg-brand-primary/20 p-2 rounded-lg shrink-0">
            <svg className="w-6 h-6 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M12 12h.01M12 16h.01" /></svg>
          </div>
          <p className="text-sm md:text-base text-white/90 leading-snug">
            <strong className="text-brand-primary font-black block mb-0.5">PLATAFORMA DE COTIZACIÓN B2B</strong>
            Busca tus repuestos, arma tu pedido <strong className="text-white">100% online</strong> y envía tu solicitud en segundos.
          </p>
        </div>

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


      {/* ── CAROUSEL DE NOVEDADES (Responsive Grid on Desktop) ── */}
      <section aria-labelledby="news-heading" className="w-full mb-12 md:mb-16">
        <h2 id="news-heading" className="sr-only">Últimas novedades de la empresa</h2>
        <div className="flex overflow-x-auto snap-x md:snap-none no-scrollbar gap-4 md:grid md:grid-cols-3 pb-2 md:pb-0">

          <article className="min-w-[85%] md:min-w-0 snap-center relative rounded-2xl overflow-hidden h-36 md:h-48 border border-white/10">
            <Image
              src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800"
              alt="Almacén de logística DIROGSA — Distribución Nacional"
              className="absolute inset-0 w-full h-full object-cover opacity-40"
              priority={true}
              fill={true}
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <span className="px-2 py-0.5 rounded text-[8px] md:text-[10px] font-black uppercase tracking-widest bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40 mb-2 md:mb-3 inline-block shadow-sm">
                LOGÍSTICA
              </span>
              <h3 className="text-white font-black text-lg md:text-xl leading-tight mb-1">Distribución Nacional</h3>
              <p className="text-[10px] md:text-xs text-[#38BDF8]">Cobertura en Lima, Arequipa, Puno y todas las provincias</p>
            </div>
          </article>

          <article className="min-w-[85%] md:min-w-0 snap-center relative rounded-2xl overflow-hidden h-36 md:h-48 border border-white/10">
            <Image
              src="https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?auto=format&fit=crop&q=80&w=800"
              alt="Tecnología Nanoflow — Filtración de alta eficiencia"
              className="absolute inset-0 w-full h-full object-cover opacity-40"
              fill={true}
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <span className="px-2 py-0.5 rounded text-[8px] md:text-[10px] font-black uppercase tracking-widest bg-[#FB923C]/20 text-[#FB923C] border border-[#FB923C]/40 mb-2 md:mb-3 inline-block shadow-sm">
                TECNOLOGÍA
              </span>
              <h3 className="text-white font-black text-lg md:text-xl leading-tight mb-1">Tecnología Nanoflow</h3>
              <p className="text-[10px] md:text-xs text-[#FB923C]">Eficiencia de filtrado de hasta 99.7%</p>
            </div>
          </article>

          <article className="min-w-[85%] md:min-w-0 snap-center relative rounded-2xl overflow-hidden h-36 md:h-48 border border-white/10">
            <Image
              src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800"
              alt="Línea de Carga Ligera — Filtros para SUVs y vehículos ligeros"
              className="absolute inset-0 w-full h-full object-cover opacity-40"
              fill={true}
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <span className="px-2 py-0.5 rounded text-[8px] md:text-[10px] font-black uppercase tracking-widest bg-brand-primary/20 text-brand-primary border border-brand-primary/40 mb-2 md:mb-3 inline-block shadow-sm">
                NUESTRO ENFOQUE
              </span>
              <h3 className="text-white font-black text-lg md:text-xl leading-tight mb-1">Especialistas en Línea Ligera</h3>
              <p className="text-[10px] md:text-xs text-brand-primary">Máximo rendimiento y protección para tu SUV o camioneta</p>
            </div>
          </article>

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
            Despachos diarios a Lima y envíos rápidos y seguros a provincias a nivel nacional. Llegamos donde esté tu negocio.
          </p>
        </div>

        {/* Card 2: Stock Permanente */}
        <div className="bg-[#141518]/60 backdrop-blur-md border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center group hover:border-brand-primary/50 transition-colors">
          <div className="h-16 w-16 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          <h3 className="text-xl font-black text-white mb-3">Stock Permanente</h3>
          <p className="text-sm text-white/60">
            Almacenes centralizados en Lima con alta rotación. Garantizamos disponibilidad para no detener tu operación.
          </p>
        </div>

        {/* Card 3: Atención B2B */}
        <div className="bg-[#141518]/60 backdrop-blur-md border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center group hover:border-brand-primary/50 transition-colors">
          <div className="h-16 w-16 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <h3 className="text-xl font-black text-white mb-3">Atención Integral</h3>
          <p className="text-sm text-white/60">
            Cotizaciones por volumen para clientes verificados y venta al por menor para modelos muy exclusivos de alta gama que no encuentras en tiendas convencionales.
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
            {PRODUCT_CATEGORIES.map(({ slug, label, emoji }) => (
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
            {HOME_SEO_HUB_BRANDS.map(({ label, slug }) => (
              <Link
                key={slug}
                href={`/vehiculo/${slug}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors hover:border-brand-primary/40 hover:text-white"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--brand-border)', color: 'var(--brand-text-dim)' }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECCIÓN SEO SEMÁNTICA (Texto Enriquecido para Googlebot) ── */}
      <section aria-labelledby="seo-about-heading" className="w-full mt-10 md:mt-14 pt-8 border-t border-white/5" style={{ color: 'var(--brand-text-muted)' }}>
        <h2 id="seo-about-heading" className="text-sm font-black text-white/50 uppercase tracking-widest mb-4">DIROGSA: Distribuidor e Importador de Filtros Automotrices con Venta al por Mayor</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs md:text-sm leading-relaxed text-justify md:text-left">
          <p>
            Bienvenido al <strong>Catálogo de Repuestos y Filtros DIROGSA - Buscador Principal</strong>. Como <em>distribuidor e importador en Perú</em>, nos especializamos en la <strong>venta al por mayor</strong> con <strong>cobertura nacional a todo el Perú</strong>. Nuestro inventario cuenta con un catálogo completo de repuestos originales y alternativos de primera línea para talleres, lubricentros y flotas. Encuentra <strong>filtros de aceite</strong>, <strong>filtros de aire</strong>, <strong>filtros de combustible</strong> y <strong>filtros de cabina</strong> diseñados para garantizar el rendimiento óptimo del motor.
          </p>
          <p>
            Entendemos que la precisión es clave en el mantenimiento automotriz preventivo. Nuestra plataforma te permite realizar búsquedas exactas por <strong>código de producto o vehículo</strong>. De esta forma, aseguramos la compatibilidad perfecta para el motor, ya sea para reducir el riesgo de desgaste en flotas corporativas, o para cuidar el motor de tu vehículo exclusivo de alta gama.
          </p>
          <p>
            Somos líderes indiscutibles en <strong>Perú</strong> para la distribución al por mayor y menor de <strong>filtros importados</strong> de fabricantes premium como <strong>Wix, Filtron, Hengst, Asakashi, Totachi y Mann-Filter</strong>. DIROGSA es tu aliado estratégico comercial. <strong>Venta al por mayor para negocios, y venta al por menor para modelos muy exclusivos de alta gama con envíos inmediatos y cobertura nacional.</strong>
          </p>
        </div>
      </section>

    </div>
  );
}
