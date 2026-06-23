/**
 * HUB PAGE: Marca de Filtros/Repuestos
 * CONSTITUTION §3 (DDD): Datos desde ProductService únicamente.
 * CONSTITUTION §6 (Premium UI): UI de clase mundial.
 *
 * Esta página captura búsquedas de alto valor como:
 *   "filtros WIX peru" → /brand/wix
 *   "filtros MANN peru" → /brand/mann-filter
 *   "repuestos AZUMI peru" → /brand/azumi
 *
 * Hub & Spoke: Este nodo enlaza hacia cada producto de la marca,
 * distribuyendo autoridad SEO a los 5,000 productos del catálogo.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE_URL } from '@/config/seo.config';
import { ProductService } from '@/services/product.service';

export const revalidate = 43200; // ISR 12h

// Marcas de repuestos con presencia en el catálogo DIROGSA
// Fuente de verdad: aquí se define qué marcas tienen página propia.
const PRODUCT_BRANDS_CATALOG = [
  {
    slug: 'wix',
    name: 'WIX Filters',
    origin: 'USA',
    description: 'WIX Filters es la marca de filtros más vendida en Estados Unidos, con más de 80 años de experiencia en filtración automotriz e industrial.',
    tags: ['Filtros de Aceite', 'Filtros de Aire', 'Filtros de Combustible', 'Filtros de Cabina'],
    color: '#F59E0B',
  },
  {
    slug: 'mann',
    name: 'MANN-FILTER',
    origin: 'ALEMANIA',
    description: 'MANN-FILTER es el fabricante de filtros de mayor precisión de origen alemán, líder en el mercado europeo y de equipos originales (OEM).',
    tags: ['Filtros de Aceite', 'Filtros de Aire', 'Filtros de Combustible'],
    color: '#3B82F6',
  },
  {
    slug: 'azumi',
    name: 'AZUMI',
    origin: 'JAPÓN',
    description: 'AZUMI es una marca japonesa de repuestos automotrices de alta calidad, especializada en el mercado latinoamericano con excelente relación precio-calidad.',
    tags: ['Filtros de Aceite', 'Filtros de Aire', 'Filtros de Combustible', 'Filtros de Cabina'],
    color: '#10B981',
  },
  {
    slug: 'totachi',
    name: 'TOTACHI',
    origin: 'JAPÓN',
    description: 'TOTACHI es una marca premium japonesa reconocida por su tecnología de lubricantes y filtros de alta performance para motores modernos.',
    tags: ['Filtros de Aceite', 'Aceites Lubricantes'],
    color: '#8B5CF6',
  },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function findBrandBySlug(slug) {
  try {
    const res = await fetch(`${API_BASE}/shop/seo/brands`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const brands = await res.json();
    const dynamicBrand = brands.find(b => b.slug === slug.toLowerCase());
    
    if (!dynamicBrand) {
      // Fallback a las hardcodeadas en caso de falla de sincronización
      return PRODUCT_BRANDS_CATALOG.find(b => b.slug === slug.toLowerCase());
    }
    
    const premiumData = PRODUCT_BRANDS_CATALOG.find(b => b.slug === slug.toLowerCase());
    if (premiumData) {
      return { ...dynamicBrand, ...premiumData };
    }
    
    // Plantilla Genérica B2B para marcas nuevas ingresadas en el ERP
    return {
      slug: dynamicBrand.slug,
      name: dynamicBrand.name,
      origin: 'Importado',
      description: `Filtros automotrices e industriales de la marca ${dynamicBrand.name}. Alta tecnología en filtración.`,
      tags: ['Filtros de Aceite', 'Filtros de Aire', 'Filtros de Combustible'],
      color: '#38BDF8', // Color dinámico (Sky Blue)
    };
  } catch (error) {
    return PRODUCT_BRANDS_CATALOG.find(b => b.slug === slug.toLowerCase());
  }
}

export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_BASE}/shop/seo/brands`, { next: { revalidate: 86400 } });
    if (!res.ok) return PRODUCT_BRANDS_CATALOG.map((b) => ({ brand: b.slug }));
    const brands = await res.json();
    return brands.map((b) => ({ brand: b.slug }));
  } catch (error) {
    return PRODUCT_BRANDS_CATALOG.map((b) => ({ brand: b.slug }));
  }
}

export async function generateMetadata({ params }) {
  const { brand: brandSlug } = await params;
  const brandInfo = await findBrandBySlug(brandSlug);
  if (!brandInfo) return { title: 'Marca no encontrada | DIROGSA' };

  const title = `Filtros ${brandInfo.name} en Perú | DIROGSA`;
  const description = `Catálogo oficial de filtros ${brandInfo.name} en Perú. ${brandInfo.description} Distribuidor autorizado con stock disponible y envíos nacionales.`;

  return {
    title,
    description,
    keywords: [
      `filtros ${brandInfo.name}`, `${brandInfo.name} peru`, `comprar ${brandInfo.name} peru`,
      `distribuidor ${brandInfo.name}`, 'filtros automotrices peru', 'dirogsa'
    ],
    alternates: { canonical: `${SITE_URL}/brand/${brandSlug}` },
    openGraph: { title, description, url: `${SITE_URL}/brand/${brandSlug}`, siteName: 'DIROGSA' },
  };
}

export default async function MarcaHubPage({ params }) {
  const { brand: brandSlug } = await params;
  const brandInfo = await findBrandBySlug(brandSlug);

  if (!brandInfo) notFound();

  // Fetch productos de esta marca — SSR con caché ISR
  const { items: products, total } = await ProductService.searchProducts({
    search: brandInfo.name,
    limit: 24,
  });

  // --- JSON-LD ---
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Marcas', item: `${SITE_URL}/marca` },
      { '@type': 'ListItem', position: 3, name: brandInfo.name, item: `${SITE_URL}/brand/${brandSlug}` },
    ],
  };

  const brandJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Brand',
    name: brandInfo.name,
    description: brandInfo.description,
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

      {/* JSON-LD invisible */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(brandJsonLd) }} />
      {itemListJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />}

      {/* ─── BREADCRUMB ─── */}
      <nav aria-label="Ruta de navegación" className="mb-8">
        <ol className="flex items-center gap-2 text-xs list-none p-0 m-0" style={{ color: 'var(--brand-text-dim)' }}>
          <li><Link href="/" className="hover:text-white transition-colors">Inicio</Link></li>
          <li aria-hidden="true"><span className="opacity-40">/</span></li>
          <li><Link href="/catalog" className="hover:text-white transition-colors">Catálogo</Link></li>
          <li aria-hidden="true"><span className="opacity-40">/</span></li>
          <li className="text-white font-bold" aria-current="page">{brandInfo.name}</li>
        </ol>
      </nav>

      {/* ─── HERO ─── */}
      <header className="mb-10">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-sm uppercase tracking-widest"
            style={{ background: `${brandInfo.color}15`, border: `1px solid ${brandInfo.color}40`, color: brandInfo.color }}
          >
            {brandInfo.name}
          </div>
          <span className="text-[10px] font-bold px-3 py-1.5 rounded-xl" style={{ background: 'var(--brand-surface)', color: 'var(--brand-text-dim)', border: '1px solid var(--brand-border)' }}>
            Origen: {brandInfo.origin}
          </span>
          <span className="text-[10px] font-bold px-3 py-1.5 rounded-xl" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--brand-primary)', border: '1px solid rgba(16,185,129,0.3)' }}>
            {total} productos
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-tight mb-4">
          Filtros <span style={{ color: brandInfo.color }}>{brandInfo.name}</span>{' '}
          <span className="text-white/30">en Perú</span>
        </h1>

        <p className="text-sm md:text-base max-w-2xl mb-6" style={{ color: 'var(--brand-text-dim)' }}>
          {brandInfo.description} Distribuidor oficial en Perú con stock garantizado, precios competitivos y envíos a nivel nacional.
        </p>

        {/* Tags de tipos de filtro */}
        <div className="flex flex-wrap gap-2">
          {brandInfo.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-bold"
                  style={{ background: `${brandInfo.color}10`, color: brandInfo.color, border: `1px solid ${brandInfo.color}30` }}>
              {tag}
            </span>
          ))}
        </div>
      </header>

      {/* ─── PRODUCT GRID ─── */}
      {products.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm" style={{ color: 'var(--brand-text-dim)' }}>
              Mostrando <span className="text-white font-bold">{products.length}</span> de{' '}
              <span className="text-white font-bold">{total}</span> productos {brandInfo.name}
            </p>
            <Link
              href={`/search?q=${encodeURIComponent(brandInfo.name)}`}
              className="text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl border transition-all"
              style={{ borderColor: `${brandInfo.color}50`, color: brandInfo.color, background: `${brandInfo.color}08` }}
            >
              Ver Todos →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <Link
                key={p.sku}
                href={`/product/${p.sku}`}
                className="group flex flex-col p-4 rounded-2xl border transition-all"
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
                  <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: brandInfo.color }}>
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
                          style={{ background: `${brandInfo.color}15`, color: brandInfo.color, border: `1px solid ${brandInfo.color}30` }}>
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
                style={{ background: brandInfo.color, color: '#0A0A0B', boxShadow: `0 0 30px ${brandInfo.color}30` }}
              >
                Ver los {total} filtros {brandInfo.name} →
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className="py-20 text-center space-y-4">
          <p className="text-white font-black text-xl">Cargando catálogo {brandInfo.name}...</p>
          <p className="text-sm" style={{ color: 'var(--brand-text-dim)' }}>
            Si tienes alguna consulta, contáctanos directamente.
          </p>
        </div>
      )}

      {/* ─── CROSS-LINKS: Otras marcas ─── */}
      <section className="mt-16 pt-10 border-t border-white/5">
        <h2 className="text-xs font-black uppercase tracking-widest mb-5" style={{ color: 'var(--brand-text-dim)' }}>
          Otras Marcas Disponibles en DIROGSA
        </h2>
        <div className="flex flex-wrap gap-3">
          {PRODUCT_BRANDS_CATALOG.filter(b => b.slug !== brandSlug).map(b => (
            <Link
              key={b.slug}
              href={`/brand/${b.slug}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest border transition-all hover:scale-105"
              style={{ background: `${b.color}10`, borderColor: `${b.color}30`, color: b.color }}
            >
              {b.name}
            </Link>
          ))}
          <Link
             href="/marca"
             className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest border transition-all hover:scale-105 hover:bg-white/5 text-white/50 border-white/10"
          >
             Ver Todo El Catálogo →
          </Link>
        </div>
      </section>

      {/* ─── SEO SEMÁNTICO ─── */}
      <section aria-labelledby="seo-brand-heading" className="mt-10 pt-8 border-t border-white/5"
               style={{ color: 'var(--brand-text-muted)' }}>
        <h2 id="seo-brand-heading" className="text-sm font-black text-white/50 uppercase tracking-widest mb-4">
          Distribuidores Oficiales de {brandInfo.name} en Perú
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs md:text-sm leading-relaxed">
          <p>
            <strong>DIROGSA</strong> es el distribuidor oficial de <strong>{brandInfo.name}</strong> en Perú,
            con cobertura de importación y distribución a nivel nacional. Nuestra alianza con{' '}
            <strong>{brandInfo.name}</strong> garantiza que cada filtro en nuestro catálogo es un producto
            original de fábrica, con certificación de calidad y rendimiento comprobado. Contamos con stock
            permanente en Lima con despacho inmediato.
          </p>
          <p>
            Si eres taller mecánico, distribuidor o tienes una flota vehicular y buscas{' '}
            <strong>filtros {brandInfo.name} al por mayor en Perú</strong>, contáctanos para conocer nuestros
            precios especiales B2B y condiciones de crédito. Trabajamos con talleres en Lima, Arequipa,
            Trujillo, Cusco y las principales ciudades del país. La calidad {brandInfo.name} al mejor precio del mercado.
          </p>
        </div>
      </section>
    </div>
  );
}
