'use client';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const TABS = [
  { id: 'CODES',      label: 'Código',  color: '#6EE7B7', glow: 'rgba(110,231,183,0.08)' },
  { id: 'APPS',       label: 'Vehículo', color: '#38BDF8', glow: 'rgba(56,189,248,0.08)' },
  { id: 'DIMENSIONS', label: 'Medidas', color: '#FB923C', glow: 'rgba(251,146,60,0.08)' },
  { id: 'NEW',        label: 'Nuevos',  color: '#A855F7', glow: 'rgba(168,85,247,0.08)' },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function BuscarPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-brand-text-dim">Cargando buscador...</div>}>
      <BuscarContent />
    </Suspense>
  );
}

function BuscarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(
    searchParams.get('type') === 'dimensions' ? 'DIMENSIONS' :
    searchParams.get('type') === 'vehicle'    ? 'APPS' : 'CODES'
  );
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [specFilters, setSpecFilters] = useState({
    h: searchParams.get('h') || '', d: searchParams.get('d') || '',
    t: searchParams.get('t') || '', id: searchParams.get('id') || ''
  });
  const [vehicleFilters, setVehicleFilters] = useState({
    make: searchParams.get('make') || '', model: searchParams.get('model') || ''
  });

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const [brands, setBrands] = useState([]);
  const searchInputRef = useRef(null);

  // Load vehicle brands once
  useEffect(() => {
    fetch(`${API_BASE}/api/vehicles/brands`)
      .then(r => r.json()).then(d => setBrands(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const consolidatedBrands = (() => {
    const groups = {};
    brands.filter(b => b.is_active !== false).forEach(b => {
      const name = b.name.toUpperCase().trim();
      const parent = b.parent_name ? b.parent_name.toUpperCase().trim() : null;
      const key = parent || name;
      if (!groups[key]) groups[key] = { name: key, models: new Set(), product_count: 0 };
      if (b.models) b.models.forEach(m => groups[key].models.add(m));
      groups[key].product_count += (b.product_count || 0);
    });
    return Object.values(groups)
      .map(g => ({ ...g, models: Array.from(g.models).sort() }))
      .sort((a, b) => b.product_count - a.product_count);
  })();

  const availableModels = consolidatedBrands.find(b => b.name === vehicleFilters.make)?.models || [];

  const handleSearch = useCallback(async () => {
    const qs = new URLSearchParams();
    if (activeTab === 'CODES') {
      if (!searchTerm) return;
      qs.set('search', searchTerm);
    } else if (activeTab === 'APPS') {
      if (!vehicleFilters.make) return;
      qs.set('vehicle_brand', vehicleFilters.make);
      if (vehicleFilters.model) qs.set('vehicle_model', vehicleFilters.model);
    } else if (activeTab === 'DIMENSIONS') {
      if (specFilters.h) qs.set('spec_h', specFilters.h);
      if (specFilters.d) qs.set('spec_d', specFilters.d);
      if (specFilters.t) qs.set('spec_t', specFilters.t);
      if (specFilters.id) qs.set('spec_id', specFilters.id);
      if (!specFilters.h && !specFilters.d && !specFilters.t && !specFilters.id) return;
    } else if (activeTab === 'NEW') {
      qs.set('is_new', 'true');
    }

    setLoading(true);
    setResults([]);
    try {
      const res = await fetch(`${API_BASE}/api/products/?${qs.toString()}`);
      const data = await res.json();
      const items = Array.isArray(data) ? data : (data.items || []);
      setResults(items);
      setTotal(data.total || items.length);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchTerm, vehicleFilters, specFilters]);

  // Auto-search on mount if params present
  useEffect(() => {
    const hasQuery = searchTerm || vehicleFilters.make || specFilters.h || specFilters.d;
    if (hasQuery || activeTab === 'NEW') handleSearch();
  }, []);

  const activeTabObj = TABS.find(t => t.id === activeTab);

  return (
    <div className="max-w-7xl mx-auto px-5 py-8">

      {/* ─── SEARCH ENGINE ─── */}
      <div className="sticky top-[73px] z-40 pb-4"
           style={{ background: 'var(--brand-bg)' }}>

        {/* Tab Selector */}
        <div className="flex gap-1 p-1 rounded-2xl mb-4"
             style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border-2)' }}>
          {TABS.map(t => {
            const isActive = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="flex-1 py-3 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1 text-[9px] font-black uppercase tracking-widest"
                style={isActive
                  ? { background: `${t.color}18`, border: `1.5px solid ${t.color}55`, color: t.color, boxShadow: `0 0 24px ${t.color}20` }
                  : { background: `${t.color}07`, border: `1.5px solid ${t.color}22`, color: `${t.color}99` }}>
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Search Panel */}
        <div className="rounded-[1.75rem] p-5 relative overflow-hidden"
             style={{ background: 'var(--brand-surface)', border: `1.5px solid ${activeTabObj.color}28`, transition: 'border-color 0.3s' }}>
          {/* Glow */}
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none"
               style={{ background: activeTabObj.glow, transition: 'background 0.3s' }} />

          <div className="relative z-10">

            {/* CODES TAB */}
            {activeTab === 'CODES' && (
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#6EE7B7' }}>
                  Código / Referencia del filtro
                </label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#6EE7B7' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input ref={searchInputRef} type="text" value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Ej: LF3970, P553004, 281132P100..."
                    className="tech-input w-full h-14 rounded-xl pl-11 pr-4 text-sm font-bold tracking-widest"
                    style={{ borderColor: 'rgba(110,231,183,0.25)' }} />
                  {searchTerm && (
                    <button onClick={() => { setSearchTerm(''); setResults([]); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--brand-text-dim)' }}>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
                <button onClick={handleSearch} disabled={!searchTerm || loading}
                  className="w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30"
                  style={{ background: 'linear-gradient(135deg, #6EE7B7, #34d399)', color: '#0A0A0B' }}>
                  {loading ? 'Buscando...' : 'Buscar Filtro →'}
                </button>
              </div>
            )}

            {/* APPS TAB */}
            {activeTab === 'APPS' && (
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#38BDF8' }}>
                  Selecciona tu vehículo
                </label>
                <select value={vehicleFilters.make}
                  onChange={e => setVehicleFilters({ make: e.target.value, model: '' })}
                  className="tech-input w-full h-14 rounded-xl px-4 text-[11px] font-black appearance-none uppercase"
                  style={{ borderColor: 'rgba(56,189,248,0.2)' }}>
                  <option value="">— SELECCIONA MARCA —</option>
                  {consolidatedBrands.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                </select>
                {vehicleFilters.make && availableModels.length > 0 && (
                  <select value={vehicleFilters.model}
                    onChange={e => setVehicleFilters(prev => ({ ...prev, model: e.target.value }))}
                    className="tech-input w-full h-14 rounded-xl px-4 text-[11px] font-black appearance-none uppercase"
                    style={{ borderColor: 'rgba(56,189,248,0.2)' }}>
                    <option value="">— MODELO (OPCIONAL) —</option>
                    {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                )}
                <button onClick={handleSearch} disabled={!vehicleFilters.make || loading}
                  className="w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #38BDF8, #0ea5e9)', color: '#0A0A0B' }}>
                  {loading ? 'Buscando...' : 'Ver Filtros para este Vehículo'}
                </button>
              </div>
            )}

            {/* DIMENSIONS TAB */}
            {activeTab === 'DIMENSIONS' && (
              <div className="space-y-4">
                <label className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#FB923C' }}>
                  Búsqueda por Medidas (Precisión)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'h', label: 'ALTURA', code: '(H)', placeholder: 'mm' },
                    { key: 'd', label: 'DIÁM. EXT.', code: '(A)', placeholder: 'mm' },
                    { key: 't', label: 'ROSCA', code: '(G)', placeholder: 'TPI/M' },
                    { key: 'id', label: 'DIÁM. INT.', code: '(B/C)', placeholder: 'mm' }
                  ].map(dim => (
                    <div key={dim.key} className="rounded-xl p-3"
                         style={{ background: 'var(--brand-surface-2)', border: '1px solid var(--brand-border-2)' }}>
                      <span className="block text-[8px] font-black uppercase tracking-tighter mb-1"
                            style={{ color: 'var(--brand-text-muted)' }}>
                        {dim.label} <span style={{ color: '#FB923C' }}>{dim.code}</span>
                      </span>
                      <input type="text" value={specFilters[dim.key]}
                        onChange={e => setSpecFilters(prev => ({ ...prev, [dim.key]: e.target.value }))}
                        className="w-full bg-transparent text-sm font-black text-white outline-none h-8"
                        placeholder={dim.placeholder} style={{ '::placeholder': { color: 'rgba(255,255,255,0.1)' } }} />
                    </div>
                  ))}
                </div>
                <button onClick={handleSearch} disabled={loading}
                  className="w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #FB923C, #f97316)', color: '#0A0A0B' }}>
                  {loading ? 'Calculando...' : 'Buscar por Medidas →'}
                </button>
              </div>
            )}

            {/* NEW TAB */}
            {activeTab === 'NEW' && (
              <div className="py-4 text-center space-y-3">
                <div className="h-14 w-14 mx-auto rounded-2xl flex items-center justify-center"
                     style={{ background: 'var(--brand-primary-dim)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <svg className="h-7 w-7" style={{ color: 'var(--brand-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h3 className="text-white font-black uppercase tracking-tight">Recién Llegados</h3>
                <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--brand-text-muted)' }}>
                  Ingresos del último mes
                </p>
                <button onClick={handleSearch}
                  className="w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                  style={{ background: 'linear-gradient(135deg, #A855F7, #9333ea)', color: '#fff' }}>
                  {loading ? 'Cargando...' : 'Ver Novedades →'}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ─── RESULTS ─── */}
      <div className="mt-6">
        {loading ? (
          <div className="space-y-4">
            <div className="p-6 rounded-[2rem] text-center"
                 style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div className="h-10 w-10 border-2 rounded-full animate-spin mx-auto mb-3"
                   style={{ borderColor: 'rgba(16,185,129,0.2)', borderTopColor: 'var(--brand-primary)' }} />
              <p className="text-xs font-black uppercase tracking-widest text-white">Enlazando con Central…</p>
            </div>
            {[1,2,3].map(i => (
              <div key={i} className="shimmer h-28 rounded-[2rem]" />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-8">
            {/* Stats bar */}
            <div className="flex items-center justify-between px-1">
              <h2 className="text-white font-black text-sm uppercase tracking-tight">Resultados</h2>
              <span className="text-[10px] font-black px-3 py-1 rounded-lg"
                    style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--brand-primary)', border: '1px solid rgba(16,185,129,0.2)' }}>
                {total} PRODUCTOS
              </span>
            </div>

            {/* Exact Matches */}
            {activeTab === 'CODES' && (() => {
              const exact = results.filter(p => p.sku === searchTerm.trim().toUpperCase());
              const equiv = results.filter(p => p.sku !== searchTerm.trim().toUpperCase());
              return (
                <div className="space-y-8">
                  <Section title="Código Exacto" count={exact.length} color="var(--brand-primary)" results={exact} />
                  <Section title="Equivalentes" count={equiv.length} color="#F59E0B" results={equiv} />
                </div>
              );
            })()}

            {activeTab !== 'CODES' && (
              <div className="grid grid-cols-1 gap-4">
                {results.map(p => <ProductCard key={p.sku} product={p} />)}
              </div>
            )}
          </div>
        ) : !loading && (searchTerm || vehicleFilters.make || specFilters.h) ? (
          <div className="py-20 text-center space-y-4">
            <div className="h-20 w-20 mx-auto rounded-[2rem] flex items-center justify-center opacity-30"
                 style={{ background: 'var(--brand-surface)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <svg className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <h3 className="text-white font-black text-lg uppercase tracking-tight">Sin coincidencias</h3>
            <p className="text-sm max-w-sm mx-auto" style={{ color: 'var(--brand-text-dim)' }}>
              No encontramos resultados. Intenta con otro código o ajusta los filtros.
            </p>
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function Section({ title, count, color, results }) {
  return (
    <div className="space-y-3">
      <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] px-1 flex items-center gap-3">
        <span className="w-0.5 h-5 rounded-full" style={{ background: color }} />
        {title} <span className="opacity-40">({count})</span>
      </h3>
      {count > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {results.map(p => <ProductCard key={p.sku} product={p} />)}
        </div>
      ) : (
        <div className="py-5 text-center rounded-3xl text-[9px] font-black uppercase tracking-widest"
             style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', color: 'var(--brand-text-dim)' }}>
          Sin coincidencias directas
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }) {
  const price = product.price_retail ?? product.price ?? 0;
  return (
    <Link href={`/producto/${product.sku}`} className="card-premium flex items-center gap-4 hover:border-brand-primary/30 transition-all group">
      {/* Image */}
      <div className="h-20 w-20 flex-shrink-0 rounded-2xl overflow-hidden flex items-center justify-center p-2"
           style={{ background: 'var(--brand-surface-2)' }}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name}
               className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <svg className="h-8 w-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: 'var(--brand-text-dim)' }}>{product.brand || 'DIROGSA'}</span>
          {product.is_new && (
            <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full animate-pulse"
                  style={{ background: 'var(--brand-primary)', color: '#0A0A0B' }}>NEW</span>
          )}
        </div>
        <h3 className="text-white font-black text-xs uppercase tracking-tight leading-tight line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-black tracking-widest"
                style={{ color: 'var(--brand-orange)' }}>{product.sku}</span>
        </div>
      </div>
      {/* Arrow */}
      <div className="flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-all group-hover:bg-brand-primary group-hover:text-black"
           style={{ background: 'var(--brand-surface-2)', color: 'var(--brand-text-dim)' }}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="py-16 px-4 text-center space-y-10">
      <div className="space-y-4">
        <div className="h-20 w-20 mx-auto rounded-[2.5rem] flex items-center justify-center relative"
             style={{ background: 'var(--brand-surface)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="absolute inset-0 rounded-[2.5rem] animate-pulse" style={{ background: 'rgba(16,185,129,0.05)' }} />
          <svg className="h-9 w-9 relative z-10" style={{ color: 'var(--brand-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <h3 className="text-white font-black text-lg uppercase tracking-tight">¿Qué filtro buscas?</h3>
        <p className="text-sm max-w-xs mx-auto leading-relaxed" style={{ color: 'var(--brand-text-dim)' }}>
          Busca por código de referencia, tipo de vehículo o medidas técnicas exactas.
        </p>
      </div>
      {/* Quick chips */}
      <div className="flex flex-wrap justify-center gap-2">
        {['WA6004','FLEETGUARD','DONALDSON','BALDWIN','TOYOTA','NISSAN'].map(chip => (
          <span key={chip} className="px-4 py-2 rounded-xl text-[9px] font-black uppercase"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--brand-text-dim)' }}>
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}
