'use client';

import { useState } from 'react';
import ReviewForm from './ReviewForm';

export default function ProductTabs({ product }) {
  const [activeTab, setActiveTab] = useState('ficha');

  const tabs = [
    { id: 'ficha', label: 'Ficha Técnica & Mantenimiento', icon: '📝' },
    { id: 'vehiculos', label: `Vehículos Compatibles (${product.applications?.length || 0})`, icon: '🚗', hidden: !product.applications?.length },
    { id: 'equivalencias', label: `Códigos Equivalentes (${product.equivalences?.length || 0})`, icon: '🔄', hidden: !product.equivalences?.length },
    { id: 'comunidad', label: 'Preguntas & Opiniones', icon: '⭐' }
  ].filter(t => !t.hidden);

  return (
    <div className="mt-12 space-y-8">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-[var(--brand-primary)] text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                : 'bg-[var(--brand-surface)] text-[var(--brand-text-dim)] hover:text-white border border-white/5'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents - Using display: none for inactive tabs so Google still indexes the HTML */}
      <div className="relative min-h-[300px]">
        
        {/* TAB 1: Ficha y Mantenimiento */}
        <div style={{ display: activeTab === 'ficha' ? 'block' : 'none' }} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Descripción */}
            <div className="p-8 rounded-[2rem] bg-[var(--brand-surface)] border border-white/5">
              <h3 className="text-sm font-black uppercase tracking-widest text-[var(--brand-primary)] mb-4">Descripción del Producto</h3>
              <p className="text-[var(--brand-text-dim)] leading-relaxed text-sm md:text-base">
                {product.description || `Repuesto original o alternativo de alta calidad para código ${product.sku} de la marca ${product.brand}. Diseñado para cumplir con los estándares de rendimiento más exigentes.`}
              </p>
              
              {product.features?.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-3">Atributos Destacados</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.features.map((f, i) => (
                      <span key={i} className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white/5 text-[var(--brand-text-dim)] border border-white/5">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mantenimiento */}
            <div className="p-8 rounded-[2rem] bg-[var(--brand-surface)] border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <span className="text-8xl">🔧</span>
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-yellow-500 mb-4 relative z-10">Consejos de Mantenimiento</h3>
              {product.maintenance_tips?.length > 0 ? (
                <ul className="space-y-4 relative z-10">
                  {product.maintenance_tips.map((tip, i) => (
                    <li key={i} className="flex gap-3 text-sm text-[var(--brand-text-dim)]">
                      <span className="text-yellow-500 mt-0.5">●</span>
                      <span className="leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--brand-text-dim)] relative z-10 italic">No hay notas de mantenimiento específicas registradas para este código.</p>
              )}
            </div>
          </div>
        </div>

        {/* TAB 2: Vehículos Compatibles */}
        {product.applications?.length > 0 && (
          <div style={{ display: activeTab === 'vehiculos' ? 'block' : 'none' }} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {product.applications.map((app, i) => (
                <div key={i} className="p-5 rounded-[1.5rem] bg-[var(--brand-surface)] border border-[#38BDF8]/10 hover:border-[#38BDF8]/30 transition-colors group">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#38BDF8]">{app.make}</span>
                      <h4 className="text-base font-black text-white uppercase leading-tight mt-0.5">{app.model}</h4>
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20">{app.year}</span>
                  </div>
                  
                  {app.engine && (
                    <div className="text-xs text-[var(--brand-text-dim)] mb-2 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Motor: <span className="text-white font-bold">{app.engine}</span>
                    </div>
                  )}
                  {app.notes && (
                    <div className="mt-3 pt-3 border-t border-white/5 text-[11px] text-[var(--brand-text-muted)] italic">
                      {app.notes.includes('KW:') ? (
                        <div className="flex items-center gap-1">
                           <span className="font-bold text-yellow-500/80">Potencia del Motor:</span> 
                           {app.notes.replace('Nota: KW:', '').trim()} kW
                        </div>
                      ) : (
                        <span>Nota: {app.notes}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Códigos Equivalentes */}
        {product.equivalences?.length > 0 && (
          <div style={{ display: activeTab === 'equivalencias' ? 'block' : 'none' }} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {product.equivalences.map((eq, i) => (
                <div key={i} className="flex flex-col justify-center p-4 rounded-2xl bg-[var(--brand-surface)] border border-emerald-500/10 hover:border-emerald-500/30 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">{eq.brand || 'Equivalente'}</span>
                    {eq.is_original && (
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded text-emerald-400 bg-emerald-400/10">OEM</span>
                    )}
                  </div>
                  <span className="text-sm font-black text-white font-mono tracking-wider">{eq.code || eq}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Preguntas & Opiniones */}
        <div style={{ display: activeTab === 'comunidad' ? 'block' : 'none' }} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* FAQs */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#38BDF8] mb-6 flex items-center gap-2">
                <span className="text-xl">💬</span> Preguntas Frecuentes
              </h3>
              {product.faqs?.length > 0 ? (
                product.faqs.map((faq, i) => (
                  <div key={i} className="p-6 rounded-[1.5rem] bg-[var(--brand-surface)] border border-white/5">
                    <h4 className="font-bold text-white text-sm mb-2">{faq.question}</h4>
                    <p className="text-sm text-[var(--brand-text-dim)] leading-relaxed">{faq.answer}</p>
                  </div>
                ))
              ) : (
                <div className="p-6 rounded-[1.5rem] bg-[var(--brand-surface)] border border-white/5">
                  <p className="text-sm text-[var(--brand-text-dim)] italic">No hay preguntas frecuentes registradas.</p>
                </div>
              )}
            </div>

            {/* Reseñas */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-purple-400 mb-6 flex items-center gap-2">
                <span className="text-xl">⭐</span> Opiniones de Clientes ({product.reviews?.length || 0})
              </h3>
              
              {product.reviews?.length > 0 ? (
                <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {product.reviews.map((r, i) => (
                    <div key={i} className="p-5 rounded-[1.5rem] bg-[var(--brand-surface)] border border-purple-500/10">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="font-bold text-sm text-white block">{r.user_name}</span>
                          <span className="text-[10px] text-[var(--brand-text-muted)]">{new Date(r.created_at).toLocaleDateString('es-PE')}</span>
                        </div>
                        <div className="flex text-yellow-400 text-xs bg-black/20 px-2 py-1 rounded-lg">
                          {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                        </div>
                      </div>
                      {r.is_verified_buyer && (
                        <div className="inline-flex items-center gap-1 text-[9px] text-green-400 border border-green-400/20 bg-green-400/10 px-2 py-0.5 rounded uppercase tracking-wider mb-3 font-bold">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          Comprador Verificado
                        </div>
                      )}
                      {r.comment && <p className="text-sm text-[var(--brand-text-dim)] leading-relaxed">"{r.comment}"</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mb-8 p-6 rounded-[1.5rem] bg-[var(--brand-surface)] border border-white/5">
                  <p className="text-sm text-[var(--brand-text-dim)] mb-2">Aún no hay opiniones para este producto.</p>
                </div>
              )}

              {/* Formulario siempre visible en esta tab */}
              <div className="p-6 rounded-[2rem] bg-black/40 border border-purple-500/20">
                <h4 className="text-sm font-bold text-white mb-4">Escribe tu opinión</h4>
                <ReviewForm sku={product.sku} />
              </div>
            </div>

          </div>
        </div>

      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
