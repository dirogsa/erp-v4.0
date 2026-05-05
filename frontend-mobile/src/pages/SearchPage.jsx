import React, { useState, useEffect, useRef } from 'react';
import MobileProductCard from '../components/MobileProductCard';
import { shopService } from '../services/api';
import {
    MagnifyingGlassIcon,
    ChevronLeftIcon,
    AdjustmentsHorizontalIcon,
    TruckIcon,
    TagIcon,
    XMarkIcon
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
    const [activeTab, setActiveTab] = useState('CODES'); // CODES, APPS, DIMENSIONS, NEW
    const [specFilters, setSpecFilters] = useState({ h: '', d: '', t: '', id: '' });
    
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

    // Search Execution (Reactive)
    useEffect(() => {
        const fetchResults = async () => {
            const hasSpecs = specFilters.h || specFilters.d || specFilters.t;
            if (!searchTerm && !selectedCategory && !activeFilters.make && !hasSpecs) {
                setResults([]);
                setStats(null);
                return;
            }

            setLoading(true);
            try {
                const res = await shopService.getProducts({ 
                    search: searchTerm,
                    category: selectedCategory,
                    vehicle_brand: activeFilters.make,
                    vehicle_model: activeFilters.model,
                    spec_h: specFilters.h,
                    spec_d: specFilters.d,
                    spec_t: specFilters.t,
                    spec_id: specFilters.id,
                    is_new: activeTab === 'NEW' ? true : undefined
                });
                setResults(res.data.items);
                setStats({ total: res.data.total });
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchResults, 400);
        return () => clearTimeout(timer);
    }, [searchTerm, selectedCategory, activeFilters, specFilters, activeTab]);

    return (
        <div className="bg-brand-bg h-screen text-brand-text flex flex-col font-sans overflow-hidden">
            {/* Header: Master Search Console */}
            <header className="flex-shrink-0 glass-card border-b border-white/5 safe-top sticky top-0 z-50">
                <div className="flex px-4 pt-4 pb-0 overflow-x-auto no-scrollbar gap-1">
                    {[
                        { id: 'CODES', label: 'CÓDIGOS' },
                        { id: 'APPS', label: 'APLICACIONES' },
                        { id: 'DIMENSIONS', label: 'DIMENSIONES' },
                        { id: 'NEW', label: 'NUEVOS' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-3 text-[9px] font-black tracking-[0.2em] uppercase transition-all rounded-t-xl border-b-4 ${
                                activeTab === tab.id 
                                ? 'bg-brand-primary text-brand-bg border-brand-primary' 
                                : 'text-brand-text-dim border-transparent hover:text-white'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="bg-brand-primary p-4 space-y-4">
                    {activeTab === 'CODES' && (
                        <div className="flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                            <button
                                onClick={() => navigate(-1)}
                                className="h-12 w-12 flex-shrink-0 bg-brand-bg/20 rounded-xl text-brand-bg active:scale-95 transition-all flex items-center justify-center"
                            >
                                <ChevronLeftIcon className="h-6 w-6" />
                            </button>
                            <div className="flex-1 relative">
                                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-bg/60" />
                                <input
                                    ref={searchInput}
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Nro Wix / Reemplazo / Descripción..."
                                    className="w-full pl-11 pr-4 py-3.5 bg-white border-none rounded-xl text-brand-sm font-black text-brand-bg focus:ring-4 focus:ring-black/10 outline-none transition-all placeholder:text-brand-bg/40 shadow-xl uppercase"
                                />
                                {searchTerm && (
                                    <button 
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-bg/40 hover:text-brand-bg"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'APPS' && (
                        <div className="space-y-3 animate-in slide-in-from-right duration-300">
                            <div className="grid grid-cols-2 gap-3">
                                <select
                                    value={activeFilters.make}
                                    onChange={(e) => setActiveFilters({ ...activeFilters, make: e.target.value, model: '' })}
                                    className="w-full bg-white rounded-xl p-3.5 text-[10px] font-black text-brand-bg outline-none uppercase shadow-lg"
                                >
                                    <option value="">SELECCIONAR MARCA</option>
                                    {consolidatedBrands.map(b => (
                                        <option key={b.name} value={b.name}>{b.name}</option>
                                    ))}
                                </select>
                                <select
                                    value={activeFilters.model}
                                    onChange={(e) => setActiveFilters({ ...activeFilters, model: e.target.value })}
                                    disabled={!activeFilters.make}
                                    className="w-full bg-white rounded-xl p-3.5 text-[10px] font-black text-brand-bg outline-none uppercase shadow-lg disabled:opacity-50"
                                >
                                    <option value="">SELECCIONAR MODELO</option>
                                    {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    {activeTab === 'DIMENSIONS' && (
                        <div className="space-y-4 animate-in slide-in-from-left duration-300">
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { key: 'h', label: 'ALTURA', code: '(H)', placeholder: 'mm', icon: '📏' },
                                    { key: 'd', label: 'DIÁM. EXT.', code: '(A)', placeholder: 'mm', icon: '⭕' },
                                    { key: 't', label: 'ROSCA', code: '(G)', placeholder: 'TPI/M', icon: '⚙️' },
                                    { key: 'id', label: 'DIÁM. INT.', code: '(B/C)', placeholder: 'mm', icon: '🔘' }
                                ].map(dim => (
                                    <div key={dim.key} className="bg-white rounded-xl p-3 relative shadow-lg border-b-2 border-transparent focus-within:border-brand-bg/20 transition-all">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="block text-[8px] font-black text-brand-bg/40 uppercase tracking-tighter">
                                                {dim.label} <span className="text-brand-primary font-bold">{dim.code}</span>
                                            </span>
                                            <span className="text-xs opacity-40">{dim.icon}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="text"
                                                value={specFilters[dim.key]}
                                                onChange={(e) => setSpecFilters({ ...specFilters, [dim.key]: e.target.value })}
                                                className="w-full bg-transparent text-[15px] font-black text-brand-bg outline-none h-8 placeholder:text-brand-bg/10"
                                                placeholder={dim.placeholder}
                                            />
                                            {specFilters[dim.key] && (
                                                <button 
                                                    onClick={() => setSpecFilters({ ...specFilters, [dim.key]: '' })}
                                                    className="flex-shrink-0 text-brand-bg/30 p-1"
                                                >
                                                    <XMarkIcon className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button 
                                onClick={() => setSpecFilters({ h: '', d: '', t: '', id: '' })}
                                className="w-full py-3 bg-brand-bg/10 rounded-xl text-[10px] font-black text-brand-bg/60 uppercase active:scale-95 transition-all shadow-sm"
                            >
                                Limpiar Búsqueda Técnica
                            </button>
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
                                            No encontramos resultados para "<span className="text-white">{searchTerm}</span>". 
                                            Intenta con otro código o ajusta los filtros.
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
