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

const SearchPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
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
            if (!searchTerm && !selectedCategory && !activeFilters.make) {
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
                    vehicle_model: activeFilters.model
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
    }, [searchTerm, selectedCategory, activeFilters]);

    return (
        <div className="bg-brand-bg h-screen text-brand-text flex flex-col font-sans overflow-hidden">
            {/* Header: Master Search */}
            <header className="flex-shrink-0 glass-card border-b border-white/5 safe-top sticky top-0 z-50">
                <div className="px-4 py-4 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="h-12 w-12 flex-shrink-0 bg-brand-surface rounded-xl border border-brand-border text-brand-text active:scale-95 transition-all flex items-center justify-center"
                    >
                        <ChevronLeftIcon className="h-6 w-6" />
                    </button>
                    
                    <div className="flex-1 relative group">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-primary" />
                        <input
                            ref={searchInput}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por código o descripción..."
                            className="w-full pl-11 pr-4 py-3.5 bg-brand-surface border border-brand-border rounded-xl text-brand-sm font-bold focus:border-brand-primary focus:outline-none transition-all placeholder:text-brand-muted/40 shadow-xl"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-text-dim hover:text-white"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Category Quick-Select (Pillar A) */}
                <div className="flex overflow-x-auto gap-2 px-4 pb-4 no-scrollbar">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                            !selectedCategory 
                            ? 'bg-brand-primary text-brand-bg border-brand-primary shadow-lg shadow-brand-primary/20' 
                            : 'bg-brand-surface border-brand-border text-brand-text-dim'
                        }`}
                    >
                        Todos
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat._id || cat.name}
                            onClick={() => setSelectedCategory(cat.name)}
                            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                                selectedCategory === cat.name 
                                ? 'bg-brand-primary text-brand-bg border-brand-primary shadow-lg shadow-brand-primary/20' 
                                : 'bg-brand-surface border-brand-border text-brand-text-dim'
                            }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
                {/* Vehicle Selection Wizard (Pillar B) */}
                <section className="p-4 space-y-4">
                    <div className="bg-brand-surface/30 border border-white/5 rounded-[2rem] p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-8 w-8 bg-brand-primary/10 rounded-lg flex items-center justify-center border border-brand-primary/20">
                                <TruckIcon className="h-5 w-5 text-brand-primary" />
                            </div>
                            <h3 className="text-brand-xs font-black text-white uppercase tracking-widest">Filtros por Aplicación Vehicular</h3>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-brand-text-dim uppercase px-2">Marca</label>
                                <select
                                    value={activeFilters.make}
                                    onChange={(e) => setActiveFilters({ ...activeFilters, make: e.target.value, model: '' })}
                                    className="w-full bg-brand-bg border border-brand-border rounded-xl p-3.5 text-xs font-bold text-white focus:border-brand-primary outline-none appearance-none uppercase"
                                >
                                    <option value="">CUALQUIER MARCA</option>
                                    {consolidatedBrands.map(b => (
                                         <option key={b.name} value={b.name}>
                                             {b.is_popular ? `⭐ ${b.name}` : b.name}
                                         </option>
                                     ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-brand-text-dim uppercase px-2">Modelo</label>
                                <select
                                    value={activeFilters.model}
                                    onChange={(e) => setActiveFilters({ ...activeFilters, model: e.target.value })}
                                    disabled={!activeFilters.make}
                                    className="w-full bg-brand-bg border border-brand-border rounded-xl p-3.5 text-xs font-bold text-white focus:border-brand-primary outline-none appearance-none uppercase disabled:opacity-20"
                                >
                                    <option value="">CUALQUIER MODELO</option>
                                    {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>

                        {activeFilters.make && (
                            <button 
                                onClick={() => setActiveFilters({ make: '', model: '' })}
                                className="w-full py-2 text-[9px] font-black text-brand-danger uppercase tracking-tighter hover:opacity-70"
                            >
                                Limpiar Filtros de Vehículo
                            </button>
                        )}
                    </div>
                </section>

                {/* Results Area */}
                <div className="px-4 pb-10">
                    <div className="flex justify-between items-center mb-6 px-1">
                        <h2 className="text-brand-heading !text-sm">Resultados</h2>
                        {stats && (
                            <span className="text-[10px] font-black text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-lg border border-brand-primary/20">
                                {stats.total} PRODUCTOS ENCONTRADOS
                            </span>
                        )}
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="bg-brand-surface h-64 rounded-3xl border border-brand-border animate-pulse shadow-inner"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            {results.map(prod => (
                                <MobileProductCard
                                    key={prod.sku}
                                    product={prod}
                                    onAddToCart={(p) => console.log("Added:", p.sku)}
                                />
                            ))}
                        </div>
                    )}

                    {!loading && results.length === 0 && (
                        <div className="py-20 text-center space-y-6">
                            <div className="h-20 w-20 bg-brand-surface border border-white/5 rounded-full flex items-center justify-center mx-auto shadow-2xl opacity-50">
                                <MagnifyingGlassIcon className="h-10 w-10 text-brand-text-dim" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-brand-title uppercase tracking-tighter">Sin coincidencias</h3>
                                <p className="text-brand-metadata px-10">Ajusta los filtros o intenta con un código diferente.</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default SearchPage;
