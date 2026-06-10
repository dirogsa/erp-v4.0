import Link from 'next/link';
import { ProductService } from '@/services/product.service';
import ImageWithFallback from '@/components/ImageWithFallback';

export const metadata = {
  title: 'Catálogo de Repuestos | DIROGSA',
  description: 'Explora nuestro catálogo completo de repuestos y filtros automotrices. Todos los modelos y marcas con calidad certificada.',
};

export default async function CatalogoPage({ searchParams }) {
  // Support simple pagination or category filtering via URL query
  const sp = await searchParams;
  const page = parseInt(sp.page) || 1;
  const limit = 48; // Límite aumentado para mostrar buenas agrupaciones de marcas
  const category = sp.category || '';

  const { items, total } = await ProductService.searchProducts({ 
    limit: limit * page, 
    category: category
  });

  // Agrupar los productos por marca
  const groupedBrands = items.reduce((acc, product) => {
    const brand = (product.brand || 'Otras Marcas').toUpperCase();
    if (!acc[brand]) acc[brand] = [];
    acc[brand].push(product);
    return acc;
  }, {});

  // Ordenar alfabéticamente (WIX, FILTRON, AZUMI, etc.)
  const sortedBrands = Object.keys(groupedBrands).sort();

  // Fecha actual para la portada
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('es-PE', { month: 'long' });
  const currentYear = currentDate.getFullYear();

  return (
    <div className="min-h-screen bg-[#0A0A0B] pb-24">
      
      {/* 1. PÁGINA 1: PORTADA (100vh) */}
      <section className="relative w-full h-screen flex items-center justify-center overflow-hidden border-b border-white/5">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{ backgroundImage: "url('/api/images/cover.webp')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0B]/40 via-transparent to-[#0A0A0B]" />
        
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto flex flex-col items-center mt-[-80px]">
          <span className="text-brand-primary text-xs md:text-sm font-black tracking-[0.3em] uppercase mb-6 px-4 py-1.5 rounded-full border border-brand-primary/30 bg-brand-primary/10">
            DIROGSA B2B • {currentMonth.toUpperCase()} {currentYear}
          </span>
          <h1 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter mb-8 drop-shadow-2xl leading-none">
            El Catálogo <br className="hidden md:block"/> Definitivo
          </h1>
          <p className="text-base md:text-xl text-brand-text-dim max-w-2xl font-medium leading-relaxed">
            Explora la selección más grande de filtros automotrices e industriales en el Perú. Calidad certificada, equivalencias exactas y el respaldo de las mejores marcas globales.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 mt-12">
            {['', 'ACEITE', 'AIRE', 'COMBUSTIBLE', 'CABINA'].map(cat => (
              <Link 
                key={cat || 'ALL'} 
                href={cat ? `/catalogo?category=${cat}` : '/catalogo'}
                className="px-6 py-3.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 backdrop-blur-md"
                style={category === cat 
                  ? { background: 'var(--brand-primary)', color: '#000', boxShadow: '0 0 30px rgba(16,185,129,0.5)' } 
                  : { background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }
                }
              >
                {cat ? `FILTROS DE ${cat}` : 'VER TODO EL INVENTARIO'}
              </Link>
            ))}
          </div>
        </div>
        
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce text-white/30">
          <span className="text-[9px] font-black uppercase tracking-widest mb-2">Descubre</span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
        </div>
      </section>

      {/* 2. PÁGINA 2: CATEGORÍA (100vh) */}
      {category && (
        <section className="relative w-full h-screen flex items-center justify-center bg-[#0D0E12] border-b border-white/5">
          <div className="max-w-5xl mx-auto px-5 text-center flex flex-col items-center">
            <div className="w-40 h-40 md:w-56 md:h-56 mb-12 opacity-90 drop-shadow-[0_0_40px_rgba(255,255,255,0.1)]">
              <ImageWithFallback 
                src={`/api/images/category-${category.toLowerCase()}.webp`} 
                alt={`Filtros de ${category}`} 
                className="w-full h-full object-contain" 
                fallbackType="hide"
              />
            </div>
            <h2 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter mb-8">
              Filtros de {category}
            </h2>
            <p className="text-brand-text-dim text-xl md:text-3xl max-w-4xl mx-auto leading-relaxed font-light">
              Máxima eficiencia y protección garantizada. La mejor filtración de {category.toLowerCase()} para optimizar el rendimiento de tu vehículo bajo las exigentes condiciones del Perú.
            </p>
          </div>
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce text-white/30">
            <span className="text-[9px] font-black uppercase tracking-widest mb-2">Continuar</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
          </div>
        </section>
      )}

      {/* RECORRIDO DE MARCAS: 1 HOJA LOGO, LUEGO OTRA HOJA PRODUCTOS */}
      {sortedBrands.length === 0 ? (
        <div className="text-center py-32 text-white/50 font-bold uppercase tracking-widest">
          No se encontraron productos
        </div>
      ) : (
        sortedBrands.map((brandName, index) => (
          <div key={brandName}>
            
            {/* PÁGINA 3 (O IMPAR): PRESENTACIÓN DE LA MARCA (100vh) */}
            <section className="relative w-full h-screen flex items-center justify-center bg-[#0A0A0B] border-b border-white/5 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/5 to-transparent opacity-30" />
              <div className="max-w-7xl mx-auto px-5 w-full flex flex-col md:flex-row items-center justify-center md:justify-between gap-16 relative z-10">
                <div className="md:w-1/2 text-center md:text-left">
                  <div className="inline-flex items-center gap-3 mb-6 justify-center md:justify-start w-full">
                    <div className="h-px w-12 bg-brand-primary"></div>
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-brand-primary">Línea Premium</span>
                  </div>
                  <h2 className="text-6xl md:text-9xl font-black text-white uppercase tracking-tighter mb-8 leading-none">
                    {brandName}
                  </h2>
                  <p className="mt-6 text-brand-text-dim text-xl md:text-2xl max-w-xl mx-auto md:mx-0 font-light">
                    Ingeniería de clase mundial. Todos los repuestos y equivalencias exactas de {brandName} para asegurar el máximo rendimiento.
                  </p>
                </div>
                
                <div className="md:w-1/2 w-full flex justify-center md:justify-end">
                  <div className="w-full max-w-lg aspect-square md:aspect-video bg-[#141518]/50 rounded-[3rem] border border-white/5 p-16 flex items-center justify-center backdrop-blur-2xl shadow-2xl relative group">
                    <div className="absolute inset-0 bg-brand-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-[3rem]"></div>
                    <ImageWithFallback 
                      src={`/api/images/logo-${brandName.toLowerCase()}.webp`} 
                      alt={`Logo ${brandName}`} 
                      className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700 relative z-10"
                      fallbackType="text"
                      fallbackText={brandName}
                    />
                  </div>
                </div>
              </div>
              
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce text-white/30">
                <span className="text-[9px] font-black uppercase tracking-widest mb-2">Ver Inventario</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
              </div>
            </section>

            {/* PÁGINA 4 (O PAR): PRODUCTOS DE LA MARCA (Min 100vh) */}
            <section className="relative w-full min-h-screen py-32 bg-[#0D0E12] border-b border-white/5">
              <div className="max-w-7xl mx-auto px-5 mb-16">
                <h3 className="text-3xl font-black text-white uppercase tracking-tighter">
                  Catálogo <span className="text-brand-primary">{brandName}</span>
                </h3>
                <p className="text-brand-text-dim mt-2">Inventario disponible y equivalencias verificadas.</p>
              </div>
              
              <div className="max-w-7xl mx-auto px-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {groupedBrands[brandName].map(product => (
                    <Link key={product.sku} href={`/producto/${product.sku}`}
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
              </div>
            </section>
          </div>
        ))
      )}
      
      {/* SECCIÓN FINAL / CARGAR MÁS */}
      {items.length < total && (
        <div className="py-20 text-center bg-[#0A0A0B]">
          <Link 
            href={`/catalogo?page=${page + 1}${category ? `&category=${category}` : ''}`}
            className="inline-flex items-center justify-center gap-3 px-12 py-5 rounded-full font-black text-xs md:text-sm uppercase tracking-widest bg-brand-primary text-black hover:bg-emerald-400 hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all duration-300 hover:-translate-y-1"
          >
            Cargar más repuestos 
            <span className="bg-black/10 px-3 py-1 rounded-full text-[10px]">
              {total - items.length} restantes
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
