import Link from 'next/link';
import { ProductService } from '@/services/product.service';

export const metadata = {
  title: 'Catálogo de Repuestos | DIROGSA',
  description: 'Explora nuestro catálogo completo de repuestos y filtros automotrices. Todos los modelos y marcas con calidad certificada.',
};

export default async function CatalogoPage({ searchParams }) {
  // Support simple pagination or category filtering via URL query
  const sp = await searchParams;
  const page = parseInt(sp.page) || 1;
  const limit = 24;
  const category = sp.category || '';

  const { items, total } = await ProductService.searchProducts({ 
    limit: limit * page, // Fetch up to the current page (simple implementation)
    category: category
  });

  return (
    <div className="max-w-7xl mx-auto px-5 py-8 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Catálogo de Productos</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--brand-text-muted)' }}>
            Mostrando {items.length} de {total} repuestos disponibles
          </p>
        </div>
        
        {/* Simple filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
          {['', 'ACEITE', 'AIRE', 'COMBUSTIBLE', 'CABINA'].map(cat => (
            <Link 
              key={cat || 'ALL'} 
              href={cat ? `/catalogo?category=${cat}` : '/catalogo'}
              className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors"
              style={category === cat 
                ? { background: 'var(--brand-primary)', color: '#0A0A0B' } 
                : { background: 'var(--brand-surface-2)', color: 'var(--brand-text-dim)', border: '1px solid var(--brand-border)' }
              }
            >
              {cat || 'TODOS'}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map(product => (
          <Link key={product.sku} href={`/producto/${product.sku}`}
            className="card-premium group hover:border-brand-primary/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-300">
            {/* Image */}
            <div className="h-32 rounded-2xl overflow-hidden flex items-center justify-center mb-3 relative bg-brand-surface-2 p-2">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name}
                     className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <svg className="h-10 w-10 opacity-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
              {product.isNew && (
                <span className="absolute top-2 left-2 text-[8px] font-black uppercase px-2 py-1 rounded-lg animate-pulse bg-brand-primary text-black">
                  NEW
                </span>
              )}
            </div>
            {/* Info */}
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-brand-text-dim">
                {product.brand || 'DIROGSA'}
              </span>
              <h3 className="text-white font-black text-xs uppercase tracking-tight leading-tight line-clamp-2">
                {product.name}
              </h3>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] font-black tracking-widest text-brand-orange">
                  {product.sku}
                </span>
                <span className="text-[9px] font-bold px-2 py-1 rounded-lg bg-brand-primary-dim text-brand-primary border border-brand-primary/20">
                  Detalle
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {items.length < total && (
        <div className="mt-12 text-center">
          <Link 
            href={`/catalogo?page=${page + 1}${category ? `&category=${category}` : ''}`}
            className="inline-block px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-brand-surface border border-brand-border text-white hover:bg-brand-surface-2 transition-colors"
          >
            Cargar más repuestos
          </Link>
        </div>
      )}
    </div>
  );
}
