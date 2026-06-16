import Link from 'next/link';
import { ProductService } from '@/services/product.service';
import LoadMoreProducts from '../LoadMoreProducts';
import { slugToDisplay } from '@/lib/slug';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  const categoryName = slugToDisplay(slug);
  
  return {
    title: `${categoryName} al por mayor | DIROGSA B2B`,
    description: `Explora nuestro catálogo completo de ${categoryName.toLowerCase()}. Compra repuestos automotrices con calidad certificada.`,
    alternates: {
      canonical: `https://www.dirogsa.com/catalogo/${slug}`,
    },
  };
}

export default async function CategoryPage({ params }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  const categoryName = slugToDisplay(slug);
  const limit = 48;

  const { items, total } = await ProductService.searchProducts({ 
    category: categoryName, // Se asume que el backend hace regex flexible o exacto ignorando case
    limit: limit,
    skip: 0
  });

  return (
    <div className="min-h-screen bg-[#0A0A0B] pb-24">
      <section className="relative w-full h-[60vh] flex items-center justify-center bg-[#0D0E12] border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/10 via-[#0A0A0B]/80 to-[#0A0A0B]" />
        <div className="max-w-5xl mx-auto px-5 text-center flex flex-col items-center relative z-10 mt-16">
          <span className="text-brand-primary text-xs font-black tracking-[0.3em] uppercase mb-4 px-4 py-1.5 rounded-full border border-brand-primary/30 bg-brand-primary/10">
            INVENTARIO DISPONIBLE
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-6 drop-shadow-2xl">
            {categoryName}
          </h1>
          <p className="text-brand-text-dim text-lg md:text-xl max-w-2xl font-medium leading-relaxed">
            Mostrando resultados optimizados. {total} productos en esta categoría.
          </p>
          <div className="mt-8">
            <Link href="/catalogo" className="text-xs text-white/50 hover:text-white uppercase font-bold tracking-widest transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Volver a Categorías
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 mt-16">
        {items.length === 0 ? (
          <div className="text-center py-32 text-white/50 font-bold uppercase tracking-widest">
            No se encontraron productos en esta categoría.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {items.map(product => (
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
            
            <LoadMoreProducts 
              category={categoryName} 
              initialSkip={limit} 
              total={total} 
              limit={limit} 
            />
          </>
        )}
      </section>
    </div>
  );
}
