/**
 * HUB PAGE: Categoría de Productos
 * CONSTITUTION §3 (DDD): Solo datos del servicio, lógica en config.
 * CONSTITUTION §6 (Premium UI): Primera impresión de clase mundial.
 *
 * Arquitectura Hub & Spoke:
 *   /catalogo → Hub de categorías (nodo raíz)
 *   /catalogo/filtros-de-aceite → Spoke (esta página, nodo de categoría)
 *   /producto/W7 → Hoja (nodo de producto)
 *
 * Google recibe aquí HTML pre-renderizado con JSON-LD ItemList,
 * Breadcrumbs y 24 enlaces hacia productos reales. Cada visita de
 * Googlebot a esta página transfiere autoridad a todos los productos listados.
 */

import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { PRODUCT_CATEGORIES, SITE_URL } from '@/config/seo.config';
import { ProductService } from '@/services/product.service';

// ISR: Revalida cada 12 horas para capturar nuevos productos
export const revalidate = 43200;

// --- Helpers ---

/**
 * Normaliza un slug de URL a un name de categoría del seo.config.
 * Ejemplo: "filtros-de-aceite" → busca el slug 'ACEITE' en PRODUCT_CATEGORIES
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Normaliza un slug de URL y consulta el backend si no existe localmente.
 */
async function findCategoryBySlug(slug) {
  try {
    const res = await fetch(`${API_BASE}/shop/seo/categories`, { next: { revalidate: 86400 } });
    if (!res.ok) return PRODUCT_CATEGORIES.find(c => c.slug.toLowerCase() === slug.toLowerCase());
    const cats = await res.json();
    const dynamicCat = cats.find(c => c.slug === slug.toLowerCase());
    
    if (!dynamicCat) {
      return PRODUCT_CATEGORIES.find(c => c.slug.toLowerCase() === slug.toLowerCase());
    }
    
    const premiumData = PRODUCT_CATEGORIES.find(c => c.slug.toLowerCase() === slug.toLowerCase());
    if (premiumData) {
      return { ...dynamicCat, ...premiumData };
    }
    
    return {
      slug: dynamicCat.slug,
      label: dynamicCat.name,
      emoji: '📦',
    };
  } catch (error) {
    return PRODUCT_CATEGORIES.find(c => c.slug.toLowerCase() === slug.toLowerCase());
  }
}

// Pre-genera en build-time las páginas de cada categoría (SSG puro)
export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_BASE}/shop/seo/categories`, { next: { revalidate: 86400 } });
    if (!res.ok) return PRODUCT_CATEGORIES.map((c) => ({ categoria: c.slug.toLowerCase() }));
    const cats = await res.json();
    return cats.map((c) => ({ categoria: c.slug }));
  } catch (error) {
    return PRODUCT_CATEGORIES.map((c) => ({ categoria: c.slug.toLowerCase() }));
  }
}

export async function generateMetadata({ params }) {
  const { categoria } = await params;
  const cat = await findCategoryBySlug(categoria);
  if (!cat) return { title: 'Categoría no encontrada | DIROGSA' };

  const title = `${cat.label} al por Mayor | Catálogo B2B DIROGSA Perú`;
  const description = `Catálogo completo de ${cat.label.toLowerCase()} en Perú. Venta al por mayor para talleres y flotas con stock disponible y envíos a nivel nacional.`;

  return {
    title,
    description,
    keywords: [cat.label, `${cat.label} peru`, `cotizar ${cat.label} peru`, 'filtros automotrices peru', 'dirogsa mayorista'],
    alternates: { canonical: `${SITE_URL}/catalogo/${categoria}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/catalogo/${categoria}`,
      siteName: 'DIROGSA',
    },
  };
}

export default async function CategoriaHubPage({ params }) {
  const { categoria } = await params;
  const cat = await findCategoryBySlug(categoria);

  if (!cat) notFound();

  // Fetch productos de esta categoría — SSR con caché ISR 12h
  const { items: products, total } = await ProductService.searchProducts({
    category: cat.slug,
    limit: 24,
  });

  // --- JSON-LD: BreadcrumbList ---
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Catálogo', item: `${SITE_URL}/catalogo` },
      { '@type': 'ListItem', position: 3, name: cat.label, item: `${SITE_URL}/catalogo/${categoria}` },
    ],
  };

  // --- JSON-LD: ItemList (Google entiende que esta página lista productos) ---
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: cat.label,
    description: `Catálogo de ${cat.label.toLowerCase()} para todo tipo de vehículos en Perú`,
    url: `${SITE_URL}/catalogo/${categoria}`,
    numberOfItems: total,
    itemListElement: products.slice(0, 10).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/producto/${p.sku}`,
      name: `${p.brand} ${p.sku} — ${p.name}`,
    })),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">

      {/* JSON-LD invisible para Googlebot */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />

      {/* ─── BREADCRUMB ─── */}
      <nav aria-label="Ruta de navegación" className="mb-8">
        <ol className="flex items-center gap-2 text-xs list-none p-0 m-0" style={{ color: 'var(--brand-text-dim)' }}>
          <li><Link href="/" className="hover:text-white transition-colors">Inicio</Link></li>
          <li aria-hidden="true"><span className="opacity-40">/</span></li>
          <li><Link href="/catalogo" className="hover:text-white transition-colors">Catálogo</Link></li>
          <li aria-hidden="true"><span className="opacity-40">/</span></li>
          <li className="text-white font-bold" aria-current="page">{cat.label}</li>
        </ol>
      </nav>

      {/* ─── HERO ─── */}
      <header className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
             style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
          <span className="text-xl" aria-hidden="true">{cat.emoji}</span>
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--brand-primary)' }}>
            {total} productos disponibles
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-tight mb-4">
          {cat.label}
        </h1>
        <p className="text-sm md:text-base max-w-2xl" style={{ color: 'var(--brand-text-dim)' }}>
          Catálogo completo de {cat.label.toLowerCase()} para todas las marcas y modelos de vehículos.
          Importados y distribuidos por DIROGSA con garantía de calidad certificada. Envíos a nivel nacional.
        </p>

        {/* Sub-nav: otras categorías (Cross-Linking entre Hubs) */}
        <div className="flex flex-wrap gap-2 mt-6">
          {PRODUCT_CATEGORIES.filter(c => c.slug.toLowerCase() !== cat.slug.toLowerCase()).map(c => (
            <Link
              key={c.slug}
              href={`/catalogo/${c.slug.toLowerCase()}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-colors hover:border-white/20 hover:text-white"
              style={{ background: 'var(--brand-surface)', borderColor: 'var(--brand-border)', color: 'var(--brand-text-dim)' }}
            >
              <span aria-hidden="true">{c.emoji}</span> {c.label}
            </Link>
          ))}
        </div>
      </header>

      {/* ─── PRODUCT GRID ─── */}
      {products.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm" style={{ color: 'var(--brand-text-dim)' }}>
              Mostrando <span className="text-white font-bold">{products.length}</span> de{' '}
              <span className="text-white font-bold">{total}</span> {cat.label.toLowerCase()}
            </p>
            <Link
              href={`/buscar?q=${encodeURIComponent(cat.label)}`}
              className="text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl border transition-all"
              style={{ borderColor: 'rgba(16,185,129,0.3)', color: 'var(--brand-primary)', background: 'rgba(16,185,129,0.05)' }}
            >
              Buscar en esta categoría →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <Link
                key={p.sku}
                href={`/producto/${p.sku}`}
                className="group flex flex-col p-4 rounded-2xl border transition-all hover:border-green-500/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.08)]"
                style={{ background: 'var(--brand-surface)', borderColor: 'var(--brand-border)' }}
              >
                {/* Imagen */}
                <div className="relative h-32 w-full rounded-xl overflow-hidden flex items-center justify-center p-2 mb-3"
                     style={{ background: 'var(--brand-surface-2)' }}>
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={`${cat.label} ${p.brand} ${p.sku}`}
                      className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="text-4xl opacity-30" aria-hidden="true">{cat.emoji}</div>
                  )}
                  {p.isNew && (
                    <span className="absolute top-2 left-2 text-[8px] font-black uppercase px-2 py-0.5 rounded-lg animate-pulse"
                          style={{ background: 'var(--brand-primary)', color: '#0A0A0B' }}>
                      NUEVO
                    </span>
                  )}
                </div>
                {/* Info */}
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--brand-text-dim)' }}>
                    {p.brand}
                  </span>
                  <h2 className="text-white font-black text-xs uppercase tracking-tight leading-tight line-clamp-2">
                    {p.name}
                  </h2>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] font-black tracking-widest" style={{ color: 'var(--brand-primary)' }}>
                      {p.sku}
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg"
                          style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--brand-primary)', border: '1px solid rgba(16,185,129,0.2)' }}>
                      Ver Detalle
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* CTA "Ver todos" */}
          {total > 24 && (
            <div className="mt-10 text-center">
              <Link
                href={`/buscar?q=${encodeURIComponent(cat.label)}&type=codes`}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:brightness-110"
                style={{ background: 'var(--brand-primary)', color: '#0A0A0B', boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}
              >
                Ver los {total} {cat.label.toLowerCase()} →
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className="py-20 text-center space-y-4">
          <div className="text-6xl mb-4" aria-hidden="true">{cat.emoji}</div>
          <p className="text-white font-black text-xl">Próximamente</p>
          <p className="text-sm" style={{ color: 'var(--brand-text-dim)' }}>
            Estamos preparando el catálogo de {cat.label.toLowerCase()}. ¡Vuelve pronto!
          </p>
          <Link href="/catalogo" className="inline-block mt-6 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest"
                style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)', color: 'var(--brand-text-dim)' }}>
            ← Ver Catálogo Completo
          </Link>
        </div>
      )}

      {/* ─── SEO SEMÁNTICO: Texto enriquecido para Google ─── */}
      <section
        aria-labelledby="seo-cat-heading"
        className="mt-16 pt-10 border-t border-white/5"
        style={{ color: 'var(--brand-text-muted)' }}
      >
        <h2 id="seo-cat-heading" className="text-sm font-black text-white/50 uppercase tracking-widest mb-5">
          {cat.label} de Calidad en Perú — DIROGSA
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs md:text-sm leading-relaxed">
          <p>
            En <strong>DIROGSA</strong> somos importadores y distribuidores oficiales de{' '}
            <strong>{cat.label.toLowerCase()}</strong> de las mejores marcas del mercado global:{' '}
            <strong>WIX Filters</strong>, <strong>MANN-FILTER</strong>, <strong>AZUMI</strong> y{' '}
            <strong>TOTACHI</strong>. Cada unidad en nuestro catálogo cumple con estándares
            internacionales de filtración, garantizando la máxima protección para el motor de tu vehículo
            en las exigentes condiciones del territorio peruano.
          </p>
          <p>
            Nuestro catálogo de <strong>{cat.label.toLowerCase()} para Perú</strong> incluye aplicaciones
            verificadas para las principales marcas de vehículos: Toyota, Nissan, Hyundai, Kia, Ford,
            Chevrolet, Mitsubishi, Hino, Isuzu y más. Realizamos despachos a Lima, Arequipa, Trujillo,
            Cusco y a nivel nacional. Para pedidos al por mayor y flota, consúltanos por WhatsApp.
          </p>
        </div>
      </section>
    </div>
  );
}
