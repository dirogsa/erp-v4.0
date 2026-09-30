/**
 * INDEX PAGE: Marcas con productos activos — DIROGSA
 *
 * Arquitectura: 100% API-driven. No hay hardcoding de marcas.
 * La fuente de verdad es ProductBrand en MongoDB, administrado desde el ERP.
 * Agregar/editar una marca en el ERP → aparece/actualiza aquí automáticamente.
 */

import Link from 'next/link';
import { SITE_URL } from '@/config/seo.config';

export const revalidate = 3600; // ISR 1h — se regenera cuando hay cambios en marcas

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Default theme para marcas sin metadata configurada (editables desde el ERP)
const DEFAULT_THEME = { color: '#38BDF8', origin: 'Importado' };

export const metadata = {
  title: 'Marcas de Filtros Importados | WIX, FILTRON, AZUMI, TOTACHI — DIROGSA Perú',
  description: 'Distribuidor oficial de las mejores marcas de filtros automotrices en Perú. Envíos nacionales.',
  alternates: { canonical: `${SITE_URL}/brand` },
};

async function getFeaturedBrands() {
  try {
    const res = await fetch(`${API_BASE}/shop/seo/brands`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const all = await res.json();
    // Show brands marked as featured in the brand hub, sorted by product count
    return all.filter(b => b.show_in_brand_hub && b.is_active !== false);
  } catch {
    return [];
  }
}

export default async function MarcasIndexPage() {
  const brands = await getFeaturedBrands();

  const brandJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Marcas de Filtros Automotrices | DIROGSA Perú',
    description: 'Distribuidores oficiales de filtros automotrices en Perú',
    itemListElement: brands.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/brand/${b.slug}`,
      name: b.name,
    })),
  };

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
      {brands.length === 0 ? (
        <div className="text-center py-20" style={{ color: 'var(--brand-text-dim)' }}>
          <p>Cargando marcas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {brands.map((brand) => {
            const color = brand.theme_color || DEFAULT_THEME.color;
            return (
              <Link
                key={brand.slug}
                href={`/brand/${brand.slug}`}
                className="group relative overflow-hidden rounded-[2rem] p-8 transition-all hover:scale-[1.02]"
                style={{
                  background: `linear-gradient(135deg, ${color}08, transparent)`,
                  border: `1px solid ${color}25`,
                }}
              >
                {/* Glow decorativo */}
                <div
                  className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"
                  style={{ background: color, transform: 'translate(30%, -30%)' }}
                />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-[10px] font-bold" style={{ color }}>
                        {brand.origin || DEFAULT_THEME.origin}
                      </span>
                      <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mt-1">
                        {brand.name}
                      </h2>
                      {brand.tagline && (
                        <p className="text-xs font-bold mt-1" style={{ color }}>
                          {brand.tagline}
                        </p>
                      )}
                    </div>
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black shrink-0"
                      style={{ background: `${color}20`, color }}
                    >
                      {brand.name[0]}
                    </div>
                  </div>

                  {brand.description && (
                    <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--brand-text-dim)' }}>
                      {brand.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-3 py-1.5 rounded-xl"
                          style={{ background: `${color}10`, color, border: `1px solid ${color}25` }}>
                      {brand.product_count} productos
                    </span>
                    <div className="inline-flex items-center gap-2 font-black text-xs uppercase tracking-widest" style={{ color }}>
                      Ver Catálogo
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

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
            <strong>USA, Europa y Japón</strong> para garantizar productos 100% originales con certificación
            de calidad internacional. Nuestro catálogo supera los 5,000 códigos disponibles para todo tipo
            de vehículos: autos de pasajeros, SUVs, camionetas, buses y maquinaria pesada.
          </p>
          <p>
            Si buscas <strong>filtros al por mayor en Perú</strong>, has llegado al lugar correcto.
            Somos tu distribuidor con la mayor cobertura y el catálogo más completo del mercado peruano.
            Realizamos despachos a Lima, Arequipa, Trujillo, Cusco y a nivel nacional.
            Para pedidos B2B, contáctanos para conocer nuestros precios mayoristas.
          </p>
        </div>
      </section>
    </div>
  );
}
