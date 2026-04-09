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
import StatusIndicator from '../components/StatusIndicator';
import { useNavigate, useLocation } from 'react-router-dom';

const SearchPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const searchType = queryParams.get('type');
    const initialQuery = queryParams.get('q') || ''; 
    const initialMake = queryParams.get('make') || '';
    const initialModel = queryParams.get('model') || '';

    const [searchTerm, setSearchTerm] = useState(initialQuery);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isWakingUp, setIsWakingUp] = useState(false);
    const [stats, setStats] = useState(null);
    const [activeFilters, setActiveFilters] = useState({ make: initialMake, model: initialModel });
    const searchInput = useRef(null);

    // Initial placeholder based on type
    const getPlaceholder = () => {
        if (searchType === 'dimensions') return "Ej: 100x150x25 o Redondo...";
        return "Ingrese Código o Equivalencia...";
    };

    // Smart loader for Render Free Tier (Cold start detector)
    useEffect(() => {
        let wakeTimer;
        if (loading) {
            // If request takes more than 3 seconds, assume Render backend is waking up from sleep
            wakeTimer = setTimeout(() => setIsWakingUp(true), 3000);
        } else {
            setIsWakingUp(false);
        }
        return () => clearTimeout(wakeTimer);
    }, [loading]);

    // Initial search or filter update
    useEffect(() => {
        const fetchResults = async () => {
            // Only search if we have 3 chars OR if we have a vehicle filter
            if (searchTerm.trim().length < 3 && !activeFilters.make && !activeFilters.model) {
                setResults([]);
                setStats(null);
                return;
            }

            setLoading(true);
            try {
                const res = await shopService.getProducts({ 
                    search: searchTerm,
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
    }, [searchTerm, activeFilters]);

    // Removed programmatic focus on mount to prevent the Android Back button bug 
    // where hiding the keyboard also triggers history.back() because the focus wasn't user-initiated.

    return (
        <div className="bg-brand-bg h-screen text-brand-text flex flex-col font-sans overflow-hidden">
            {/* Technical Command Header (No solapa, empuja el contenido) */}
            <header className="flex-shrink-0 bg-brand-bg border-b border-brand-primary/20 safe-top">
                {/* 1. System Status Notification */}
                {isWakingUp && (
                    <div className="px-4 py-2 bg-brand-primary/5 border-b border-brand-primary/10">
                        <StatusIndicator 
                            type="loading"
                            label="WAKING CORE"
                            description="Sincronizando servidores externos..."
                            className="!py-2 !rounded-lg border-none bg-transparent shadow-none"
                            showScanline={false}
                        />
                    </div>
                )}

                {/* 2. Primary Search Controls */}
                <div className="px-4 py-4 space-y-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2.5 bg-brand-surface-2 rounded-xl border border-brand-border-2 text-brand-text active:scale-95 transition-all shadow-lg"
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
                                className="w-full pl-11 pr-4 py-4 bg-brand-surface border-2 border-brand-border-2 rounded-2xl text-sm font-bold focus:border-brand-primary focus:outline-none transition-all placeholder:text-brand-muted/40 shadow-xl"
                            />
                        </div>
                    </div>

                    {/* 3. Search Intelligence Stats */}
                    {stats && (
                        <div className="flex items-center justify-between pb-1 animate-in fade-in slide-in-from-left-4">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse glow-emerald"></span>
                                <p className="text-[10px] font-black text-brand-text/50 uppercase tracking-[0.2em]">
                                    {stats.total} <span className="text-brand-muted">Ítems encontrados</span>
                                </p>
                            </div>
                            <button className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-surface-2 border border-brand-border-2 rounded-full text-[9px] font-black text-brand-primary border-brand-primary/20 uppercase tracking-widest active:scale-90">
                                <AdjustmentsHorizontalIcon className="h-3.5 w-3.5" /> Filtros
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Scrollable Content (Safe flow) */}
            <main className="flex-1 overflow-y-auto p-4 pt-6 no-scrollbar">
                {searchTerm.length < 3 && searchTerm.length > 0 && (
                    <div className="text-center py-20">
                        <p className="text-brand-muted text-xs font-bold uppercase tracking-widest">Buscando...</p>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="bg-brand-surface h-56 rounded-3xl border border-brand-border animate-pulse shadow-inner"></div>
                            ))}
                        </div>
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
