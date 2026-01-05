import React, { useState, useEffect } from 'react';
import { shopService } from '../services/api';
import ProductCard from './ProductCard';
import LoadingSpinner from './LoadingSpinner';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    TruckIcon,
    ArrowsRightLeftIcon,
    AdjustmentsVerticalIcon,
    XMarkIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';

const Catalog = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [searchMode, setSearchMode] = useState('all'); // all, vehicle, specs, equivalence
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [brands, setBrands] = useState([]);
    const [selectedVehicleBrand, setSelectedVehicleBrand] = useState('');
    const [selectedOrigin, setSelectedOrigin] = useState('ALL');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 20;

    useEffect(() => {
        setProducts([]); // Clear on filter change
        setPage(1);
        setHasMore(true);
        loadData(1, true);
    }, [selectedCategory, searchMode, selectedVehicleBrand, selectedOrigin]);

    const loadData = async (pageNum = 1, isFresh = false) => {
        setLoading(true);
        try {
            const params = {
                search,
                category: selectedCategory,
                mode: searchMode,
                vehicle_brand: selectedVehicleBrand || undefined,
                page: pageNum,
                limit: LIMIT,
                skip: (pageNum - 1) * LIMIT
            };

            // Only fetch filters on initial load to save bandwidth, or just once. 
            // Ideally separation of concerns, but for now:
            const promises = [shopService.getProducts(params)];

            // Should probably only load metadata once, but keeping logic simple for now
            if (isFresh && categories.length === 0) {
                promises.push(shopService.getCategories());
                promises.push(shopService.getVehicleBrands());
            }

            const [prodRes, catRes, brandRes] = await Promise.all(promises);

            const newItems = prodRes.data.items || [];
            if (isFresh) {
                setProducts(newItems);
            } else {
                setProducts(prev => [...prev, ...newItems]);
            }

            // Update metadata if fetched
            if (catRes) setCategories(catRes.data || []);
            if (brandRes) setBrands(brandRes.data || []);

            // Check if we reached the end
            const total = prodRes.data.total || 0;
            const currentCount = isFresh ? newItems.length : products.length + newItems.length;
            setHasMore(currentCount < total);

        } catch (error) {
            console.error("[Catalog] Error loading catalog:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setProducts([]);
        setPage(1);
        loadData(1, true);
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadData(nextPage, false);
    };

    const filteredBrands = brands.filter(b => selectedOrigin === 'ALL' || b.origin === selectedOrigin);

    const origins = [
        { id: 'ALL', label: 'Todos', icon: '🌎' },
        { id: 'EUROPE', label: 'Europeos', icon: '🇪🇺' },
        { id: 'ASIA', label: 'Asiáticos', icon: '🇯🇵' },
        { id: 'USA', label: 'Americanos', icon: '🇺🇸' }
    ];

    return (
        <section className="py-12">
            <div className="flex flex-col mb-12">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 mb-2">Nuestro Catálogo</h2>
                        <p className="text-slate-500 font-medium">Encuentra los mejores repuestos con precisión</p>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                            {origins.map(origin => (
                                <button
                                    key={origin.id}
                                    onClick={() => setSelectedOrigin(origin.id)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${selectedOrigin === origin.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <span>{origin.icon}</span>
                                    {origin.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex w-full md:w-auto gap-3">
                            <button
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all border ${showAdvanced
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-xl'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-primary-500'
                                    }`}
                            >
                                <FunnelIcon className="h-5 w-5" />
                                {showAdvanced ? 'Cerrar Filtros' : 'Búsqueda Avanzada'}
                            </button>

                            <select
                                className="bg-white border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500 shadow-sm font-bold text-slate-600"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <option value="">Todas las Categorías</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* New Arrivals Section */}
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-1 w-8 bg-amber-400 rounded-full"></div>
                        <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                            <SparklesIcon className="h-4 w-4 text-amber-500" /> Novedades
                        </h3>
                    </div>

                    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden group hover:shadow-primary-900/20 transition-all">
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary-600/20 transition-all duration-700"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                            <div className="space-y-4 max-w-lg">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white border border-white/5 backdrop-blur-md text-xs font-black uppercase tracking-wider">
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                    Recién Llegado
                                </div>
                                <h2 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">
                                    Nuevos Ingresos <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-amber-400">2025</span>
                                </h2>
                                <p className="text-slate-400 text-lg font-medium">
                                    Descubre la última tecnología en filtración y repuestos de alto rendimiento para tu flota.
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => document.getElementById('catalog-grid').scrollIntoView({ behavior: 'smooth' })}
                                    className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black hover:bg-slate-50 transition-all shadow-xl shadow-white/5 hover:scale-105 active:scale-95 duration-300"
                                >
                                    Ver Lo Nuevo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Advanced Search Panel */}
                <div className={`transition-all duration-500 overflow-hidden ${showAdvanced ? 'max-h-[500px] opacity-100 mb-8' : 'max-h-0 opacity-0'}`}>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <button
                                onClick={() => setSearchMode('vehicle')}
                                className={`p-6 rounded-3xl border-2 transition-all text-left group ${searchMode === 'vehicle' ? 'border-primary-600 bg-primary-50/50' : 'border-slate-50 hover:border-slate-200 bg-slate-50/30'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${searchMode === 'vehicle' ? 'bg-primary-600 text-white' : 'bg-white text-slate-400 group-hover:text-primary-600'
                                    }`}>
                                    <TruckIcon className="h-6 w-6" />
                                </div>
                                <h4 className="font-black text-slate-900 mb-1">Por Vehículo</h4>
                                <p className="text-xs text-slate-500 leading-relaxed font-medium">Busca por marca, modelo o motor (ej: Toyota Yaris 1.5)</p>
                            </button>

                            <button
                                onClick={() => setSearchMode('specs')}
                                className={`p-6 rounded-3xl border-2 transition-all text-left group ${searchMode === 'specs' ? 'border-primary-600 bg-primary-50/50' : 'border-slate-50 hover:border-slate-200 bg-slate-50/30'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${searchMode === 'specs' ? 'bg-primary-600 text-white' : 'bg-white text-slate-400 group-hover:text-primary-600'
                                    }`}>
                                    <AdjustmentsVerticalIcon className="h-6 w-6" />
                                </div>
                                <h4 className="font-black text-slate-900 mb-1">Por Medidas</h4>
                                <p className="text-xs text-slate-500 leading-relaxed font-medium">Filtra por especificaciones técnicas (ej: rosca M20, 120mm)</p>
                            </button>

                            <button
                                onClick={() => setSearchMode('equivalence')}
                                className={`p-6 rounded-3xl border-2 transition-all text-left group ${searchMode === 'equivalence' ? 'border-primary-600 bg-primary-50/50' : 'border-slate-50 hover:border-slate-200 bg-slate-50/30'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${searchMode === 'equivalence' ? 'bg-primary-600 text-white' : 'bg-white text-slate-400 group-hover:text-primary-600'
                                    }`}>
                                    <ArrowsRightLeftIcon className="h-6 w-6" />
                                </div>
                                <h4 className="font-black text-slate-900 mb-1">Equivalencias</h4>
                                <p className="text-xs text-slate-500 leading-relaxed font-medium">Busca cruces con otras marcas o códigos OEM (ej: W811/80)</p>
                            </button>
                        </div>

                        <form onSubmit={handleSearch} className="relative">
                            <input
                                type="text"
                                placeholder={
                                    searchMode === 'vehicle' ? "Escribe marca o modelo (ej: Toyota Hilux)..." :
                                        searchMode === 'specs' ? "Escribe medida o rosca (ej: M20 o 80mm)..." :
                                            searchMode === 'equivalence' ? "Escribe código de otra marca u OEM..." :
                                                "Buscar por SKU, nombre o marca..."
                                }
                                className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 pr-16 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-lg font-medium shadow-inner"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <button type="submit" className="absolute right-4 top-3.5 bg-primary-600 text-white p-3 rounded-xl hover:bg-primary-500 transition-all shadow-lg shadow-primary-600/20 active:scale-95">
                                <MagnifyingGlassIcon className="h-6 w-6" />
                            </button>

                            {search && (
                                <button
                                    type="button"
                                    onClick={() => { setSearch(''); setSearchMode('all'); }}
                                    className="absolute right-20 top-5 text-slate-400 hover:text-slate-600"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            )}
                        </form>

                        {/* Search Tips */}
                        <div className="mt-6 flex flex-wrap gap-3 items-center">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter bg-slate-100 px-2 py-1 rounded-md">💡 Tips para {searchMode === 'all' ? 'búsqueda' : searchMode === 'vehicle' ? 'vehículos' : searchMode === 'specs' ? 'medidas' : 'cruces'}:</span>

                            {searchMode === 'all' || searchMode === 'vehicle' ? (
                                <button onClick={() => { setSearchMode('vehicle'); setSearch('Hilux 2.4'); }} className="text-[11px] font-bold text-slate-500 hover:text-primary-600 hover:bg-primary-50 px-3 py-1.5 rounded-xl border border-dotted border-slate-300 transition-all">
                                    "Toyota Hilux 2.4"
                                </button>
                            ) : null}

                            {searchMode === 'all' || searchMode === 'specs' ? (
                                <button onClick={() => { setSearchMode('specs'); setSearch('M20'); }} className="text-[11px] font-bold text-slate-500 hover:text-primary-600 hover:bg-primary-50 px-3 py-1.5 rounded-xl border border-dotted border-slate-300 transition-all">
                                    "Rosca M20"
                                </button>
                            ) : null}

                            {searchMode === 'all' || searchMode === 'equivalence' ? (
                                <button onClick={() => { setSearchMode('equivalence'); setSearch('W811'); }} className="text-[11px] font-bold text-slate-500 hover:text-primary-600 hover:bg-primary-50 px-3 py-1.5 rounded-xl border border-dotted border-slate-300 transition-all">
                                    "Mann W811"
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* Quick Search Bar (When advanced is closed) */}
                {!showAdvanced && (
                    <form onSubmit={handleSearch} className="relative w-full">
                        <input
                            type="text"
                            placeholder="Buscar por SKU, marca, medidas o aplicaciones..."
                            className="w-full bg-white border border-slate-200 rounded-[2rem] px-8 py-5 pr-16 focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm text-lg font-medium"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button type="submit" className="absolute right-4 top-2 bg-primary-600 text-white p-3 rounded-2xl hover:bg-primary-500 transition-all shadow-lg shadow-primary-600/20">
                            <MagnifyingGlassIcon className="h-8 w-8 text-white p-0.5" />
                        </button>
                    </form>
                )}
            </div>

            {loading ? (
                <LoadingSpinner />
            ) : (
                <div id="catalog-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {products.length > 0 ? (
                        products.map((product) => (
                            <ProductCard key={product.sku} product={product} onAddToCart={() => { }} />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 bg-slate-50 rounded-3xl">
                            <p className="text-slate-500">No se encontraron productos.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Load More Button */}
            {!loading && hasMore && products.length > 0 && (
                <div className="mt-12 text-center">
                    <button
                        onClick={handleLoadMore}
                        className="px-8 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                    >
                        Cargar más productos
                    </button>
                </div>
            )}
        </section>
    );
};

export default Catalog;
