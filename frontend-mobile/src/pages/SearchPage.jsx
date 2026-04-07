import React, { useState, useEffect, useRef } from 'react';
import MobileProductCard from '../components/MobileProductCard';
import { shopService } from '../services/api';
import {
    MagnifyingGlassIcon,
    ChevronLeftIcon,
    AdjustmentsHorizontalIcon,
    QrCodeIcon,
    ArrowsPointingInIcon,
    TagIcon
} from '@heroicons/react/24/outline';
import { useNavigate, useLocation } from 'react-router-dom';

const SearchPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const searchType = queryParams.get('type');
    const initialQuery = queryParams.get('q') || ''; // Read initial search from URL

    const [searchTerm, setSearchTerm] = useState(initialQuery);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const searchInput = useRef(null);

    // Initial placeholder based on type
    const getPlaceholder = () => {
        if (searchType === 'dimensions') return "Ej: 100x150x25 o Redondo...";
        return "Ingrese Código o Equivalencia...";
    };

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
        <div className="bg-brand-bg min-h-screen text-brand-text flex flex-col font-sans">
            {/* Header / Search Input */}
            <div className="bg-brand-bg/80 backdrop-blur-xl px-4 pt-12 pb-4 sticky top-0 z-50 border-b border-brand-border/50">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2.5 bg-brand-surface rounded-xl border border-brand-border text-brand-text active:scale-95 transition-all"
                    >
                        <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    
                    <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-primary" />
                        <input
                            ref={searchInput}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={getPlaceholder()}
                            className="w-full pl-12 pr-4 py-3.5 bg-brand-surface border border-brand-border rounded-xl text-sm font-bold focus:ring-1 focus:ring-brand-primary focus:outline-none transition-all placeholder:text-brand-muted/40"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted font-bold"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>

                {stats && (
                    <div className="flex items-center justify-between mt-4 px-1">
                        <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">
                            {stats.total} resultados encontrados
                        </p>
                        <button className="flex items-center gap-1 text-[10px] font-black text-brand-primary uppercase">
                            <AdjustmentsHorizontalIcon className="h-4 w-4" /> Filtros
                        </button>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <main className="p-4 flex-1">
                {searchTerm.length < 3 && searchTerm.length > 0 && (
                    <div className="text-center py-20">
                        <p className="text-brand-muted text-xs font-bold uppercase tracking-widest">Buscando...</p>
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-brand-surface h-56 rounded-3xl border border-brand-border animate-pulse"></div>
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

                {results.length === 0 && searchTerm.length >= 3 && !loading && (
                    <div className="text-center py-20 px-10">
                        <div className="h-16 w-16 bg-brand-surface border border-brand-border text-brand-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <MagnifyingGlassIcon className="h-8 w-8" />
                        </div>
                        <h3 className="text-sm font-black text-white mb-1 uppercase tracking-tighter">Sin coincidencias</h3>
                        <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest leading-relaxed">No encontramos resultados para "{searchTerm}". Revisa el código e intenta nuevamente.</p>
                    </div>
                )}

                {results.length === 0 && searchTerm === '' && (
                    <div className="space-y-8 mt-10">
                        <section className="text-center px-6">
                            <div className="inline-flex p-3 bg-brand-surface border border-brand-border rounded-2xl mb-4">
                                {searchType === 'dimensions' ? <ArrowsPointingInIcon className="h-6 w-6 text-brand-primary" /> : <TagIcon className="h-6 w-6 text-brand-primary" />}
                            </div>
                            <h4 className="text-sm font-black text-white uppercase tracking-tighter mb-2">
                                {searchType === 'dimensions' ? "Búsqueda por Dimensiones" : "Búsqueda por Código Técnico"}
                            </h4>
                            <p className="text-[10px] text-brand-muted font-bold uppercase tracking-[0.1em] leading-relaxed">
                                {searchType === 'dimensions' 
                                    ? "Utiliza milímetros o pulgadas para identificar el filtro físicamente." 
                                    : "Ingresa el código original del fabricante o cualquier equivalencia de mercado."}
                            </p>
                        </section>

                        <section className="p-8 bg-brand-surface border border-brand-border rounded-[2.5rem] relative overflow-hidden">
                            <div className="relative z-10">
                                <h4 className="text-lg font-black mb-1 text-white underline decoration-brand-primary decoration-4 underline-offset-4">ESCÁNER QR</h4>
                                <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest mb-6">Identificación instantánea</p>
                                <button className="w-full bg-brand-primary text-brand-bg px-6 py-4 rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all">
                                    Activar Cámara
                                </button>
                            </div>
                            <QrCodeIcon className="absolute -bottom-6 -right-6 h-32 w-32 text-white/5" />
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
};

export default SearchPage;
