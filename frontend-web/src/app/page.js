// SERVER COMPONENT — No 'use client' directiva. Permite inyectar JSON-LD sin JS en cliente.
import Link from 'next/link';
import Image from 'next/image';
import SearchModule from '@/components/SearchModule';
import SearchSkeleton from '@/components/SearchSkeleton';
import LogisticsSection from '@/components/LogisticsSection';
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
          Plataforma B2B de <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-emerald-300">Abastecimiento de Filtros</span>
        </h1>
        <p className="text-base md:text-lg text-white/80 max-w-2xl mb-6 leading-relaxed">
          Cotiza online filtros originales y certificados OEM de marcas líderes como <strong>WIX, Filtron y Hengst</strong> para vehículos livianos, SUVs, camionetas y modelos de alta gama.
        </p>
        
        <ul className="flex flex-col gap-3 mb-8 text-sm md:text-base text-white/85 text-left max-w-2xl">
          <li className="flex items-start gap-3">
            <span className="text-brand-primary font-black mt-0.5">✅</span>
            <span><strong>Cotización Web Mayorista:</strong> Precios preferenciales y disponibilidad inmediata.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-brand-primary font-black mt-0.5">✅</span>
            <span><strong>Socios de Concesionarias y Talleres:</strong> Filtros certificados que no alteran la garantía de fábrica.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-brand-primary font-black mt-0.5">✅</span>
            <span><strong>Líderes en Distribución Regional:</strong> Despachos y envíos rápidos diarios a provincias en todo el Perú.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-brand-primary font-black mt-0.5">✅</span>
            <span><strong>Especialistas en Carga Ligera & Premium:</strong> Alta disponibilidad para SUVs, camionetas y autos de alta gama.</span>
          </li>
        </ul>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="#search-heading" className="bg-brand-primary text-[#0A0A0B] px-6 py-3.5 md:py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:brightness-110 transition-all md:shadow-[0_0_20px_rgba(16,185,129,0.2)] text-center flex items-center justify-center gap-2">
            Acceder a Cotización Web
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
          <Link href="/catalogo" className="border border-white/20 bg-[#141518]/80 text-white px-6 py-3.5 md:py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-center">
            Ver Catálogo Mayorista
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
          <div className="bg-[#141518] md:bg-[#141518]/90 md:backdrop-blur-sm border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center relative">
            <div className="w-12 h-12 rounded-full bg-[#0A0A0B] border-2 border-brand-primary/50 text-brand-primary flex items-center justify-center font-black text-xl mb-4 md:shadow-[0_0_15px_rgba(16,185,129,0.2)]">1</div>
            <h3 className="font-bold text-white mb-2">Busca tu Filtro</h3>
            <p className="text-xs text-white/60">Encuentra por código, vehículo o medidas exactas.</p>
          </div>

          {/* Paso 2 */}
          <div className="bg-[#141518] md:bg-[#141518]/90 md:backdrop-blur-sm border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center relative">
            <div className="w-12 h-12 rounded-full bg-[#0A0A0B] border-2 border-brand-primary/50 text-brand-primary flex items-center justify-center font-black text-xl mb-4 md:shadow-[0_0_15px_rgba(16,185,129,0.2)]">2</div>
            <h3 className="font-bold text-white mb-2">Arma tu Cotización</h3>
            <p className="text-xs text-white/60">Agrega productos a tu lista web de forma rápida.</p>
          </div>

          {/* Paso 3 */}
          <div className="bg-[#141518] md:bg-[#141518]/90 md:backdrop-blur-sm border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center relative">
            <div className="w-12 h-12 rounded-full bg-[#0A0A0B] border-2 border-brand-primary/50 text-brand-primary flex items-center justify-center font-black text-xl mb-4 md:shadow-[0_0_15px_rgba(16,185,129,0.2)]">3</div>
            <h3 className="font-bold text-white mb-2">Envía Solicitud</h3>
            <p className="text-xs text-white/60">Manda tu lista online para recibir precios mayoristas.</p>
          </div>

          {/* Paso 4 */}
          <div className="bg-[#141518] md:bg-[#141518]/90 md:backdrop-blur-sm border border-brand-primary/30 rounded-2xl p-6 flex flex-col items-center text-center relative md:shadow-[0_0_20px_rgba(16,185,129,0.05)]">
            <div className="w-12 h-12 rounded-full bg-brand-primary text-[#0A0A0B] flex items-center justify-center font-black text-xl mb-4 md:shadow-[0_0_15px_rgba(16,185,129,0.4)] shadow-sm">4</div>
            <h3 className="font-bold text-white mb-2">Recibe tu Pedido</h3>
            <p className="text-xs text-white/70">Atención comercial y despacho a nivel nacional.</p>
          </div>
        </div>
      </section>



      {/* ── SECCIÓN: CANALES DE ABASTECIMIENTO (Prueba Social & Confianza B2B) ── */}
      <section className="w-full mb-16 md:mb-20" aria-labelledby="channels-heading">
        <div className="text-center mb-8">
          <h2 id="channels-heading" className="text-2xl md:text-3xl font-black text-white mb-2">Canales de Abastecimiento Especializado</h2>
          <p className="text-white/60 text-sm md:text-base">Garantizamos disponibilidad, certificación OEM y soporte para cada segmento.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Canal 1: Concesionarias */}
          <div className="bg-[#141518]/40 border border-white/5 rounded-2xl p-6 hover:border-brand-primary/30 transition-all duration-300">
            <h3 className="text-brand-primary font-black text-xs uppercase tracking-widest mb-2">Casas de Auto y Concesionarias</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Cumplimos los estándares internacionales exigidos por fabricantes para mantener la garantía de fábrica en vehículos nuevos de pasajeros y SUVs.
            </p>
          </div>

          {/* Canal 2: Talleres de Prestigio */}
          <div className="bg-[#141518]/40 border border-white/5 rounded-2xl p-6 hover:border-brand-primary/30 transition-all duration-300">
            <h3 className="text-brand-primary font-black text-xs uppercase tracking-widest mb-2">Talleres Especializados y Premium</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Filtros certificados para marcas europeas, americanas y líneas exclusivas de alta gama. Máximo rendimiento del motor bajo pedido.
            </p>
          </div>

          {/* Canal 3: Lubricentros y Multi-marcas */}
          <div className="bg-[#141518]/40 border border-white/5 rounded-2xl p-6 hover:border-brand-primary/30 transition-all duration-300">
            <h3 className="text-brand-primary font-black text-xs uppercase tracking-widest mb-2">Lubricentros y Mayoristas</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Abastecimiento constante para stock diario. Precios preferenciales y escalables por volumen en filtros de alta rotación (aceite, aire y cabina).
            </p>
          </div>

          {/* Canal 4: Provincias */}
          <div className="bg-[#141518]/40 border border-white/5 rounded-2xl p-6 hover:border-brand-primary/30 transition-all duration-300">
            <h3 className="text-brand-primary font-black text-xs uppercase tracking-widest mb-2">Distribución en Provincias</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Consolidación logística con envíos rápidos diarios a todo el interior del país. Aseguramos disponibilidad en tu región sin retrasos.
            </p>
          </div>
        </div>
      </section>




      {/* ── SECCIÓN: NUESTRA OPERACIÓN LOGÍSTICA REAL (Credibilidad B2B) ── */}
      <LogisticsSection />



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
            DIROGSA es un importador y distribuidor mayorista de filtros automotrices en Perú, especialista en carga ligera, SUVs, camionetas y vehículos de alta gama. Nuestra plataforma B2B permite cotizar online filtros originales y certificados OEM de marcas premium como WIX, Filtron y Hengst. Atendemos a concesionarias autorizadas, talleres especializados, lubricentros y distribuidores con cobertura y envíos rápidos a provincias a nivel nacional.
          </p>
        </div>
      </section>

    </div>
  );
}
