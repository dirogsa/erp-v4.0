// SERVER COMPONENT — No 'use client' directiva. Permite inyectar JSON-LD sin JS en cliente.
import Link from 'next/link';
import Image from 'next/image';
import SearchModule from '@/components/SearchModule';
import SearchSkeleton from '@/components/SearchSkeleton';
import { Suspense } from 'react';
import { PRODUCT_CATEGORIES, HOME_SEO_HUB_BRANDS, SITE_URL } from '@/config/seo.config';

// Metadata a nivel de página (extiende el template del layout)
export const metadata = {
  title: 'DIROGSA | Filtros y Repuestos Automotrices en Perú',
  description: 'Importador oficial de filtros importados en Perú. Venta mayorista y minorista de WIX Filters, MANN-FILTER, AZUMI y TOTACHI para todo tipo de vehículos.',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    url: SITE_URL,
    title: 'DIROGSA | Filtros Importados y Repuestos en Perú',
    description: 'Catálogo oficial de filtros importados WIX, MANN, AZUMI y TOTACHI en Perú. Distribuidor oficial con cobertura nacional.',
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
            <Image 
              src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800" 
              alt="Almacén de logística DIROGSA — Distribución Nacional"
              className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity duration-500"
              priority={true}
              fill={true}
              sizes="(max-width: 768px) 100vw, 33vw"
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
            <Image 
              src="https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?auto=format&fit=crop&q=80&w=800" 
              alt="Tecnología Nanoflow — Filtración de alta eficiencia"
              className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity duration-500"
              fill={true}
              sizes="(max-width: 768px) 100vw, 33vw"
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
            <Image 
              src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800" 
              alt="Línea Industrial Pesada — Filtros para maquinaria minera"
              className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity duration-500"
              fill={true}
              sizes="(max-width: 768px) 100vw, 33vw"
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
          <Suspense fallback={<SearchSkeleton />}>
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
        <h2 id="seo-about-heading" className="text-sm font-black text-white/50 uppercase tracking-widest mb-4">DIROGSA: Importador y Distribuidor Oficial de Filtros Automotrices en Perú</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs md:text-sm leading-relaxed text-justify md:text-left">
          <p>
            Bienvenido al <strong>Catálogo de Repuestos y Filtros DIROGSA - Buscador Principal</strong>. Como <em>importador y distribuidor oficial en Perú</em>, nos especializamos en ofrecer la más alta calidad en soluciones de filtración vehicular e industrial. Nuestro inventario cuenta con un catálogo completo de repuestos originales y alternativos de primera línea. Encuentra en nuestra tienda <strong>filtros de aceite</strong>, <strong>filtros de aire</strong>, <strong>filtros de combustible</strong> y <strong>filtros de cabina</strong>, diseñados para garantizar el rendimiento óptimo y la protección del motor de tu vehículo en las exigentes rutas de nuestro país.
          </p>
          <p>
            Entendemos que la precisión es clave en el mantenimiento automotriz preventivo y correctivo. Por ello, nuestra plataforma tecnológica de ecommerce te permite realizar búsquedas exactas por <strong>código de producto, marca del vehículo, modelo o medidas técnicas específicas</strong>. De esta forma, aseguramos la compatibilidad perfecta para tu motor, reduciendo el riesgo de desgaste prematuro de piezas y maximizando el ahorro de combustible en tu flota o vehículo particular.
          </p>
          <p>
            Trabajamos con las marcas más reconocidas a nivel mundial en el rubro automotriz, siendo líderes indiscutibles en <strong>Perú</strong> para la venta y distribución a nivel nacional de <strong>filtros importados</strong> de fabricantes premium como <strong>WIX Filters, MANN-FILTER, AZUMI y TOTACHI</strong>. Estos componentes integran tecnología de vanguardia y medios filtrantes de alta eficiencia para asegurar una protección superior al 99%. Nuestro catálogo está especializado en la línea ligera de autos de pasajeros, SUVs, camionetas pick-up y vehículos comerciales de carga ligera que recorren las diversas rutas peruanas. DIROGSA es tu aliado estratégico, comprometiéndonos a mantener tu vehículo siempre en movimiento con la máxima seguridad, exactitud en las compatibilidades y garantía de fábrica en cada repuesto. <strong>Envíos inmediatos a todo el Perú.</strong>
          </p>
        </div>
      </section>

    </div>
  );
}
