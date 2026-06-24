/**
 * /vehicle/[marca]/page.js — Hub SEO de Marca de Vehículo
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
    alternates: { canonical: `${SITE_URL}/vehicle/${marca}` },
    openGraph: {
      title: `Filtros para ${marcaDisplay} | DIROGSA`,
      description: `Catálogo completo de filtros y repuestos para ${marcaDisplay} en Perú.`,
      url: `${SITE_URL}/vehicle/${marca}`,
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

    let apiStatus = "online";
    if (prodRes.ok) {
      const data = await prodRes.json();
      products = data.items || [];
      total = data.total || products.length;
      apiStatus = data.api_status || "online";
    } else if (prodRes.status === 503) {
      apiStatus = "offline";
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
      { '@type': 'ListItem', position: 2, name: 'Catálogo por Vehículo', item: `${SITE_URL}/vehicle` },
      { '@type': 'ListItem', position: 3, name: marcaDisplay, item: `${SITE_URL}/vehicle/${marca}` },
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
      url: `${SITE_URL}/product/${p.sku}`,
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
          <li><Link href="/catalog" className="hover:text-white transition-colors">Catálogo</Link></li>
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
                  href={`/vehicle/${marca}/${m.model_slug}`}
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
          {apiStatus === "offline" ? (
            <div className="text-center py-20 px-4 border border-[#38BDF8]/20 rounded-3xl bg-[#141518]/40 backdrop-blur-md relative overflow-hidden my-10">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent opacity-50" />
              <div className="w-16 h-16 mx-auto bg-[#38BDF8]/10 rounded-full flex items-center justify-center mb-6 border border-[#38BDF8]/30 shadow-[0_0_30px_rgba(56,189,248,0.2)]">
                <svg className="w-8 h-8 text-[#38BDF8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-wide mb-3">Inventario en Mantenimiento</h3>
              <p className="text-brand-text-dim text-sm md:text-base max-w-lg mx-auto mb-8 leading-relaxed">
                Estamos actualizando el catálogo de repuestos para vehículos <strong>{marcaDisplay}</strong>.
                Por favor, contáctanos directamente para verificar stock y cotizar.
              </p>
              <a href="https://wa.me/51991717240" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#25D366] text-black font-black uppercase text-sm tracking-widest hover:bg-[#25D366]/90 transition-all hover:scale-105 shadow-[0_0_20px_rgba(37,211,102,0.3)]">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.528 1.971 14.076 1.97 11.98 1.97c-5.433 0-9.863 4.374-9.867 9.806-.001 1.73.457 3.41 1.32 4.947l-1.047 3.826 3.925-1.029zm13.111-7.234c-.29-.145-1.716-.847-1.978-.942-.262-.096-.453-.145-.642.145-.19.29-.738.942-.905 1.135-.167.19-.335.21-.625.065-2.9-.145-4.814-1.924-5.59-3.267-.168-.29-.018-.447.127-.592.13-.13.29-.339.436-.508.145-.17.193-.29.29-.483.097-.19.048-.363-.024-.508-.073-.145-.642-1.547-.88-2.122-.232-.558-.468-.483-.642-.492-.166-.008-.356-.01-.546-.01-.19 0-.501.07-.763.356-.262.29-1 .977-1 2.382s1.02 2.762 1.164 2.956c.145.195 2.007 3.064 4.862 4.297.68.293 1.21.468 1.623.599.683.217 1.305.186 1.797.112.548-.08 1.716-.702 1.957-1.378.24-.678.24-1.257.17-1.378-.073-.121-.262-.19-.553-.335z"/></svg>
                Consultar por WhatsApp
              </a>
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm font-bold" style={{ color: 'var(--brand-text-dim)' }}>
                  Mostrando <span className="text-white">{products.length}</span> de <span className="text-white">{total}</span> repuestos
                </p>
                <Link
                  href="/catalog"
                  className="text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl border transition-all"
                  style={{ borderColor: 'rgba(56,189,248,0.3)', color: '#38BDF8', background: 'rgba(56,189,248,0.05)' }}
                >
                  Ver Todos →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                {products.map(p => (
                  <Link key={p.sku} href={`/product/${p.sku}`}
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
              <Link href="/catalog"
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
