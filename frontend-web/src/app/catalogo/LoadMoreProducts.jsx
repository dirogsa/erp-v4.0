'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ProductService } from '@/services/product.service';

export default function LoadMoreProducts({ category, search = '', initialSkip, total, limit = 48 }) {
  const [products, setProducts] = useState([]);
  const [skip, setSkip] = useState(initialSkip);
  const [loading, setLoading] = useState(false);

  const remaining = total - skip - products.length;

  const loadMore = async () => {
    if (loading || remaining <= 0) return;
    setLoading(true);
    try {
      const res = await ProductService.searchProducts({
        category,
        search: search || undefined,
        limit,
        skip
      });
      if (res && res.items) {
        setProducts(prev => [...prev, ...res.items]);
        setSkip(prev => prev + limit);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (remaining <= 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        {products.map(product => (
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

      <div className="py-20 text-center bg-[#0A0A0B]">
        <button 
          onClick={loadMore}
          disabled={loading}
          className="inline-flex items-center justify-center gap-3 px-12 py-5 rounded-full font-black text-xs md:text-sm uppercase tracking-widest bg-brand-primary text-black hover:bg-emerald-400 hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {loading ? 'Cargando...' : 'Cargar más repuestos'}
          {!loading && (
            <span className="bg-black/10 px-3 py-1 rounded-full text-[10px]">
              {remaining} restantes
            </span>
          )}
        </button>
      </div>
    </>
  );
}
