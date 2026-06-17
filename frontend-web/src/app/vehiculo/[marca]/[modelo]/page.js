/**
 * /vehiculo/[marca]/[modelo]/page.js — Página SEO de Modelo de Vehículo
 * CONSTITUTION §3: Lógica en lib, esta página es solo un mensajero.
 *
 * La resolución slug → BD se hace mediante el endpoint /shop/seo/vehicles
 * que devuelve {model_raw, model_slug}. El model_raw se usa para la consulta
 * a la BD, eliminando el mismatch que causaba ~1,000 redirecciones en Search Console.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SITE_URL } from '@/config/seo.config';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const revalidate = 3600;

/**
 * Pre-genera las páginas de modelo en build-time usando el mismo
 * endpoint que el sitemap — garantía de coherencia.
 * Los slugs del backend son idénticos a los del sitemap.
 */
export async function generateStaticParams() {
  // Free Tier Protection: Do not pre-build thousands of pages during build-time.
  // Generate them dynamically on the first visit (ISR) to avoid triggering Render 429 Too Many Requests.
  return [];
}

/**
 * Resuelve el slug del modelo al valor raw de la BD.
 * Consulta /seo/vehicles (cacheado 24h) para encontrar
 * model_raw que corresponde al model_slug de la URL.
 *
 * @returns {{ makeRaw: string, modelRaw: string } | null}
 */
async function resolveSlugToRaw(makeSlug, modelSlug) {
  try {
    const res = await fetch(`${API_BASE}/shop/seo/vehicles`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const vehicles = await res.json();
    const vehicle = vehicles.find(v => v.make_slug === makeSlug);
    if (!vehicle) return null;
    const model = vehicle.models.find(m => m.model_slug === modelSlug);
    if (!model) return null;
    return { makeRaw: vehicle.make_raw, modelRaw: model.model_raw };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { marca, modelo } = await params;
  const marcaDisplay = marca.replace(/-/g, ' ').toUpperCase();
  const modeloDisplay = modelo.replace(/-/g, ' ').toUpperCase();

  return {
    title: `Filtros para ${marcaDisplay} ${modeloDisplay} (Wix, Filtron) | DIROGSA Perú`,
    description: `Compra filtros de aceite, aire, combustible y cabina premium para ${marcaDisplay} ${modeloDisplay}. Equivalencias exactas en marcas líderes como WIX y Filtron. Venta B2B en Perú.`,
    keywords: [
      `filtros wix ${marcaDisplay} ${modeloDisplay}`,
      `filtros para ${marcaDisplay} ${modeloDisplay}`,
      `repuestos ${marcaDisplay} ${modeloDisplay} peru`,
      `filtro aceite ${marcaDisplay} ${modeloDisplay}`,
      `filtro aire ${marcaDisplay} ${modeloDisplay}`,
      `equivalencias wix ${marcaDisplay}`,
      'dirogsa peru mayorista'
    ],
    alternates: { canonical: `${SITE_URL}/vehiculo/${marca}/${modelo}` },
    openGraph: {
      title: `Filtros para ${marcaDisplay} ${modeloDisplay} | DIROGSA`,
      description: `Repuestos compatibles con ${marcaDisplay} ${modeloDisplay}. Distribuidor oficial Perú.`,
      url: `${SITE_URL}/vehiculo/${marca}/${modelo}`,
    },
  };
}

export default async function VehiculoModeloPage({ params }) {
  const { marca, modelo } = await params;
  const marcaDisplay = marca.replace(/-/g, ' ').toUpperCase();
  const modeloDisplay = modelo.replace(/-/g, ' ').toUpperCase();

  // ── PASO CLAVE: Resolver el slug → valor raw de la BD ──
  // Esto garantiza que la consulta al backend use exactamente el texto
  // que existe en la BD (ej: "KONA II (SX4)"), no el slug de la URL.
  const resolved = await resolveSlugToRaw(marca, modelo);

  let products = [];
  let total = 0;

  if (resolved) {
    // Consulta con el valor RAW de la BD → coincidencia exacta, 0 redirecciones
    try {
      const url = `${API_BASE}/shop/products?vehicle_brand=${encodeURIComponent(resolved.makeRaw)}&vehicle_model=${encodeURIComponent(resolved.modelRaw)}&limit=40`;
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (res.ok) {
        const data = await res.json();
        products = data.items || [];
        total = data.total || products.length;
      }
    } catch (err) {
      console.error('[VehiculoModelo] Error fetching products:', err.message);
    }
  } else {
    // El slug no existe en la BD → 404 limpio (no redirección)
    // Esto elimina las páginas _old y modelos que ya no existen.
    notFound();
  }

  // Display names: preferir el raw de la BD si lo tenemos
  const marcaLabel = resolved?.makeRaw ?? marcaDisplay;
  const modeloLabel = resolved?.modelRaw ?? modeloDisplay;

  // JSON-LD BreadcrumbList
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio',    item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Catálogo',  item: `${SITE_URL}/catalogo` },
      { '@type': 'ListItem', position: 3, name: marcaLabel,  item: `${SITE_URL}/vehiculo/${marca}` },
      { '@type': 'ListItem', position: 4, name: modeloLabel, item: `${SITE_URL}/vehiculo/${marca}/${modelo}` },
    ],
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Filtros para ${marcaLabel} ${modeloLabel}`,
    description: `Repuestos automotrices compatibles con ${marcaLabel} ${modeloLabel} disponibles en DIROGSA Perú`,
    numberOfItems: total,
    itemListElement: products.slice(0, 10).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/producto/${p.sku}`,
      name: p.name,
    })),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">

      {/* ── JSON-LD Schemas ── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />

      {/* ── BREADCRUMB ── */}
      <nav aria-label="Ruta de navegación" className="mb-8">
        <ol className="flex items-center gap-2 text-xs list-none p-0 m-0 flex-wrap" style={{ color: 'var(--brand-text-dim)' }}>
          <li><Link href="/" className="hover:text-white transition-colors">Inicio</Link></li>
          <li aria-hidden="true"><span className="opacity-40">/</span></li>
          <li><Link href="/catalogo" className="hover:text-white transition-colors">Catálogo</Link></li>
          <li aria-hidden="true"><span className="opacity-40">/</span></li>
          <li><Link href={`/vehiculo/${marca}`} className="hover:text-white transition-colors">{marcaLabel}</Link></li>
          <li aria-hidden="true"><span className="opacity-40">/</span></li>
          <li className="text-white font-bold" aria-current="page">{modeloLabel}</li>
        </ol>
      </nav>

      {/* ── HERO ── */}
      <header className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/30 mb-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#38BDF8]">{marcaLabel}</span>
          <span className="opacity-30 text-[#38BDF8]">·</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#38BDF8]">{modeloLabel}</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-tight mb-3">
          Filtros para{' '}
          <span className="text-[#38BDF8]">{marcaLabel} {modeloLabel}</span>
        </h1>
        <p className="text-sm md:text-base max-w-2xl" style={{ color: 'var(--brand-text-dim)' }}>
          Catálogo premium de filtros de aceite, aire, combustible y cabina (WIX, Filtron, Originales)
          con aplicación verificada para {marcaLabel} {modeloLabel}.
          {total > 0 ? ` ${total} productos compatibles listos para despacho.` : ''}
        </p>
      </header>

      {/* ── PRODUCTS GRID ── */}
      {products.length > 0 ? (
        <main>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm font-bold" style={{ color: 'var(--brand-text-dim)' }}>
              <span className="text-white">{total}</span> repuestos compatibles
            </p>
            <Link
              href={`/vehiculo/${marca}`}
              className="text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl border transition-all"
              style={{ borderColor: 'rgba(56,189,248,0.3)', color: '#38BDF8', background: 'rgba(56,189,248,0.05)' }}
            >
              Ver Todos →
            </Link>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 list-none p-0">
            {products.map(p => (
              <li key={p.sku}>
                <Link href={`/producto/${p.sku}`}
                  className="group flex flex-col h-full p-4 rounded-2xl border transition-all hover:border-[#38BDF8]/40 hover:shadow-[0_0_24px_rgba(56,189,248,0.1)]"
                  style={{ background: 'var(--brand-surface)', borderColor: 'var(--brand-border-2)' }}>
                  <div className="h-28 w-full rounded-xl flex items-center justify-center p-2 mb-3"
                       style={{ background: 'var(--brand-surface-2)' }}>
                    {p.image_url ? (
                      <img src={p.image_url}
                           alt={`${p.name} — compatible con ${marcaLabel} ${modeloLabel}`}
                           className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <svg className="h-8 w-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--brand-text-dim)' }}>
                    {p.brand || 'DIROGSA'}
                  </span>
                  <h2 className="text-white font-black text-xs uppercase leading-tight line-clamp-2 flex-1 mb-2">
                    {p.name}
                  </h2>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t" style={{ borderColor: 'var(--brand-border-2)' }}>
                    <span className="text-[10px] font-bold" style={{ color: '#38BDF8' }}>{p.sku}</span>
                    <span className="text-[9px] font-black uppercase px-2 py-1 rounded-lg" style={{ background: 'rgba(56,189,248,0.1)', color: '#38BDF8' }}>
                      Ver →
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </main>
      ) : (
        <div className="py-20 text-center space-y-4">
          <p className="text-white font-black text-lg">Sin resultados para {marcaLabel} {modeloLabel}</p>
          <p className="text-sm" style={{ color: 'var(--brand-text-dim)' }}>
            Prueba buscar todos los filtros disponibles para {marcaLabel}.
          </p>
          <Link href={`/vehiculo/${marca}`}
            className="inline-flex px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest mt-4"
            style={{ background: '#38BDF8', color: '#0A0A0B' }}>
            Ver todos los {marcaLabel}
          </Link>
        </div>
      )}

      {/* ── SECCIÓN SEO SEMÁNTICA ── */}
      <section aria-labelledby="seo-about-heading" className="w-full mt-12 md:mt-20 pt-8 border-t border-white/5" style={{ color: 'var(--brand-text-muted)' }}>
        <h2 id="seo-about-heading" className="text-sm font-black text-white/50 uppercase tracking-widest mb-4">
          Repuestos y Filtros para {marcaLabel} {modeloLabel} en Perú
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs md:text-sm leading-relaxed text-justify md:text-left">
          <p>
            Bienvenido al catálogo especializado de repuestos y soluciones de filtración para <strong>{marcaLabel} {modeloLabel}</strong> de DIROGSA. Como importadores directos en Perú, garantizamos un inventario de alta calidad diseñado para cumplir con las especificaciones exactas del fabricante (OEM) de tu vehículo. En esta sección encontrarás {products.length > 0 ? 'nuestro portafolio de' : 'próximamente la línea de'} <strong>filtros de aceite, filtros de aire, filtros de combustible y filtros de cabina</strong> optimizados para asegurar el máximo rendimiento del motor de tu {marcaLabel}.
          </p>
          <p>
            El mantenimiento preventivo de un {marcaLabel} {modeloLabel} exige componentes de precisión. Por ello, trabajamos con marcas líderes a nivel mundial que emplean tecnología de micro-filtración avanzada, previniendo el desgaste prematuro de las piezas internas y optimizando el consumo de combustible. Explora nuestro catálogo y mantén tu {modeloLabel} operando con la confiabilidad, seguridad y garantía que solo DIROGSA puede ofrecer. Envíos a nivel nacional.
          </p>
        </div>
      </section>
    </div>
  );
}
