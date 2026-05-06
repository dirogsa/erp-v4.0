import React, { useState, useEffect, useRef } from 'react';
import MobileProductCard from '../components/MobileProductCard';
import { shopService } from '../services/api';
import {
    MagnifyingGlassIcon,
    ChevronLeftIcon,
    AdjustmentsHorizontalIcon,
    TruckIcon,
    TagIcon,
    XMarkIcon,
    BoltIcon,
    ArrowsPointingInIcon
} from '@heroicons/react/24/outline';
import { useNavigate, useLocation } from 'react-router-dom';

import { useCart } from '../context/CartContext';

const SearchPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { addToCart } = useCart();
    const queryParams = new URLSearchParams(location.search);
    
    const [searchTerm, setSearchTerm] = useState(queryParams.get('q') || '');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    
    // Advanced Filters
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [rawBrands, setRawBrands] = useState([]); // Original list from API
    const [activeFilters, setActiveFilters] = useState({ 
        make: queryParams.get('make') || '', 
        model: queryParams.get('model') || '' 
    });
    const [activeTab, setActiveTab] = useState(
        queryParams.get('type') === 'dimensions' ? 'DIMENSIONS' : 
        queryParams.get('type') === 'vehicle' ? 'APPS' : 'CODES'
    );
    const [specFilters, setSpecFilters] = useState({ 
        h: queryParams.get('h') || '', 
        d: queryParams.get('d') || '', 
        t: queryParams.get('t') || '', 
        id: queryParams.get('id') || '' 
    });
    
    const tabs = [
        { id: 'CODES',      label: 'Código',   icon: <TagIcon className="h-4 w-4" />,                color: '#6EE7B7', glow: 'rgba(110,231,183,0.08)' },
        { id: 'APPS',       label: 'Vehículo',  icon: <TruckIcon className="h-4 w-4" />,              color: '#38BDF8', glow: 'rgba(56,189,248,0.08)' },
        { id: 'DIMENSIONS', label: 'Medidas',   icon: <ArrowsPointingInIcon className="h-4 w-4" />,   color: '#FB923C', glow: 'rgba(251,146,60,0.08)' },
        { id: 'NEW',        label: 'Nuevos',    icon: <TagIcon className="h-4 w-4" />,                color: '#A855F7', glow: 'rgba(168,85,247,0.08)' },
    ];
    
    const searchInput = useRef(null);

    // Initial Load: Categories and Brands
    useEffect(() => {
        const loadMetadata = async () => {
            try {
                const [catRes, brandRes] = await Promise.all([
                    shopService.getCategories(),
                    shopService.getVehicleBrands()
                ]);
                setCategories(catRes.data || []);
                setRawBrands(brandRes.data || []);
            } catch (err) {
                console.error("Failed to load search metadata", err);
            }
        };
        loadMetadata();
    }, []);

    // World-Class Logic: Consolidate Brands for UI
    // Group "TOYOTA INDUSTRIAL" into "TOYOTA" and prioritize popular brands
    const consolidatedBrands = React.useMemo(() => {
        const groups = {};
        rawBrands
            .filter(b => b.is_active !== false) // Solo marcas activas
            .forEach(b => {
                const name = b.name.toUpperCase().trim();
                const parent = b.parent_name ? b.parent_name.toUpperCase().trim() : null;
                const displayName = parent || name;
                
                if (!groups[displayName]) {
                    groups[displayName] = { name: displayName, models: new Set(), is_popular: false };
                }
                // If any variant is popular, the group becomes popular
                if (b.is_popular) groups[displayName].is_popular = true;
                b.models.forEach(m => groups[displayName].models.add(m));
            });
        
        return Object.values(groups).sort((a, b) => {
            if (a.is_popular && !b.is_popular) return -1;
            if (!a.is_popular && b.is_popular) return 1;
            return a.name.localeCompare(b.name);
        });
    }, [rawBrands]);

    const availableModels = React.useMemo(() => {
        const brand = consolidatedBrands.find(b => b.name === activeFilters.make);
        return brand ? Array.from(brand.models).sort() : [];
    }, [activeFilters.make, consolidatedBrands]);

    // Search Execution (Manual Trigger - Context Isolated)
    const handleSearch = async () => {
        let params = {};

        // Definimos los parámetros según el CONTEXTO de la pestaña activa
        if (activeTab === 'CODES') {
            if (!searchTerm) return;
            params = { search: searchTerm };
        } 
        else if (activeTab === 'APPS') {
            if (!activeFilters.make) return;
            params = { 
                vehicle_brand: activeFilters.make, 
                vehicle_model: activeFilters.model 
            };
        } 
        else if (activeTab === 'DIMENSIONS') {
            const hasSpecs = specFilters.h || specFilters.d || specFilters.t || specFilters.id;
            if (!hasSpecs) return;
            params = {
                spec_h: specFilters.h,
                spec_d: specFilters.d,
                spec_t: specFilters.t,
                spec_id: specFilters.id,
            };
        } 
        else if (activeTab === 'NEW') {
            params = { is_new: true };
        }

        setLoading(true);
        try {
            const res = await shopService.getProducts({ 
                ...params,
                category: selectedCategory // La categoría es lo único que podría ser global si se desea
            });
            setResults(res.data.items);
            setStats({ total: res.data.total });
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setLoading(false);
        }
    };

    // Efecto para la carga inicial si viene por URL o pestaña NUEVOS
    useEffect(() => {
        const hasSearch = searchTerm || activeFilters.make || specFilters.h || specFilters.d || specFilters.t || specFilters.id;
        if (hasSearch || activeTab === 'NEW') {
            handleSearch();
        }
    }, []);

    return (
        <div className="bg-brand-bg h-screen text-brand-text flex flex-col font-sans overflow-hidden">
            {/* Header: Master Search Console */}
            <header className="flex-shrink-0 px-5 pt-8 pb-4 safe-top sticky top-0 z-50 bg-brand-bg/80 backdrop-blur-xl border-b border-white/5">
                {/* Tab selector */}
                <div className="flex gap-1 mb-5 p-1 rounded-2xl"
                    style={{ background: 'var(--brand-surface)', border: '1px solid var(--brand-border-2)' }}>
                    {tabs.map(t => {
                        const isActive = activeTab === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className="flex-1 py-3 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1"
                                style={isActive ? {
                                    background: `${t.color}18`,
                                    border: `1.5px solid ${t.color}55`,
                                    color: t.color,
                                    fontWeight: '800',
                                    boxShadow: `0 0 24px ${t.color}20`
                                } : {
                                    background: `${t.color}07`,
                                    border: `1.5px solid ${t.color}22`,
                                    color: `${t.color}99`,
                                    fontWeight: '600',
                                }}
                            >
                                <span style={{ color: isActive ? t.color : `${t.color}88` }}>{t.icon}</span>
                                <span className="text-[8px] uppercase tracking-widest">{t.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Search panel */}
                <div className="rounded-[1.75rem] p-5 relative overflow-hidden"
                    style={{
                        background: 'var(--brand-surface)',
                        border: `1.5px solid ${tabs.find(t => t.id === activeTab)?.color ?? '#6EE7B7'}28`,
                        boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
                        transition: 'border-color 0.3s'
                    }}>

                    {/* Panel ambient glow */}
                    <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none"
                        style={{ background: tabs.find(t => t.id === activeTab)?.glow ?? 'rgba(110,231,183,0.06)', transition: 'background 0.3s' }} />

                    {/* ── CODES TAB ── */}
                    {activeTab === 'CODES' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-3">
                            <label className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#6EE7B7' }}>Código / Referencia del filtro</label>
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#6EE7B7' }} />
                                <input
                                    ref={searchInput}
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Nro Wix / Reemplazo / Descripción..."
                                    className="tech-input w-full h-14 rounded-xl pl-11 pr-4 text-sm font-bold tracking-widest"
                                    style={{ borderColor: 'rgba(110,231,183,0.25)' }}
                                />
                                {searchTerm && (
                                    <button 
                                        onClick={() => { setSearchTerm(''); setResults([]); }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-text-dim hover:text-white"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={!searchTerm || loading}
                                className="w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 shadow-lg flex items-center justify-center gap-2"
                                style={{ background: 'linear-gradient(135deg, #6EE7B7, #34d399)', color: '#0D0E11' }}
                            >
                                {loading ? 'Buscando...' : 'Buscar Filtro →'}
                            </button>
                        </div>
                    )}

                    {/* ── APPS TAB ── */}
                    {activeTab === 'APPS' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-3">
                            <label className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#38BDF8' }}>Selecciona tu vehículo</label>
                            <div className="relative">
                                <TruckIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: '#38BDF8' }} />
                                <select
                                    value={activeFilters.make}
                                    onChange={(e) => setActiveFilters({ ...activeFilters, make: e.target.value, model: '' })}
                                    className="tech-input w-full h-14 rounded-xl pl-11 pr-4 text-[11px] font-black appearance-none uppercase"
                                    style={{ borderColor: 'rgba(56,189,248,0.25)' }}
                                >
                                    <option value="">— SELECCIONAR MARCA —</option>
                                    {consolidatedBrands.map(b => (
                                        <option key={b.name} value={b.name}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <select
                                value={activeFilters.model}
                                onChange={(e) => setActiveFilters({ ...activeFilters, model: e.target.value })}
                                disabled={!activeFilters.make}
                                className="tech-input w-full h-14 rounded-xl px-4 text-[11px] font-black appearance-none uppercase disabled:opacity-25"
                                style={{ borderColor: 'rgba(56,189,248,0.2)' }}
                            >
                                <option value="">— MODELO (OPCIONAL) —</option>
                                {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <button
                                onClick={handleSearch}
                                disabled={!activeFilters.make || loading}
                                className="w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 shadow-lg flex items-center justify-center gap-2"
                                style={{ background: 'linear-gradient(135deg, #38BDF8, #0ea5e9)', color: '#0D0E11' }}
                            >
                                <TruckIcon className="h-4 w-4" /> {loading ? 'Buscando...' : 'Ver Filtros para este Vehículo'}
                            </button>
                        </div>
                    )}

                    {/* ── DIMENSIONS TAB ── */}
                    {activeTab === 'DIMENSIONS' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
                            <label className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#FB923C' }}>Búsqueda por Medidas (Precisión)</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { key: 'h', label: 'ALTURA', code: '(H)', placeholder: 'mm', icon: '📏' },
                                    { key: 'd', label: 'DIÁM. EXT.', code: '(A)', placeholder: 'mm', icon: '⭕' },
                                    { key: 't', label: 'ROSCA', code: '(G)', placeholder: 'TPI/M', icon: '⚙️' },
                                    { key: 'id', label: 'DIÁM. INT.', code: '(B/C)', placeholder: 'mm', icon: '🔘' }
                                ].map(dim => (
                                    <div key={dim.key} className="bg-brand-surface-2 rounded-xl p-3 relative shadow-lg border border-brand-border-2 focus-within:border-[#FB923C]/50 transition-all">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="block text-[8px] font-black text-brand-text-muted uppercase tracking-tighter">
                                                {dim.label} <span className="text-[#FB923C] font-bold">{dim.code}</span>
                                            </span>
                                            <span className="text-xs opacity-40">{dim.icon}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="text"
                                                value={specFilters[dim.key]}
                                                onChange={(e) => setSpecFilters({ ...specFilters, [dim.key]: e.target.value })}
                                                className="w-full bg-transparent text-[15px] font-black text-white outline-none h-8 placeholder:text-white/10"
                                                placeholder={dim.placeholder}
                                            />
                                            {specFilters[dim.key] && (
                                                <button 
                                                    onClick={() => setSpecFilters({ ...specFilters, [dim.key]: '' })}
                                                    className="flex-shrink-0 text-white/20 p-1"
                                                >
                                                    <XMarkIcon className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={handleSearch}
                                    disabled={loading}
                                    className="w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 shadow-lg flex items-center justify-center gap-2"
                                    style={{ background: 'linear-gradient(135deg, #FB923C, #f97316)', color: '#0D0E11' }}
                                >
                                    <ArrowsPointingInIcon className="h-4 w-4" /> {loading ? 'Calculando...' : 'Buscar por Medidas'}
                                </button>
                                <button 
                                    onClick={() => {
                                        setSpecFilters({ h: '', d: '', t: '', id: '' });
                                        setResults([]);
                                    }}
                                    className="w-full py-3 bg-white/5 rounded-xl text-[9px] font-black text-brand-text-muted hover:text-white uppercase transition-all"
                                >
                                    Limpiar Búsqueda Técnica
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── NEW TAB ── */}
                    {activeTab === 'NEW' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4 py-4 text-center">
                            <div className="h-16 w-16 mx-auto rounded-2xl flex items-center justify-center bg-brand-primary/10 border border-brand-primary/20">
                                <BoltIcon className="h-8 w-8 text-brand-primary" />
                            </div>
                            <div>
                                <h3 className="text-brand-md font-black text-white uppercase tracking-tight">Recién Llegados</h3>
                                <p className="text-[10px] text-brand-text-muted mt-1 uppercase tracking-widest">Mostrando ingresos del último mes</p>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
                {/* Results Area */}
                <div className="px-4 pb-32 space-y-6">
                    {!searchTerm && !selectedCategory && !activeFilters.make && !specFilters.h && !specFilters.d && !specFilters.t ? (
                        <div className="py-12 px-2 text-center space-y-12 animate-in fade-in zoom-in duration-700">
                            {/* Empty State / Guided Discovery */}
                            <div className="space-y-4">
                                <div className="h-24 w-24 bg-brand-surface rounded-[2.5rem] border border-white/5 flex items-center justify-center mx-auto shadow-2xl relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-brand-primary/10 animate-pulse"></div>
                                    <MagnifyingGlassIcon className="h-10 w-10 text-brand-primary relative z-10" />
                                </div>
                                <h3 className="text-white font-black text-lg uppercase tracking-tight">¿Qué filtro buscas hoy?</h3>
                                <p className="text-brand-text-dim text-[11px] leading-relaxed max-w-[260px] mx-auto font-medium">
                                    Encuentra el repuesto exacto buscando por código, tipo de filtro o aplicación vehicular.
                                </p>
                            </div>

                            {/* Quick Discovery: By Filter Type */}
                            <div className="space-y-4">
                                <p className="text-[9px] font-black text-brand-primary uppercase tracking-[0.3em] flex items-center justify-center gap-3">
                                    <span className="h-px w-8 bg-brand-primary/30"></span>
                                    Tipos de Filtro
                                    <span className="h-px w-8 bg-brand-primary/30"></span>
                                </p>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {['ACEITE', 'AIRE', 'COMBUSTIBLE', 'CABINA', 'HIDRÁULICO'].map(cat => (
                                        <button 
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className="px-6 py-3 bg-brand-surface border border-white/10 rounded-2xl text-[10px] font-black text-white hover:bg-brand-primary hover:text-brand-bg transition-all active:scale-95 shadow-xl uppercase tracking-widest"
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Discovery: By Brand/Code */}
                            <div className="space-y-4">
                                <p className="text-[9px] font-black text-brand-text-dim uppercase tracking-[0.3em] flex items-center justify-center gap-3">
                                    Marcas y Códigos Top
                                </p>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {['WA6004', 'DONALDSON', 'FLEETGUARD', 'BALDWIN', 'TOYOTA', 'NISSAN'].map(chip => (
                                        <button 
                                            key={chip}
                                            onClick={() => setSearchTerm(chip)}
                                            className="px-4 py-2 bg-brand-surface/40 border border-white/5 rounded-xl text-[9px] font-black text-brand-text-dim hover:text-brand-primary transition-all active:scale-95"
                                        >
                                            {chip}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : loading ? (
                        <div className="space-y-6 pt-4">
                            {/* Wake-Up Info Card */}
                            <div className="bg-brand-surface/50 border border-brand-primary/20 p-6 rounded-[2.5rem] text-center shadow-2xl animate-in fade-in zoom-in duration-700">
                                <div className="h-12 w-12 border-2 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mx-auto mb-4"></div>
                                <h4 className="text-white font-black text-xs uppercase tracking-widest mb-1">Enlazando con Central</h4>
                                <p className="text-[10px] text-brand-text-dim leading-relaxed px-4">
                                    Estableciendo conexión segura con nuestra base de datos. Por favor, espere un momento mientras validamos el inventario.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-brand-surface h-32 rounded-[2rem] border border-brand-border animate-pulse shadow-inner"></div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 pt-4">
                            {results.length > 0 && (
                                <div className="flex justify-between items-center mb-2 px-1">
                                    <h2 className="text-brand-heading !text-sm">Resultados</h2>
                                    <span className="text-[10px] font-black text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-lg border border-brand-primary/20">
                                        {stats?.total} PRODUCTOS
                                    </span>
                                </div>
                            )}
                            
                            {results.map(prod => (
                                <MobileProductCard
                                    key={prod.sku}
                                    product={prod}
                                    searchTerm={searchTerm}
                                    onAddToCart={(p) => {
                                        addToCart(p);
                                        navigate('/cart');
                                    }}
                                />
                            ))}

                            {results.length === 0 && (
                                <div className="py-20 text-center space-y-6 animate-in fade-in slide-in-from-bottom-10">
                                    <div className="h-24 w-24 bg-brand-surface border border-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl opacity-50">
                                        <XMarkIcon className="h-12 w-12 text-brand-danger" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-white font-black text-lg uppercase tracking-tighter">Sin coincidencias</h3>
                                        <p className="text-brand-text-dim text-[11px] px-10">
                                            {activeTab === 'NEW' ? (
                                                "No hay novedades o ingresos recientes disponibles en este momento."
                                            ) : activeTab === 'APPS' ? (
                                                <>No encontramos filtros para <span className="text-white">{activeFilters.make} {activeFilters.model}</span>.</>
                                            ) : activeTab === 'DIMENSIONS' ? (
                                                "No encontramos filtros que coincidan con las medidas técnicas ingresadas."
                                            ) : (
                                                <>No encontramos resultados para "<span className="text-white">{searchTerm}</span>".</>
                                            )}
                                            <br />Intenta con otro criterio o ajusta los filtros.
                                        </p>
                                        <button 
                                            onClick={() => {
                                                setSearchTerm('');
                                                setSelectedCategory(null);
                                                setActiveFilters({ make: '', model: '' });
                                            }}
                                            className="mt-4 text-brand-primary font-black text-[10px] uppercase border-b border-brand-primary/30 pb-1"
                                        >
                                            Limpiar todos los filtros
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default SearchPage;
