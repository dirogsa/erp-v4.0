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
    XMarkIcon
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

    useEffect(() => {
        loadData();
    }, [selectedCategory, searchMode, selectedVehicleBrand]);

    const loadData = async () => {
        setLoading(true);
        try {
            const params = {
                search,
                category: selectedCategory,
                mode: searchMode,
                vehicle_brand: selectedVehicleBrand || undefined
            };
            const [prodRes, catRes, brandRes] = await Promise.all([
                shopService.getProducts(params),
                shopService.getCategories(),
                shopService.getVehicleBrands()
            ]);
            setProducts(prodRes.data.items || []);
            setCategories(catRes.data || []);
            setBrands(brandRes.data || []);
        } catch (error) {
            console.error("[Catalog] Error loading catalog:", error);
            console.error("[Catalog] Error response:", error.response?.data);
            console.error("[Catalog] Error status:", error.response?.status);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        loadData();
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

                {/* Brands Browser UI */}
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-1 w-8 bg-primary-600 rounded-full"></div>
                        <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest">Explorar por Marca</h3>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-6 -mx-2 px-2 no-scrollbar scroll-smooth">
                        {filteredBrands.length > 0 ? (
                            filteredBrands.map(brand => (
                                <button
                                    key={brand.name}
                                    onClick={() => setSelectedVehicleBrand(selectedVehicleBrand === brand.name ? '' : brand.name)}
                                    className={`flex-shrink-0 flex flex-col items-center gap-3 p-4 rounded-[2rem] border-2 transition-all w-28 ${selectedVehicleBrand === brand.name
                                        ? 'border-primary-600 bg-primary-50 ring-4 ring-primary-100'
                                        : 'border-slate-50 bg-white hover:border-slate-200'
                                        }`}
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 group-hover:scale-105 transition-transform">
                                        {brand.logo_url ? (
                                            <img src={brand.logo_url} alt={brand.name} className="w-10 h-10 object-contain" />
                                        ) : (
                                            <span className="text-xl font-black text-slate-300">{brand.name[0]}</span>
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase text-center ${selectedVehicleBrand === brand.name ? 'text-primary-700' : 'text-slate-500'}`}>
                                        {brand.name}
                                    </span>
                                </button>
                            ))
                        ) : (
                            <p className="text-slate-400 italic text-sm py-4">No hay marcas registradas para este origen aún.</p>
                        )}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
        </section>
    );
};

export default Catalog;
