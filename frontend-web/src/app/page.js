// SERVER COMPONENT — No 'use client' directiva. Permite inyectar JSON-LD sin JS en cliente.
import Link from 'next/link';
import Image from 'next/image';
import SearchModule from '@/components/SearchModule';
import SearchSkeleton from '@/components/SearchSkeleton';
import LogisticsSection from '@/components/LogisticsSection';
import { Suspense } from 'react';
import { PRODUCT_CATEGORIES, HOME_SEO_HUB_BRANDS, SITE_URL } from '@/config/seo.config';
import { ProductService } from '@/services/product.service';
import { toSlug } from '@/lib/slug';

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

export default async function HomePage() {
  const categoriesRaw = await ProductService.getCategories();
  let homeCategories = [];
  try {
    const parentFiltros = categoriesRaw.find(c => c.name.toUpperCase().includes('FILTRO') && !c.parent_id);
    const parentFiltrosId = parentFiltros ? parentFiltros._id : null;
    const childCategories = categoriesRaw.filter(c => c.parent_id === parentFiltrosId);
    
    homeCategories = childCategories.slice(0, 4).map(c => ({
      slug: toSlug(c.name),
      label: c.name
    }));
  } catch (err) {
    console.error('[HomePage] Error processing dynamic categories:', err.message);
  }

  if (homeCategories.length === 0) {
    homeCategories = PRODUCT_CATEGORIES.slice(0, 4).map(c => ({
      slug: c.slug.toLowerCase(),
      label: c.label
    }));
  }

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
        urlTemplate: 'https://dirogsa.com/search?q={search_term_string}&type=codes',
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
    telephone: '+51991717240',
    email: 'ventas@dirogsa.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Lima', // Dirección principal
      addressLocality: 'Lima',
      addressRegion: 'Lima',
      postalCode: '15001',
      addressCountry: 'PE',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+51991717240',
      contactType: 'customer service',
      availableLanguage: 'Spanish',
    },
    sameAs: [
      'https://www.facebook.com/dirogsa',
      'https://www.instagram.com/dirogsa',
      'https://pe.linkedin.com/company/dirogsa'
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

      {/* ── ZONA 1: HIGH CONVERSION (Above the Fold) ── */}
      <section className="w-full text-center md:text-left pt-2 pb-6 flex flex-col md:items-start items-center">
        <span className="px-3 py-1 text-[10px] md:text-xs font-black uppercase tracking-widest text-brand-primary border border-brand-primary/30 bg-brand-primary/10 rounded-full mb-4 inline-block">
          Importación y Distribución Nacional
        </span>
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tighter mb-4 max-w-4xl">
          Plataforma B2B de <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-emerald-300">Abastecimiento</span>
        </h1>
        <p className="text-sm md:text-lg text-white/80 max-w-2xl mb-8 leading-relaxed">
          Cotiza online filtros originales y certificados OEM (WIX, Filtron) al por mayor. Despacho diario a nivel nacional.
        </p>

        {/* ── BUSCADOR INMEDIATO (Prioridad Absoluta UX) ── */}
        <div className="w-full w-full max-w-5xl relative z-10">
          <section aria-labelledby="search-heading" className="w-full">
            <h2 id="search-heading" className="sr-only">Módulo de Búsqueda de Productos</h2>
            <Suspense fallback={<SearchSkeleton />}>
              <SearchModule />
            </Suspense>
          </section>
        </div>
      </section>

      {/* ── ZONA 2: CONFIANZA B2B Y OPERACIÓN REAL (Logística) ── */}
      <LogisticsSection />

      {/* ── ZONA 3: ¿CÓMO FUNCIONA? (Flujo de la Plataforma) ── */}
      <section className="w-full my-8 md:my-12" aria-labelledby="how-it-works-heading">
        <div className="text-center mb-8">
          <h2 id="how-it-works-heading" className="text-2xl md:text-3xl font-black text-white mb-2">¿Cómo funciona?</h2>
          <p className="text-white/60 text-sm md:text-base">Proceso automatizado para talleres y concesionarias.</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 relative">
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-[1px] bg-white/10 -z-10" />

          <div className="bg-[#141518] md:bg-[#141518]/90 md:backdrop-blur-sm border border-white/10 rounded-2xl p-4 md:p-6 flex flex-col items-center text-center relative">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#0A0A0B] border-2 border-brand-primary/50 text-brand-primary flex items-center justify-center font-black text-lg md:text-xl mb-3 md:shadow-[0_0_15px_rgba(16,185,129,0.2)]">1</div>
            <h3 className="font-bold text-white text-sm md:text-base mb-1">Busca</h3>
            <p className="text-[10px] md:text-xs text-white/60">Por código o vehículo.</p>
          </div>

          <div className="bg-[#141518] md:bg-[#141518]/90 md:backdrop-blur-sm border border-white/10 rounded-2xl p-4 md:p-6 flex flex-col items-center text-center relative">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#0A0A0B] border-2 border-brand-primary/50 text-brand-primary flex items-center justify-center font-black text-lg md:text-xl mb-3 md:shadow-[0_0_15px_rgba(16,185,129,0.2)]">2</div>
            <h3 className="font-bold text-white text-sm md:text-base mb-1">Cotiza</h3>
            <p className="text-[10px] md:text-xs text-white/60">Agrega a tu lista web.</p>
          </div>

          <div className="bg-[#141518] md:bg-[#141518]/90 md:backdrop-blur-sm border border-white/10 rounded-2xl p-4 md:p-6 flex flex-col items-center text-center relative">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#0A0A0B] border-2 border-brand-primary/50 text-brand-primary flex items-center justify-center font-black text-lg md:text-xl mb-3 md:shadow-[0_0_15px_rgba(16,185,129,0.2)]">3</div>
            <h3 className="font-bold text-white text-sm md:text-base mb-1">Envía</h3>
            <p className="text-[10px] md:text-xs text-white/60">Recibe precios B2B.</p>
          </div>

          <div className="bg-[#141518] md:bg-[#141518]/90 md:backdrop-blur-sm border border-brand-primary/30 rounded-2xl p-4 md:p-6 flex flex-col items-center text-center relative md:shadow-[0_0_20px_rgba(16,185,129,0.05)]">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-brand-primary text-[#0A0A0B] flex items-center justify-center font-black text-lg md:text-xl mb-3 md:shadow-[0_0_15px_rgba(16,185,129,0.4)] shadow-sm">4</div>
            <h3 className="font-bold text-white text-sm md:text-base mb-1">Recibe</h3>
            <p className="text-[10px] md:text-xs text-white/70">Despacho nacional.</p>
          </div>
        </div>
      </section>


      {/* ── ZONA 4: SEO BASEMENT (Información Comercial y Hubs de Enlaces) ── */}
      <div className="mt-10 md:mt-16 pt-8 border-t border-white/5 opacity-80 hover:opacity-100 transition-opacity">
        
        {/* Canales de Abastecimiento */}
        <section className="w-full mb-12" aria-labelledby="channels-heading">
          <div className="mb-6">
            <h2 id="channels-heading" className="text-xl md:text-2xl font-black text-white mb-2">Canales de Abastecimiento</h2>
            <p className="text-white/60 text-sm">Garantizamos disponibilidad, certificación OEM y soporte B2B.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#141518]/40 border border-white/5 rounded-2xl p-5">
              <h3 className="text-brand-primary font-black text-[10px] uppercase tracking-widest mb-2">Concesionarias</h3>
              <p className="text-[11px] text-white/60 leading-relaxed">Estándares internacionales exigidos por fabricantes para mantener la garantía de fábrica en vehículos nuevos.</p>
            </div>
            <div className="bg-[#141518]/40 border border-white/5 rounded-2xl p-5">
              <h3 className="text-brand-primary font-black text-[10px] uppercase tracking-widest mb-2">Talleres Premium</h3>
              <p className="text-[11px] text-white/60 leading-relaxed">Filtros certificados para marcas europeas y exclusivas. Máximo rendimiento del motor bajo pedido.</p>
            </div>
            <div className="bg-[#141518]/40 border border-white/5 rounded-2xl p-5">
              <h3 className="text-brand-primary font-black text-[10px] uppercase tracking-widest mb-2">Lubricentros</h3>
              <p className="text-[11px] text-white/60 leading-relaxed">Abastecimiento constante para stock diario. Precios escalables por volumen en filtros de alta rotación.</p>
            </div>
            <div className="bg-[#141518]/40 border border-white/5 rounded-2xl p-5">
              <h3 className="text-brand-primary font-black text-[10px] uppercase tracking-widest mb-2">Provincias</h3>
              <p className="text-[11px] text-white/60 leading-relaxed">Consolidación logística con envíos rápidos a todo el país. Disponibilidad en tu región sin retrasos.</p>
            </div>
          </div>
        </section>

        {/* HUB SEO PROGRAMÁTICO */}
        <section aria-labelledby="seo-hub-heading" className="w-full mb-12">
          <h2 id="seo-hub-heading" className="text-[10px] font-black uppercase tracking-widest mb-5 text-white/40">Explorar Directorio</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-3 text-white/30">Tipo de filtro</p>
              <div className="flex flex-wrap gap-2">
                {homeCategories.map(({ slug, label }) => (
                  <Link key={slug} href={`/catalog/${slug}`} className="px-3 py-1.5 rounded-lg text-[10px] font-bold border border-white/10 bg-[#141518]/50 text-white/60 hover:text-white transition-colors">
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Marcas */}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-3 text-white/30">Marcas importadas</p>
              <div className="flex flex-wrap gap-2">
                {['wix', 'mann', 'azumi', 'totachi'].map((slug) => (
                  <Link key={slug} href={`/brand/${slug}`} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border border-white/10 bg-[#141518]/50 text-white/60 hover:text-white transition-colors">
                    {slug}
                  </Link>
                ))}
              </div>
            </div>

            {/* Vehículos */}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-3 text-white/30">Filtros por vehículo</p>
              <div className="flex flex-wrap gap-2">
                {HOME_SEO_HUB_BRANDS.slice(0, 6).map(({ label, slug }) => (
                  <Link key={slug} href={`/vehicle/${slug}`} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border border-white/10 bg-[#141518]/50 text-white/60 hover:text-white transition-colors">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SEO Semántica (Texto Enriquecido) */}
        <section aria-labelledby="seo-about-heading" className="w-full pt-6 border-t border-white/5">
          <h2 id="seo-about-heading" className="sr-only">Sobre DIROGSA</h2>
          <div className="text-[10px] leading-relaxed text-justify text-white/40">
            <p>
              DIROGSA es un importador y distribuidor mayorista de filtros automotrices en Perú, especialista en carga ligera, SUVs, camionetas y vehículos de alta gama. Nuestra plataforma B2B permite cotizar online filtros originales y certificados OEM de marcas premium como WIX, Filtron y Hengst. Atendemos a concesionarias autorizadas, talleres especializados, lubricentros y distribuidores con cobertura y envíos rápidos a provincias a nivel nacional.
            </p>
          </div>
        </section>

      </div>

    </div>
  );
}
