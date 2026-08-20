'use client';
import Link from 'next/link';

export default function ProductCard({ product }) {
  // Safe extraction of specs
  const specs = product.specs || [];
  
  return (
    <Link 
      href={`/product/${product.sku}`}
      className="group bg-[#141518]/60 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden flex flex-col hover:border-brand-primary/40 hover:shadow-[0_10px_40px_rgba(16,185,129,0.1)] transition-all duration-500 hover:-translate-y-2 relative h-full"
    >
      {/* Badge de "Nuevo" */}
      {product.isNew && (
        <span className="absolute top-4 left-4 z-20 text-[8px] font-black uppercase px-3 py-1.5 rounded-xl bg-brand-primary text-black shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-pulse">
          Nuevo Ingreso
        </span>
      )}

      {/* Área de la Imagen */}
      <div className="h-48 md:h-56 w-full flex items-center justify-center relative bg-gradient-to-b from-white/5 to-transparent p-4 md:p-6 overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-b-[4rem]"></div>
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="max-w-full max-h-full object-contain group-hover:scale-125 transition-transform duration-700 ease-out drop-shadow-2xl relative z-10" 
          />
        ) : (
          <svg className="h-12 w-12 md:h-16 md:w-16 opacity-10 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
      </div>

      {/* Contenido (Info) */}
      <div className="p-5 md:p-6 flex-1 flex flex-col border-t border-white/5 relative bg-[#0D0E12]">
        
        {/* Marca y Nombre */}
        <div className="mb-4">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-text-dim mb-2 block group-hover:text-brand-primary transition-colors">
            {product.brand || 'DIROGSA'}
          </span>
          <h3 className="text-white font-bold text-sm leading-relaxed line-clamp-2 pr-4">
            {product.name}
          </h3>
        </div>

        {/* Medidas (Especificaciones Técnicas) */}
        {specs.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {specs.slice(0, 4).map((spec, idx) => (
              <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-[9px] font-bold border border-white/10 bg-white/5 text-white/80 group-hover:border-brand-primary/20 group-hover:bg-brand-primary/5 transition-colors">
                <span className="text-brand-primary mr-1">{spec.label}:</span>
                {spec.value} {spec.measure_type !== 'other' && spec.measure_type !== 'thread' ? spec.measure_type : ''}
              </span>
            ))}
            {specs.length > 4 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-[9px] font-bold border border-white/5 bg-transparent text-white/40">
                +{specs.length - 4}
              </span>
            )}
          </div>
        )}

        <div className="flex-1"></div>

        {/* Footer: SKU y Acción */}
        <div className="flex items-end justify-between pt-4 mt-auto border-t border-white/5">
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
  );
}
