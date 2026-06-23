import Link from 'next/link';
import ActionLink from '@/components/ActionLink';
import { ProductService } from '@/services/product.service';
import LoadMoreProducts from '../LoadMoreProducts';
import { slugToDisplay } from '@/lib/slug';

function getBrandStyles(brandName) {
  const cleanName = brandName.trim();
  const lowerName = cleanName.toLowerCase();
  
  if (lowerName.includes('wix')) return {
    gradient: 'from-[#FFDD00]/10 to-transparent',
    borderColor: 'hover:border-[#FFDD00]/30',
    shadowColor: 'hover:shadow-[#FFDD00]/5',
    tagColor: 'text-[#FFDD00] bg-[#FFDD00]/5 border-[#FFDD00]/20',
    logo: 'WIX'
  };
  if (lowerName.includes('mann')) return {
    gradient: 'from-[#009E49]/10 to-transparent',
    borderColor: 'hover:border-[#009E49]/30',
    shadowColor: 'hover:shadow-[#009E49]/5',
    tagColor: 'text-[#009E49] bg-[#009E49]/5 border-[#009E49]/20',
    logo: 'MANN'
  };
  if (lowerName.includes('azumi')) return {
    gradient: 'from-[#E31E24]/10 to-transparent',
    borderColor: 'hover:border-[#E31E24]/30',
    shadowColor: 'hover:shadow-[#E31E24]/5',
    tagColor: 'text-[#E31E24] bg-[#E31E24]/5 border-[#E31E24]/20',
    logo: 'AZUMI'
  };
  if (lowerName.includes('totachi')) return {
    gradient: 'from-[#004A97]/10 to-transparent',
    borderColor: 'hover:border-[#004A97]/30',
    shadowColor: 'hover:shadow-[#004A97]/5',
    tagColor: 'text-[#004A97] bg-[#004A97]/5 border-[#004A97]/20',
    logo: 'TOTACHI'
  };
  if (lowerName.includes('filtron')) return {
    gradient: 'from-[#E2001A]/10 to-transparent',
    borderColor: 'hover:border-[#E2001A]/30',
    shadowColor: 'hover:shadow-[#E2001A]/5',
    tagColor: 'text-[#E2001A] bg-[#E2001A]/5 border-[#E2001A]/20',
    logo: 'FILTRON'
  };
  if (lowerName.includes('mahle')) return {
    gradient: 'from-[#00A5DF]/10 to-transparent',
    borderColor: 'hover:border-[#00A5DF]/30',
    shadowColor: 'hover:shadow-[#00A5DF]/5',
    tagColor: 'text-[#00A5DF] bg-[#00A5DF]/5 border-[#00A5DF]/20',
    logo: 'MAHLE'
  };
  if (lowerName.includes('asakashi')) return {
    gradient: 'from-[#C41230]/10 to-transparent',
    borderColor: 'hover:border-[#C41230]/30',
    shadowColor: 'hover:shadow-[#C41230]/5',
    tagColor: 'text-[#C41230] bg-[#C41230]/5 border-[#C41230]/20',
    logo: 'JS'
  };
  
  return {
    gradient: 'from-brand-primary/5 to-transparent',
    borderColor: 'hover:border-brand-primary/30',
    shadowColor: 'hover:shadow-brand-primary/5',
    tagColor: 'text-brand-primary bg-brand-primary/5 border-brand-primary/20',
    logo: cleanName.substring(0, 7).toUpperCase()
  };
}

export async function generateMetadata({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { slug } = resolvedParams;
  const brand = resolvedSearchParams.brand || '';
  const categoryName = slugToDisplay(slug);
  
  const title = brand 
    ? `${categoryName} ${brand.toUpperCase()} al por mayor | DIROGSA`
    : `${categoryName} al por mayor | Catálogo B2B DIROGSA`;
    
  return {
    title,
    description: `Explora nuestro catálogo completo de ${categoryName.toLowerCase()} ${brand ? `de la marca ${brand.toUpperCase()}` : ''}. Compra repuestos automotrices con calidad certificada.`,
    alternates: {
      canonical: `https://www.dirogsa.com/catalog/${slug}${brand ? `?brand=${brand}` : ''}`,
    },
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { slug } = resolvedParams;
  const brandParam = resolvedSearchParams.brand || '';
  const categoryName = slugToDisplay(slug);
  const limit = 48;

  // 1. Fetch ALL brands dynamically from the database
  const dbBrands = await ProductService.getProductBrands();
  
  // 2. Filter active and allowed to be shown in catalog
  const activeDbBrands = dbBrands.filter(b => b.is_active !== false && b.show_in_catalog !== false);
  
  // 3. Build enriched BRANDS array using ONLY DB data for business fields
  const BRANDS = activeDbBrands.map(b => {
    const styles = getBrandStyles(b.name);
    return {
      id: b.name.toLowerCase(),
      name: b.name,
      origin: b.origin || '',
      description: b.description || `Línea de repuestos y filtros de calidad superior marca ${b.name} con garantía certificada de DIROGSA.`,
      ...styles
    };
  });

  // Active brand selection helper
  const activeBrandObj = brandParam ? BRANDS.find(b => b.id === brandParam.toLowerCase()) : null;

  // Query database ONLY if a brand is specified (saving free-tier database connections/queries)
  let items = [];
  let total = 0;

  if (activeBrandObj) {
    const data = await ProductService.searchProducts({ 
      category: categoryName,
      search: activeBrandObj.name,
      limit: limit,
      skip: 0
    });
    items = data.items || [];
    total = data.total || 0;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] pb-24">
      {/* ─── HERO SECTION ─── */}
      <section className="relative w-full h-[50vh] flex items-center justify-center bg-[#0D0E12] border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/5 via-[#0A0A0B]/85 to-[#0A0A0B]" />
        <div className="max-w-5xl mx-auto px-5 text-center flex flex-col items-center relative z-10 mt-16">
          <span className="text-brand-primary text-xs font-black tracking-[0.3em] uppercase mb-4 px-4 py-1.5 rounded-full border border-brand-primary/30 bg-brand-primary/10">
            {activeBrandObj ? `${total} PRODUCTOS DISPONIBLES` : 'EMBUDO DE DESCUBRIMIENTO'}
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-4 drop-shadow-2xl">
            {categoryName} {activeBrandObj ? `— ${activeBrandObj.name}` : ''}
          </h1>
          <p className="text-brand-text-dim text-base md:text-lg max-w-2xl font-medium leading-relaxed">
            {activeBrandObj 
              ? `Mostrando filtros de alta calidad importados de la marca ${activeBrandObj.name} para ${categoryName.toLowerCase()}.`
              : 'Selecciona una de nuestras marcas exclusivas importadas para ver los repuestos exactos y optimizar el rendimiento de la base de datos.'
            }
          </p>
          <div className="mt-8 flex gap-4">
            <ActionLink href="/catalog" className="text-xs text-white/50 hover:text-white uppercase font-bold tracking-widest transition-colors flex items-center gap-2" loadingMessage="Cargando categorías...">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Volver a Categorías
            </ActionLink>
            {activeBrandObj && (
              <ActionLink href={`/catalog/${slug}`} className="text-xs text-brand-primary hover:text-white uppercase font-bold tracking-widest transition-colors flex items-center gap-2" loadingMessage="Limpiando filtro...">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Cambiar de Marca
              </ActionLink>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 mt-12">
        {/* ─── BRAND FILTER DISPLAY (No brand selected yet) ─── */}
        {!activeBrandObj ? (
          <div className="space-y-8">
            <div className="text-center md:text-left border-b border-white/5 pb-4">
              <h2 className="text-white font-black text-xl md:text-2xl uppercase tracking-wider">
                Marcas Importadas Disponibles
              </h2>
              <p className="text-brand-text-dim text-xs md:text-sm mt-1">
                Elija una marca para cargar los códigos específicos de la base de datos de {categoryName.toLowerCase()}.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {BRANDS.map((brand) => (
                <ActionLink 
                  key={brand.id}
                  href={`/catalog/${slug}?brand=${brand.id}`}
                  className={`group relative overflow-hidden bg-[#141518]/60 backdrop-blur-md border border-white/5 rounded-3xl p-8 flex flex-col justify-between transition-all duration-500 hover:-translate-y-1.5 ${brand.borderColor} ${brand.shadowColor} hover:shadow-2xl`}
                  loadingMessage={`Consultando base de datos ${brand.name}...`}
                >
                  {/* Decorative background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${brand.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        {brand.origin && (
                          <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${brand.tagColor}`}>
                            Origen: {brand.origin}
                          </span>
                        )}
                      </div>
                      <span className="text-2xl font-black text-white/20 group-hover:text-white/40 transition-colors uppercase tracking-widest font-mono">
                        {brand.logo}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-white font-black text-2xl uppercase tracking-wide group-hover:text-brand-primary transition-colors">
                        {brand.name}
                      </h3>
                      <p className="text-brand-text-dim text-xs md:text-sm mt-2 leading-relaxed font-medium">
                        {brand.description}
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 flex items-center justify-between border-t border-white/5 pt-6 mt-6">
                    <span className="text-[10px] text-white/50 group-hover:text-white uppercase font-bold tracking-widest transition-colors">
                      Ver catálogo {categoryName.toLowerCase()}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-black transition-all duration-300">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </ActionLink>
              ))}
            </div>
          </div>
        ) : (
          /* ─── PRODUCT LIST DISPLAY (Brand selected) ─── */
          <div className="space-y-6">
            {/* Quick Filter Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between border-b border-white/5 pb-4 gap-4">
              <div>
                <p className="text-xs md:text-sm text-brand-text-dim text-center md:text-left">
                  Mostrando <span className="text-white font-bold">{items.length}</span> de <span className="text-white font-bold">{total}</span> filtros marca <span className="text-brand-primary font-bold">{activeBrandObj.name}</span>
                </p>
              </div>

              {/* Brand selection switcher pills */}
              <div className="flex flex-wrap gap-2 justify-center">
                {BRANDS.map(b => (
                  <ActionLink
                    key={b.id}
                    href={`/catalog/${slug}?brand=${b.id}`}
                    loadingMessage={`Cargando ${b.name}...`}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                      b.id === brandParam.toLowerCase()
                        ? 'bg-brand-primary text-black border-transparent shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        : 'bg-white/5 text-white/70 border-white/5 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {b.name}
                  </ActionLink>
                ))}
                <ActionLink
                  href={`/catalog/${slug}`}
                  loadingMessage="Limpiando filtro..."
                  className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                >
                  Limpiar Filtro ×
                </ActionLink>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-32 text-white/50 font-bold uppercase tracking-widest border border-white/5 rounded-3xl bg-[#141518]/20">
                No se encontraron productos de la marca {activeBrandObj.name} en esta categoría.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {items.map(product => (
                    <Link key={product.sku} href={`/product/${product.sku}`}
                      className="group bg-[#141518]/60 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden flex flex-col hover:border-brand-primary/40 hover:shadow-[0_10px_40px_rgba(16,185,129,0.1)] transition-all duration-500 hover:-translate-y-2 relative">
                      
                      {product.isNew && (
                        <span className="absolute top-4 left-4 z-20 text-[8px] font-black uppercase px-3 py-1.5 rounded-xl bg-brand-primary text-black shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-pulse">
                          Nuevo Ingreso
                        </span>
                      )}

                      <div className="h-56 w-full flex items-center justify-center relative bg-gradient-to-b from-white/5 to-transparent p-6 overflow-hidden">
                        <div className="absolute inset-0 bg-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-b-[4rem]"></div>
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name}
                               className="max-w-full max-h-full object-contain group-hover:scale-125 transition-transform duration-700 ease-out drop-shadow-2xl relative z-10" />
                        ) : (
                          <svg className="h-16 w-16 opacity-10 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>

                      <div className="p-6 flex-1 flex flex-col justify-between border-t border-white/5 relative bg-[#0D0E12]">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-text-dim mb-2 block group-hover:text-brand-primary transition-colors">
                            {product.brand || 'DIROGSA'}
                          </span>
                          <h3 className="text-white font-bold text-sm leading-relaxed line-clamp-2 pr-4">
                            {product.name}
                          </h3>
                        </div>
                        
                        <div className="flex items-end justify-between pt-6 mt-4">
                          <div className="flex flex-col">
                            <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest mb-1">Código</span>
                            <span className="text-sm font-black tracking-wider text-white">
                              {product.sku}
                            </span>
                          </div>
                          <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-black transition-all duration-300 border border-white/10 group-hover:border-transparent">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                
                <LoadMoreProducts 
                  category={categoryName}
                  search={activeBrandObj.name}
                  initialSkip={limit} 
                  total={total} 
                  limit={limit} 
                />
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
