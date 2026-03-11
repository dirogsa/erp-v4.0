import React, { useState, useEffect, useRef } from 'react';
import MobileProductCard from '../components/MobileProductCard';
import { shopService } from '../services/api';
import {
    MagnifyingGlassIcon,
    ChevronLeftIcon,
    AdjustmentsHorizontalIcon,
    QrCodeIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const SearchPage = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const searchInput = useRef(null);

    // Debounce search
    useEffect(() => {
        if (searchTerm.trim().length < 3) {
            setResults([]);
            setStats(null);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await shopService.getProducts({ search: searchTerm });
                setResults(res.data.items);
                setStats({ total: res.data.total });
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setLoading(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Focus input on mount
    useEffect(() => {
        if (searchInput.current) searchInput.current.focus();
    }, []);

    return (
        <div className="bg-slate-50 min-h-screen pb-24">
            {/* Header / Search Input */}
            <div className="bg-white px-4 pt-12 pb-4 sticky top-0 z-50 border-b border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 bg-slate-100 rounded-xl text-slate-600 active:scale-95 transition-all"
                    >
                        <ChevronLeftIcon className="h-6 w-6" />
                    </button>
                    <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-500" />
                        <input
                            ref={searchInput}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Marca, Modelo, SKU o Medida..."
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-100 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary-500 transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold"
                            >
                                ×
                            </button>
                        )}
                    </div>
                    <button className="p-2 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-200">
                        <QrCodeIcon className="h-6 w-6" />
                    </button>
                </div>

                {stats && (
                    <div className="flex items-center justify-between mt-4 px-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {stats.total} productos encontrados
                        </p>
                        <button className="flex items-center gap-1 text-[10px] font-black text-primary-600 uppercase border-b-2 border-primary-50">
                            <AdjustmentsHorizontalIcon className="h-4 w-4" /> Filtros
                        </button>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="p-4">
                {searchTerm.length < 3 && searchTerm.length > 0 && (
                    <div className="text-center py-20">
                        <p className="text-slate-400 text-sm font-medium">Sigue escribiendo para buscar...</p>
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-2 gap-4 animate-pulse">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white h-56 rounded-3xl border border-slate-50"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {results.map(prod => {
                            // Detect if match was by equivalence
                            const isEquiv = prod.equivalences?.some(eq => eq.code.toLowerCase().includes(searchTerm.toLowerCase()));

                            return (
                                <div key={prod.sku} className="relative">
                                    {isEquiv && (
                                        <div className="absolute top-2 right-2 z-10">
                                            <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded-md border border-amber-200">
                                                COINCIDENCIA
                                            </span>
                                        </div>
                                    )}
                                    <MobileProductCard
                                        product={prod}
                                        onAddToCart={(p) => console.log("Added:", p.sku)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}

                {results.length === 0 && searchTerm.length >= 3 && !loading && (
                    <div className="text-center py-20 px-10">
                        <div className="h-20 w-20 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MagnifyingGlassIcon className="h-10 w-10" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-1">Cero Resultados</h3>
                        <p className="text-sm text-slate-500 font-medium">No encontramos nada que coincida con "{searchTerm}".</p>
                        <button
                            onClick={() => setSearchTerm('')}
                            className="text-primary-600 font-bold text-sm mt-6 underline"
                        >
                            Ver otros productos
                        </button>
                    </div>
                )}

                {results.length === 0 && searchTerm === '' && (
                    <div className="space-y-8 mt-4">
                        <section>
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Búsquedas Frecuentes</h4>
                            <div className="flex flex-wrap gap-2">
                                {['Aceite 10W40', 'Toyota Hilux', 'Filtro Aire', 'Nissan Sentra', 'WA9567'].map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => setSearchTerm(tag)}
                                        className="bg-white px-4 py-2 rounded-xl text-xs font-bold text-slate-600 border border-slate-100 shadow-sm active:bg-slate-50"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="bg-primary-900 p-6 rounded-[2.5rem] relative overflow-hidden">
                            <div className="relative z-10 text-white">
                                <h4 className="text-xl font-black mb-2 leading-tight">¿Tienes el código QR?</h4>
                                <p className="text-xs text-primary-200 font-medium mb-6">Escanea el código de la caja para encontrarlo instantáneamente.</p>
                                <button className="bg-white text-primary-900 px-6 py-3 rounded-2xl text-xs font-black uppercase shadow-xl active:scale-95 transition-all">
                                    Abrir Escáner
                                </button>
                            </div>
                            <QrCodeIcon className="absolute -bottom-10 -right-10 h-40 w-40 text-white/5" />
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchPage;
