'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DIMSService } from '@/services/dims.service';

export default function DimensionalSection({ title, color, exactSku }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [flexibility, setFlexibility] = useState('high');

  const handleFetchDims = async () => {
    if (!exactSku) return;
    setLoading(true);
    setResults([]); // Limpiar resultados anteriores para mostrar feedback visual de carga
    try {
      const data = await DIMSService.getAlternatives(exactSku, flexibility);
      setResults(data.dimensional_similarities || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  };

  const count = results.length;

  return (
    <div className="space-y-4 opacity-90 hover:opacity-100 transition-opacity">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Título y Badge */}
        <div className="flex items-center gap-3">
          <h3 className="text-white font-black text-xs md:text-sm uppercase tracking-[0.2em] px-1 flex items-center gap-3">
            <span className="w-1 h-6 rounded-full" style={{ background: color }} />
            {title} <span className="opacity-40">({count})</span>
          </h3>
          {count > 0 && (
            <span className="text-[9px] md:text-[10px] font-bold px-2 py-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Verifique compatibilidad
            </span>
          )}
        </div>

        {/* Controles siempre visibles */}
        <div className="flex items-center gap-2">
          <select 
            value={flexibility} 
            onChange={(e) => setFlexibility(e.target.value)}
            className="bg-brand-surface-2 border border-white/10 text-white text-[10px] font-bold px-3 py-2 rounded-lg outline-none focus:border-brand-primary"
          >
            <option value="high">Compatibilidad Alta</option>
            <option value="medium">Compatibilidad Media</option>
            <option value="low">Compatibilidad Baja</option>
          </select>
          <button 
            onClick={handleFetchDims}
            disabled={loading}
            className="py-2 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white/5 hover:bg-brand-primary hover:text-black transition-all disabled:opacity-50"
          >
            {loading ? '...' : hasSearched ? 'Recalcular' : 'Obtener'}
          </button>
        </div>
      </div>
      
      {/* Cuerpo de Resultados */}
      {!hasSearched ? (
        <div className="py-6 text-center rounded-2xl md:rounded-3xl text-[10px] md:text-xs font-black uppercase tracking-widest border border-dashed border-white/10 text-brand-text-dim/50">
          Usa los controles de arriba para encontrar alternativas por medida
        </div>
      ) : count > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {results.map(p => <DimensionalProductCard key={p.sku} product={p} />)}
        </div>
      ) : (
        <div className="py-6 text-center rounded-2xl md:rounded-3xl text-[10px] md:text-xs font-black uppercase tracking-widest border border-white/5 bg-white/[0.02] text-brand-text-dim">
          No hay sugerencias con este nivel de flexibilidad
        </div>
      )}
    </div>
  );
}

function DimensionalProductCard({ product }) {
  return (
    <Link href={`/product/${product.sku}`} className="card-premium flex items-center md:flex-col md:items-start gap-4 transition-all group h-full opacity-90 hover:opacity-100 bg-black/40 hover:border-brand-primary/30">
      <div className="h-20 w-20 md:w-full md:h-40 flex-shrink-0 rounded-2xl overflow-hidden flex items-center justify-center p-2 bg-brand-surface-2 relative">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name}
               className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <svg className="h-8 w-8 md:h-12 md:w-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <span className="text-[7px] md:text-[9px] font-black uppercase px-1.5 py-0.5 md:px-2 md:py-1 rounded-md md:rounded-lg bg-brand-primary text-[#0A0A0B]">
            {product.ranking_score}% RANKING
          </span>
          <span className="text-[7px] md:text-[8px] font-bold uppercase px-1.5 py-0.5 md:px-2 md:py-1 rounded-md md:rounded-lg bg-white/10 text-white backdrop-blur-sm">
            Sim: {product.similarity_score}% | Conf: {product.confidence_score}%
          </span>
        </div>
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between w-full h-full">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-text-dim">
              {product.brand || 'DIROGSA'}
            </span>
            <span className="text-[10px] md:text-xs font-black tracking-widest text-brand-orange">
              {product.sku}
            </span>
          </div>
          <h3 className="text-white font-black text-xs md:text-sm uppercase tracking-tight leading-tight line-clamp-2 md:line-clamp-3">
            {product.name}
          </h3>
          {product.match_level && (
            <p className="mt-1 text-[9px] text-brand-text-dim leading-tight">{product.match_level}</p>
          )}
        </div>
        
        <div className="mt-2 pt-2 border-t border-white/5 space-y-2 flex-grow">
          {product.evidence?.matches && product.evidence.matches.length > 0 && (
            <div className="flex flex-col gap-0.5 mb-1">
              {product.evidence.matches.map((m, idx) => (
                <span key={idx} className="text-[8px] text-green-400 flex items-center gap-1">
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  {m}
                </span>
              ))}
            </div>
          )}
          {product.evidence?.warnings && product.evidence.warnings.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.evidence.warnings.map((w, idx) => (
                <span key={idx} className="text-[8px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20">
                  {w}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between mt-auto">
          <span className="text-[9px] font-bold text-brand-text-dim">Comparabilidad: {product.comparability}%</span>
          <span className="hidden md:inline-flex text-[9px] font-bold px-2 py-1 rounded-lg bg-brand-primary-dim text-brand-primary border border-brand-primary/20">
            Detalle
          </span>
        </div>
      </div>
    </Link>
  );
}
