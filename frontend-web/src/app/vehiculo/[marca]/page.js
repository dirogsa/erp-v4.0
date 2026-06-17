/**
 * /vehiculo/[marca]/page.js — Hub SEO de Marca de Vehículo
 * CONSTITUTION §3: Lógica en lib, esta página es solo un mensajero.
 *
 * Usa el endpoint /shop/seo/vehicles que devuelve datos pre-slugificados,
 * garantizando coherencia total entre el sitemap y las páginas renderizadas.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SITE_URL } from '@/config/seo.config';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const revalidate = 3600;

/**
 * Pre-genera las páginas de marca de vehículo en build-time usando
 * el mismo endpoint que el sitemap — garantía de coherencia.
 */
export async function generateStaticParams() {
  // Free Tier Protection: Do not pre-build thousands of pages during build-time.
  // Generate them dynamically on the first visit (ISR) to avoid triggering Render 429 Too Many Requests.
  return [];
}

export async function generateMetadata({ params }) {
  const { marca } = await params;
  const marcaDisplay = marca.replace(/-/g, ' ').toUpperCase();

  return {
    title: `Filtros para ${marcaDisplay} | Repuestos Originales DIROGSA Perú`,
    description: `Encuentra filtros de aceite, aire y combustible compatibles con vehículos ${marcaDisplay}. Catálogo completo con aplicaciones vehiculares verificadas. Importador oficial en Perú.`,
    keywords: [
      `filtros ${marcaDisplay}`, `repuestos ${marcaDisplay} peru`,
      `filtro aceite ${marcaDisplay}`, `filtro aire ${marcaDisplay}`,
      'dirogsa', 'peru'
    ],
    alternates: { canonical: `${SITE_URL}/vehiculo/${marca}` },
    openGraph: {
      title: `Filtros para ${marcaDisplay} | DIROGSA`,
      description: `Catálogo completo de filtros y repuestos para ${marcaDisplay} en Perú.`,
      url: `${SITE_URL}/vehiculo/${marca}`,
    },
  };
}

export default async function VehiculoMarcaPage({ params }) {
  const { marca } = await params;
  const marcaDisplay = marca.replace(/-/g, ' ').toUpperCase();

  let products = [];
  let models = [];
  let total = 0;
  let isValidBrand = false;

  try {
    // El backend acepta la marca como regex flexible, por lo que
    // marcaDisplay (ej: "MERCEDES BENZ") matchea "MERCEDES-BENZ" en la BD.
    const [prodRes, vehRes] = await Promise.all([
      fetch(
        `${API_BASE}/shop/products?vehicle_brand=${encodeURIComponent(marcaDisplay)}&limit=20`,
        { next: { revalidate: 3600 } }
      ),
      fetch(`${API_BASE}/shop/seo/vehicles`, { next: { revalidate: 86400 } }),
    ]);

    if (prodRes.ok) {
      const data = await prodRes.json();
      products = data.items || [];
      total = data.total || products.length;
    }

    if (vehRes.ok) {
      const vehicles = await vehRes.json();
      // Busca por make_slug (garantiza coincidencia exacta con la URL)
      const found = vehicles.find(v => v.make_slug === marca);
      if (found) {
        isValidBrand = true;
        // models ya vienen pre-slugificados: [{ model_raw, model_slug }]
        models = found?.models || [];
      }
    }
  } catch (err) {
    console.error('[VehiculoMarca] Error:', err.message);
  }

  // ── GUARDIA SEO: Si la marca no existe en la whitelist, 404 limpio ──
  // Esto evita que Google indexe páginas vacías para marcas como
  // "talbot", "veb (ifa) fahrzeugwerke", "renault trucks (rvi)", etc.
  if (!isValidBrand) {
    notFound();
  }

  // JSON-LD: BreadcrumbList
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Catálogo por Vehículo', item: `${SITE_URL}/vehiculo` },
      { '@type': 'ListItem', position: 3, name: marcaDisplay, item: `${SITE_URL}/vehiculo/${marca}` },
    ],
  };

  const itemListJsonLd = products.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Filtros para ${marcaDisplay}`,
    description: `Catálogo de repuestos compatibles con vehículos ${marcaDisplay} en Perú`,
    numberOfItems: total,
    itemListElement: products.slice(0, 10).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/producto/${p.sku}`,
      name: p.name,
    })),
  } : null;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">

      {/* ── JSON-LD Schemas ── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {itemListJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      )}

      {/* ── BREADCRUMB ── */}
      <nav aria-label="Ruta de navegación" className="mb-8">
        <ol className="flex items-center gap-2 text-xs list-none p-0 m-0" style={{ color: 'var(--brand-text-dim)' }}>
          <li><Link href="/" className="hover:text-white transition-colors">Inicio</Link></li>
          <li aria-hidden="true"><span className="opacity-40">/</span></li>
          <li><Link href="/catalogo" className="hover:text-white transition-colors">Catálogo</Link></li>
          <li aria-hidden="true"><span className="opacity-40">/</span></li>
          <li className="text-white font-bold" aria-current="page">{marcaDisplay}</li>
        </ol>
      </nav>

      {/* ── HERO SECTION ── */}
      <header className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/30 mb-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#38BDF8]">Aplicaciones Vehiculares</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-tight mb-3">
          Filtros para <span className="text-[#38BDF8]">{marcaDisplay}</span>
        </h1>
        <p className="text-sm md:text-base max-w-2xl" style={{ color: 'var(--brand-text-dim)' }}>
          Catálogo completo de filtros de aceite, aire, combustible y cabina compatibles con vehículos {marcaDisplay}.
          Todos los repuestos verificados por nuestros técnicos especializados.
          {total > 0 && ` ${total} productos disponibles.`}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── SIDEBAR: MODELOS ── */}
        {models.length > 0 && (
          <aside className="lg:col-span-3" aria-labelledby="modelos-heading">
            <h2 id="modelos-heading" className="text-xs font-black uppercase tracking-widest mb-4 px-1" style={{ color: 'var(--brand-text-dim)' }}>
              Filtrar por Modelo
            </h2>
            <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0" aria-label="Modelos de vehículos">
              {models.map(m => (
                <Link
                  key={m.model_slug}
                  href={`/vehiculo/${marca}/${m.model_slug}`}
                  className="flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all border hover:border-[#38BDF8]/50 hover:text-[#38BDF8] hover:bg-[#38BDF8]/5"
                  style={{ background: 'var(--brand-surface)', borderColor: 'var(--brand-border-2)', color: 'var(--brand-text-dim)' }}
                >
                  {m.model_raw}
                </Link>
              ))}
            </nav>
          </aside>
        )}

        {/* ── MAIN: PRODUCTS GRID ── */}
        <main className={models.length > 0 ? 'lg:col-span-9' : 'lg:col-span-12'}>
          {products.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm font-bold" style={{ color: 'var(--brand-text-dim)' }}>
                  Mostrando <span className="text-white">{products.length}</span> de <span className="text-white">{total}</span> repuestos
                </p>
                <Link
                  href="/catalogo"
                  className="text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl border transition-all"
                  style={{ borderColor: 'rgba(56,189,248,0.3)', color: '#38BDF8', background: 'rgba(56,189,248,0.05)' }}
                >
                  Ver Todos →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                {products.map(p => (
                  <Link key={p.sku} href={`/producto/${p.sku}`}
                    className="group flex flex-col p-4 rounded-2xl border transition-all hover:border-[#38BDF8]/30"
                    style={{ background: 'var(--brand-surface)', borderColor: 'var(--brand-border-2)' }}>
                    <div className="h-32 w-full rounded-xl overflow-hidden flex items-center justify-center p-2 mb-3"
                         style={{ background: 'var(--brand-surface-2)' }}>
                      {p.image_url ? (
                        <img src={p.image_url} alt={`${p.name} para ${marcaDisplay}`}
                             className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <svg className="h-10 w-10 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--brand-text-dim)' }}>
                      {p.brand || 'DIROGSA'}
                    </span>
                    <h3 className="text-white font-black text-xs uppercase leading-tight line-clamp-2 mb-2">{p.name}</h3>
                    <span className="text-[10px] font-bold mt-auto" style={{ color: '#38BDF8' }}>{p.sku}</span>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="py-20 text-center space-y-4">
              <p className="text-white font-black text-lg">Sin resultados para {marcaDisplay}</p>
              <p className="text-sm" style={{ color: 'var(--brand-text-dim)' }}>
                Intenta buscar directamente por código en nuestro catálogo.
              </p>
              <Link href="/catalogo"
                className="inline-flex px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest mt-4"
                style={{ background: '#38BDF8', color: '#0A0A0B' }}>
                Ir al Catálogo
              </Link>
            </div>
          )}
        </main>
      </div>

      {/* ── SECCIÓN SEO SEMÁNTICA ── */}
      <section aria-labelledby="seo-about-heading" className="w-full mt-12 md:mt-20 pt-8 border-t border-white/5" style={{ color: 'var(--brand-text-muted)' }}>
        <h2 id="seo-about-heading" className="text-sm font-black text-white/50 uppercase tracking-widest mb-4">
          Catálogo Oficial de Filtros Automotrices para {marcaDisplay} en Perú
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs md:text-sm leading-relaxed text-justify md:text-left">
          <p>
            En DIROGSA, somos especialistas en la importación y distribución de repuestos de alta gama para toda la línea de vehículos <strong>{marcaDisplay}</strong>. Sabemos que esta marca requiere componentes que soporten las exigentes condiciones del parque automotor peruano. Por eso, nuestro inventario incluye <strong>filtros de aceite, filtros de aire, filtros de combustible y filtros de cabina (A/C)</strong> fabricados bajo estrictos estándares internacionales que igualan o superan la calidad original (OEM).
          </p>
          <p>
            Ya sea que busques repuestos para el mantenimiento preventivo de un auto compacto, una SUV o una flota comercial de {marcaDisplay}, nuestra plataforma te permite ubicar exactamente la pieza que necesitas mediante referencias cruzadas precisas. Trabajamos con fabricantes globales de primer nivel. Realizamos despachos seguros y rápidos a nivel nacional.
          </p>
        </div>
      </section>
    </div>
  );
}
