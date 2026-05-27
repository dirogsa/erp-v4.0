import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ProductService } from '@/services/product.service';

/**
 * DYNAMIC METADATA — Constitution §6 / SEO Architecture
 * Next.js calls this BEFORE rendering. Google sees the exact title+description on arrival.
 */
export async function generateMetadata({ params }) {
  const { sku } = await params;
  const product = await ProductService.getProductBySku(sku);

  if (!product) {
    return {
      title: 'Producto no encontrado',
      description: 'El repuesto buscado no está disponible en el catálogo DIROGSA.',
    };
  }

  const title = `${product.category} ${product.name} ${product.sku} | Marca ${product.brand}`;
  const description = `Compra ${product.name} código ${product.sku} de la marca ${product.brand}. ` +
    `Repuesto automotriz de alta calidad disponible en DIROGSA Perú. ` +
    `${product.equivalences.length > 0 ? `Equivalente a: ${product.equivalences.slice(0,3).map(e => e.code || e).join(', ')}.` : ''}`;

  return {
    title,
    description,
    keywords: [product.sku, product.brand, product.category, 'filtros', 'repuestos', 'peru', 'dirogsa',
                ...product.equivalences.slice(0,5).map(e => e.code || e)].join(', '),
    openGraph: {
      title,
      description,
      images: product.imageUrl ? [{ url: product.imageUrl }] : [],
      type: 'website',
    },
    alternates: {
      canonical: `https://dirogsa.com/producto/${product.sku}`,
    },
  };
}

/**
 * PURE SERVER COMPONENT — No useState, no useEffect, no client JS.
 * This is what Google indexes. Full HTML arrives pre-built.
 */
export default async function ProductPage({ params }) {
  const { sku } = await params;
  const product = await ProductService.getProductBySku(sku);

  if (!product) notFound();

  // ── JSON-LD Schema.org (Google Rich Snippets) ──
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${product.name} ${product.brand}`,
    description: product.description,
    sku: product.sku,
    mpn: product.sku,
    image: product.imageUrl || 'https://dirogsa.com/default-product.png',
    brand: { '@type': 'Brand', name: product.brand },
    offers: {
      '@type': 'Offer',
      url: `https://dirogsa.com/producto/${product.sku}`,
      priceCurrency: product.currency,
      price: product.price,
      priceValidUntil: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'DIROGSA' },
    },
    ...(product.equivalences.length > 0 && {
      additionalProperty: product.equivalences.slice(0, 10).map(eq => ({
        '@type': 'PropertyValue',
        name: eq.brand || 'Referencia Equivalente',
        value: eq.code || eq,
      })),
    }),
  };

  const hasStock = product.stock > 0;

  return (
    <div className="max-w-7xl mx-auto px-5 py-8">

      {/* JSON-LD Invisible for Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ─── BREADCRUMB ─── */}
      <nav className="flex items-center gap-2 text-xs mb-8 fade-in"
           style={{ color: 'var(--brand-text-dim)' }}>
        <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
        <span>/</span>
        <Link href="/catalogo" className="hover:text-white transition-colors">Catálogo</Link>
        <span>/</span>
        <span className="text-white font-bold">{product.sku}</span>
      </nav>

      {/* ─── MAIN GRID ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">

        {/* ── LEFT: IMAGE ── */}
        <div className="space-y-4">
          <div className="relative rounded-[2.5rem] overflow-hidden flex items-center justify-center p-10 group"
               style={{ background: 'var(--brand-surface)', border: '1px solid rgba(255,255,255,0.05)', minHeight: '380px' }}>
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={`${product.name} — Código ${product.sku} | DIROGSA`}
                className="max-w-full max-h-[320px] object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="flex flex-col items-center gap-4 opacity-30">
                <svg className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-bold">Imagen no disponible</span>
              </div>
            )}
            {product.isNew && (
              <div className="absolute top-5 left-5 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl animate-pulse shadow-lg"
                   style={{ background: 'var(--brand-primary)', color: '#0A0A0B' }}>
                NUEVO
              </div>
            )}
          </div>

          {/* Technical Specs Grid */}
          {product.specs.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {product.specs.slice(0, 4).map((spec, i) => (
                <div key={i} className="flex flex-col items-center justify-center text-center p-3 rounded-2xl"
                     style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <span className="text-[9px] font-black uppercase tracking-tight mb-1"
                        style={{ color: 'var(--brand-orange)' }}>{spec.label}</span>
                  <span className="text-sm font-black text-white">{spec.value}</span>
                  {spec.measure_type && (
                    <span className="text-[8px] font-bold uppercase mt-0.5"
                          style={{ color: 'var(--brand-text-dim)' }}>{spec.measure_type}</span>
                  )}
                </div>
              ))}
              {product.weightG > 0 && (
                <div className="flex flex-col items-center justify-center text-center p-3 rounded-2xl"
                     style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <span className="text-[9px] font-black uppercase tracking-tight mb-1"
                        style={{ color: 'var(--brand-orange)' }}>PESO</span>
                  <span className="text-sm font-black text-white">{product.weightG}</span>
                  <span className="text-[8px] font-bold uppercase mt-0.5"
                        style={{ color: 'var(--brand-text-dim)' }}>GRAMOS</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT: INFO ── */}
        <div className="space-y-6">

          {/* Brand + Title */}
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest"
                  style={{ color: 'var(--brand-primary)' }}>
              {product.brand}
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight uppercase tracking-tighter mt-2">
              {product.name}
            </h1>
            <div className="flex items-center gap-3 mt-3">
              <span className="px-4 py-1.5 rounded-lg font-black text-sm tracking-widest"
                    style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border)', color: 'var(--brand-primary)' }}>
                {product.sku}
              </span>
              <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase border-2 ${hasStock
                ? 'text-green-400 bg-green-400/10 border-green-400/20'
                : 'text-red-400 bg-red-400/10 border-red-400/20'}`}>
                {hasStock ? `${product.stock} En Stock` : 'Agotado'}
              </span>
            </div>
          </div>

          {/* Price Card — B2B Gated */}
          <div className="rounded-[2rem] p-6 relative overflow-hidden"
               style={{ background: 'rgba(20,21,24,0.5)', border: '2px solid rgba(255,255,255,0.05)' }}>
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <svg className="h-20 w-20" style={{ color: 'var(--brand-primary)' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest"
                      style={{ color: 'var(--brand-text-dim)' }}>Precio Unitario</span>
                {product.promoDiscountPct > 0 && (
                  <span className="text-[10px] font-black px-3 py-1 rounded-full animate-pulse"
                        style={{ background: 'rgba(245,158,11,0.2)', color: 'var(--brand-orange)', border: '1px solid rgba(245,158,11,0.3)' }}>
                    ¡OFERTA -{product.promoDiscountPct}%!
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-5xl font-black text-white">
                  {product.currency === 'PEN' ? 'S/' : '$'} {Number(product.price).toFixed(2)}
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--brand-text-dim)' }}>Incl. IGV · Precio para clientes registrados</p>
            </div>
          </div>

          {/* CTA B2B Login */}
          <div className="rounded-[1.5rem] p-5 text-center space-y-3"
               style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="h-10 w-10 rounded-full flex items-center justify-center mx-auto"
                 style={{ background: 'rgba(245,158,11,0.1)' }}>
              <span className="text-xl">🔒</span>
            </div>
            <h3 className="text-white font-black text-base uppercase tracking-tight">Acceso B2B Requerido</h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--brand-text-dim)' }}>
              Para ver precios especiales por volumen y realizar pedidos, inicia sesión con tu cuenta de distribuidor.
            </p>
            <Link href="/login"
              className="mt-2 w-full block py-4 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all hover:brightness-110 active:scale-95"
              style={{ background: 'var(--brand-orange)', color: '#0A0A0B', boxShadow: '0 0 20px rgba(245,158,11,0.3)' }}>
              INICIAR SESIÓN
            </Link>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest mb-2"
                style={{ color: 'var(--brand-text-muted)' }}>Descripción</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--brand-text-muted)' }}>
              {product.description}
            </p>
          </div>
        </div>
      </div>

      {/* ─── TABS: EQUIVALENCIAS + APLICACIONES ─── */}
      <div className="space-y-8">

        {/* Equivalencias */}
        {product.equivalences.length > 0 && (
          <section>
            <h2 className="text-lg font-black text-white mb-4 flex items-center gap-3">
              <span className="w-1 h-6 rounded-full" style={{ background: 'var(--brand-primary)' }} />
              Referencias y Equivalencias
              <span className="text-sm font-bold" style={{ color: 'var(--brand-text-dim)' }}>
                ({product.equivalences.length})
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {product.equivalences.map((eq, i) => (
                <div key={i}
                  className="flex items-center justify-between p-5 rounded-[1.5rem]"
                  style={{ background: 'rgba(20,21,24,0.5)', border: '1px solid rgba(110,231,183,0.15)' }}>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1"
                       style={{ color: '#6EE7B7' }}>{eq.brand || 'Equivalente'}</p>
                    <p className="text-sm font-black text-white font-mono">{eq.code || eq}</p>
                  </div>
                  {eq.is_original && (
                    <span className="text-[10px] font-black px-3 py-1 rounded-lg uppercase"
                          style={{ background: 'rgba(16,185,129,0.2)', color: 'var(--brand-primary)', border: '1px solid rgba(16,185,129,0.3)' }}>OEM</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Aplicaciones Vehiculares */}
        {product.applications.length > 0 && (
          <section>
            <h2 className="text-lg font-black text-white mb-4 flex items-center gap-3">
              <span className="w-1 h-6 rounded-full" style={{ background: '#38BDF8' }} />
              Aplicaciones Vehiculares
              <span className="text-sm font-bold" style={{ color: 'var(--brand-text-dim)' }}>
                ({product.applications.length})
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {product.applications.map((app, i) => (
                <div key={i}
                  className="p-5 rounded-[1.5rem] relative overflow-hidden group"
                  style={{ background: 'rgba(20,21,24,0.5)', border: '1px solid rgba(56,189,248,0.15)' }}>
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="h-12 w-12" style={{ color: '#38BDF8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-black text-white uppercase mb-2">
                    {app.make} {app.model}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] font-black px-3 py-1 rounded-xl"
                          style={{ color: '#38BDF8', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)' }}>
                      {app.year}
                    </span>
                    {app.engine && (
                      <span className="text-[10px] font-black px-3 py-1 rounded-xl"
                            style={{ color: '#38BDF8', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)' }}>
                        MOT: {app.engine}
                      </span>
                    )}
                  </div>
                  {app.notes && (
                    <p className="text-xs mt-3 italic leading-relaxed"
                       style={{ color: 'var(--brand-text-muted)' }}>Nota: {app.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Features */}
        {product.features.length > 0 && (
          <section>
            <h2 className="text-lg font-black text-white mb-4 flex items-center gap-3">
              <span className="w-1 h-6 rounded-full" style={{ background: 'var(--brand-accent)' }} />
              Atributos Adicionales
            </h2>
            <div className="flex flex-wrap gap-3">
              {product.features.map((f, i) => (
                <span key={i}
                  className="text-sm font-black px-5 py-2.5 rounded-2xl"
                  style={{ background: 'var(--brand-surface)', border: '1px solid rgba(255,255,255,0.05)', color: 'white' }}>
                  {f}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>

    </div>
  );
}
