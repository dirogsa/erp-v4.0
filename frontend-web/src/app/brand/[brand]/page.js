/**
 * HUB PAGE: Marca de Filtros — DIROGSA
 *
 * Arquitectura: 100% API-driven. Sin hardcoding de marcas ni config files.
 * La fuente de verdad es ProductBrand en MongoDB, administrado desde el ERP.
 *
 * Captura búsquedas como:
 *   "filtros WIX peru"     → /brand/wix
 *   "filtros FILTRON peru" → /brand/filtron
 *   "repuestos AZUMI peru" → /brand/azumi
 *
 * Productos: se obtienen con brand= filter (B-Tree exact match, NO Atlas Search).
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE_URL } from '@/config/seo.config';
import { ProductService } from '@/services/product.service';

export const revalidate = 43200; // ISR 12h

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const DEFAULT_COLOR = '#38BDF8';

async function getAllActiveBrands() {
  try {
    const res = await fetch(`${API_BASE}/shop/seo/brands`, {
      next: { revalidate: 43200 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function findBrandBySlug(slug) {
  const brands = await getAllActiveBrands();
  return brands.find(b => b.slug === slug.toLowerCase()) || null;
}

export async function generateStaticParams() {
  const brands = await getAllActiveBrands();
  // Only generate pages for featured brands (those with dedicated hub pages)
  return brands
    .filter(b => b.is_featured)
    .map(b => ({ brand: b.slug }));
}

export async function generateMetadata({ params }) {
  const { brand: brandSlug } = await params;
  const brandInfo = await findBrandBySlug(brandSlug);
  if (!brandInfo) return { title: 'Marca no encontrada | DIROGSA' };

  const title = `Filtros ${brandInfo.name} en Perú | DIROGSA`;
  const description = brandInfo.description
    ? `${brandInfo.description} Distribuidor autorizado con stock disponible y envíos nacionales.`
    : `Catálogo oficial de filtros ${brandInfo.name} en Perú. Distribuidor con stock y envíos nacionales.`;

  return {
    title,
    description,
    keywords: [
      `filtros ${brandInfo.name}`, `${brandInfo.name} peru`,
      `comprar ${brandInfo.name} peru`, `distribuidor ${brandInfo.name}`,
      'filtros automotrices peru', 'dirogsa',
    ],
    alternates: { canonical: `${SITE_URL}/brand/${brandSlug}` },
    openGraph: { title, description, url: `${SITE_URL}/brand/${brandSlug}`, siteName: 'DIROGSA' },
  };
}

export default async function MarcaHubPage({ params }) {
  const { brand: brandSlug } = await params;
  const brandInfo = await findBrandBySlug(brandSlug);

  if (!brandInfo) notFound();

  const color = brandInfo.theme_color || DEFAULT_COLOR;

  // Fetch products by exact brand name — uses B-Tree index, not Atlas Search
  const { items: products, total, api_status } = await ProductService.getProducts({
    brand: brandInfo.name,
    limit: 24,
  });

  // Fetch sibling brands for cross-links (exclude current)
  const allBrands = await getAllActiveBrands();
  const siblingBrands = allBrands.filter(b => b.show_in_brand_hub && b.slug !== brandSlug);

  // ─── JSON-LD ───
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Marcas', item: `${SITE_URL}/brand` },
      { '@type': 'ListItem', position: 3, name: brandInfo.name, item: `${SITE_URL}/brand/${brandSlug}` },
    ],
  };

  const brandJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Brand',
    name: brandInfo.name,
    description: brandInfo.description || '',
    url: `${SITE_URL}/brand/${brandSlug}`,
  };

  const itemListJsonLd = products.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Filtros ${brandInfo.name} en Perú`,
    numberOfItems: total,
    itemListElement: products.slice(0, 10).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/product/${p.sku}`,
      name: `${brandInfo.name} ${p.sku} — ${p.name}`,
    })),
  } : null;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(brandJsonLd) }} />
      {itemListJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />}

      {/* ─── BREADCRUMB ─── */}
      <nav aria-label="Ruta de navegación" className="mb-8">
        <ol className="flex items-center gap-2 text-xs list-none p-0 m-0" style={{ color: 'var(--brand-text-dim)' }}>
          <li><Link href="/" className="hover:text-white transition-colors">Inicio</Link></li>
          <li aria-hidden="true"><span className="opacity-40">/</span></li>
          <li><Link href="/brand" className="hover:text-white transition-colors">Marcas</Link></li>
          <li aria-hidden="true"><span className="opacity-40">/</span></li>
          <li className="text-white font-bold" aria-current="page">{brandInfo.name}</li>
        </ol>
      </nav>

      {/* ─── HERO ─── */}
      <header className="mb-10">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-sm uppercase tracking-widest"
            style={{ background: `${color}15`, border: `1px solid ${color}40`, color }}
          >
            {brandInfo.name}
          </div>
          {brandInfo.origin && (
            <span className="text-[10px] font-bold px-3 py-1.5 rounded-xl"
                  style={{ background: 'var(--brand-surface)', color: 'var(--brand-text-dim)', border: '1px solid var(--brand-border)' }}>
              Origen: {brandInfo.origin}
            </span>
          )}
          <span className="text-[10px] font-bold px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--brand-primary)', border: '1px solid rgba(16,185,129,0.3)' }}>
            {total} productos
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-tight mb-4">
          Filtros <span style={{ color }}>{brandInfo.name}</span>{' '}
          <span className="text-white/30">en Perú</span>
        </h1>

        {brandInfo.description && (
          <p className="text-sm md:text-base max-w-2xl mb-6" style={{ color: 'var(--brand-text-dim)' }}>
            {brandInfo.description} Distribuidor oficial en Perú con stock garantizado y envíos a nivel nacional.
          </p>
        )}

        {brandInfo.tagline && (
          <p className="text-xs font-bold mb-4" style={{ color }}>✦ {brandInfo.tagline}</p>
        )}

        {/* Marketing bullets */}
        {brandInfo.marketing_bullets?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {brandInfo.marketing_bullets.map((bullet) => (
              <span key={bullet} className="inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-bold"
                    style={{ background: `${color}10`, color, border: `1px solid ${color}30` }}>
                {bullet}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* ─── PRODUCT GRID ─── */}
      {api_status === 'offline' ? (
        <div className="text-center py-20 px-4 border border-brand-primary/20 rounded-3xl bg-[#141518]/40 backdrop-blur-md relative overflow-hidden my-10">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary to-transparent opacity-50" />
          <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-wide mb-3">Catálogo en Mantenimiento</h3>
          <p className="text-brand-text-dim text-sm md:text-base max-w-lg mx-auto mb-8 leading-relaxed">
            Estamos sincronizando el catálogo <strong>{brandInfo.name}</strong>.
            Contáctanos directamente para tu cotización.
          </p>
          <a href="https://wa.me/51991717240" target="_blank" rel="noopener noreferrer"
             className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#25D366] text-black font-black uppercase text-sm tracking-widest hover:bg-[#25D366]/90 transition-all hover:scale-105">
            Cotizar por WhatsApp →
          </a>
        </div>
      ) : products.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm" style={{ color: 'var(--brand-text-dim)' }}>
              Mostrando <span className="text-white font-bold">{products.length}</span> de{' '}
              <span className="text-white font-bold">{total}</span> productos {brandInfo.name}
            </p>
            <Link
              href={`/search?q=${encodeURIComponent(brandInfo.name)}`}
              className="text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl border transition-all"
              style={{ borderColor: `${color}50`, color, background: `${color}08` }}
            >
              Ver Todos →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <Link
                key={p.sku}
                href={`/product/${p.sku}`}
                className="group flex flex-col p-4 rounded-2xl border transition-all hover:border-current"
                style={{ background: 'var(--brand-surface)', borderColor: 'var(--brand-border)' }}
              >
                <div className="relative h-32 w-full rounded-xl overflow-hidden flex items-center justify-center p-2 mb-3"
                     style={{ background: 'var(--brand-surface-2)' }}>
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={`${brandInfo.name} ${p.sku}`}
                         className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
                         loading="lazy" />
                  ) : (
                    <div className="text-white/10 text-5xl font-black select-none">{brandInfo.name[0]}</div>
                  )}
                  {p.isNew && (
                    <span className="absolute top-2 left-2 text-[8px] font-black uppercase px-2 py-0.5 rounded-lg animate-pulse"
                          style={{ background: 'var(--brand-primary)', color: '#0A0A0B' }}>
                      NUEVO
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>
                    {brandInfo.name}
                  </span>
                  <h2 className="text-white font-black text-xs uppercase tracking-tight leading-tight line-clamp-2">
                    {p.name}
                  </h2>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] font-black tracking-widest" style={{ color: 'var(--brand-text-dim)' }}>
                      {p.sku}
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg"
                          style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                      Ver →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {total > 24 && (
            <div className="mt-10 text-center">
              <Link
                href={`/search?q=${encodeURIComponent(brandInfo.name)}`}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:brightness-110"
                style={{ background: color, color: '#0A0A0B', boxShadow: `0 0 30px ${color}30` }}
              >
                Ver los {total} filtros {brandInfo.name} →
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className="py-20 text-center space-y-4">
          <p className="text-white font-black text-xl">Sin productos disponibles por el momento</p>
          <p className="text-sm" style={{ color: 'var(--brand-text-dim)' }}>
            Contáctanos directamente para consultar disponibilidad de {brandInfo.name}.
          </p>
        </div>
      )}

      {/* ─── CROSS-LINKS: Otras marcas ─── */}
      {siblingBrands.length > 0 && (
        <section className="mt-16 pt-10 border-t border-white/5">
          <h2 className="text-xs font-black uppercase tracking-widest mb-5" style={{ color: 'var(--brand-text-dim)' }}>
            Otras Marcas Disponibles en DIROGSA
          </h2>
          <div className="flex flex-wrap gap-3">
            {siblingBrands.map(b => {
              const c = b.theme_color || DEFAULT_COLOR;
              return (
                <Link
                  key={b.slug}
                  href={`/brand/${b.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest border transition-all hover:scale-105"
                  style={{ background: `${c}10`, borderColor: `${c}30`, color: c }}
                >
                  {b.name}
                </Link>
              );
            })}
            <Link href="/brand"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest border transition-all hover:scale-105 hover:bg-white/5 text-white/50 border-white/10">
              Ver Todas →
            </Link>
          </div>
        </section>
      )}

      {/* ─── SEO SEMÁNTICO ─── */}
      <section aria-labelledby="seo-brand-heading" className="mt-10 pt-8 border-t border-white/5"
               style={{ color: 'var(--brand-text-muted)' }}>
        <h2 id="seo-brand-heading" className="text-sm font-black text-white/50 uppercase tracking-widest mb-4">
          Distribuidores Oficiales de {brandInfo.name} en Perú
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs md:text-sm leading-relaxed">
          <p>
            <strong>DIROGSA</strong> es el distribuidor oficial de <strong>{brandInfo.name}</strong> en Perú,
            con cobertura de importación y distribución a nivel nacional. Cada filtro en nuestro catálogo es
            un producto original de fábrica con certificación de calidad. Stock permanente en Lima con
            despacho inmediato.
          </p>
          <p>
            Si eres taller mecánico, distribuidor o tienes una flota vehicular y buscas{' '}
            <strong>filtros {brandInfo.name} al por mayor en Perú</strong>, contáctanos para conocer nuestros
            precios especiales B2B. Trabajamos con talleres en Lima, Arequipa, Trujillo, Cusco y las
            principales ciudades del país.
          </p>
        </div>
      </section>
    </div>
  );
}
