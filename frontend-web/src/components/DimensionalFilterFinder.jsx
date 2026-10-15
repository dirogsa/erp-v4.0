'use client';
import { useState } from 'react';

const FILTER_TYPES = [
  { id: '', label: 'Todos los Tipos' },
  { id: 'FILTRO DE AIRE', label: 'Aire' },
  { id: 'FILTRO DE ACEITE', label: 'Aceite' },
  { id: 'FILTRO DE COMBUSTIBLE', label: 'Combustible' },
  { id: 'FILTRO DE CABINA', label: 'Cabina' }
];

const SHAPES = [
  { 
    id: 'flat', 
    label: 'Plano (Panel)', 
    desc: 'Típico en Aire y Cabina',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="6" width="18" height="12" rx="2" strokeDasharray="none" />
        <line x1="7" y1="6" x2="7" y2="18" strokeOpacity="0.4" />
        <line x1="11" y1="6" x2="11" y2="18" strokeOpacity="0.4" />
        <line x1="15" y1="6" x2="15" y2="18" strokeOpacity="0.4" />
      </svg>
    )
  },
  { 
    id: 'round', 
    label: 'Cilíndrico (Redondo)', 
    desc: 'Típico en Aceite y Combustible',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <ellipse cx="12" cy="6" rx="7" ry="3" />
        <path d="M5 6v12c0 1.66 3.13 3 7 3s7-1.34 7-3V6" />
        <ellipse cx="12" cy="18" rx="7" ry="3" strokeOpacity="0.4" />
      </svg>
    )
  },
  { 
    id: 'oval', 
    label: 'Ovalado (Elíptico)', 
    desc: 'Filtros elípticos especiales',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <ellipse cx="12" cy="7" rx="8" ry="3" />
        <path d="M4 7v10c0 1.66 3.58 3 8 3s8-1.34 8-3V7" />
        <ellipse cx="12" cy="17" rx="8" ry="3" strokeOpacity="0.4" />
      </svg>
    )
  }
];

const TOLERANCES = [
  { value: '0', label: '+/- 0 mm (Exacta)' },
  { value: '2', label: '+/- 2 mm' },
  { value: '5', label: '+/- 5 mm' },
  { value: '15', label: '+/- 15 mm' },
  { value: '20', label: '+/- 20 mm' }
];

export default function DimensionalFilterFinder({ onSearch, isSearching }) {
  const [filterType, setFilterType] = useState('');
  const [shape, setShape] = useState('flat');
  const [activeHighlight, setActiveHighlight] = useState(null);

  // Dimensiones
  const [dimA, setDimA] = useState('');
  const [tolA, setTolA] = useState('5');

  const [dimB, setDimB] = useState('');
  const [tolB, setTolB] = useState('5');

  const [dimC, setDimC] = useState('');
  const [tolC, setTolC] = useState('5');

  const [dimD, setDimD] = useState('');
  const [tolD, setTolD] = useState('5');

  const [dimE, setDimE] = useState('');
  const [tolE, setTolE] = useState('5');

  const [dimF, setDimF] = useState(''); // Rosca / Inlet

  const [dimH, setDimH] = useState('');
  const [tolH, setTolH] = useState('5');

  const handleApply = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set('type', 'dimensions');
    if (filterType) params.set('category', filterType);
    if (shape) params.set('shape', shape);
    if (dimA) { params.set('dim_a', dimA); params.set('tol_a', tolA); }
    if (dimB) { params.set('dim_b', dimB); params.set('tol_b', tolB); }
    if (dimC) { params.set('dim_c', dimC); params.set('tol_c', tolC); }
    if (dimD) { params.set('dim_d', dimD); params.set('tol_d', tolD); }
    if (dimE) { params.set('dim_e', dimE); params.set('tol_e', tolE); }
    if (dimF) params.set('dim_f', dimF);
    if (dimH) { params.set('dim_h', dimH); params.set('tol_h', tolH); }

    onSearch(params);
  };

  const handleReset = () => {
    setDimA('');
    setDimB('');
    setDimC('');
    setDimD('');
    setDimE('');
    setDimF('');
    setDimH('');
    setTolA('5');
    setTolB('5');
    setTolC('5');
    setTolD('5');
    setTolE('5');
    setTolH('5');
  };

  return (
    <div className="space-y-6">
      {/* 1. Selector de Tipo de Filtro */}
      <div>
        <label className="block text-[10px] md:text-xs font-black text-brand-primary uppercase tracking-widest mb-2.5">
          1. Tipo de Filtro
        </label>
        <div className="flex flex-wrap gap-2">
          {FILTER_TYPES.map(cat => {
            const isSel = filterType === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilterType(cat.id)}
                className={`px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border ${
                  isSel
                    ? 'bg-brand-primary text-[#0A0A0B] border-brand-primary font-black shadow-lg shadow-brand-primary/20'
                    : 'bg-[#1A1C21] text-white/70 border-white/10 hover:border-white/20 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Selector de Forma (Shape) */}
      <div>
        <label className="block text-[10px] md:text-xs font-black text-brand-primary uppercase tracking-widest mb-2.5">
          2. Forma del Filtro (Shape)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SHAPES.map(s => {
            const isSel = shape === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setShape(s.id)}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all text-left ${
                  isSel
                    ? 'bg-brand-primary/10 border-brand-primary text-white ring-1 ring-brand-primary'
                    : 'bg-[#1A1C21] border-white/10 text-white/70 hover:border-white/20 hover:text-white'
                }`}
              >
                <div className={`p-2 rounded-xl ${isSel ? 'bg-brand-primary text-black' : 'bg-white/5 text-brand-primary'}`}>
                  {s.icon}
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider">{s.label}</div>
                  <div className="text-[10px] text-white/40">{s.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Panel de Dimensiones y Diagrama Técnico Dinámico */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
        {/* Esquema Técnico SVG Ilustrativo */}
        <div className="lg:col-span-5 bg-[#0D0E11] border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[280px]">
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary/80 mb-3 self-start">
            Diagrama de Medidas ({shape.toUpperCase()})
          </span>

          {shape === 'flat' && (
            <svg viewBox="0 0 320 200" className="w-full max-w-[260px] h-auto">
              {/* Panel rectangular en perspectiva */}
              <polygon points="50,60 210,60 260,110 100,110" fill="#1E232B" stroke="#38BDF8" strokeWidth="2" />
              <polygon points="50,60 100,110 100,150 50,100" fill="#14181F" stroke="#38BDF8" strokeWidth="2" />
              <polygon points="100,110 260,110 260,150 100,150" fill="#252C37" stroke="#38BDF8" strokeWidth="2" />

              {/* Cota A (Largo) */}
              <line x1="50" y1="45" x2="210" y2="45" stroke={activeHighlight === 'A' ? '#10B981' : '#F59E0B'} strokeWidth="2" strokeDasharray="3 3" />
              <text x="130" y="38" fill={activeHighlight === 'A' ? '#10B981' : '#F59E0B'} fontSize="13" fontWeight="bold" textAnchor="middle">A (Longitud)</text>

              {/* Cota B (Ancho) */}
              <line x1="225" y1="55" x2="275" y2="105" stroke={activeHighlight === 'B' ? '#10B981' : '#F59E0B'} strokeWidth="2" strokeDasharray="3 3" />
              <text x="260" y="75" fill={activeHighlight === 'B' ? '#10B981' : '#F59E0B'} fontSize="13" fontWeight="bold">B (Ancho)</text>

              {/* Cota H (Altura) */}
              <line x1="275" y1="110" x2="275" y2="150" stroke={activeHighlight === 'H' ? '#10B981' : '#F59E0B'} strokeWidth="2" strokeDasharray="3 3" />
              <text x="282" y="135" fill={activeHighlight === 'H' ? '#10B981' : '#F59E0B'} fontSize="13" fontWeight="bold">H (Alto)</text>
            </svg>
          )}

          {shape === 'round' && (
            <svg viewBox="0 0 320 220" className="w-full max-w-[240px] h-auto">
              {/* Filtro cilíndrico */}
              <ellipse cx="160" cy="50" rx="70" ry="25" fill="#252C37" stroke="#38BDF8" strokeWidth="2" />
              <ellipse cx="160" cy="50" rx="30" ry="12" fill="#0D0E11" stroke="#38BDF8" strokeWidth="1.5" />
              <path d="M90 50 v110 c0 15 31 25 70 25 s70 -10 70 -25 v-110" fill="#1A1F27" stroke="#38BDF8" strokeWidth="2" />

              {/* Cota A (Diámetro Exterior) */}
              <line x1="90" y1="20" x2="230" y2="20" stroke={activeHighlight === 'A' ? '#10B981' : '#F59E0B'} strokeWidth="2" strokeDasharray="3 3" />
              <text x="160" y="15" fill={activeHighlight === 'A' ? '#10B981' : '#F59E0B'} fontSize="12" fontWeight="bold" textAnchor="middle">A (Diám. Exterior)</text>

              {/* Cota B (Diámetro Interior) */}
              <line x1="130" y1="50" x2="190" y2="50" stroke={activeHighlight === 'B' ? '#10B981' : '#F59E0B'} strokeWidth="2" strokeDasharray="3 3" />
              <text x="160" y="45" fill={activeHighlight === 'B' ? '#10B981' : '#F59E0B'} fontSize="11" fontWeight="bold" textAnchor="middle">B (Diám. Interior)</text>

              {/* Cota H (Altura) */}
              <line x1="245" y1="50" x2="245" y2="160" stroke={activeHighlight === 'H' ? '#10B981' : '#F59E0B'} strokeWidth="2" strokeDasharray="3 3" />
              <text x="252" y="110" fill={activeHighlight === 'H' ? '#10B981' : '#F59E0B'} fontSize="12" fontWeight="bold">H (Altura)</text>
            </svg>
          )}

          {shape === 'oval' && (
            <svg viewBox="0 0 320 220" className="w-full max-w-[240px] h-auto">
              <ellipse cx="160" cy="55" rx="80" ry="25" fill="#252C37" stroke="#38BDF8" strokeWidth="2" />
              <ellipse cx="160" cy="55" rx="40" ry="12" fill="#0D0E11" stroke="#38BDF8" strokeWidth="1.5" />
              <path d="M80 55 v100 c0 15 36 25 80 25 s80 -10 80 -25 v-100" fill="#1A1F27" stroke="#38BDF8" strokeWidth="2" />

              <line x1="80" y1="20" x2="240" y2="20" stroke={activeHighlight === 'A' ? '#10B981' : '#F59E0B'} strokeWidth="2" strokeDasharray="3 3" />
              <text x="160" y="14" fill={activeHighlight === 'A' ? '#10B981' : '#F59E0B'} fontSize="12" fontWeight="bold" textAnchor="middle">A (Largo / Diám. Ext)</text>

              <line x1="255" y1="55" x2="255" y2="155" stroke={activeHighlight === 'H' ? '#10B981' : '#F59E0B'} strokeWidth="2" strokeDasharray="3 3" />
              <text x="262" y="110" fill={activeHighlight === 'H' ? '#10B981' : '#F59E0B'} fontSize="12" fontWeight="bold">H (Alto)</text>
            </svg>
          )}

          <div className="text-[10px] text-white/40 mt-3 text-center">
            Pasa el cursor por las casillas para ver la referencia en el plano.
          </div>
        </div>

        {/* Inputs de Medidas con Selector de Tolerancia */}
        <div className="lg:col-span-7 space-y-3.5">
          {/* Cota A */}
          <DimensionRow
            label="A"
            title={shape === 'flat' ? 'Longitud / Largo exterior (A)' : 'Diámetro exterior (A)'}
            value={dimA}
            onChange={setDimA}
            tolerance={tolA}
            onTolChange={setTolA}
            onFocus={() => setActiveHighlight('A')}
            onBlur={() => setActiveHighlight(null)}
            placeholder="Ej: 290"
          />

          {/* Cota B */}
          <DimensionRow
            label="B"
            title={shape === 'flat' ? 'Ancho exterior (B)' : 'Diámetro interior sup. (B)'}
            value={dimB}
            onChange={setDimB}
            tolerance={tolB}
            onTolChange={setTolB}
            onFocus={() => setActiveHighlight('B')}
            onBlur={() => setActiveHighlight(null)}
            placeholder={shape === 'flat' ? 'Ej: 240' : 'Ej: 62'}
          />

          {/* Cota H */}
          <DimensionRow
            label="H"
            title="Altura total (H)"
            value={dimH}
            onChange={setDimH}
            tolerance={tolH}
            onTolChange={setTolH}
            onFocus={() => setActiveHighlight('H')}
            onBlur={() => setActiveHighlight(null)}
            placeholder="Ej: 50 o 120"
          />

          {/* Cota C (Solo si es redondo o oval) */}
          {shape !== 'flat' && (
            <DimensionRow
              label="C"
              title="Diámetro interior inferior (C)"
              value={dimC}
              onChange={setDimC}
              tolerance={tolC}
              onTolChange={setTolC}
              onFocus={() => setActiveHighlight('C')}
              onBlur={() => setActiveHighlight(null)}
              placeholder="Opcional"
            />
          )}

          {/* Cota F / G (Rosca) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-[#1A1C21] border border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 font-black text-xs flex items-center justify-center">
                F
              </span>
              <span className="text-xs font-bold text-white/90">Rosca / Conector de entrada</span>
            </div>
            <div className="w-full sm:w-48">
              <input
                type="text"
                value={dimF}
                onChange={(e) => setDimF(e.target.value)}
                placeholder="Ej: 3/4-16 o M20x1.5"
                className="w-full bg-[#121316] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-brand-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Botones de Acción */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white text-xs font-black uppercase tracking-wider transition-all"
        >
          Limpiar
        </button>

        <button
          type="button"
          onClick={handleApply}
          disabled={isSearching}
          className="flex-1 bg-gradient-to-r from-[#10B981] to-[#059669] text-black font-black text-xs md:text-sm uppercase tracking-widest py-3.5 px-6 rounded-xl hover:opacity-95 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSearching ? 'Buscando filtros...' : 'Buscar Filtro por Dimensiones →'}
        </button>
      </div>
    </div>
  );
}

function DimensionRow({ label, title, value, onChange, tolerance, onTolChange, onFocus, onBlur, placeholder }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-[#1A1C21] border border-white/5 hover:border-white/20 transition-all">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-lg bg-brand-primary/20 text-brand-primary font-black text-xs flex items-center justify-center">
          {label}
        </span>
        <span className="text-xs font-bold text-white/90">{title}</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative w-28">
          <input
            type="number"
            step="0.1"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder={placeholder}
            className="w-full bg-[#121316] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-brand-primary pr-8"
          />
          <span className="absolute right-2.5 top-1.5 text-[10px] text-white/40 font-bold pointer-events-none">
            mm
          </span>
        </div>

        <select
          value={tolerance}
          onChange={(e) => onTolChange(e.target.value)}
          className="bg-[#121316] border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white/80 outline-none focus:border-brand-primary font-medium"
        >
          {TOLERANCES.map(t => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
