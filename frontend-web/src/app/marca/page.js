/**
 * INDEX PAGE: Marcas de Filtros/Repuestos
 * CONSTITUTION §6 — Premium UI.
 *
 * Esta página sirve como nodo raíz del árbol de Marcas en el Hub & Spoke.
 * Captura búsquedas como: "marcas de filtros peru", "distribuidores wix peru".
 * Enlaza hacia cada /marca/[brand] Hub page.
 */

import Link from 'next/link';
import { SITE_URL } from '@/config/seo.config';

export const metadata = {
  title: 'Marcas de Filtros Importados | WIX, MANN, AZUMI, TOTACHI — DIROGSA Perú',
  description: 'Distribuidor oficial de las mejores marcas de filtros automotrices en Perú: WIX Filters (USA), MANN-FILTER (Alemania), AZUMI (Japón) y TOTACHI (Japón). Envíos nacionales.',
  alternates: { canonical: `${SITE_URL}/marca` },
};

const BRANDS = [
  {
    slug: 'wix',
    name: 'WIX Filters',
    origin: 'USA 🇺🇸',
    tagline: 'La marca #1 en USA',
    description: 'Más de 80 años protegiendo motores. La marca de filtros más vendida en Estados Unidos con tecnología de filtración de alto rendimiento.',
    color: '#F59E0B',
    categories: ['Aceite', 'Aire', 'Combustible', 'Cabina'],
  },
  {
    slug: 'mann',
    name: 'MANN-FILTER',
    origin: 'Alemania 🇩🇪',
    tagline: 'Precisión alemana OEM',
    description: 'Líder europeo en filtración de precisión. Proveedor original (OEM) de las principales marcas de automóviles del mundo.',
    color: '#3B82F6',
    categories: ['Aceite', 'Aire', 'Combustible'],
  },
  {
    slug: 'azumi',
    name: 'AZUMI',
    origin: 'Japón 🇯🇵',
    tagline: 'Calidad japonesa para Latinoamérica',
    description: 'Especialista en filtros para el mercado latinoamericano. Excelente relación precio-calidad con tecnología japonesa comprobada.',
    color: '#10B981',
    categories: ['Aceite', 'Aire', 'Combustible', 'Cabina'],
  },
  {
    slug: 'totachi',
    name: 'TOTACHI',
    origin: 'Japón 🇯🇵',
    tagline: 'Lubricantes y filtros premium',
    description: 'Marca premium japonesa reconocida por su tecnología de lubricantes y filtros de alta performance para motores modernos.',
    color: '#8B5CF6',
    categories: ['Aceite', 'Lubricantes'],
  },
];

const brandJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Marcas de Filtros Automotrices | DIROGSA Perú',
  description: 'Distribuidores oficiales de WIX, MANN-FILTER, AZUMI y TOTACHI en Perú',
  itemListElement: BRANDS.map((b, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `${SITE_URL}/marca/${b.slug}`,
    name: b.name,
  })),
};

export default function MarcasIndexPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-12">

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(brandJsonLd) }} />

      {/* ─── BREADCRUMB ─── */}
      <nav aria-label="Ruta de navegación" className="mb-8">
        <ol className="flex items-center gap-2 text-xs list-none p-0 m-0" style={{ color: 'var(--brand-text-dim)' }}>
          <li><Link href="/" className="hover:text-white transition-colors">Inicio</Link></li>
          <li aria-hidden="true"><span className="opacity-40">/</span></li>
          <li className="text-white font-bold" aria-current="page">Marcas</li>
        </ol>
      </nav>

      {/* ─── HERO ─── */}
      <header className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
             style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--brand-primary)' }}>
            Distribuidores Oficiales en Perú
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-tight mb-4">
          Marcas de{' '}
          <span style={{ color: 'var(--brand-primary)' }}>Filtros Importados</span>
        </h1>
        <p className="text-sm md:text-lg max-w-2xl mx-auto" style={{ color: 'var(--brand-text-dim)' }}>
          DIROGSA importa y distribuye las marcas de filtros más reconocidas del mundo.
          Calidad certificada con garantía de fábrica y envíos a todo el Perú.
        </p>
      </header>

      {/* ─── BRAND CARDS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {BRANDS.map((brand) => (
          <Link
            key={brand.slug}
            href={`/marca/${brand.slug}`}
            className="group relative overflow-hidden rounded-[2rem] p-8 transition-all hover:scale-[1.02]"
            style={{
              background: `linear-gradient(135deg, ${brand.color}08, transparent)`,
              border: `1px solid ${brand.color}25`,
            }}
          >
            {/* Glow decorativo */}
            <div
              className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"
              style={{ background: brand.color, transform: 'translate(30%, -30%)' }}
            />

            <div className="relative z-10">
              {/* Header de la tarjeta */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-[10px] font-bold" style={{ color: brand.color }}>
                    {brand.origin}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mt-1">
                    {brand.name}
                  </h2>
                  <p className="text-xs font-bold mt-1" style={{ color: brand.color }}>
                    {brand.tagline}
                  </p>
                </div>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black shrink-0"
                  style={{ background: `${brand.color}20`, color: brand.color }}
                >
                  {brand.name[0]}
                </div>
              </div>

              <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--brand-text-dim)' }}>
                {brand.description}
              </p>

              {/* Tags de categorías */}
              <div className="flex flex-wrap gap-2 mb-6">
                {brand.categories.map(cat => (
                  <span
                    key={cat}
                    className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg"
                    style={{ background: `${brand.color}15`, color: brand.color, border: `1px solid ${brand.color}25` }}
                  >
                    Filtros de {cat}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <div
                className="inline-flex items-center gap-2 font-black text-xs uppercase tracking-widest"
                style={{ color: brand.color }}
              >
                Ver Catálogo Completo
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ─── SEO SEMÁNTICO ─── */}
      <section aria-labelledby="seo-brands-heading" className="pt-10 border-t border-white/5"
               style={{ color: 'var(--brand-text-muted)' }}>
        <h2 id="seo-brands-heading" className="text-sm font-black text-white/50 uppercase tracking-widest mb-5">
          DIROGSA — Importador Oficial de Filtros en Perú
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs md:text-sm leading-relaxed">
          <p>
            <strong>DIROGSA</strong> es el importador y distribuidor oficial en Perú de las marcas de filtros
            automotrices más reconocidas del mundo. Trabajamos directamente con fabricantes de{' '}
            <strong>USA, Alemania y Japón</strong> para garantizar productos 100% originales con certificación
            de calidad internacional. Nuestro catálogo supera los 5,000 códigos disponibles para todo tipo
            de vehículos: autos de pasajeros, SUVs, camionetas, buses y maquinaria pesada.
          </p>
          <p>
            Si buscas <strong>filtros WIX en Perú</strong>, <strong>filtros MANN-FILTER</strong>,{' '}
            <strong>filtros AZUMI</strong> o <strong>filtros TOTACHI</strong>, has llegado al lugar correcto.
            Somos su distribuidor con la mayor cobertura y el catálogo más completo del mercado peruano.
            Realizamos despachos a Lima, Arequipa, Trujillo, Cusco y a nivel nacional.
            Para pedidos al por mayor, contáctanos para conocer nuestros precios B2B.
          </p>
        </div>
      </section>
    </div>
  );
}
