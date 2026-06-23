import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ProductService } from '@/services/product.service';
import ReviewForm from '@/components/product/ReviewForm';
import ProductTabs from '@/components/product/ProductTabs';
import AddToCartModule from '@/components/product/AddToCartModule';

export const dynamic = 'force-dynamic'; // On-demand SSR: no build-time bombardment of the free-tier API
export const revalidate = false;        // ISR disabled: each request is served by SSR cache headers

/**
 * DYNAMIC METADATA — Constitution §6 / SEO Architecture
 * Next.js calls this BEFORE rendering. Google sees the exact title+description on arrival.
 */
export async function generateMetadata({ params }) {
  const { sku } = await params;
  // NOTE: Next.js 14+ automatically deduplicates fetch() calls with same URL+opts within a request.
  // ProductService.getProductBySku uses the same path so this is free — no extra DB round-trip.
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
  const mainTitle = `${baseType} ${product.brand} ${product.sku} | Cotizar Mayorista Perú`;
  
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
      product.sku, `${baseType} ${product.sku}`, `cotizar ${product.sku} al por mayor peru`, 
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
      canonical: `https://dirogsa.com/product/${product.sku}`,
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

  const hasValidImage = product.imageUrl && 
    product.imageUrl.trim() !== '' && 
    product.imageUrl.toLowerCase() !== 'none' && 
    !product.imageUrl.includes('placeholder') && 
    !product.imageUrl.includes('default');

  // Fetch related products (Hub & Spoke SEO Cross-Linking)
  const relatedRes = await ProductService.getRelatedProducts(product, 4);
  const relatedProducts = (relatedRes?.items || []).filter(p => p.sku !== product.sku).slice(0, 4);

  // ── JSON-LD: BreadcrumbList (genera rutas verdes en resultados de Google) ──
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://dirogsa.com' },
      { '@type': 'ListItem', position: 2, name: 'Catálogo', item: 'https://dirogsa.com/catalogo' },
      { '@type': 'ListItem', position: 3, name: product.sku, item: `https://dirogsa.com/product/${product.sku}` },
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
      url: `https://dirogsa.com/product/${product.sku}`,
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
            {hasValidImage ? (
              <div className="relative w-full h-[320px] flex items-center justify-center">
                <img
                  src={product.imageUrl}
                  alt={`${product.name} — Código ${product.sku} | DIROGSA`}
                  className="max-w-full max-h-full object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-700"
                  loading="eager"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 select-none">
                <div className="relative w-40 h-40 mb-4 flex items-center justify-center text-brand-primary">
                  <svg className="w-full h-full text-brand-primary opacity-60 hover:opacity-100 transition-opacity" viewBox="0 0 100 100" fill="none">
                    <defs>
                      <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0" />
                      </radialGradient>
                      <linearGradient id="pleats" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="25%" stopColor="#D97706" />
                        <stop offset="50%" stopColor="#F59E0B" />
                        <stop offset="75%" stopColor="#D97706" />
                        <stop offset="100%" stopColor="#B45309" />
                      </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r="45" fill="url(#glow)" />
                    <rect x="25" y="25" width="50" height="50" rx="4" fill="url(#pleats)" />
                    <path d="M30 25 v50 M35 25 v50 M40 25 v50 M45 25 v50 M50 25 v50 M55 25 v50 M60 25 v50 M65 25 v50 M70 25 v50" stroke="#78350F" strokeWidth="1.5" strokeOpacity="0.5" />
                    <rect x="23" y="21" width="54" height="5" rx="1.5" fill="#1F2937" stroke="#374151" strokeWidth="1" />
                    <rect x="23" y="74" width="54" height="5" rx="1.5" fill="#1F2937" stroke="#374151" strokeWidth="1" />
                    <circle cx="50" cy="47" r="12" fill="#111827" stroke="var(--brand-primary)" strokeWidth="1" strokeOpacity="0.5" />
                    <path d="M47 47 l2 2 l4 -4" stroke="var(--brand-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-1">Ilustración Técnica</h3>
                <p className="text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--brand-text-muted)' }}>
                  Catálogo Oficial DIROGSA
                </p>
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

          {/* ─── ZONA DE PRECIO Y ACCESO B2B (MÓDULO INTERACTIVO) ─── */}
          <AddToCartModule product={product} isAuthenticated={isAuthenticated} />

        </div>
      </div>

      {/* ─── TABS: FICHA, APLICACIONES, EQUIVALENCIAS, COMUNIDAD ─── */}
      <ProductTabs product={product} />

      {/* ─── HUB & SPOKE SEO: ENLAZADO INTERNO DE PRODUCTOS RELACIONADOS ─── */}
      {relatedProducts.length > 0 && (
        <div className="mt-20 border-t border-white/5 pt-12">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-8">
            También te podría interesar de <span style={{ color: 'var(--brand-primary)' }}>{product.brand}</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((p, i) => (
              <Link href={`/product/${p.sku}`} key={i} className="group block">
                <div className="rounded-[1.5rem] bg-[var(--brand-surface)] border border-white/5 p-4 hover:border-white/20 transition-all">
                  <div className="relative w-full h-32 mb-4 flex items-center justify-center bg-white/5 rounded-xl p-2 overflow-hidden">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={`Repuesto ${p.sku} ${p.brand}`}
                        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] font-black uppercase text-[var(--brand-primary)] tracking-widest">{p.brand}</div>
                  <h3 className="text-white font-bold text-sm truncate mt-1">{p.sku}</h3>
                  <div className="text-[var(--brand-text-dim)] text-xs truncate">{p.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
