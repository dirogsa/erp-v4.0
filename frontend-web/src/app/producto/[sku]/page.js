import Link from 'next/link';
import Image from 'next/image';
import { ProductService } from '@/services/product.service';
import ReviewForm from '@/components/product/ReviewForm';
import ProductTabs from '@/components/product/ProductTabs';

/**
 * DYNAMIC METADATA — Constitution §6 / SEO Architecture
 * Next.js calls this BEFORE rendering. Google sees the exact title+description on arrival.
 */
export async function generateMetadata({ params }) {
  const { sku } = await params;
  const product = await ProductService.getProductBySku(sku);

  if (!product) {
    return {
      title: 'Producto no encontrado | DIROGSA Perú',
      description: 'El repuesto buscado no está disponible en el catálogo de DIROGSA Perú.',
    };
  }

  // Helper para intenciones de búsqueda según categoría (Filtros vs otros repuestos)
  const isFilter = product.category?.toLowerCase().includes('filtro');
  const baseType = isFilter ? 'Filtro de Aire' : product.category || 'Repuesto';
  const mainTitle = `${baseType} ${product.brand} ${product.sku} | Comprar en Perú`;
  
  // Construcción semántica de la descripción para máximo CTR local
  let description = `¿Buscas ${baseType} código ${product.sku} de la marca ${product.brand} en Perú? `;
  description += `Encuentra stock, precio y especificaciones técnicas en DIROGSA. `;
  if (product.applications?.length > 0) {
    const mainApps = product.applications.slice(0, 2).map(a => `${a.make} ${a.model}`).join(' y ');
    description += `Compatible con ${mainApps}. `;
  }
  if (product.equivalences?.length > 0) {
    description += `Equivalencias: ${product.equivalences.slice(0, 3).map(e => e.code || e).join(', ')}. `;
  }
  description += `Envíos a nivel nacional.`;

  return {
    title: mainTitle,
    description,
    keywords: [
      product.sku, `${baseType} ${product.sku}`, `comprar ${product.sku} peru`, 
      product.brand, `${product.brand} peru`, 'filtros automotrices peru', 'dirogsa',
      ...product.equivalences.slice(0,3).map(e => (e.code || e))
    ].join(', '),
    openGraph: {
      title: mainTitle,
      description,
      images: product.imageUrl ? [{ url: product.imageUrl, alt: mainTitle }] : [],
      type: 'website',
      locale: 'es_PE',
      siteName: 'DIROGSA',
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

  // ── JSON-LD: BreadcrumbList (genera rutas verdes en resultados de Google) ──
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://dirogsa.com' },
      { '@type': 'ListItem', position: 2, name: 'Catálogo', item: 'https://dirogsa.com/catalogo' },
      { '@type': 'ListItem', position: 3, name: product.sku, item: `https://dirogsa.com/producto/${product.sku}` },
    ],
  };

  // ── JSON-LD Schema.org (Google Rich Snippets para Perú) ──
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${product.category || 'Repuesto'} ${product.brand} ${product.sku}`,
    description: product.description || `Filtro/Repuesto automotriz ${product.brand} ${product.sku}. Venta y distribución a nivel nacional en Perú.`,
    sku: product.sku,
    mpn: product.sku,
    image: product.imageUrl || 'https://dirogsa.com/default-product.png',
    brand: { '@type': 'Brand', name: product.brand },
    offers: {
      '@type': 'Offer',
      url: `https://dirogsa.com/producto/${product.sku}`,
      priceCurrency: product.currency || 'PEN',
      price: product.price,
      priceValidUntil: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { 
        '@type': 'Organization', 
        name: 'DIROGSA',
        areaServed: 'PE' // Geolocalización crítica
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: 'PEN'
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'PE'
        }
      }
    },
    ...(product.equivalences?.length > 0 && {
      additionalProperty: product.equivalences.slice(0, 10).map(eq => ({
        '@type': 'PropertyValue',
        name: 'Equivalencia Original/Cross-Reference',
        value: `${eq.brand || 'OEM'} ${eq.code || eq}`,
      })),
    }),
  };

  // ── JSON-LD: Reviews & Ratings ──
  if (product.reviews?.length > 0) {
    const totalRating = product.reviews.reduce((acc, curr) => acc + curr.rating, 0);
    const avgRating = (totalRating / product.reviews.length).toFixed(1);
    
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avgRating,
      reviewCount: product.reviews.length,
      bestRating: "5",
      worstRating: "1"
    };

    jsonLd.review = product.reviews.slice(0, 5).map(r => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.user_name },
      datePublished: r.created_at,
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: '5' },
      reviewBody: r.comment || ''
    }));
  }

  // ── JSON-LD: FAQPage ──
  let faqJsonLd = null;
  if (product.faqs?.length > 0) {
    faqJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: product.faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    };
  }

  const hasStock = product.stock > 0;
  
  // TODO: Integrar con sistema de cookies/sesión real del ERP.
  // Por defecto, asumimos que es un visitante sin autenticación (B2C/Guest)
  const isAuthenticated = false;

  return (
    <div className="max-w-7xl mx-auto px-5 py-8">

      {/* JSON-LD Schemas invisibles para Google */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}

      {/* ─── BREADCRUMB SEMÁNTICO (aria + schema aligned) ─── */}
      <nav aria-label="Ruta de navegación" className="flex items-center gap-2 text-xs mb-8 fade-in" style={{ color: 'var(--brand-text-dim)' }}>
        <ol className="flex items-center gap-2 list-none p-0 m-0">
          <li><Link href="/" className="hover:text-white transition-colors">Inicio</Link></li>
          <li aria-hidden="true"><span className="opacity-40">/</span></li>
          <li><Link href="/catalogo" className="hover:text-white transition-colors">Catálogo</Link></li>
          <li aria-hidden="true"><span className="opacity-40">/</span></li>
          <li className="text-white font-bold" aria-current="page">{product.sku}</li>
        </ol>
      </nav>

      {/* ─── MAIN GRID ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">

        {/* ── LEFT: IMAGE ── */}
        <div className="space-y-4">
          <div className="relative rounded-[2.5rem] overflow-hidden flex items-center justify-center p-10 group"
               style={{ background: 'var(--brand-surface)', border: '1px solid rgba(255,255,255,0.05)', minHeight: '380px' }}>
            {product.imageUrl ? (
              <div className="relative w-full h-[320px]">
                <Image
                  src={product.imageUrl}
                  alt={`${product.name} — Código ${product.sku} | DIROGSA`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-700"
                  priority
                />
              </div>
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
              {isAuthenticated ? (
                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase border-2 ${hasStock
                  ? 'text-green-400 bg-green-400/10 border-green-400/20'
                  : 'text-red-400 bg-red-400/10 border-red-400/20'}`}>
                  {hasStock ? `${product.stock} En Stock` : 'Agotado'}
                </span>
              ) : (
                <span className="px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase border-2 text-gray-400 bg-gray-500/10 border-gray-500/20 flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Stock Oculto
                </span>
              )}
            </div>
          </div>

          {/* ─── ZONA DE PRECIO Y ACCESO B2B ─── */}
          {isAuthenticated ? (
            /* Usuario Autenticado: Muestra Precio y Acciones de Compra */
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
                
                <button className="mt-6 w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:brightness-110 active:scale-95 text-black"
                        style={{ background: 'var(--brand-primary)', boxShadow: '0 0 20px rgba(16,185,129,0.3)' }}>
                  Añadir al Carrito
                </button>
              </div>
            </div>
          ) : (
            /* Usuario Invitado: Tarjeta Premium de Bloqueo (Glassmorphism) */
            <div className="relative rounded-[2rem] p-[2px] overflow-hidden group">
              {/* Borde animado de gradiente */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#F59E0B] via-[#0A0A0B] to-[#38BDF8] opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
              
              <div className="relative h-full w-full rounded-[2rem] p-6 text-center flex flex-col items-center justify-center space-y-4 backdrop-blur-xl"
                   style={{ background: 'rgba(10,10,11,0.85)' }}>
                
                {/* Ícono de candado con glow */}
                <div className="relative">
                  <div className="absolute inset-0 bg-[#F59E0B] blur-[20px] opacity-20 rounded-full" />
                  <div className="h-14 w-14 rounded-full flex items-center justify-center relative z-10 border border-[#F59E0B]/30"
                       style={{ background: 'rgba(245,158,11,0.1)' }}>
                    <svg className="h-6 w-6 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-black text-lg uppercase tracking-tight mb-1">Información B2B Privada</h3>
                  <p className="text-[13px] leading-relaxed max-w-[280px] mx-auto" style={{ color: 'var(--brand-text-dim)' }}>
                    Visualiza stock en tiempo real, precios al por mayor y realiza pedidos al instante.
                  </p>
                </div>

                <div className="w-full pt-2">
                  <Link href="/login"
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all hover:brightness-110 active:scale-95"
                    style={{ background: 'var(--brand-orange)', color: '#0A0A0B', boxShadow: '0 0 20px rgba(245,158,11,0.2)' }}>
                    Iniciar Sesión
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                  <p className="mt-4 text-[10px] uppercase font-bold tracking-widest" style={{ color: 'var(--brand-text-muted)' }}>
                    ¿Eres distribuidor y no tienes cuenta? <a href="#" className="text-[#38BDF8] hover:underline">Solicita acceso</a>
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ─── TABS: FICHA, APLICACIONES, EQUIVALENCIAS, COMUNIDAD ─── */}
      <ProductTabs product={product} />

    </div>
  );
}
