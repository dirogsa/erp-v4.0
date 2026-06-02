import { notFound } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const SITE_URL = 'https://dirogsa.com';

// ── ISR: Revalida cada hora ──
export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_BASE}/shop/vehicles`, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const vehicles = await res.json();
    const params = [];
    for (const v of vehicles.slice(0, 30)) {
      const marcaSlug = v.make.toLowerCase().replace(/\s+/g, '-');
      for (const model of (v.models || []).slice(0, 10)) {
        if (!model || model.toLowerCase() === 'none') continue;
        params.push({ marca: marcaSlug, modelo: model.toLowerCase().replace(/\s+/g, '-') });
      }
    }
    return params;
  } catch { return []; }
}

export async function generateMetadata({ params }) {
  const { marca, modelo } = await params;
  const marcaDisplay = decodeURIComponent(marca).replace(/-/g, ' ').toUpperCase();
  const modeloDisplay = decodeURIComponent(modelo).replace(/-/g, ' ').toUpperCase();

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
    alternates: {
      canonical: `${SITE_URL}/vehiculo/${marca}/${modelo}`,
    },
    openGraph: {
      title: `Filtros para ${marcaDisplay} ${modeloDisplay} | DIROGSA`,
      description: `Repuestos compatibles con ${marcaDisplay} ${modeloDisplay}. Distribuidor oficial Perú.`,
      url: `${SITE_URL}/vehiculo/${marca}/${modelo}`,
    },
  };
}

export default async function VehiculoModeloPage({ params }) {
  const { marca, modelo } = await params;
  const marcaDisplay = decodeURIComponent(marca).replace(/-/g, ' ').toUpperCase();
  const modeloDisplay = decodeURIComponent(modelo).replace(/-/g, ' ').toUpperCase();

  let products = [];
  let total = 0;

  try {
    const url = `${API_BASE}/shop/products?vehicle_brand=${encodeURIComponent(marcaDisplay)}&vehicle_model=${encodeURIComponent(modeloDisplay)}&limit=40`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      products = data.items || [];
      total = data.total || products.length;
    }
  } catch (err) {
    console.error('[VehiculoModelo] Error:', err.message);
  }

  // JSON-LD BreadcrumbList
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio',   item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Vehículos', item: `${SITE_URL}/vehiculo` },
      { '@type': 'ListItem', position: 3, name: marcaDisplay, item: `${SITE_URL}/vehiculo/${marca}` },
      { '@type': 'ListItem', position: 4, name: modeloDisplay, item: `${SITE_URL}/vehiculo/${marca}/${modelo}` },
    ],
  };

  // JSON-LD ItemList — potencia los rich snippets de lista de productos
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Filtros para ${marcaDisplay} ${modeloDisplay}`,
    description: `Repuestos automotrices compatibles con ${marcaDisplay} ${modeloDisplay} disponibles en DIROGSA Perú`,
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
          <li><Link href="/buscar?type=apps" className="hover:text-white transition-colors">Vehículos</Link></li>
          <li aria-hidden="true"><span className="opacity-40">/</span></li>
          <li><Link href={`/vehiculo/${marca}`} className="hover:text-white transition-colors">{marcaDisplay}</Link></li>
          <li aria-hidden="true"><span className="opacity-40">/</span></li>
          <li className="text-white font-bold" aria-current="page">{modeloDisplay}</li>
        </ol>
      </nav>

      {/* ── HERO ── */}
      <header className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/30 mb-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#38BDF8]">{marcaDisplay}</span>
          <span className="opacity-30 text-[#38BDF8]">·</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#38BDF8]">{modeloDisplay}</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-tight mb-3">
          Filtros para{' '}
          <span className="text-[#38BDF8]">{marcaDisplay} {modeloDisplay}</span>
        </h1>
        <p className="text-sm md:text-base max-w-2xl" style={{ color: 'var(--brand-text-dim)' }}>
          Catálogo premium de filtros de aceite, aire, combustible y cabina (WIX, Filtron, Originales) con aplicación verificada para{' '}
          {marcaDisplay} {modeloDisplay}. {total > 0 ? `${total} productos compatibles listos para despacho.` : ''}
        </p>
      </header>

      {/* ── PRODUCTS GRID ── */}
      {products.length > 0 ? (
        <main>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm font-bold" style={{ color: 'var(--brand-text-dim)' }}>
              <span className="text-white">{total}</span> repuestos compatibles
            </p>
            <Link href={`/buscar?type=apps&make=${encodeURIComponent(marcaDisplay)}&model=${encodeURIComponent(modeloDisplay)}`}
              className="text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl border transition-all"
              style={{ borderColor: 'rgba(56,189,248,0.3)', color: '#38BDF8', background: 'rgba(56,189,248,0.05)' }}>
              Búsqueda Avanzada →
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
                           alt={`${p.name} — compatible con ${marcaDisplay} ${modeloDisplay}`}
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
          <p className="text-white font-black text-lg">Sin resultados para {marcaDisplay} {modeloDisplay}</p>
          <p className="text-sm" style={{ color: 'var(--brand-text-dim)' }}>
            Prueba buscar todos los filtros disponibles para {marcaDisplay}.
          </p>
          <Link href={`/vehiculo/${marca}`}
            className="inline-flex px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest mt-4"
            style={{ background: '#38BDF8', color: '#0A0A0B' }}>
            Ver todos los {marcaDisplay}
          </Link>
        </div>
      )}
      {/* ── SECCIÓN SEO SEMÁNTICA (Contenido de Calidad para Googlebot) ── */}
      <section aria-labelledby="seo-about-heading" className="w-full mt-12 md:mt-20 pt-8 border-t border-white/5" style={{ color: 'var(--brand-text-muted)' }}>
        <h2 id="seo-about-heading" className="text-sm font-black text-white/50 uppercase tracking-widest mb-4">Repuestos y Filtros para {marcaDisplay} {modeloDisplay} en Perú</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs md:text-sm leading-relaxed text-justify md:text-left">
          <p>
            Bienvenido al catálogo especializado de repuestos y soluciones de filtración para <strong>{marcaDisplay} {modeloDisplay}</strong> de DIROGSA. Como importadores directos en Perú, garantizamos un inventario de alta calidad diseñado para cumplir con las especificaciones exactas del fabricante (OEM) de tu vehículo. En esta sección encontrarás {products.length > 0 ? 'nuestro portafolio de' : 'próximamente la línea de'} <strong>filtros de aceite, filtros de aire, filtros de combustible y filtros de cabina</strong> optimizados para asegurar el máximo rendimiento del motor de tu {marcaDisplay}.
          </p>
          <p>
            El mantenimiento preventivo de un {marcaDisplay} {modeloDisplay} exige componentes de precisión. Por ello, trabajamos con marcas líderes a nivel mundial que emplean tecnología de micro-filtración avanzada, previniendo el desgaste prematuro de las piezas internas y optimizando el consumo de combustible. Explora nuestro catálogo y mantén tu {modeloDisplay} operando con la confiabilidad, seguridad y garantía que solo DIROGSA puede ofrecer. Envíos a nivel nacional.
          </p>
        </div>
      </section>
    </div>
  );
}
